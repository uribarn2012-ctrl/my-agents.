#include "CivGenerator.h"
#include "CivSimulation.h"

namespace CivGenData
{
	using F = ECivField;
	using N = ECivNeed;

	struct FPurpose
	{
		const TCHAR* Key;
		const TCHAR* Device;          // Hebrew device name
		const TCHAR* DeviceDefinite;
		bool bFemale;
		const TCHAR* Goal;            // Hebrew: what it is for
		F Field;
		N Need;
		const TCHAR* Effect;          // channel strength: food=1 means the full step for that channel
	};

	static const FPurpose Purposes[] =
	{
		{ TEXT("harvest"), TEXT("מכונת קציר"), TEXT("מכונת הקציר"), true, TEXT("לקצור יותר בפחות ידיים"), F::Food, N::Famine, TEXT("food") },
		{ TEXT("irrigate"), TEXT("משאבת מים"), TEXT("משאבת המים"), true, TEXT("להביא מים לשדות רחוקים"), F::Food, N::Famine, TEXT("food cap") },
		{ TEXT("preserve"), TEXT("מערכת שימור מזון"), TEXT("מערכת שימור המזון"), true, TEXT("לשמור מזון לשנים רעות"), F::Food, N::Famine, TEXT("food resist") },
		{ TEXT("diagnose"), TEXT("מכשיר אבחון"), TEXT("מכשיר האבחון"), false, TEXT("לגלות מחלות מוקדם"), F::Medicine, N::Plague, TEXT("health") },
		{ TEXT("treat"), TEXT("טיפול"), TEXT("הטיפול"), false, TEXT("לרפא מחלות קשות"), F::Medicine, N::Plague, TEXT("health resist") },
		{ TEXT("defend"), TEXT("מערך הגנה"), TEXT("מערך ההגנה"), false, TEXT("להגן על הערים ממתקפה"), F::War, N::War, TEXT("war") },
		{ TEXT("warn"), TEXT("מערכת התרעה"), TEXT("מערכת ההתרעה"), true, TEXT("להזהיר לפני אסון"), F::Science, N::Disaster, TEXT("resist") },
		{ TEXT("build"), TEXT("מנוף בנייה"), TEXT("מנוף הבנייה"), false, TEXT("להרים בניינים גבוהים וחזקים יותר"), F::Craft, N::Disaster, TEXT("res cap") },
		{ TEXT("haul"), TEXT("כלי הובלה"), TEXT("כלי ההובלה"), false, TEXT("להעביר סחורות ואנשים רחוק יותר"), F::Craft, N::None, TEXT("res range spread") },
		{ TEXT("message"), TEXT("מערכת קשר"), TEXT("מערכת הקשר"), true, TEXT("להעביר ידיעות במהירות"), F::Science, N::None, TEXT("spread") },
		{ TEXT("compute"), TEXT("מכונת חישוב"), TEXT("מכונת החישוב"), true, TEXT("לפתור חשבונות שאדם לא יספיק"), F::Science, N::None, TEXT("research") },
		{ TEXT("mine"), TEXT("מקדח מכרות"), TEXT("מקדח המכרות"), false, TEXT("להגיע לעפרות עמוקות"), F::Craft, N::None, TEXT("res") },
		{ TEXT("light"), TEXT("תאורת רחוב"), TEXT("תאורת הרחוב"), true, TEXT("להאיר את הלילה בערים"), F::Craft, N::None, TEXT("research") },
		// Purposes used only by the far-future concepts below.
		{ TEXT("extend_life"), TEXT(""), TEXT(""), false, TEXT("להאריך את החיים"), F::Medicine, N::Plague, TEXT("health") },
		{ TEXT("settle"), TEXT(""), TEXT(""), false, TEXT("לחיות במקומות שלא היו ראויים לחיים"), F::Space, N::None, TEXT("cap") },
		{ TEXT("mind"), TEXT(""), TEXT(""), false, TEXT("להרחיב את מה שהמוח יכול"), F::Science, N::None, TEXT("research spread") },
		{ TEXT("climate"), TEXT(""), TEXT(""), false, TEXT("לרכך אסונות טבע"), F::Science, N::Disaster, TEXT("resist food") },
		{ TEXT("energy"), TEXT(""), TEXT(""), false, TEXT("לספק אנרגיה כמעט בלי גבול"), F::Space, N::None, TEXT("res") },
		{ TEXT("travel"), TEXT(""), TEXT(""), false, TEXT("לקצר מסעות בין כוכבים"), F::Space, N::None, TEXT("range spread") },
	};

