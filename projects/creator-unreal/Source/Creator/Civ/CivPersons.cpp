// Individual lives. Nothing here assigns a destiny: each year a person's traits, standing and the state of
// their people decide what can happen next. Most years nothing does. Rising is rare and earned, falling is
// common, and how open society is to climbing depends on the era.
#include "CivSimulation.h"
#include "CivNames.h"

using CivText::Fill;

namespace CivLifeData
{
	struct FTemplate { ECivLife Kind; const TCHAR* Male; const TCHAR* Female; };

	// {o} another person, {p} a people, {e} an enemy people, {i} an invention, {t} a title, {w} an occupation
	static const FTemplate Templates[] =
	{
		{ ECivLife::FromCrowd, TEXT("באותה שנה הפנה האל את מבטו אליו, ומאז נרשם כל מה שעבר עליו."), TEXT("באותה שנה הפנה האל את מבטו אליה, ומאז נרשם כל מה שעבר עליה.") },
		{ ECivLife::Work, TEXT("התחיל לעבוד כ{w}."), TEXT("התחילה לעבוד כ{w}.") },
		{ ECivLife::Married, TEXT("נשא לאישה את {o}."), TEXT("נישאה ל{o}.") },
		{ ECivLife::MarriedUp, TEXT("נשא לאישה את {o}, בת למשפחה מכובדת ממשפחתו, ודלתות נפתחו לפניו."), TEXT("נישאה ל{o}, בן למשפחה מכובדת ממשפחתה, ודלתות נפתחו לפניה.") },
		{ ECivLife::MovedCity, TEXT("עזב את כפר הולדתו ועבר לעיר {o}."), TEXT("עזבה את כפר הולדתה ועברה לעיר {o}.") },
		{ ECivLife::GoodYear, TEXT("הייתה לו שנה טובה: היבול מילא את המחסן, ובפעם הראשונה לא דאג לחורף."), TEXT("הייתה לה שנה טובה: היבול מילא את המחסן, ובפעם הראשונה לא דאגה לחורף.") },
		{ ECivLife::Feud, TEXT("הסתכסך עם {o} על גבול שדה, והמריבה לא נגמרה עד סוף ימיו."), TEXT("הסתכסכה עם {o} על גבול שדה, והמריבה לא נגמרה עד סוף ימיה.") },
		{ ECivLife::Illness, TEXT("חלה קשה והחלים לאט."), TEXT("חלתה קשה והחלימה לאט.") },
		{ ECivLife::PlagueSurvived, TEXT("המגפה עברה בביתו, והוא נשאר בחיים."), TEXT("המגפה עברה בביתה, והיא נשארה בחיים.") },
		{ ECivLife::Hunger, TEXT("בשנות הרעב מכר את מה שהיה לו כדי לאכול."), TEXT("בשנות הרעב מכרה את מה שהיה לה כדי לאכול.") },
		{ ECivLife::Knighted, TEXT("על אומץ ליבו הועלה לדרגת {t} בידי {o}."), TEXT("על אומץ ליבה הועלתה לדרגת {t} בידי {o}.") },
		{ ECivLife::Ennobled, TEXT("קיבל אדמה משלו והפך ל{t}."), TEXT("קיבלה אדמה משלה והפכה ל{t}.") },
		{ ECivLife::Inherited, TEXT("ירש מהוריו את אדמותיהם ואת התואר {t}."), TEXT("ירשה מהוריה את אדמותיהם ואת התואר {t}.") },
		{ ECivLife::Crowned, TEXT("עלה לשלטון בירושה והפך ל{t}."), TEXT("עלתה לשלטון בירושה והפכה ל{t}.") },
		{ ECivLife::CoupWon, TEXT("הפיל את {o} בקשר שרקם בסתר, ותפס את השלטון כ{t}."), TEXT("הפילה את {o} בקשר שרקמה בסתר, ותפסה את השלטון כ{t}.") },
		{ ECivLife::CoupLost, TEXT("ניסה להפיל את {o} בקשר, והקשר נחשף."), TEXT("ניסתה להפיל את {o} בקשר, והקשר נחשף.") },
		{ ECivLife::Disgraced, TEXT("נפל מגדולתו: איבד את תוארו ואת אדמותיו, וחזר לעבוד בשדה."), TEXT("נפלה מגדולתה: איבדה את תוארה ואת אדמותיה, וחזרה לעבוד בשדה.") },
		{ ECivLife::Tyrant, TEXT("התחיל לשלוט ביד קשה, ואנשים למדו לפחד ממנו."), TEXT("התחילה לשלוט ביד קשה, ואנשים למדו לפחד ממנה.") },
		{ ECivLife::Law, TEXT("הוציא חוק שהקל על חיי העם."), TEXT("הוציאה חוק שהקל על חיי העם.") },
		{ ECivLife::Miracle, TEXT("אנשים סיפרו שחולה קם אחרי שנגע בו."), TEXT("אנשים סיפרו שחולה קם אחרי שנגעה בו.") },
		{ ECivLife::Holy, TEXT("עולי רגל החלו להגיע אליו, וקראו לו איש קדוש."), TEXT("עולי רגל החלו להגיע אליה, וקראו לה אישה קדושה.") },
		{ ECivLife::Faith, TEXT("סביב דבריו התגבשה אמונה חדשה בעם {p}."), TEXT("סביב דבריה התגבשה אמונה חדשה בעם {p}.") },
		{ ECivLife::Persecuted, TEXT("השלטון רדף אותו בגלל דרשותיו."), TEXT("השלטון רדף אותה בגלל דרשותיה.") },
		{ ECivLife::Rich, TEXT("הסחורות שלו הגיעו רחוק, והוא נעשה אדם עשיר."), TEXT("הסחורות שלה הגיעו רחוק, והיא נעשתה אישה עשירה.") },
		{ ECivLife::Healer, TEXT("התחיל לטפל בחולים, בלי שאיש ביקש ממנו."), TEXT("התחילה לטפל בחולים, בלי שאיש ביקש ממנה.") },
		{ ECivLife::RebelWon, TEXT("המרד ניצח, והוא הפך ל{t}."), TEXT("המרד ניצח, והיא הפכה ל{t}.") },
		{ ECivLife::RebelFaded, TEXT("המרד דעך בלי קרב מכריע. הוא חזר לביתו, ואיש לא שכח לו את זה."), TEXT("המרד דעך בלי קרב מכריע. היא חזרה לביתה, ואיש לא שכח לה את זה.") },
		{ ECivLife::Explorer, TEXT("יצא לדרך אל מעבר למקומות שהכירו."), TEXT("יצאה לדרך אל מעבר למקומות שהכירו.") },
		{ ECivLife::Discovery, TEXT("חזר עם מפות של ארצות שאיש בעמו לא ראה."), TEXT("חזרה עם מפות של ארצות שאיש בעמה לא ראה.") },
		{ ECivLife::BecameInventor, TEXT("החל לבלות את ימיו בניסויים ובחקירה."), TEXT("החלה לבלות את ימיה בניסויים ובחקירה.") },
		{ ECivLife::Inspired, TEXT("התעורר בלילה עם רעיון שלא היה שלו."), TEXT("התעוררה בלילה עם רעיון שלא היה שלה.") },
		{ ECivLife::Blessed, TEXT("האל בירך אותו: מחלותיו חלפו, וכל מה שנגע בו הצליח."), TEXT("האל בירך אותה: מחלותיה חלפו, וכל מה שנגעה בו הצליח.") },
		{ ECivLife::Cursed, TEXT("האל קילל אותו: גופו נחלש, הונו אבד ושמו הטוב התפורר."), TEXT("האל קילל אותה: גופה נחלש, הונה אבד ושמה הטוב התפורר.") },
		{ ECivLife::Venerated, TEXT("אחרי מותו המשיכו להתפלל ליד קברו, ודורות אחר כך עוד נשאו את שמו."), TEXT("אחרי מותה המשיכו להתפלל ליד קברה, ודורות אחר כך עוד נשאו את שמה.") },
		{ ECivLife::Retired, TEXT("חזר מן הצבא אל השדה."), TEXT("חזרה מן הצבא אל השדה.") },
		{ ECivLife::General, TEXT("החיילים התחילו ללכת אחריו יותר משהלכו אחרי מפקדיהם."), TEXT("החיילים התחילו ללכת אחריה יותר משהלכו אחרי מפקדיהם.") },
	};

	static const FTemplate* TemplateOf(ECivLife Kind)
	{
		for (const FTemplate& T : Templates) { if (T.Kind == Kind) { return &T; } }
		return nullptr;
	}

	static const TCHAR* OccupationWord(ECivOccupation Occupation, bool bFemale)
	{
		switch (Occupation)
		{
		case ECivOccupation::Farmer: return bFemale ? TEXT("איכרה") : TEXT("איכר");
		case ECivOccupation::Artisan: return bFemale ? TEXT("בעלת מלאכה") : TEXT("בעל מלאכה");
		case ECivOccupation::Soldier: return bFemale ? TEXT("חיילת") : TEXT("חייל");
		case ECivOccupation::Merchant: return bFemale ? TEXT("סוחרת") : TEXT("סוחר");
		case ECivOccupation::Priest: return bFemale ? TEXT("מטיפה") : TEXT("מטיף");
		case ECivOccupation::Healer: return bFemale ? TEXT("מרפאה") : TEXT("מרפא");
		case ECivOccupation::Inventor: return bFemale ? TEXT("ממציאה") : TEXT("ממציא");
		case ECivOccupation::Rebel: return bFemale ? TEXT("מורדת") : TEXT("מורד");
		case ECivOccupation::Explorer: return bFemale ? TEXT("נוסעת") : TEXT("נוסע");
		default: return bFemale ? TEXT("פשוטת עם") : TEXT("פשוט עם");
		}
	}