	struct FPrinciple
	{
		const TCHAR* Key;
		const TCHAR* AdjM;            // Hebrew adjective, masculine
		const TCHAR* AdjF;            // feminine
		const TCHAR* How;             // Hebrew: the working principle
		int32 MinEra;
		const TCHAR* Required;        // known inventions the principle rests on
		const TCHAR* Purposes;        // what this principle can honestly be applied to
		double Weights[CivResourceCount];  // wood stone metal energy rare
		bool bSpeculative;
	};

	static const FPrinciple Principles[] =
	{
		{ TEXT("water"), TEXT("מונע מים"), TEXT("מונעת מים"), TEXT("גלגל שמסתובב בכוח זרם המים"), 2, TEXT("wheel"), TEXT("irrigate mine"), { 1, 1, 0, 0, 0 }, false },
		{ TEXT("wind"), TEXT("מונע רוח"), TEXT("מונעת רוח"), TEXT("כנפיים שהרוח מסובבת"), 2, TEXT("sailing wheel"), TEXT("irrigate"), { 1, 0.5, 0, 0, 0 }, false },
		{ TEXT("mechanical"), TEXT("מכני"), TEXT("מכנית"), TEXT("גלגלי שיניים ומנופים"), 4, TEXT("clockwork"), TEXT("harvest irrigate build compute"), { 0.5, 0, 1, 0, 0 }, false },
		{ TEXT("steam"), TEXT("קיטורי"), TEXT("קיטורית"), TEXT("לחץ של קיטור בתוך גליל"), 5, TEXT("steam"), TEXT("harvest irrigate build mine"), { 0, 0, 1, 1, 0 }, false },
		{ TEXT("chemical"), TEXT("כימי"), TEXT("כימית"), TEXT("תגובות כימיות מבוקרות"), 5, TEXT("chemistry"), TEXT("preserve treat"), { 0, 0, 0, 0.5, 1 }, false },
		{ TEXT("electric"), TEXT("חשמלי"), TEXT("חשמלית"), TEXT("זרם חשמלי"), 5, TEXT("electricity"), TEXT("harvest irrigate build mine preserve diagnose warn"), { 0, 0, 1, 1, 0 }, false },
		{ TEXT("magnetic"), TEXT("מגנטי"), TEXT("מגנטית"), TEXT("שדות מגנטיים חזקים"), 6, TEXT("electricity steel"), TEXT("haul diagnose"), { 0, 0, 1, 1, 0.5 }, false },
		{ TEXT("radio"), TEXT("אלחוטי"), TEXT("אלחוטית"), TEXT("גלי רדיו"), 6, TEXT("radio"), TEXT("warn defend"), { 0, 0, 0.5, 0.5, 1 }, false },
		{ TEXT("optical"), TEXT("אופטי"), TEXT("אופטית"), TEXT("קרני אור ועדשות מדויקות"), 6, TEXT("optics electricity"), TEXT("diagnose message"), { 0, 0, 0.5, 0.5, 1 }, false },
		{ TEXT("computing"), TEXT("ממוחשב"), TEXT("ממוחשבת"), TEXT("תוכנה שמחליטה לפי מדידות"), 6, TEXT("computer"), TEXT("diagnose warn harvest irrigate build preserve defend"), { 0, 0, 0.5, 1, 1 }, false },
		{ TEXT("nuclear"), TEXT("גרעיני"), TEXT("גרעינית"), TEXT("חום מביקוע גרעיני"), 6, TEXT("nuclear"), TEXT("haul treat"), { 0, 0, 1, 2, 2 }, false },
		{ TEXT("robotic"), TEXT("רובוטי"), TEXT("רובוטית"), TEXT("זרועות שפועלות בלי אדם"), 7, TEXT("robotics"), TEXT("harvest mine build treat defend"), { 0, 0, 1, 1, 1 }, false },
		{ TEXT("genetic"), TEXT("גנטי"), TEXT("גנטית"), TEXT("תיקון מדויק של הגנים"), 7, TEXT("genetics"), TEXT("treat"), { 0, 0, 0, 0.5, 1 }, false },
		{ TEXT("orbital"), TEXT("מסלולי"), TEXT("מסלולית"), TEXT("לוויינים שצופים מלמעלה"), 7, TEXT("satellite"), TEXT("warn message defend"), { 0, 0, 1, 1, 1 }, false },
		{ TEXT("fusion"), TEXT("היתוכי"), TEXT("היתוכית"), TEXT("אנרגיה מהיתוך גרעיני"), 7, TEXT("fusion"), TEXT("haul mine"), { 0, 0, 1, 3, 1 }, false },
		{ TEXT("neural"), TEXT("עצבי"), TEXT("עצבית"), TEXT("רשתות מלאכותיות שמחקות עצבים"), 8, TEXT("thinking_machines genetics"), TEXT("compute treat mind extend_life"), { 0, 0, 0.5, 1, 2 }, true },
		{ TEXT("quantum"), TEXT("קוונטי"), TEXT("קוונטית"), TEXT("חלקיקים שמצבם שזור"), 8, TEXT("thinking_machines"), TEXT("compute message mind"), { 0, 0, 0.5, 2, 3 }, true },
		{ TEXT("gravity"), TEXT("כבידתי"), TEXT("כבידתית"), TEXT("עיצוב שדה הכבידה"), 8, TEXT("antimatter"), TEXT("haul defend travel"), { 0, 0, 2, 4, 3 }, true },
		// Principles used by the far-future concepts.
		{ TEXT("biotech"), TEXT(""), TEXT(""), TEXT("הנדסה של תאים חיים"), 7, TEXT("genetics"), TEXT("extend_life settle climate"), { 0, 0, 0, 1, 1 }, false },
		{ TEXT("nano"), TEXT(""), TEXT(""), TEXT("מכונות זעירות שבונות מולקולה אחר מולקולה"), 8, TEXT("robotics"), TEXT("extend_life settle energy"), { 0, 0, 1, 1, 2 }, true },
		{ TEXT("planetary"), TEXT(""), TEXT(""), TEXT("הנדסה בקנה מידה של כוכב לכת"), 8, TEXT("fusion orbital"), TEXT("settle climate energy"), { 0, 0, 3, 3, 1 }, true },
		{ TEXT("spacetime"), TEXT(""), TEXT(""), TEXT("עיוות של המרחב עצמו"), 8, TEXT("antimatter"), TEXT("travel"), { 0, 0, 2, 5, 3 }, true },
	};

	struct FConcept
	{
		const TCHAR* Key;
		const TCHAR* Name;
		const TCHAR* NameDefinite;
		const TCHAR* Parents;
		const TCHAR* Purpose;
		const TCHAR* Principle;
		F Field;
		bool bSpeculative;
	};

	static const FConcept Concepts[] =
	{
		{ TEXT("gen_brain_interface"), TEXT("ממשק מוח-מחשב"), TEXT("ממשק המוח-מחשב"), TEXT("thinking_machines genetics"), TEXT("mind"), TEXT("neural"), F::Science, true },
		{ TEXT("gen_computer_brain"), TEXT("מוח מחשב"), TEXT("מוח המחשב"), TEXT("gen_brain_interface"), TEXT("mind"), TEXT("neural"), F::Science, true },
		{ TEXT("gen_mind_copy"), TEXT("העתקת תודעה"), TEXT("העתקת התודעה"), TEXT("gen_computer_brain"), TEXT("extend_life"), TEXT("neural"), F::Medicine, true },
		{ TEXT("gen_life_in_computer"), TEXT("חיים בתוך מחשב"), TEXT("החיים בתוך המחשב"), TEXT("gen_mind_copy"), TEXT("mind"), TEXT("neural"), F::Science, true },
		{ TEXT("gen_thought_net"), TEXT("רשת מחשבות"), TEXT("רשת המחשבות"), TEXT("gen_brain_interface internet"), TEXT("mind"), TEXT("quantum"), F::Science, true },
		{ TEXT("gen_aging"), TEXT("עצירת הזדקנות"), TEXT("עצירת ההזדקנות"), TEXT("genetics"), TEXT("extend_life"), TEXT("biotech"), F::Medicine, false },
		{ TEXT("gen_nanomed"), TEXT("רפואת מכונות זעירות"), TEXT("רפואת המכונות הזעירות"), TEXT("robotics genetics"), TEXT("extend_life"), TEXT("nano"), F::Medicine, true },
		{ TEXT("gen_terraform"), TEXT("עיצוב כוכבי לכת"), TEXT("עיצוב כוכבי הלכת"), TEXT("mars genetics"), TEXT("settle"), TEXT("planetary"), F::Space, true },
		{ TEXT("gen_weather"), TEXT("שליטה במזג האוויר"), TEXT("השליטה במזג האוויר"), TEXT("satellite fusion"), TEXT("climate"), TEXT("planetary"), F::Science, true },
		{ TEXT("gen_solar_swarm"), TEXT("נחיל קולטי שמש"), TEXT("נחיל קולטי השמש"), TEXT("asteroid_mining fusion"), TEXT("energy"), TEXT("planetary"), F::Space, true },
		{ TEXT("gen_gravity"), TEXT("שליטה בכבידה"), TEXT("השליטה בכבידה"), TEXT("antimatter"), TEXT("travel"), TEXT("gravity"), F::Space, true },
		{ TEXT("gen_warp"), TEXT("קיפול מרחב"), TEXT("קיפול המרחב"), TEXT("gen_gravity starship"), TEXT("travel"), TEXT("spacetime"), F::Space, true },
	};