	static FString RankWord(ECivRank Rank, int32 Era, bool bFemale)
	{
		switch (Rank)
		{
		case ECivRank::Knight:
			if (Era <= 1) { return bFemale ? TEXT("לוחמת ותיקה") : TEXT("לוחם ותיק"); }
			if (Era <= 5) { return bFemale ? TEXT("אבירה") : TEXT("אביר"); }
			return bFemale ? TEXT("קצינה בכירה") : TEXT("קצין בכיר");
		case ECivRank::Lord:
			if (Era <= 1) { return bFemale ? TEXT("זקנת שבט") : TEXT("זקן שבט"); }
			if (Era <= 5) { return bFemale ? TEXT("אצילה") : TEXT("אציל"); }
			return bFemale ? TEXT("שרה") : TEXT("שר");
		case ECivRank::Ruler:
			if (Era <= 1) { return bFemale ? TEXT("ראשת שבט") : TEXT("ראש שבט"); }
			if (Era <= 4) { return bFemale ? TEXT("מלכה") : TEXT("מלך"); }
			return bFemale ? TEXT("נשיאה") : TEXT("נשיא");
		default:
			return bFemale ? TEXT("פשוטת עם") : TEXT("פשוט עם");
		}
	}

	/** How open society is to climbing, by era: a little in the tribe, hardly at all in the old kingdoms, more in modern times. */
	static double Mobility(int32 Era)
	{
		if (Era <= 1) { return 0.5; }
		if (Era <= 4) { return 0.25; }
		if (Era <= 6) { return 0.6; }
		return 1.0;
	}

	/** Early societies mostly barred women from arms and thrones; the bar lowers with time. */
	static double GenderBar(const FCivPerson& Me, int32 Era)
	{
		if (!Me.bFemale || Era >= 5) { return 1.0; }
		return 0.25;
	}

	/** Modern peoples choose their leaders; older ones pass the throne down the family. */
	static bool Elects(int32 Era) { return Era >= 5; }

	static double Trait(FCivRandom& Rng, double FromParents, bool bHasParents)
	{
		const double Fresh = Rng.Unit();
		return bHasParents ? FMath::Clamp(0.5 * FromParents + 0.5 * Fresh, 0.0, 1.0) : Fresh;
	}

	static bool LoggedSince(const FCivPerson& Me, ECivLife Kind, int32 SinceYear)
	{
		for (int32 I = Me.Log.Num() - 1; I >= 0 && Me.Log[I].Year >= SinceYear; --I)
		{
			if (Me.Log[I].Kind == Kind) { return true; }
		}
		return false;
	}

	static bool HasKind(const FCivPerson& Me, ECivLife Kind)
	{
		return Me.Log.ContainsByPredicate([Kind](const FCivLifeEvent& E) { return E.Kind == Kind; });
	}
}

using namespace CivLifeData;

// ---------------------------------------------------------------------------
// Birth and the pool of named people
// ---------------------------------------------------------------------------

FCivLifeEvent& FCivSimulation::Log(FCivPerson& Me, ECivLife Kind, int32 Other, int32 Param)
{
	FCivLifeEvent E;
	E.Year = Year;
	E.Kind = Kind;
	E.Other = Other;
	E.Param = Param;
	E.Era = Peoples.IsValidIndex(Me.People) ? static_cast<uint8>(Peoples[Me.People].Era) : 0;
	const int32 Index = Me.Log.Add(E);
	return Me.Log[Index];
}

int32 FCivSimulation::CreatePerson(FCivRandom& Random, int32 PeopleIndex, int32 Father, int32 Mother, int32 AgeYears)
{
	FCivPeople& P = Peoples[PeopleIndex];
	const int32 Index = Persons.AddDefaulted();
	FCivPerson& Me = Persons[Index];
	const bool bFather = Father != INDEX_NONE;
	const bool bMother = Mother != INDEX_NONE;
	const bool bParents = bFather && bMother;
	const FCivPerson* Dad = bFather ? &Persons[Father] : nullptr;
	const FCivPerson* Mum = bMother ? &Persons[Mother] : nullptr;

	Me.Id = Index;
	Me.bFemale = Random.Chance(0.5);
	Me.FirstName = CivText::FirstName(Random, Me.bFemale);
	const FString ParentName = Dad ? Dad->FirstName : CivText::FirstName(Random, false);
	Me.Name = CivText::FixFinalForms(Me.FirstName + (Me.bFemale ? TEXT(" בת ") : TEXT(" בן ")) + ParentName);
	Me.House = Dad ? Dad->House : (Mum ? Mum->House : CivText::PeopleName(Random));
	Me.People = PeopleIndex;
	Me.BornYear = Year - AgeYears;
	Me.Father = Father;
	Me.Mother = Mother;

	Me.Curiosity = Trait(Random, bParents ? 0.5 * (Dad->Curiosity + Mum->Curiosity) : 0.0, bParents);
	Me.Boldness = Trait(Random, bParents ? 0.5 * (Dad->Boldness + Mum->Boldness) : 0.0, bParents);
	Me.Patience = Trait(Random, bParents ? 0.5 * (Dad->Patience + Mum->Patience) : 0.0, bParents);
	Me.Compassion = Trait(Random, bParents ? 0.5 * (Dad->Compassion + Mum->Compassion) : 0.0, bParents);
	Me.Ambition = Trait(Random, bParents ? 0.5 * (Dad->Ambition + Mum->Ambition) : 0.0, bParents);
	Me.Piety = Trait(Random, bParents ? 0.5 * (Dad->Piety + Mum->Piety) : 0.0, bParents);
	Me.Cruelty = Trait(Random, bParents ? 0.5 * (Dad->Cruelty + Mum->Cruelty) : 0.0, bParents);
	Me.Cunning = Trait(Random, bParents ? 0.5 * (Dad->Cunning + Mum->Cunning) : 0.0, bParents);
	Me.Charisma = Trait(Random, bParents ? 0.5 * (Dad->Charisma + Mum->Charisma) : 0.0, bParents);
	Me.Brilliance = FMath::Exp(Random.Normal() * 0.45);
	Me.Passion = static_cast<ECivField>(Random.RangeInt(0, CivFieldCount - 1));
	Me.Health = Random.Range(0.75, 1.0);

	// Standing is inherited, a step at a time: the child of a lord starts as gentry, not as a lord.
	const ECivRank ParentRank = FMath::Max(Dad ? Dad->Rank : ECivRank::Commoner, Mum ? Mum->Rank : ECivRank::Commoner);
	Me.Rank = ParentRank >= ECivRank::Lord || (ParentRank == ECivRank::Knight && Random.Chance(0.4)) ? ECivRank::Knight : ECivRank::Commoner;
	if (ParentRank >= ECivRank::Lord) { Me.bHeir = true; }
	Me.OriginRank = Me.Rank;
	Me.Wealth = (Dad ? Dad->Wealth : 0.05) * 0.4 + 0.02;

	const double Span = ExpectedLifespan(P) * Random.Range(0.8, 1.6);
	Me.PlannedDeathYear = Me.BornYear + FMath::Max(AgeYears + 2, FMath::RoundToInt32(Span));
	// Childhood was dangerous before medicine.
	const double ChildDeath = 0.32 / FMath::Max(1.0, P.HealthMult);
	if (AgeYears == 0 && Random.Chance(ChildDeath))
	{
		Me.PlannedDeathYear = Me.BornYear + Random.RangeInt(1, 12);
		Me.bChildDeath = true;
	}

	P.LivingPersons.Add(Index);
	++Stats.PersonsCreated;

	FCivLifeEvent BornEvent;
	BornEvent.Year = Me.BornYear;
	BornEvent.Kind = ECivLife::Born;
	BornEvent.Param = PeopleIndex;
	BornEvent.Era = static_cast<uint8>(P.Era);
	// Where: a city if the people has any, otherwise one of its villages (left empty).
	const FCivPerson* Home = Mum ? Mum : Dad;
	if (Home)
	{
		// A child is born where the family lives.
		for (int32 I = Home->Log.Num() - 1; I >= 0; --I)
		{
			if (Home->Log[I].Kind == ECivLife::MovedCity || Home->Log[I].Kind == ECivLife::Born) { BornEvent.OtherName = Home->Log[I].OtherName; break; }
		}
	}
	else if (P.Cities.Num() > 0 && Random.Chance(0.5)) { BornEvent.OtherName = P.Cities[Random.RangeInt(0, P.Cities.Num() - 1)].Name; }
	Me.Log.Add(BornEvent);
	return Index;
}

void FCivSimulation::SeedPersonPool()
{
	for (int32 Index = 0; Index < Peoples.Num(); ++Index)
	{
		const int32 Target = Settings.NamedPersonsPerPeople;
		for (int32 N = 0; N < Target; ++N)
		{
			const int32 NewId = CreatePerson(Rng, Index, INDEX_NONE, INDEX_NONE, Rng.RangeInt(0, 45));
			// Every people starts with a few families already above the rest.
			if (Year - Persons[NewId].BornYear >= 16 && N < 8)
			{
				FCivPerson& Born = Persons[NewId];
				Born.Rank = N < 4 ? ECivRank::Lord : ECivRank::Knight;
				Born.OriginRank = Born.Rank;
				Born.Occupation = N < 4 ? ECivOccupation::Lord : ECivOccupation::Soldier;
				Born.Reputation = Rng.Range(0.2, 0.6);
				Born.Arms = Rng.Range(0.2, 0.6);
			}
		}
	}
}

int32 FCivSimulation::CountNobles(int32 PeopleIndex) const
{
	int32 Count = 0;
	for (int32 Id : Peoples[PeopleIndex].LivingPersons)
	{
		const FCivPerson& C = Persons[Id];
		if (C.Rank >= ECivRank::Lord && Year - C.BornYear >= 18) { ++Count; }
	}
	return Count;
}

int32 FCivSimulation::CreateNoble(int32 PeopleIndex)
{
	const int32 Id = CreatePerson(Rng, PeopleIndex, INDEX_NONE, INDEX_NONE, Rng.RangeInt(22, 45));
	FCivPerson& Me = Persons[Id];
	Me.Rank = ECivRank::Lord;
	Me.OriginRank = ECivRank::Lord;
	Me.Occupation = ECivOccupation::Lord;
	Me.bHeir = true;
	Me.Reputation = Rng.Range(0.25, 0.5);
	Me.Arms = Rng.Range(0.2, 0.5);
	Me.Wealth = Rng.Range(0.4, 0.8);
	Log(Me, ECivLife::FromNobility, INDEX_NONE, PeopleIndex);
	return Id;
}