	// Purpose + principle pairs that the starting table already covers: these would be duplicates.
	static const TCHAR* const Covered[] =
	{
		TEXT("message:electric"), TEXT("message:radio"), TEXT("compute:computing"), TEXT("haul:steam"),
		TEXT("light:electric"), TEXT("haul:electric"), TEXT("defend:chemical"),
	};

	static const double EraCost[] = { 3, 12, 35, 100, 280, 900, 4000, 40000, 150000 };
	static const double EraMaterial[] = { 2, 10, 30, 100, 250, 800, 4000, 25000, 100000 };

	static const FPurpose* FindPurpose(const FString& Key)
	{
		for (const FPurpose& P : Purposes) { if (Key == P.Key) { return &P; } }
		return nullptr;
	}

	static const FPrinciple* FindPrinciple(const FString& Key)
	{
		for (const FPrinciple& P : Principles) { if (Key == P.Key) { return &P; } }
		return nullptr;
	}

	static int32 FindInTree(const TArray<FCivInventionDef>& Tree, const FString& Key)
	{
		for (int32 I = 0; I < Tree.Num(); ++I) { if (Tree[I].Key == Key) { return I; } }
		return INDEX_NONE;
	}

	static bool ListHas(const TCHAR* List, const FString& Word)
	{
		TArray<FString> Parts;
		FString(List).ParseIntoArray(Parts, TEXT(" "));
		return Parts.Contains(Word);
	}