FCivPerson& FCivSimulation::BirthInventor(int32 PeopleIndex, int32 AgeYears)
{
	// An inventor is someone already living whose curiosity found an opening. Only if nobody fits does a new face appear.
	FCivPeople& P = Peoples[PeopleIndex];
	int32 Found = INDEX_NONE;
	double Best = 0.0;
	for (int32 Id : P.LivingPersons)
	{
		const FCivPerson& C = Persons[Id];
		const int32 Age = Year - C.BornYear;
		if (C.bInventor || C.Rank >= ECivRank::Lord || C.bChildDeath || C.Occupation == ECivOccupation::Priest || C.Occupation == ECivOccupation::Rebel || Age < 18 || Age > 45) { continue; }
		const double Score = C.Curiosity + C.Patience * 0.5 + Rng.Range(0.0, 0.3);
		if (Score > Best) { Best = Score; Found = Id; }
	}
	if (Found == INDEX_NONE) { Found = CreatePerson(Rng, PeopleIndex, INDEX_NONE, INDEX_NONE, FMath::Max(AgeYears, 16)); }

	FCivPerson& Me = Persons[Found];
	Me.bInventor = true;
	if (Year - Me.BornYear >= 14) { Me.Occupation = ECivOccupation::Inventor; }
	Me.Curiosity = FMath::Max(Me.Curiosity, Rng.Range(0.5, 1.0));
	Peoples[PeopleIndex].LivingInventors.Add(Found);
	++Stats.InventorsBorn;
	Log(Me, ECivLife::BecameInventor);
	return Me;
}

void FCivSimulation::KillPerson(FCivPerson& G, const TCHAR* Cause)
{
	if (!G.IsAlive()) { return; }
	G.DeathYear = Year;
	G.DeathCause = Cause;
	G.Project = INDEX_NONE;
	FCivPeople& P = Peoples[G.People];
	P.LivingPersons.Remove(G.Id);
	P.LivingInventors.Remove(G.Id);
	if (Year - G.BornYear < 15) { ++Stats.DiedYoung; }
	Log(G, ECivLife::Died);

	if (G.Spouse != INDEX_NONE && Persons[G.Spouse].IsAlive())
	{
		Log(Persons[G.Spouse], ECivLife::Widowed, G.Id);
		Persons[G.Spouse].Spouse = INDEX_NONE;
	}
	for (int32 ParentId : { G.Father, G.Mother })
	{
		if (ParentId != INDEX_NONE && Persons[ParentId].IsAlive() && Year - G.BornYear < 40) { Log(Persons[ParentId], ECivLife::ChildDied, G.Id); }
	}

	// A title passes to a grown child; with no heir the land goes back to the crown.
	if (G.Rank == ECivRank::Lord)
	{
		for (int32 Id : P.LivingPersons)
		{
			FCivPerson& Child = Persons[Id];
			if ((Child.Father == G.Id || Child.Mother == G.Id) && Year - Child.BornYear >= 16 && Child.Rank < ECivRank::Lord)
			{
				Child.Rank = ECivRank::Lord;
				if (!Child.bInventor) { Child.Occupation = ECivOccupation::Lord; }
				Log(Child, ECivLife::Inherited);
				break;
			}
		}
	}

	if (G.bHoly && G.Reputation > 0.6)
	{
		G.bVenerated = true;
		++Stats.Saints;
		P.Faith = FMath::Min(1.0, P.Faith + 0.1);
		Log(G, ECivLife::Venerated);
		Write(ECivEntryKind::Inventor, 2, G.People, Fill(G.bFemale ? TEXT("{0} מעם {1}, שהעם קרא לה קדושה, מתה; קברה נעשה מקום עלייה לרגל.") : TEXT("{0} מעם {1}, שהעם קרא לו קדוש, מת; קברו נעשה מקום עלייה לרגל."), { G.Name, P.Name }));
	}
	else if (G.InventionCount >= 3)
	{
		Write(ECivEntryKind::Inventor, 2, G.People, Fill(
			G.bFemale ? TEXT("{0} {1} מעם {2} מתה בגיל {3}, אחרי {4} המצאות.") : TEXT("{0} {1} מעם {2} מת בגיל {3}, אחרי {4} המצאות."),
			{ G.Name, G.PersonalityWord(), P.Name, FString::FromInt(Year - G.BornYear), FString::FromInt(G.InventionCount) }));
	}
}

// ---------------------------------------------------------------------------
// Each year of a life
// ---------------------------------------------------------------------------

void FCivSimulation::TickPersons()
{
	for (int32 Index = 0; Index < Peoples.Num(); ++Index)
	{
		if (!Peoples[Index].bAlive) { continue; }

		FCivPeople& P = Peoples[Index];
		FCivYearContext Context;
		Context.PeopleIndex = Index;
		Context.Era = P.Era;
		for (const FCivWar& War : Wars)
		{
			if (War.A == Index || War.B == Index) { Context.bAtWar = true; Context.Enemy = War.A == Index ? War.B : War.A; break; }
		}
		Context.bPlague = P.NeedPressure[static_cast<int32>(ECivNeed::Plague)] > 0.7;
		Context.bFamine = P.NeedPressure[static_cast<int32>(ECivNeed::Famine)] > 0.7;
		Context.bDisaster = P.NeedPressure[static_cast<int32>(ECivNeed::Disaster)] > 0.7;
		Context.bRulerIsTyrant = Persons.IsValidIndex(P.Ruler) && Persons[P.Ruler].IsAlive() && Persons[P.Ruler].bTyrant;

		// Creating people can move the list in memory, so births wait until the end of the year.
		PendingBirths.Reset();
		const TArray<int32> Everyone = P.LivingPersons;
		for (int32 Id : Everyone)
		{
			if (Persons[Id].IsAlive() && Persons[Id].People == Index) { LifeYear(Id, Context); }
		}
		for (const TPair<int32, int32>& Parents : PendingBirths)
		{
			const int32 ChildId = CreatePerson(Rng, Index, Parents.Key, Parents.Value, 0);
			Log(Persons[Parents.Key], ECivLife::Child, ChildId);
			Log(Persons[Parents.Value], ECivLife::Child, ChildId);
			Persons[Parents.Key].ChildCount += 1;
			Persons[Parents.Value].ChildCount += 1;
			for (int32 ParentId : { Parents.Key, Parents.Value })
			{
				for (int32 Grand : { Persons[ParentId].Father, Persons[ParentId].Mother })
				{
					if (Persons.IsValidIndex(Grand) && Persons[Grand].IsAlive()) { Log(Persons[Grand], ECivLife::Grandchild, ChildId); }
				}
			}
		}

		// When attrition thins the named circle, someone from the crowd steps into view, with the start of a past.
		while (Peoples[Index].LivingPersons.Num() < Settings.NamedPersonsPerPeople / 2)
		{
			const int32 NewId = CreatePerson(Rng, Index, INDEX_NONE, INDEX_NONE, Rng.RangeInt(14, 40));
			FCivPerson& Newcomer = Persons[NewId];
			Newcomer.Occupation = (Peoples[Index].Era >= 1 && Rng.Chance(0.2)) ? ECivOccupation::Artisan : ECivOccupation::Farmer;
			FCivLifeEvent Work;
			Work.Year = Newcomer.BornYear + 14; Work.Kind = ECivLife::Work; Work.Param = static_cast<int32>(Newcomer.Occupation);
			Work.Era = static_cast<uint8>(Peoples[Index].Era);
			Newcomer.Log.Add(Work);
		}

		// The great families do not vanish just because the book stopped naming them.
		if (CountNobles(Index) < 3) { CreateNoble(Index); }

		UpdateRuler(Index, Context);
	}
}

void FCivSimulation::UpdateRuler(int32 PeopleIndex, const FCivYearContext& Context)
{
	FCivPeople& P = Peoples[PeopleIndex];
	const bool bVacant = !Persons.IsValidIndex(P.Ruler) || !Persons[P.Ruler].IsAlive() || Persons[P.Ruler].People != PeopleIndex || Persons[P.Ruler].Rank != ECivRank::Ruler;
	if (bVacant)
	{
		int32 Successor = INDEX_NONE;
		ECivLife How = ECivLife::Chosen;
		const int32 Previous = P.Ruler;

		if (Persons.IsValidIndex(Previous) && !Elects(P.Era))
		{
			// The family keeps the throne: a grown child first (in older times a son before a daughter), then a brother or sister.
			int32 Daughter = INDEX_NONE;
			for (int32 Pass = 0; Pass < 2 && Successor == INDEX_NONE; ++Pass)
			{
				for (int32 Id : P.LivingPersons)
				{
					const FCivPerson& C = Persons[Id];
					if (Year - C.BornYear < 16) { continue; }
					const bool bChild = C.Father == Previous || C.Mother == Previous;
					const bool bSibling = !bChild && C.Id != Previous && C.Father != INDEX_NONE && C.Father == Persons[Previous].Father;
					if ((Pass == 0 && !bChild) || (Pass == 1 && !bSibling)) { continue; }
					if (C.bFemale && P.Era < 5) { if (Daughter == INDEX_NONE) { Daughter = Id; } continue; }
					Successor = Id;
					break;
				}
				if (Successor == INDEX_NONE && Daughter != INDEX_NONE) { Successor = Daughter; }
			}
			if (Successor != INDEX_NONE) { How = ECivLife::Crowned; }
		}

		if (Successor == INDEX_NONE)
		{
			// No heir: the great families settle it among themselves. Modern peoples vote, and a well-known commoner can win.
			double Best = -1.0;
			for (int32 Id : P.LivingPersons)
			{
				const FCivPerson& C = Persons[Id];
				if (Year - C.BornYear < 25 || C.Occupation == ECivOccupation::Rebel || C.Occupation == ECivOccupation::Priest || C.bHoly) { continue; }
				const bool bEligible = C.Rank >= ECivRank::Lord || (Elects(P.Era) && C.Reputation > 0.5 && Year - C.BornYear >= 35);
				if (!bEligible) { continue; }
				double Score = C.Reputation * 2.0 + C.Charisma + Rng.Range(0.0, 0.5);
				if (!Elects(P.Era)) { Score += static_cast<int32>(C.Rank) * 0.5; Score *= GenderBar(C, P.Era); }
				if (Score > Best) { Best = Score; Successor = Id; }
			}
		}
		if (Successor == INDEX_NONE) { Successor = CreateNoble(PeopleIndex); }
		SetRuler(PeopleIndex, Successor, How, INDEX_NONE);
	}

	if (Persons.IsValidIndex(P.Ruler) && Persons[P.Ruler].IsAlive())
	{
		const FCivPerson& R = Persons[P.Ruler];
		P.RulerAggression = 0.5 + R.Cruelty * 0.75 + R.Ambition * 0.75;
	}
	else
	{
		P.RulerAggression = 1.0;
	}
	P.LawBonus = FMath::Max(0.0, P.LawBonus * 0.999);
}