	/** Effects are one modest step in each channel the purpose touches. Speculative steps are larger. */
	static void FillEffects(const FPurpose& Purpose, bool bSpeculative, FCivInventionEffects& Out)
	{
		const double Step = bSpeculative ? 1.25 : 1.08;
		TArray<FString> Parts;
		FString(Purpose.Effect).ParseIntoArray(Parts, TEXT(" "));
		for (const FString& Part : Parts)
		{
			if (Part == TEXT("food")) { Out.Food = Step; }
			else if (Part == TEXT("cap")) { Out.Capacity = Step; }
			else if (Part == TEXT("res")) { Out.Resources = Step; }
			else if (Part == TEXT("research")) { Out.Research = Step; }
			else if (Part == TEXT("spread")) { Out.Spread = Step; }
			else if (Part == TEXT("health")) { Out.Health = Step; }
			else if (Part == TEXT("war")) { Out.War = Step; }
			else if (Part == TEXT("resist")) { Out.Resist = bSpeculative ? 0.04 : 0.015; }
			else if (Part == TEXT("range")) { Out.Range = bSpeculative ? 0.2 : 0.05; }
		}
	}

	static void FillBill(const FPrinciple& Principle, int32 Era, FCivInventionProposal& Out)
	{
		const int32 SafeEra = FMath::Clamp(Era, 0, UE_ARRAY_COUNT(EraCost) - 1);
		Out.Era = SafeEra;
		Out.Cost = EraCost[SafeEra] * (Out.bSpeculative ? 4.0 : 1.0);
		for (int32 R = 0; R < CivResourceCount; ++R)
		{
			Out.Materials[R] = Principle.Weights[R] * EraMaterial[SafeEra] * (Out.bSpeculative ? 2.0 : 1.0);
		}
	}
}