void FCivSimulation::SetRuler(int32 PeopleIndex, int32 Id, ECivLife How, int32 Fallen)
{
	FCivPeople& P = Peoples[PeopleIndex];
	FCivPerson& Me = Persons[Id];
	Me.Rank = ECivRank::Ruler;
	Me.Occupation = Me.bInventor ? ECivOccupation::Inventor : ECivOccupation::Lord;
	Me.Reputation = FMath::Max(Me.Reputation, How == ECivLife::Crowned || How == ECivLife::Chosen ? 0.35 : 0.25);
	P.Ruler = Id;

	const FString Title = RankWord(ECivRank::Ruler, P.Era, Me.bFemale);
	Log(Me, How, Fallen, PeopleIndex);

	const bool bFromCommon = Me.OriginRank == ECivRank::Commoner && How != ECivLife::Crowned;
	if (bFromCommon) { ++Stats.RulersFromCommon; }

	const TCHAR* Text = nullptr;
	if (How == ECivLife::Crowned) { Text = Me.bFemale ? TEXT("{0} עלתה לשלטון בעם {1} בירושה, כ{2}.") : TEXT("{0} עלה לשלטון בעם {1} בירושה, כ{2}."); }
	else if (How == ECivLife::CoupWon) { Text = Me.bFemale ? TEXT("{0} תפסה את השלטון בעם {1} בהפיכה והפכה ל{2}.") : TEXT("{0} תפס את השלטון בעם {1} בהפיכה והפך ל{2}."); }
	else if (How == ECivLife::RebelWon) { Text = Me.bFemale ? TEXT("המרד של {0} ניצח בעם {1}, והיא הפכה ל{2}.") : TEXT("המרד של {0} ניצח בעם {1}, והוא הפך ל{2}."); }
	else if (bFromCommon) { Text = Me.bFemale ? TEXT("{0}, שנולדה בבית פשוט, נבחרה בעם {1} להיות {2}.") : TEXT("{0}, שנולד בבית פשוט, נבחר בעם {1} להיות {2}."); }
	else { Text = Me.bFemale ? TEXT("{0} נבחרה בעם {1} להיות {2}.") : TEXT("{0} נבחר בעם {1} להיות {2}."); }
	// Ordinary successions stay out of the book; seized thrones and self-made rulers do not.
	const int32 Importance = (How == ECivLife::CoupWon || How == ECivLife::RebelWon || (bFromCommon && !Elects(P.Era))) ? 3 : 1;
	Write(ECivEntryKind::People, Importance, PeopleIndex, Fill(Text, { Me.Name, P.Name, Title }));
}

bool FCivSimulation::TryCoup(int32 Id, const FCivYearContext& C)
{
	FCivPeople& P = Peoples[C.PeopleIndex];
	if (!Persons.IsValidIndex(P.Ruler) || !Persons[P.Ruler].IsAlive() || P.Ruler == Id) { return false; }
	FCivPerson& Me = Persons[Id];
	const FCivPerson& Throne = Persons[P.Ruler];
	const int32 Age = Year - Me.BornYear;
	const bool bOpen = Throne.bTyrant || Throne.Reputation < 0.15 || Year - Throne.BornYear > 70 || (C.bAtWar && Throne.Reputation < 0.3);
	if (!bOpen || Me.Ambition < 0.75 || Me.Cunning < 0.5 || Age < 25 || Age > 60) { return false; }
	if (!Rng.Chance(0.012 * GenderBar(Me, C.Era))) { return false; }

	const int32 Fallen = P.Ruler;
	FCivPerson& R = Persons[Fallen];
	const double Attack = Me.Cunning + Me.Charisma + Me.Reputation + Me.Arms * 0.5;
	const double Defence = R.Cunning + R.Reputation + (R.bTyrant ? -0.2 : 0.3) + 0.5;   // the throne has its own guards
	const double Odds = FMath::Clamp(Attack / (Attack + Defence * 1.5), 0.05, 0.5);
	++Stats.CoupsTried;
	if (Rng.Chance(Odds))
	{
		++Stats.CoupsWon;
		++Stats.Deposed;
		Log(R, ECivLife::Deposed, Id);
		R.Rank = ECivRank::Commoner;
		R.Occupation = ECivOccupation::Farmer;
		R.Reputation *= 0.5;
		R.bTyrant = false;
		SetRuler(C.PeopleIndex, Id, ECivLife::CoupWon, Fallen);
		if (Rng.Chance(0.5)) { KillPerson(Persons[Fallen], TEXT("נרצח בידי מי שתפס את מקומו")); }
		return false;
	}

	Log(Me, ECivLife::CoupLost, Fallen);
	if (Rng.Chance(0.7))
	{
		KillPerson(Me, TEXT("הוצאה להורג"));
		return true;
	}
	Me.Rank = ECivRank::Commoner;
	Me.Occupation = ECivOccupation::Farmer;
	Me.Reputation *= 0.3;
	Log(Me, ECivLife::Disgraced);
	return false;
}

void FCivSimulation::LifeYear(int32 Id, const FCivYearContext& C)
{
	FCivPerson& Me = Persons[Id];
	FCivPeople& P = Peoples[C.PeopleIndex];
	const int32 Age = Year - Me.BornYear;
	const double Mob = Mobility(C.Era);
	const double Bar = GenderBar(Me, C.Era);

	// Body: age and sickness.
	if (Age >= 40) { Me.Health -= Rng.Range(0.002, 0.012); }
	else { Me.Health = FMath::Min(1.0, Me.Health + 0.01); }
	if (Year >= Me.PlannedDeathYear || Me.Health <= 0.0)
	{
		const TCHAR* Cause = Me.bChildDeath ? TEXT("מחלת ילדות") : (Age >= 50 ? TEXT("זקנה") : TEXT("מחלה"));
		KillPerson(Me, Cause);
		return;
	}
	if (Age < 14) { return; }

	// The first real choice in life: what to do. Mostly it is what the parents did.
	if (Me.Occupation == ECivOccupation::None)
	{
		ECivOccupation Choice = ECivOccupation::Farmer;
		const ECivOccupation Parent = Persons.IsValidIndex(Me.Father) ? Persons[Me.Father].Occupation : ECivOccupation::Farmer;
		if (Me.Rank >= ECivRank::Knight && Rng.Chance(0.6 * Bar + 0.2)) { Choice = ECivOccupation::Soldier; }
		else if (Parent == ECivOccupation::Merchant || Parent == ECivOccupation::Artisan) { Choice = Rng.Chance(0.7) ? Parent : ECivOccupation::Farmer; }
		else if (C.Era >= 1 && Rng.Chance(0.15)) { Choice = ECivOccupation::Artisan; }
		else if (C.Era >= 2 && Me.Cunning > 0.8 && Rng.Chance(0.25)) { Choice = ECivOccupation::Merchant; }
		else if (Me.Boldness > 0.7 && Rng.Chance(0.3 * Bar)) { Choice = ECivOccupation::Soldier; }
		Me.Occupation = Choice;
		Log(Me, ECivLife::Work, INDEX_NONE, static_cast<int32>(Choice));
	}

	// Family: most lives are made of this.
	if (Me.Spouse == INDEX_NONE && Age >= 16 && Age <= 40 && !Me.bHoly && Rng.Chance(0.09) && !LoggedSince(Me, ECivLife::Widowed, Year - 2))
	{
		int32 Match = INDEX_NONE;
		double Best = 0.0;
		for (int32 Other : P.LivingPersons)
		{
			const FCivPerson& O = Persons[Other];
			const int32 OtherAge = Year - O.BornYear;
			if (O.bFemale == Me.bFemale || O.Spouse != INDEX_NONE || OtherAge < 16 || OtherAge > 40 || O.bHoly || O.Id == Id) { continue; }
			if (O.Father != INDEX_NONE && (O.Father == Me.Father || O.Mother == Me.Mother)) { continue; }
			const int32 RankGap = FMath::Abs(static_cast<int32>(O.Rank) - static_cast<int32>(Me.Rank));
			const double Score = Rng.Range(0.0, 1.0) - RankGap * 0.8 - FMath::Abs(OtherAge - Age) * 0.03 + Me.Charisma * 0.2;
			if (Score > Best) { Best = Score; Match = Other; }
		}
		if (Match != INDEX_NONE)
		{
			FCivPerson& O = Persons[Match];
			Me.Spouse = Match;
			O.Spouse = Id;
			const bool bUp = static_cast<int32>(O.Rank) > static_cast<int32>(Me.Rank) && O.Rank >= ECivRank::Knight;
			const bool bDown = static_cast<int32>(Me.Rank) > static_cast<int32>(O.Rank) && Me.Rank >= ECivRank::Knight;
			Log(Me, bUp ? ECivLife::MarriedUp : ECivLife::Married, Match);
			Log(O, bDown ? ECivLife::MarriedUp : ECivLife::Married, Id);
			if (bUp) { Me.Reputation = FMath::Min(1.0, Me.Reputation + 0.1); }
			if (bDown) { O.Reputation = FMath::Min(1.0, O.Reputation + 0.1); }
		}
	}
	// The small things that fill most years.
	if (Age >= 18 && Me.Rank == ECivRank::Commoner)
	{
		if (!Me.bMoved && P.Cities.Num() > 0 && Me.Log.Num() > 0 && Me.Log[0].OtherName.IsEmpty() && Rng.Chance(0.006))
		{
			Me.bMoved = true;
			Log(Me, ECivLife::MovedCity).OtherName = P.Cities[Rng.RangeInt(0, P.Cities.Num() - 1)].Name;
		}
		if (P.ClimateFactor > 1.1 && Rng.Chance(0.05) && !LoggedSince(Me, ECivLife::GoodYear, Year - 15))
		{
			Me.Wealth = FMath::Min(1.0, Me.Wealth + 0.1);
			Log(Me, ECivLife::GoodYear);
		}
		if (Me.Rival == INDEX_NONE && Rng.Chance(0.004 * (0.5 + Me.Cruelty + Me.Ambition)))
		{
			const int32 Other = P.LivingPersons[Rng.RangeInt(0, P.LivingPersons.Num() - 1)];
			const FCivPerson& O = Persons[Other];
			const bool bFamily = Other == Me.Father || Other == Me.Mother || O.Father == Id || O.Mother == Id || (Me.Father != INDEX_NONE && O.Father == Me.Father);
			if (Other != Id && Other != Me.Spouse && !bFamily && Year - O.BornYear >= 18)
			{
				Me.Rival = Other;
				Log(Me, ECivLife::Feud, Other);
			}
		}
	}

	if (Me.bFemale && Me.Spouse != INDEX_NONE && Age <= 42 && Me.ChildCount < 7 && Persons[Me.Spouse].IsAlive() && Me.Log.Last().Kind != ECivLife::Married && Me.Log.Last().Kind != ECivLife::MarriedUp && Rng.Chance(0.14))
	{
		// Only some children enter the named circle; the rest stay in the statistics.
		const int32 Cap = Settings.NamedPersonsPerPeople;
		const bool bNamed = P.LivingPersons.Num() < Cap || (Me.Rank >= ECivRank::Lord && P.LivingPersons.Num() < Cap + Cap / 2);
		if (bNamed) { PendingBirths.Add(TPair<int32, int32>(Me.Spouse, Id)); }
		else { Me.ChildCount += 1; }
	}

	// What the world does to a person.
	if (C.bPlague && Rng.Chance(0.12) && !LoggedSince(Me, ECivLife::PlagueSurvived, Year - 5))
	{
		Log(Me, ECivLife::PlagueSurvived);
		if (Me.Occupation == ECivOccupation::Farmer && Me.Piety > 0.7 && Rng.Chance(0.3))
		{
			Me.Occupation = ECivOccupation::Priest;
			Me.AwakeningCause = ECivNeed::Plague;
			Log(Me, ECivLife::Awakening, INDEX_NONE, static_cast<int32>(ECivNeed::Plague));
			++Stats.Preachers;
		}
		else if ((Me.Occupation == ECivOccupation::Farmer || Me.Occupation == ECivOccupation::Artisan) && Me.Compassion > 0.8 && Rng.Chance(0.4))
		{
			Me.Occupation = ECivOccupation::Healer;
			Log(Me, ECivLife::Healer);
			++Stats.Healers;
		}
	}
	if (C.bFamine && Me.Rank <= ECivRank::Commoner && Rng.Chance(0.08))
	{
		Me.Wealth *= 0.5;
		Me.Health -= 0.08;
		if (!LoggedSince(Me, ECivLife::Hunger, Year - 10)) { Log(Me, ECivLife::Hunger); }
		if (Me.Occupation == ECivOccupation::Farmer && Me.Piety > 0.75 && Rng.Chance(0.1))
		{
			Me.Occupation = ECivOccupation::Priest;
			Me.AwakeningCause = ECivNeed::Famine;
			Log(Me, ECivLife::Awakening, INDEX_NONE, static_cast<int32>(ECivNeed::Famine));
			++Stats.Preachers;
		}
	}
	if (Age > 18 && Rng.Chance(0.012))
	{
		Me.Health -= 0.25;
		Log(Me, ECivLife::Illness);
		// A broken body turns some to faith, too.
		if (Me.Piety > 0.8 && Me.Occupation == ECivOccupation::Farmer && Rng.Chance(0.1))
		{
			Me.Occupation = ECivOccupation::Priest;
			Me.AwakeningCause = ECivNeed::None;
			Log(Me, ECivLife::Awakening, INDEX_NONE, static_cast<int32>(ECivNeed::None));
			++Stats.Preachers;
		}
	}

	// War pulls people out of their lives.
	if (C.bAtWar && Age >= 16 && Age <= 40 && (Me.Occupation == ECivOccupation::Farmer || Me.Occupation == ECivOccupation::Artisan) && Rng.Chance(0.03 * (0.5 + Me.Boldness) * Bar))
	{
		Me.Occupation = ECivOccupation::Soldier;
		Log(Me, ECivLife::Levied, INDEX_NONE, C.Enemy);
	}

	// Each path has its own chances and dangers.
	switch (Me.Occupation)
	{
	case ECivOccupation::Farmer:
	case ECivOccupation::Artisan:
		if (C.Era >= 2 && Me.Cunning > 0.65 && Me.Ambition > 0.5 && Rng.Chance(0.006))
		{
			Me.Occupation = ECivOccupation::Merchant;
			Log(Me, ECivLife::Work, INDEX_NONE, static_cast<int32>(ECivOccupation::Merchant));
		}
		else if (Me.Ambition > 0.7 && Me.Boldness > 0.6 && Age >= 25 && Age < 50 && (C.bFamine || C.bRulerIsTyrant) && Rng.Chance(0.012))
		{
			Me.Occupation = ECivOccupation::Rebel;
			Me.RebelStart = Year;
			Log(Me, ECivLife::Rebel, P.Ruler, C.bRulerIsTyrant ? 1 : 0);
			++Stats.Rebels;
		}
		else if (C.Era >= 1 && Me.Boldness > 0.7 && Me.Curiosity > 0.6 && Age < 40 && Rng.Chance(0.003))
		{
			Me.Occupation = ECivOccupation::Explorer;
			Log(Me, ECivLife::Explorer);
			++Stats.Explorers;
		}
		break;

	case ECivOccupation::Soldier:
		Me.Arms = FMath::Min(1.0, Me.Arms + Rng.Range(0.0, 0.04));
		if (C.bAtWar || Rng.Chance(C.Era <= 3 ? 0.25 : 0.12))   // wars, and the raids and border fights between them
		{
			if (Rng.Chance(0.03 * (1.2 - Me.Arms)))
			{
				KillPerson(Me, C.bAtWar ? TEXT("פצעי מלחמה") : TEXT("פצעים מקרב בגבול"));
				return;
			}
			if (Rng.Chance(0.15 * (Me.Arms + Me.Boldness)))
			{
				Me.Reputation = FMath::Min(1.0, Me.Reputation + Rng.Range(0.08, 0.22));
				Log(Me, ECivLife::Battle, INDEX_NONE, C.bAtWar ? C.Enemy : INDEX_NONE);
			}
			if (Me.Rank < ECivRank::Knight && Me.Arms > 0.3 && Me.Reputation > 0.25 && Rng.Chance(0.4 * Mob * Bar))
			{
				Me.Rank = ECivRank::Knight;
				if (Persons.IsValidIndex(P.Ruler) && Persons[P.Ruler].IsAlive()) { Me.Patron = P.Ruler; }
				Log(Me, ECivLife::Knighted, Me.Patron, static_cast<int32>(ECivRank::Knight));
				if (Me.OriginRank <= ECivRank::Commoner) { ++Stats.Knighted; }
			}
			else if (Me.Rank == ECivRank::Knight && Me.Reputation > 0.4 && Me.Arms > 0.45 && CountNobles(C.PeopleIndex) < 8 && Rng.Chance(0.15 * Mob * Bar))
			{
				Me.Rank = ECivRank::Lord;
				Me.Occupation = ECivOccupation::Lord;
				Log(Me, ECivLife::Ennobled, INDEX_NONE, static_cast<int32>(ECivRank::Lord));
				if (Me.OriginRank <= ECivRank::Commoner)
				{
					++Stats.Ennobled;
					Write(ECivEntryKind::People, 2, C.PeopleIndex, Fill(Me.bFemale ? TEXT("{0}, שהתחילה כחיילת פשוטה בעם {1}, קיבלה אדמה ותואר.") : TEXT("{0}, שהתחיל כחייל פשוט בעם {1}, קיבל אדמה ותואר."), { Me.Name, P.Name }));
				}
				break;
			}
		}
		if (Me.IsAlive() && Me.Occupation == ECivOccupation::Soldier && (Age > 55 || (Age > 45 && Rng.Chance(0.1))))
		{
			Me.Occupation = ECivOccupation::Farmer;   // goes home
			Log(Me, ECivLife::Retired);
			break;
		}
		// A famous commander is a danger to a weak throne.
		if (Me.Rank == ECivRank::Knight && Me.Reputation > 0.65)
		{
			if (!HasKind(Me, ECivLife::General)) { Log(Me, ECivLife::General); }
			if (TryCoup(Id, C)) { return; }
		}
		break;

	case ECivOccupation::Lord:
	{
		if (Me.Rank == ECivRank::Ruler)
		{
			if (Me.Cruelty > 0.75 && !Me.bTyrant && Age > 25 && Rng.Chance(0.08))
			{
				Me.bTyrant = true;
				Log(Me, ECivLife::Tyrant);
				++Stats.Tyrants;
				Write(ECivEntryKind::People, 1, C.PeopleIndex, Fill(Me.bFemale ? TEXT("{0}, השליטה של עם {1}, החלה לשלוט בפחד.") : TEXT("{0}, השליט של עם {1}, החל לשלוט בפחד."), { Me.Name, P.Name }));
			}
			if (Me.Compassion > 0.55 && Me.Patience > 0.4 && Rng.Chance(0.03))
			{
				P.LawBonus = FMath::Min(0.4, P.LawBonus + 0.05);
				Me.Reputation = FMath::Min(1.0, Me.Reputation + 0.05);
				Log(Me, ECivLife::Law);
			}
			// A quiet reign builds trust; fear wears it down.
			Me.Reputation = FMath::Clamp(Me.Reputation + (Me.bTyrant ? -0.01 : 0.004 * (0.5 + Me.Compassion)), 0.0, 1.0);
			break;
		}
		if (Me.Rank == ECivRank::Lord && TryCoup(Id, C)) { return; }
		break;
	}

	case ECivOccupation::Merchant:
		Me.Wealth = FMath::Min(1.0, Me.Wealth + Rng.Range(-0.01, 0.05) * (0.5 + Me.Cunning));
		if (Me.Wealth > 0.6 && !Me.bRich && Rng.Chance(0.1))
		{
			Me.bRich = true;
			Me.Reputation = FMath::Min(1.0, Me.Reputation + 0.15);
			Log(Me, ECivLife::Rich);
			++Stats.RichMerchants;
		}
		if (Me.Wealth > 0.2)
		{
			// War closes the roads, disasters burn the stores, and some voyages simply never come back.
			const int32 Why = C.bAtWar ? 0 : (C.bDisaster ? 1 : 2);
			const double Risk = Why == 2 ? 0.006 : 0.03;
			if (Rng.Chance(Risk))
			{
				Me.Wealth = 0.03;
				Me.bRich = false;
				Me.Reputation *= 0.6;
				Log(Me, ECivLife::Ruined, INDEX_NONE, Why);
				++Stats.Ruined;
			}
		}
		break;

	case ECivOccupation::Priest:
		Me.Faith = FMath::Min(1.0, Me.Faith + Rng.Range(0.0, 0.05));
		Me.Reputation = FMath::Min(1.0, Me.Reputation + Rng.Range(-0.005, 0.03) * (0.5 + Me.Charisma));
		if (Me.Faith > 0.4 && Rng.Chance(0.02) && !LoggedSince(Me, ECivLife::Miracle, Year - 10)) { Log(Me, ECivLife::Miracle); Me.Reputation = FMath::Min(1.0, Me.Reputation + 0.12); }
		if (!Me.bHoly && Me.Reputation > 0.6 && Me.Faith > 0.5 && Rng.Chance(0.15))
		{
			Me.bHoly = true;
			Log(Me, ECivLife::Holy);
			Write(ECivEntryKind::People, 1, C.PeopleIndex, Fill(Me.bFemale ? TEXT("בעם {1} קמה אישה קדושה: {0}. עולי רגל צעדו אליה ימים שלמים.") : TEXT("בעם {1} קם איש קדוש: {0}. עולי רגל צעדו אליו ימים שלמים."), { Me.Name, P.Name }));
		}
		if (Me.bHoly && P.Faith < 0.4 && Rng.Chance(0.04))
		{
			P.Faith = FMath::Min(1.0, P.Faith + 0.2);
			Log(Me, ECivLife::Faith, INDEX_NONE, C.PeopleIndex);
		}
		if (C.bRulerIsTyrant && Me.Reputation > 0.4 && Rng.Chance(0.05) && !LoggedSince(Me, ECivLife::Persecuted, Year - 10))
		{
			Log(Me, ECivLife::Persecuted);
			if (Rng.Chance(0.4))
			{
				Me.Reputation = FMath::Min(1.0, Me.Reputation + 0.25);
				Me.bHoly = Me.bHoly || Me.Reputation > 0.6;
				KillPerson(Me, TEXT("הוצאה להורג בידי השלטון"));
				return;
			}
		}
		break;

	case ECivOccupation::Healer:
		Me.Reputation = FMath::Min(1.0, Me.Reputation + Rng.Range(0.0, 0.015));
		if (C.bPlague && Rng.Chance(0.03))
		{
			KillPerson(Me, TEXT("מגפה שנדבקה בה בעת הטיפול"));
			return;
		}
		break;

	case ECivOccupation::Rebel:
	{
		if (Year - Me.RebelStart > 6)
		{
			Me.Occupation = ECivOccupation::Farmer;
			Log(Me, ECivLife::RebelFaded);
			break;
		}
		if (Rng.Chance(0.12))
		{
			// Most risings are crushed. A weak or hated ruler gives them a real chance; a settled kingdom almost none.
			const bool bRulerWeak = Persons.IsValidIndex(P.Ruler) && Persons[P.Ruler].IsAlive() && (Persons[P.Ruler].bTyrant || Persons[P.Ruler].Reputation < 0.2);
			const double Odds = (bRulerWeak ? 0.25 : 0.05) * (0.5 + Me.Charisma) * Bar * (Me.Reputation > 0.1 ? 1.0 : 0.5) * (0.5 + Mob);
			if (Rng.Chance(Odds))
			{
				const int32 Fallen = P.Ruler;
				if (Persons.IsValidIndex(Fallen) && Persons[Fallen].IsAlive())
				{
					Log(Persons[Fallen], ECivLife::Deposed, Id);
					Persons[Fallen].Rank = ECivRank::Commoner;
					Persons[Fallen].Occupation = ECivOccupation::Farmer;
					Persons[Fallen].bTyrant = false;
					++Stats.Deposed;
				}
				++Stats.RebellionsWon;
				SetRuler(C.PeopleIndex, Id, ECivLife::RebelWon, Fallen);
			}
			else if (Rng.Chance(0.6))
			{
				KillPerson(Me, TEXT("דיכוי המרד"));
				return;
			}
		}
		break;
	}

	case ECivOccupation::Explorer:
		if (Rng.Chance(0.05))
		{
			KillPerson(Me, TEXT("מסע שלא חזר ממנו"));
			return;
		}
		if (Rng.Chance(0.08))
		{
			Me.Reputation = FMath::Min(1.0, Me.Reputation + 0.2);
			Log(Me, ECivLife::Discovery);
			P.ExplorerRange = FMath::Min(1.0, P.ExplorerRange + 0.05);
			Recalculate(P);
			Me.Occupation = ECivOccupation::Farmer;
		}
		break;

	default:
		break;
	}

	// A title can be lost.
	if (Me.Rank == ECivRank::Knight && Me.Occupation != ECivOccupation::Soldier && Me.OriginRank == ECivRank::Commoner && Me.Reputation < 0.05 && Rng.Chance(0.01))
	{
		Me.Rank = ECivRank::Commoner;
		Log(Me, ECivLife::Disgraced);
	}
	Me.Reputation = FMath::Max(0.0, Me.Reputation - 0.002);
}