bool FCivCuratedProposer::Propose(const FCivProposalContext& Context, FCivRandom& Rng, FCivInventionProposal& Out)
{
	using namespace CivGenData;
	const TArray<FCivInventionDef>& Tree = *Context.Tree;
	const FCivPeople& People = *Context.People;

	// Sometimes reach for one of the great far-future ideas.
	if (Context.PeopleEra >= 7 && Rng.Chance(0.25))
	{
		const FConcept& Concept = Concepts[Rng.RangeInt(0, UE_ARRAY_COUNT(Concepts) - 1)];
		const FPurpose* Purpose = FindPurpose(Concept.Purpose);
		const FPrinciple* Principle = FindPrinciple(Concept.Principle);
		check(Purpose && Principle);

		Out = FCivInventionProposal();
		Out.Key = Concept.Key;
		Out.Name = Concept.Name;
		Out.NameDefinite = Concept.NameDefinite;
		Out.Field = Concept.Field;
		Out.PurposeKey = Purpose->Key;
		Out.PrincipleKey = Principle->Key;
		Out.Need = Purpose->Need;
		Out.bSpeculative = Concept.bSpeculative;
		Out.Mechanism = FString(Principle->How) + TEXT(", כדי ") + Purpose->Goal;

		TArray<FString> ParentKeys;
		FString(Concept.Parents).ParseIntoArray(ParentKeys, TEXT(" "));
		int32 Era = 7;
		for (const FString& ParentKey : ParentKeys)
		{
			const int32 Index = FindInTree(Tree, ParentKey);
			if (Index != INDEX_NONE) { Out.Parents.Add(Index); Era = FMath::Max(Era, Tree[Index].Era); }
			else { Out.Parents.Add(INDEX_NONE); }
		}
		FillBill(*Principle, Era, Out);
		FillEffects(*Purpose, Concept.bSpeculative, Out.Effects);
		return true;
	}

	// Otherwise combine a purpose with a principle. The pairing is deliberately loose: Validate does the judging.
	TArray<const FPurpose*> Weighted;
	for (const FPurpose& Purpose : Purposes)
	{
		if (Purpose.Device[0] == 0) { continue; }
		Weighted.Add(&Purpose);
		if (Purpose.Need != ECivNeed::None && People.NeedPressure[static_cast<int32>(Purpose.Need)] > 0.2)
		{
			Weighted.Add(&Purpose);
			Weighted.Add(&Purpose);
		}
	}
	const FPurpose& Purpose = *Weighted[Rng.RangeInt(0, Weighted.Num() - 1)];
	const FPrinciple& Principle = Principles[Rng.RangeInt(0, UE_ARRAY_COUNT(Principles) - 1)];
	if (Principle.AdjM[0] == 0) { return false; }

	Out = FCivInventionProposal();
	Out.Key = FString::Printf(TEXT("gen_%s_%s"), Purpose.Key, Principle.Key);
	const TCHAR* Adj = Purpose.bFemale ? Principle.AdjF : Principle.AdjM;
	Out.Name = FString(Purpose.Device) + TEXT(" ") + Adj;
	Out.NameDefinite = FString(Purpose.DeviceDefinite) + TEXT(" ה") + Adj;
	Out.Field = Purpose.Field;
	Out.PurposeKey = Purpose.Key;
	Out.PrincipleKey = Principle.Key;
	Out.Need = Purpose.Need;
	Out.bSpeculative = Principle.bSpeculative;
	Out.Mechanism = FString(Principle.How) + TEXT(", כדי ") + Purpose.Goal;

	TArray<FString> Required;
	FString(Principle.Required).ParseIntoArray(Required, TEXT(" "));
	int32 Era = Principle.MinEra;
	for (const FString& RequiredKey : Required)
	{
		const int32 Index = FindInTree(Tree, RequiredKey);
		Out.Parents.Add(Index);
		if (Index != INDEX_NONE) { Era = FMath::Max(Era, Tree[Index].Era); }
	}

	// A newer device builds on the older one that served the same purpose.
	for (int32 I = Tree.Num() - 1; I >= 0; --I)
	{
		// Only something older can be the ancestor: a steam harvester does not grow out of a robotic one.
		if (Tree[I].bGenerated && Tree[I].PurposeKey == Out.PurposeKey && People.Known[I] && Tree[I].PrincipleKey != Out.PrincipleKey && Tree[I].Era < Principle.MinEra)
		{
			Out.Parents.Add(I);
			Era = FMath::Max(Era, Tree[I].Era);
			break;
		}
	}

	// A device that already exists and is known can be improved, a generation at a time.
	int32 Tier = 1;
	static const TCHAR* const TierNames[] = { TEXT(""), TEXT(""), TEXT(" מהדור השני"), TEXT(" מהדור השלישי"), TEXT(" מהדור הרביעי") };
	for (Tier = 1; Tier <= 4; ++Tier)
	{
		const FString TierKey = Tier == 1 ? Out.Key : FString::Printf(TEXT("%s_t%d"), *Out.Key, Tier);
		const int32 Existing = FindInTree(Tree, TierKey);
		if (Existing == INDEX_NONE)
		{
			Out.Key = TierKey;
			if (Tier > 1)
			{
				Out.Name += TierNames[Tier];
				Out.NameDefinite += TierNames[Tier];
				const FString PreviousKey = Tier == 2 ? FString::Printf(TEXT("gen_%s_%s"), Purpose.Key, Principle.Key) : FString::Printf(TEXT("gen_%s_%s_t%d"), Purpose.Key, Principle.Key, Tier - 1);
				Out.Parents.Add(FindInTree(Tree, PreviousKey));
			}
			break;
		}
	}
	if (Tier > 4) { return false; }

	FillBill(Principle, Era, Out);
	Out.Cost *= Tier;
	FillEffects(Purpose, Principle.bSpeculative, Out.Effects);
	return true;
}