// ---------------------------------------------------------------------------
// Looking at one person
// ---------------------------------------------------------------------------

int32 FCivSimulation::PromoteFromCrowd(int32 PeopleIndex)
{
	if (!Peoples.IsValidIndex(PeopleIndex) || !Peoples[PeopleIndex].bAlive) { return INDEX_NONE; }

	// A separate random stream: looking at someone does not disturb the rest of the world's dice.
	FCivRandom Background(Settings.Seed ^ (static_cast<uint64>(Persons.Num()) << 20), 0x50524F4DULL);
	const uint8 Era = static_cast<uint8>(Peoples[PeopleIndex].Era);
	const int32 Id = CreatePerson(Background, PeopleIndex, INDEX_NONE, INDEX_NONE, Background.RangeInt(20, 55));
	const int32 Age = Year - Persons[Id].BornYear;
	Persons[Id].bPromoted = true;

	// A plausible past: work at 14, a marriage for most, children for many. The family are real people too.
	Persons[Id].Occupation = Background.Chance(0.75) ? ECivOccupation::Farmer : ECivOccupation::Artisan;
	FCivLifeEvent Work; Work.Year = Persons[Id].BornYear + 14; Work.Kind = ECivLife::Work; Work.Param = static_cast<int32>(Persons[Id].Occupation); Work.Era = Era;
	Persons[Id].Log.Add(Work);
	if (Age > 22 && Background.Chance(0.7))
	{
		const int32 MarriedAt = Background.RangeInt(18, FMath::Min(30, Age - 1));
		const int32 SpouseId = CreatePerson(Background, PeopleIndex, INDEX_NONE, INDEX_NONE, FMath::Max(18, Age + Background.RangeInt(-5, 3)));
		Persons[SpouseId].bFemale = !Persons[Id].bFemale;
		Persons[SpouseId].FirstName = CivText::FirstName(Background, Persons[SpouseId].bFemale);
		Persons[SpouseId].Name = CivText::FixFinalForms(Persons[SpouseId].FirstName + (Persons[SpouseId].bFemale ? TEXT(" בת ") : TEXT(" בן ")) + CivText::FirstName(Background, false));
		Persons[SpouseId].Occupation = Persons[Id].Occupation;
		Persons[Id].Spouse = SpouseId;
		Persons[SpouseId].Spouse = Id;
		FCivLifeEvent Married; Married.Year = Persons[Id].BornYear + MarriedAt; Married.Kind = ECivLife::Married; Married.Era = Era;
		Married.Other = SpouseId; Persons[Id].Log.Add(Married);
		Married.Other = Id; Persons[SpouseId].Log.Add(Married);

		const int32 Children = Background.RangeInt(0, 3);
		const int32 FatherId = Persons[Id].bFemale ? SpouseId : Id;
		const int32 MotherId = Persons[Id].bFemale ? Id : SpouseId;
		for (int32 N = 0; N < Children; ++N)
		{
			const int32 ChildAge = Age - MarriedAt - 1 - N * Background.RangeInt(2, 4);
			if (ChildAge < 0) { break; }
			const int32 ChildId = CreatePerson(Background, PeopleIndex, FatherId, MotherId, ChildAge);
			FCivLifeEvent Child; Child.Year = Persons[ChildId].BornYear; Child.Kind = ECivLife::Child; Child.Other = ChildId; Child.Era = Era;
			Persons[FatherId].Log.Add(Child);
			Persons[MotherId].Log.Add(Child);
			Persons[FatherId].ChildCount += 1;
			Persons[MotherId].ChildCount += 1;
		}
		for (int32 Member : { Id, SpouseId })
		{
			Persons[Member].Log.StableSort([](const FCivLifeEvent& A, const FCivLifeEvent& B) { return A.Year < B.Year; });
		}
	}
	FCivLifeEvent Now; Now.Year = Year; Now.Kind = ECivLife::FromCrowd; Now.Param = PeopleIndex; Now.Era = Era;
	Persons[Id].Log.Add(Now);
	return Id;
}

bool FCivSimulation::GodBlessPerson(int32 Id)
{
	if (!Persons.IsValidIndex(Id) || !Persons[Id].IsAlive()) { return false; }
	FCivPerson& Me = Persons[Id];
	Me.Health = 1.0;
	Me.PlannedDeathYear += 15;
	Me.Faith = FMath::Min(1.0, Me.Faith + 0.4);
	Me.Reputation = FMath::Min(1.0, Me.Reputation + 0.2);
	Me.Wealth = FMath::Min(1.0, Me.Wealth + 0.3);
	Log(Me, ECivLife::Blessed);
	// A blessing can change a whole life: the pious may take it as a calling.
	if (Me.Occupation == ECivOccupation::Farmer && Me.Piety > 0.5)
	{
		Me.Occupation = ECivOccupation::Priest;
		Me.AwakeningCause = ECivNeed::Count;
		Log(Me, ECivLife::Awakening, INDEX_NONE, static_cast<int32>(ECivNeed::Count));
		++Stats.Preachers;
	}
	return true;
}

bool FCivSimulation::GodCursePerson(int32 Id)
{
	if (!Persons.IsValidIndex(Id) || !Persons[Id].IsAlive()) { return false; }
	FCivPerson& Me = Persons[Id];
	Me.Health *= 0.5;
	Me.Reputation *= 0.4;
	Me.Wealth *= 0.3;
	Me.bRich = false;
	Log(Me, ECivLife::Cursed);
	if (Me.Rank >= ECivRank::Knight && Me.Rank < ECivRank::Ruler && Rng.Chance(0.5))
	{
		Me.Rank = ECivRank::Commoner;
		Me.Occupation = ECivOccupation::Farmer;
		Log(Me, ECivLife::Disgraced);
	}
	return true;
}

bool FCivSimulation::GodInspirePerson(int32 Id)
{
	if (!Persons.IsValidIndex(Id) || !Persons[Id].IsAlive()) { return false; }
	FCivPerson& Me = Persons[Id];
	Me.InspiredUntil = Year + 15;
	Me.Curiosity = FMath::Min(1.0, Me.Curiosity + 0.2);
	Log(Me, ECivLife::Inspired);
	if (!Me.bInventor && Year - Me.BornYear >= 14)
	{
		Me.bInventor = true;
		Me.Occupation = ECivOccupation::Inventor;
		Peoples[Me.People].LivingInventors.Add(Id);
		++Stats.InventorsBorn;
		Log(Me, ECivLife::BecameInventor);
	}
	return true;
}