ECivReject CivGenerator::Validate(const FCivInventionProposal& Proposal, const FCivProposalContext& Context)
{
	using namespace CivGenData;
	const TArray<FCivInventionDef>& Tree = *Context.Tree;
	const FCivPeople& People = *Context.People;

	// 1. It must grow out of things this people really knows.
	if (Proposal.Parents.Num() == 0) { return ECivReject::NoParents; }
	for (int32 Parent : Proposal.Parents)
	{
		if (!Tree.IsValidIndex(Parent) || !People.Known[Parent]) { return ECivReject::ParentUnknown; }
	}

	// 2. A real purpose. 3. A coherent mechanism.
	const FPurpose* Purpose = FindPurpose(Proposal.PurposeKey);
	if (!Purpose) { return ECivReject::NoPurpose; }
	const FPrinciple* Principle = FindPrinciple(Proposal.PrincipleKey);
	if (!Principle) { return ECivReject::NoMechanism; }
	if (!ListHas(Principle->Purposes, Proposal.PurposeKey)) { return ECivReject::Incompatible; }

	// The principle must rest on inventions this people has.
	TArray<FString> Required;
	FString(Principle->Required).ParseIntoArray(Required, TEXT(" "));
	for (const FString& RequiredKey : Required)
	{
		const int32 Index = FindInTree(Tree, RequiredKey);
		if (Index == INDEX_NONE || !People.Known[Index]) { return ECivReject::MissingBasis; }
	}
	if (Context.PeopleEra < Principle->MinEra) { return ECivReject::TooEarly; }

	// 4. Beyond known science only for the most advanced peoples.
	if ((Proposal.bSpeculative || Principle->bSpeculative) && (!Context.bAllowSpeculative || Context.PeopleEra < 8))
	{
		return ECivReject::SpeculativeTooSoon;
	}

	// 5. Materials the people can actually get.
	for (int32 R = 0; R < CivResourceCount; ++R)
	{
		if (Proposal.Materials[R] > 0.0 && People.ResourceRate[R] <= 0.0) { return ECivReject::MaterialsLocked; }
	}

	// 6. A real effect, and not a magic one.
	const FCivInventionEffects& E = Proposal.Effects;
	const double Multipliers[] = { E.Food, E.Capacity, E.Resources, E.Research, E.Spread, E.Health, E.War };
	bool bHasEffect = E.Resist > 0.0 || E.Range > 0.0;
	double Strongest = 1.0;
	for (double M : Multipliers)
	{
		if (M != 1.0) { bHasEffect = true; }
		Strongest = FMath::Max(Strongest, M);
	}
	if (!bHasEffect) { return ECivReject::NoEffect; }
	if (Strongest > (Proposal.bSpeculative ? 1.5 : 1.2)) { return ECivReject::TooStrong; }

	// 7. Nothing that already exists under another name.
	const FString Pair = Proposal.PurposeKey + TEXT(":") + Proposal.PrincipleKey;
	for (const TCHAR* CoveredPair : Covered)
	{
		if (Pair == CoveredPair) { return ECivReject::Duplicate; }
	}
	for (const FCivInventionDef& Def : Tree)
	{
		if (Def.Key == Proposal.Key || Def.Name == Proposal.Name) { return ECivReject::Duplicate; }
		// Far-future concepts share pairs on purpose; ordinary devices may not.
		if (Def.bGenerated && Def.PurposeKey == Proposal.PurposeKey && Def.PrincipleKey == Proposal.PrincipleKey && !Proposal.Key.StartsWith(TEXT("gen_"))) { return ECivReject::Duplicate; }
	}
	return ECivReject::None;
}

const TCHAR* CivGenerator::RejectName(ECivReject Reason)
{
	switch (Reason)
	{
	case ECivReject::None: return TEXT("accepted");
	case ECivReject::NoParents: return TEXT("no parent inventions");
	case ECivReject::ParentUnknown: return TEXT("parent not known to this people");
	case ECivReject::NoPurpose: return TEXT("no real purpose");
	case ECivReject::NoMechanism: return TEXT("no coherent mechanism");
	case ECivReject::Incompatible: return TEXT("principle does not fit purpose");
	case ECivReject::MissingBasis: return TEXT("principle's basis not known");
	case ECivReject::MaterialsLocked: return TEXT("materials unavailable");
	case ECivReject::TooEarly: return TEXT("too early for this era");
	case ECivReject::NoEffect: return TEXT("no game effect");
	case ECivReject::TooStrong: return TEXT("effect too strong");
	case ECivReject::Duplicate: return TEXT("near-duplicate");
	case ECivReject::SpeculativeTooSoon: return TEXT("speculative before high knowledge");
	default: return TEXT("unknown");
	}
}