FString FCivSimulation::BuildLifeStory(int32 Id) const
{
	if (!Persons.IsValidIndex(Id)) { return FString(); }
	const FCivPerson& Me = Persons[Id];
	if (Me.Log.Num() == 0) { return FString(); }   // a forgotten life, long past and unremarkable

	const bool F = Me.bFemale;
	const FCivPeople& P = Peoples[Me.People];
	const auto PeopleName = [this](int32 Index) { return Peoples.IsValidIndex(Index) ? Peoples[Index].Name : FString(); };
	const auto PersonName = [this](const FCivLifeEvent& E) { return Persons.IsValidIndex(E.Other) ? Persons[E.Other].Name : E.OtherName; };

	// Heading: name, family, people, the span of the life and how it is remembered.
	FString Story = Me.Name + TEXT(", מבית ") + Me.House + TEXT(", מעם ") + P.Name;
	Story += TEXT(" (") + YearLabel(Me.BornYear) + TEXT(" עד ") + (Me.IsAlive() ? FString(F ? TEXT("היום, עדיין בחיים") : TEXT("היום, עדיין בחיים")) : YearLabel(Me.DeathYear)) + TEXT(")");
	if (Me.bVenerated) { Story += F ? TEXT(", קדושה") : TEXT(", קדוש"); }
	Story += TEXT("\n");

	int32 BattlesTold = 0;
	for (const FCivLifeEvent& E : Me.Log)
	{
		const int32 Era = E.Era;
		FString Line;
		const FString Other = PersonName(E);
		const bool bOtherFemale = Persons.IsValidIndex(E.Other) && Persons[E.Other].bFemale;

		switch (E.Kind)
		{
		case ECivLife::Born:
		{
			Line = F ? TEXT("נולדה בעם ") : TEXT("נולד בעם ");
			Line += PeopleName(E.Param);
			Line += E.OtherName.IsEmpty() ? FString(TEXT(", באחד הכפרים")) : FString(TEXT(", בעיר ")) + E.OtherName;
			if (Persons.IsValidIndex(Me.Father) && Persons.IsValidIndex(Me.Mother))
			{
				Line += F ? TEXT(", בתם של ") : TEXT(", בנם של ");
				Line += Persons[Me.Father].Name + TEXT(" ו") + Persons[Me.Mother].Name;
			}
			if (Me.OriginRank >= ECivRank::Knight) { Line += TEXT(", למשפחה מן השכבה העליונה"); }
			Line += TEXT(".");
			break;
		}
		case ECivLife::FromCrowd:
			if (!Me.bPromoted) { continue; }
			Line = F ? TemplateOf(E.Kind)->Female : TemplateOf(E.Kind)->Male;
			break;
		case ECivLife::FromNobility:
			if (Era <= 1) { Line = F ? TEXT("בת לאחת המשפחות החשובות בשבט; באותה שנה החלה לשבת בין זקני השבט.") : TEXT("בן לאחת המשפחות החשובות בשבט; באותה שנה החל לשבת בין זקני השבט."); }
			else if (Era <= 5) { Line = F ? TEXT("בת לבית אצולה ותיק; באותה שנה נקראה אל חצר השליט.") : TEXT("בן לבית אצולה ותיק; באותה שנה נקרא אל חצר השליט."); }
			else { Line = F ? TEXT("בת למשפחה ותיקה ובעלת השפעה; באותה שנה נכנסה לחיים הציבוריים.") : TEXT("בן למשפחה ותיקה ובעלת השפעה; באותה שנה נכנס לחיים הציבוריים."); }
			break;
		case ECivLife::Child:
			if (F) { Line = bOtherFemale ? TEXT("ילדה בת: ") : TEXT("ילדה בן: "); }
			else { Line = bOtherFemale ? TEXT("נולדה לו בת: ") : TEXT("נולד לו בן: "); }
			Line += Other + TEXT(".");
			break;
		case ECivLife::Grandchild:
			Line = bOtherFemale ? (F ? TEXT("נולדה לה נכדה: ") : TEXT("נולדה לו נכדה: ")) : (F ? TEXT("נולד לה נכד: ") : TEXT("נולד לו נכד: "));
			Line += Other + TEXT(".");
			break;
		case ECivLife::ChildDied:
			Line = F ? (bOtherFemale ? TEXT("קברה את בתה ") : TEXT("קברה את בנה ")) : (bOtherFemale ? TEXT("קבר את בתו ") : TEXT("קבר את בנו "));
			Line += Other + (F ? TEXT(". אחרי זה לא הייתה אותה אישה.") : TEXT(". אחרי זה לא היה אותו אדם."));
			break;
		case ECivLife::Widowed:
			Line = F ? TEXT("התאלמנה: בעלה, ") : TEXT("התאלמן: אשתו, ");
			Line += Other + (F ? TEXT(", מת.") : TEXT(", מתה."));
			break;
		case ECivLife::Levied:
			Line = F ? TEXT("גויסה למלחמה") : TEXT("גויס למלחמה");
			if (Peoples.IsValidIndex(E.Param)) { Line += TEXT(" נגד עם ") + PeopleName(E.Param); }
			Line += F ? TEXT(" ועזבה את הבית.") : TEXT(" ועזב את הבית.");
			break;
		case ECivLife::Battle:
		{
			// A few ways a soldier earns a name, chosen by the year so the story stays the same every time it is read.
			static const TCHAR* const Male[] =
			{
				TEXT("עמד במקומו כשאחרים ברחו, ושמו יצא בין החיילים."), TEXT("נשא על גבו את מפקדו הפצוע אל מחוץ לקרב."),
				TEXT("הוביל את חבריו קדימה אחרי שמפקדם נפל."), TEXT("נפצע, אבל לא עזב את השורה עד שהקרב נגמר."),
			};
			static const TCHAR* const Female[] =
			{
				TEXT("עמדה במקומה כשאחרים ברחו, ושמה יצא בין החיילים."), TEXT("נשאה על גבה את מפקדה הפצוע אל מחוץ לקרב."),
				TEXT("הובילה את חבריה קדימה אחרי שמפקדם נפל."), TEXT("נפצעה, אבל לא עזבה את השורה עד שהקרב נגמר."),
			};
			Line = Peoples.IsValidIndex(E.Param) ? FString(TEXT("בקרב מול עם ")) + PeopleName(E.Param) + TEXT(", ") : FString(TEXT("בהתכתשות על הגבול, "));
			const int32 Variant = (BattlesTold++ + Me.Id) % UE_ARRAY_COUNT(Male);
			Line += F ? Female[Variant] : Male[Variant];
			break;
		}
		case ECivLife::Chosen:
		{
			const FString Title = RankWord(ECivRank::Ruler, Era, F);
			if (Elects(Era)) { Line = (F ? TEXT("נבחרה בבחירות להיות ") : TEXT("נבחר בבחירות להיות ")) + Title + TEXT("."); }
			else if (Me.OriginRank == ECivRank::Commoner) { Line = (F ? TEXT("כשלא נשאר יורש, בחרו בה הגדולים שבעם להיות ") : TEXT("כשלא נשאר יורש, בחרו בו הגדולים שבעם להיות ")) + Title + (F ? TEXT(", אף שנולדה בבית פשוט.") : TEXT(", אף שנולד בבית פשוט.")); }
			else { Line = (F ? TEXT("כשלא נשאר יורש, בחרו בה הגדולים שבעם להיות ") : TEXT("כשלא נשאר יורש, בחרו בו הגדולים שבעם להיות ")) + Title + TEXT("."); }
			break;
		}
		case ECivLife::Deposed:
			Line = F ? TEXT("הודחה מהשלטון") : TEXT("הודח מהשלטון");
			if (!Other.IsEmpty()) { Line += TEXT(" בידי ") + Other; }
			Line += F ? TEXT(", ונשארה בלי כלום.") : TEXT(", ונשאר בלי כלום.");
			break;
		case ECivLife::Awakening:
		{
			const TCHAR* Cause = F ? TEXT("המחלה הקשה שעברה עליה") : TEXT("המחלה הקשה שעברה עליו");
			if (E.Param == static_cast<int32>(ECivNeed::Plague)) { Cause = TEXT("המגפה"); }
			else if (E.Param == static_cast<int32>(ECivNeed::Famine)) { Cause = TEXT("שנות הרעב"); }
			else if (E.Param == static_cast<int32>(ECivNeed::Count)) { Cause = TEXT("ברכת האל"); }
			if (E.Param == static_cast<int32>(ECivNeed::Count)) { Line = F ? TEXT("אחרי ברכת האל עזבה הכול והתחילה ללכת בין הכפרים ולספר על מה שקרה לה.") : TEXT("אחרי ברכת האל עזב הכול והתחיל ללכת בין הכפרים ולספר על מה שקרה לו."); break; }
			Line = FString(TEXT("אחרי ")) + Cause + (F ? TEXT(" נשבר משהו בתוכה. היא עזבה הכול והתחילה ללכת בין הכפרים ולהטיף.") : TEXT(" נשבר משהו בתוכו. הוא עזב הכול והתחיל ללכת בין הכפרים ולהטיף."));
			break;
		}
		case ECivLife::Rebel:
			if (E.Param == 1 && !Other.IsEmpty()) { Line = (F ? TEXT("לא יכלה לשאת עוד את שלטונו האכזר של ") : TEXT("לא יכול היה לשאת עוד את שלטונו האכזר של ")) + Other + (F ? TEXT(", וקמה בראש מרד.") : TEXT(", וקם בראש מרד.")); }
			else { Line = F ? TEXT("בשנות הרעב, כשהמחסנים של הגדולים היו מלאים, קמה בראש מרד.") : TEXT("בשנות הרעב, כשהמחסנים של הגדולים היו מלאים, קם בראש מרד."); }
			break;
		case ECivLife::Ruined:
			if (E.Param == 0) { Line = F ? TEXT("המלחמה סגרה את דרכי המסחר, והיא איבדה את כל הונה.") : TEXT("המלחמה סגרה את דרכי המסחר, והוא איבד את כל הונו."); }
			else if (E.Param == 1) { Line = F ? TEXT("האסון הרס את מחסניה, והיא איבדה את כל הונה.") : TEXT("האסון הרס את מחסניו, והוא איבד את כל הונו."); }
			else { Line = F ? TEXT("שיירת הסחורה הגדולה שלה לא חזרה, והיא איבדה את כל הונה.") : TEXT("שיירת הסחורה הגדולה שלו לא חזרה, והוא איבד את כל הונו."); }
			break;
		case ECivLife::Invented:
		{
			const FString Thing = Tree.IsValidIndex(E.Param) ? Tree[E.Param].NameDefinite : FString(TEXT("המצאה"));
			if (E.Other == 1) { Line = (F ? TEXT("הייתה הראשונה בעולם שהגיעה אל ") : TEXT("היה הראשון בעולם שהגיע אל ")) + Thing + TEXT("."); }
			else { Line = (F ? TEXT("הגיעה בעצמה אל ") : TEXT("הגיע בעצמו אל ")) + Thing + TEXT(", שעמים אחרים כבר הכירו."); }
			break;
		}
		case ECivLife::Died:
		{
			const FString& Cause = Me.DeathCause;
			if (Cause == TEXT("הוצאה להורג")) { Line = F ? TEXT("הוצאה להורג.") : TEXT("הוצא להורג."); }
			else if (Cause == TEXT("הוצאה להורג בידי השלטון")) { Line = F ? TEXT("הוצאה להורג בידי השלטון.") : TEXT("הוצא להורג בידי השלטון."); }
			else if (Cause == TEXT("נרצח בידי מי שתפס את מקומו")) { Line = F ? TEXT("נרצחה בידי מי שתפס את מקומה.") : TEXT("נרצח בידי מי שתפס את מקומו."); }
			else if (Cause == TEXT("דיכוי המרד")) { Line = F ? TEXT("נהרגה כשהמרד דוכא.") : TEXT("נהרג כשהמרד דוכא."); }
			else if (Cause == TEXT("מסע שלא חזר ממנו")) { Line = F ? TEXT("יצאה למסע ולא חזרה ממנו.") : TEXT("יצא למסע ולא חזר ממנו."); }
			else if (Cause == TEXT("מגפה שנדבקה בה בעת הטיפול")) { Line = F ? TEXT("נדבקה במגפה בעת שטיפלה בחולים, ומתה.") : TEXT("נדבק במגפה בעת שטיפל בחולים, ומת."); }
			else if (Cause == TEXT("ניסוי שהשתבש")) { Line = F ? TEXT("נהרגה בניסוי שהשתבש.") : TEXT("נהרג בניסוי שהשתבש."); }
			else if (Cause == TEXT("מלחמה")) { Line = F ? TEXT("נהרגה במלחמה.") : TEXT("נהרג במלחמה."); }
			else if (Cause == TEXT("פצעי מלחמה")) { Line = F ? TEXT("מתה מפצעים שספגה במלחמה.") : TEXT("מת מפצעים שספג במלחמה."); }
			else if (Cause == TEXT("פצעים מקרב בגבול")) { Line = F ? TEXT("מתה מפצעים שספגה בקרב על הגבול.") : TEXT("מת מפצעים שספג בקרב על הגבול."); }
			else if (Cause == TEXT("רעידת אדמה")) { Line = F ? TEXT("נהרגה ברעידת אדמה.") : TEXT("נהרג ברעידת אדמה."); }
			else if (Cause == TEXT("שיטפון")) { Line = F ? TEXT("טבעה בשיטפון.") : TEXT("טבע בשיטפון."); }
			else if (Cause == TEXT("התפרצות הר געש")) { Line = F ? TEXT("נהרגה בהתפרצות הר הגעש.") : TEXT("נהרג בהתפרצות הר הגעש."); }
			else if (Cause == TEXT("סופה")) { Line = F ? TEXT("נהרגה בסופה.") : TEXT("נהרג בסופה."); }
			else if (Cause == TEXT("פגיעת מטאור")) { Line = F ? TEXT("נהרגה כשאבן ענק נפלה מן השמיים.") : TEXT("נהרג כשאבן ענק נפלה מן השמיים."); }
			else if (Cause == TEXT("עידן קרח")) { Line = F ? TEXT("מתה בקור של עידן הקרח.") : TEXT("מת בקור של עידן הקרח."); }
			else if (Cause == TEXT("כיבוש")) { Line = F ? TEXT("נהרגה כשעמה נכבש.") : TEXT("נהרג כשעמו נכבש."); }
			else { Line = (F ? TEXT("מתה מ") : TEXT("מת מ")) + Cause + TEXT("."); }
			break;
		}
		default:
		{
			const FTemplate* T = TemplateOf(E.Kind);
			if (!T) { continue; }
			Line = F ? T->Female : T->Male;
			Line.ReplaceInline(TEXT("{o}"), *(Other.IsEmpty() ? FString(TEXT("השליט")) : Other));
			Line.ReplaceInline(TEXT("{p}"), *PeopleName(E.Kind == ECivLife::Faith ? E.Param : Me.People));
			if (E.Kind == ECivLife::Work) { Line.ReplaceInline(TEXT("{w}"), OccupationWord(static_cast<ECivOccupation>(E.Param), F)); }
			if (Line.Contains(TEXT("{t}")))
			{
				const ECivRank Rank = (E.Kind == ECivLife::Knighted) ? ECivRank::Knight : ((E.Kind == ECivLife::Ennobled || E.Kind == ECivLife::Inherited) ? ECivRank::Lord : ECivRank::Ruler);
				Line.ReplaceInline(TEXT("{t}"), *RankWord(Rank, Era, F));
			}
			break;
		}
		}

		const int32 LineAge = E.Year - Me.BornYear;
		Story += TEXT("  ") + YearLabel(E.Year);
		if (LineAge > 0 && E.Kind != ECivLife::Born) { Story += FString::Printf(TEXT(", בגיל %d"), LineAge); }
		Story += TEXT(": ") + Line + TEXT("\n");
	}
	return Story;
}

void FCivSimulation::ForgetOldLives()
{
	// Keep memory bounded: long-dead ordinary lives fade, as they do in reality.
	const int32 Cutoff = Year - 300;
	for (int32 Index = ForgetCursor; Index < Persons.Num(); ++Index)
	{
		FCivPerson& Me = Persons[Index];
		if (Me.IsAlive() || Me.DeathYear > Cutoff) { break; }
		ForgetCursor = Index + 1;
		const bool bRemembered = Me.bVenerated || Me.bHoly || Me.bInventor || Me.bPromoted || Me.Rank >= ECivRank::Knight || Me.OriginRank >= ECivRank::Knight || Me.Reputation > 0.3
			|| HasKind(Me, ECivLife::Blessed) || HasKind(Me, ECivLife::Cursed) || HasKind(Me, ECivLife::Knighted) || HasKind(Me, ECivLife::Ruined) || HasKind(Me, ECivLife::Rebel);
		if (!bRemembered)
		{
			Me.Log.Empty();
			Me.FirstName.Empty();
			Me.House.Empty();
			Me.DeathCause.Empty();
		}
	}
}
