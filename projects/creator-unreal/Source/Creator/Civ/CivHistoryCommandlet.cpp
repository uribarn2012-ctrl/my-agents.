#include "CivHistoryCommandlet.h"

#include "CivSimulation.h"
#include "CivNames.h"
#include "CivRealHistory.h"
#include "Misc/FileHelper.h"
#include "Misc/Parse.h"
#include "Misc/Paths.h"
#include "HAL/PlatformTime.h"

DEFINE_LOG_CATEGORY_STATIC(LogCivHistory, Log, All);

namespace CivHistoryTest
{
	static FCivWorldSettings MakeSettings(uint64 Seed, double IQ, const FCivTuning& Tuning)
	{
		FCivWorldSettings S;
		S.Seed = Seed;
		S.AverageIQ = IQ;
		S.Tuning = Tuning;
		return S;
	}

	static bool Reached(const FCivSimulation& Sim, ECivMilestone M) { return Sim.GetMilestoneYear(M) != INDEX_NONE; }

	static void RunUntil(FCivSimulation& Sim, int32 MaxYears, ECivMilestone Stop)
	{
		while (Sim.GetYear() < MaxYears && !Sim.IsExtinct() && !Reached(Sim, Stop)) { Sim.StepYear(); }
	}

	static void RunYears(FCivSimulation& Sim, int32 Years)
	{
		for (int32 Y = 0; Y < Years && !Sim.IsExtinct(); ++Y) { Sim.StepYear(); }
	}

	static FString Row(const FCivSimulation& Sim)
	{
		const FCivStats& S = Sim.GetStats();
		return FString::Printf(TEXT("seed=%-3llu iq=%3.0f city=%6d writing=%6d printing=%6d steam=%6d electric=%6d computer=%6d satellite=%6d moon=%6d mars=%6d launch=%6d arrival=%6d end=%6d pop=%9.2e wars=%3d events=%4d inventors=%5d generated=%3d persons=%6d lost=%2d extinct=%d"),
			Sim.GetSettings().Seed, Sim.GetSettings().AverageIQ, Sim.GetMilestoneYear(ECivMilestone::FirstCity), Sim.GetMilestoneYear(ECivMilestone::Writing), Sim.GetMilestoneYear(ECivMilestone::Printing), Sim.GetMilestoneYear(ECivMilestone::Steam),
			Sim.GetMilestoneYear(ECivMilestone::Electricity), Sim.GetMilestoneYear(ECivMilestone::Computer), Sim.GetMilestoneYear(ECivMilestone::Satellite), Sim.GetMilestoneYear(ECivMilestone::Moon), Sim.GetMilestoneYear(ECivMilestone::Mars),
			Sim.GetMilestoneYear(ECivMilestone::StarLaunch), Sim.GetMilestoneYear(ECivMilestone::OtherStar), Sim.GetYear(), Sim.GetWorldPopulation(),
			S.Wars, S.Events, S.InventorsBorn, S.ProposalsAccepted, S.PersonsCreated, S.PeoplesLost, Sim.IsExtinct() ? 1 : 0);
	}

	struct FSeries { double Mean = 0.0, Min = 0.0, Max = 0.0; int32 Reached = 0; };

	static FSeries Measure(const TArray<int32>& Values)
	{
		FSeries S;
		double Sum = 0.0;
		for (int32 V : Values)
		{
			if (V == INDEX_NONE) { continue; }
			S.Min = S.Reached == 0 ? V : FMath::Min(S.Min, (double)V);
			S.Max = S.Reached == 0 ? V : FMath::Max(S.Max, (double)V);
			Sum += V;
			++S.Reached;
		}
		S.Mean = S.Reached > 0 ? Sum / S.Reached : 0.0;
		return S;
	}

	static FCivTuning ReadTuning(const FString& Params)
	{
		FCivTuning T;
		if (FParse::Value(*Params, TEXT("BirthExp="), T.BirthIQExponent)) { for (double& E : T.BirthIQExponentByEra) { E = T.BirthIQExponent; } }
		FString Exps;
		if (FParse::Value(*Params, TEXT("IQExps="), Exps, false))
		{
			TArray<FString> Parts;
			Exps.ParseIntoArray(Parts, TEXT(","));
			for (int32 I = 0; I < Parts.Num() && I < 9; ++I) { T.BirthIQExponentByEra[I] = FCString::Atod(*Parts[I]); }
		}
		FParse::Value(*Params, TEXT("SpreadExp="), T.SpreadIQExponent);
		FParse::Value(*Params, TEXT("InventorRate="), T.InventorRate);
		FParse::Value(*Params, TEXT("PopExp="), T.PopulationExponent);
		FParse::Value(*Params, TEXT("CostScale="), T.CostScale);
		FParse::Value(*Params, TEXT("Diffusion="), T.DiffusionRate);
		FParse::Value(*Params, TEXT("MaterialScale="), T.MaterialScale);
		FParse::Value(*Params, TEXT("MiningRate="), T.MiningRate);
		FParse::Value(*Params, TEXT("Growth="), T.PopulationGrowth);
		FParse::Value(*Params, TEXT("Capacity="), T.BaseCapacity);
		FParse::Value(*Params, TEXT("GenChance="), T.GenerationChance);
		FParse::Value(*Params, TEXT("KnowledgeBonus="), T.KnowledgeBonus);
		FParse::Value(*Params, TEXT("ResearchExp="), T.ResearchExponent);
		FParse::Value(*Params, TEXT("SchoolExp="), T.SchoolExponent);
		FParse::Value(*Params, TEXT("EraCost="), T.EraCostFactor);
		FString Shape;
		if (FParse::Value(*Params, TEXT("EraShape="), Shape, false))
		{
			TArray<FString> Parts;
			Shape.ParseIntoArray(Parts, TEXT(","));
			for (int32 I = 0; I < Parts.Num() && I < 9; ++I) { T.EraCostShape[I] = FCString::Atod(*Parts[I]); }
		}
		return T;
	}

	static void InspireAll(FCivSimulation& Sim)
	{
		for (int32 Index = 0; Index < Sim.GetPeoples().Num(); ++Index)
		{
			if (Sim.GetPeoples()[Index].bAlive) { Sim.GodInspire(Index); }
		}
	}

	static TArray<FString> GeneratedList(const FCivSimulation& Sim)
	{
		TArray<FString> Lines;
		const TArray<FCivInventionDef>& Tree = Sim.GetTree();
		for (const FCivInventionDef& Def : Tree)
		{
			if (!Def.bGenerated) { continue; }
			FString Parents;
			for (int32 Parent : Def.Prereqs)
			{
				if (!Parents.IsEmpty()) { Parents += TEXT(" + "); }
				Parents += Tree[Parent].Name;
				if (Tree[Parent].bGenerated) { Parents += TEXT(" [חדש]"); }
			}
			int32 Knowers = 0;
			const int32 Index = Tree.IndexOfByPredicate([&Def](const FCivInventionDef& X) { return X.Key == Def.Key; });
			for (const FCivPeople& P : Sim.GetPeoples()) { if (P.Known[Index]) { ++Knowers; } }
			Lines.Add(FString::Printf(TEXT("%s | שנה %d | עידן %d | %s | נבנה על: %s | איך: %s | עמים שיודעים: %d"),
				*Def.Name, Def.ConceivedYear, Def.Era, Def.bSpeculative ? TEXT("מעבר למדע המוכר") : TEXT("מדע מוכר"), *Parents, *Def.Mechanism, Knowers));
		}
		return Lines;
	}

	/** The generated inventions of one world, each with where it came from, why and how, what it costs and what it gives. */
	static TArray<FString> InventionReport(const FCivSimulation& Sim)
	{
		static const TCHAR* const NeedWords[] = { TEXT("אין צורך דוחק; רצון לשפר את מה שיש"), TEXT("אסונות טבע"), TEXT("מלחמות"), TEXT("רעב"), TEXT("מחלות ומגפות") };
		static const TCHAR* const MaterialWords[] = { TEXT("עץ"), TEXT("אבן"), TEXT("מתכת"), TEXT("אנרגיה"), TEXT("חומרים נדירים") };
		const TArray<FCivInventionDef>& Tree = Sim.GetTree();
		TArray<FString> Lines;
		int32 Count = 0;
		for (const FCivInventionDef& Def : Tree) { if (Def.bGenerated) { ++Count; } }
		Lines.Add(FString::Printf(TEXT("--- עולם %llu, מנת משכל %.0f: %d המצאות חדשות עד שנה %d ---"), Sim.GetSettings().Seed, Sim.GetSettings().AverageIQ, Count, Sim.GetYear()));
		Lines.Add(TEXT(""));
		for (int32 Index = 0; Index < Tree.Num(); ++Index)
		{
			const FCivInventionDef& Def = Tree[Index];
			if (!Def.bGenerated) { continue; }
			FString Parents;
			for (int32 Parent : Def.Prereqs)
			{
				if (!Parents.IsEmpty()) { Parents += TEXT(", "); }
				Parents += Tree[Parent].Name;
				if (Tree[Parent].bGenerated) { Parents += TEXT(" (גם זו המצאה חדשה)"); }
			}
			FString Materials;
			for (int32 R = 0; R < CivResourceCount; ++R)
			{
				if (Def.Materials[R] <= 0.0) { continue; }
				if (!Materials.IsEmpty()) { Materials += TEXT(", "); }
				Materials += MaterialWords[R];
			}
			const FCivInventionEffects& E = Def.Effects;
			FString Gives;
			const auto Add = [&Gives](double Multiplier, const TCHAR* Word)
			{
				if (Multiplier == 1.0) { return; }
				if (!Gives.IsEmpty()) { Gives += TEXT(", "); }
				Gives += FString::Printf(TEXT("%s (%+.0f%%)"), Word, (Multiplier - 1.0) * 100.0);
			};
			Add(E.Food, TEXT("יותר מזון"));
			Add(E.Capacity, TEXT("מקום ליותר אנשים"));
			Add(E.Resources, TEXT("יותר חומרי גלם"));
			Add(E.Research, TEXT("מחקר מהיר יותר"));
			Add(E.Spread, TEXT("ידע עובר מהר יותר"));
			Add(E.Health, TEXT("בריאות טובה יותר"));
			Add(E.War, TEXT("כוח צבאי"));
			if (E.Resist > 0.0) { if (!Gives.IsEmpty()) { Gives += TEXT(", "); } Gives += FString::Printf(TEXT("עמידות לאסונות (+%.1f%%)"), E.Resist * 100.0); }
			if (E.Range > 0.0) { if (!Gives.IsEmpty()) { Gives += TEXT(", "); } Gives += TEXT("מסעות רחוקים יותר"); }
			int32 Knowers = 0, Alive = 0;
			for (const FCivPeople& P : Sim.GetPeoples()) { if (P.bAlive) { ++Alive; if (P.Known[Index]) { ++Knowers; } } }
			const FString Where = Sim.GetPeoples().IsValidIndex(Def.ConceivedPeople) ? Sim.GetPeoples()[Def.ConceivedPeople].Name : FString(TEXT("לא ידוע"));

			Lines.Add(Def.Name + (Def.bSpeculative ? TEXT("  [מעבר למדע המוכר]") : TEXT("")));
			Lines.Add(FString::Printf(TEXT("  הרעיון נולד: שנה %d, בעם %s"), Def.ConceivedYear, *Where));
			Lines.Add(TEXT("  נשען על: ") + Parents);
			Lines.Add(TEXT("  הצורך: ") + FString(NeedWords[FMath::Clamp(static_cast<int32>(Def.Need), 0, 4)]));
			Lines.Add(TEXT("  איך זה עובד: ") + Def.Mechanism + TEXT("."));
			Lines.Add(TEXT("  חומרים: ") + (Materials.IsEmpty() ? FString(TEXT("בעיקר עבודה")) : Materials) + (Def.bSpeculative ? TEXT(" (פי שניים מהרגיל, ועבודה פי ארבעה)") : TEXT("")));
			Lines.Add(TEXT("  מה זה נותן במשחק: ") + Gives);
			Lines.Add(FString::Printf(TEXT("  בסוף הספר: %d מתוך %d העמים יודעים אותה"), Knowers, Alive));
			Lines.Add(TEXT(""));
		}
		const FCivStats& S = Sim.GetStats();
		Lines.Add(FString::Printf(TEXT("רעיונות שנבדקו בעולם הזה: %d. התקבלו: %d. נדחו: %d. סיבות הדחייה העיקריות:"), S.ProposalsTried, S.ProposalsAccepted, S.ProposalsTried - S.ProposalsAccepted));
		static const TCHAR* const RejectWords[] =
		{
			TEXT(""), TEXT("אין לה הורים"), TEXT("נשענת על המצאה שהעם לא מכיר"), TEXT("אין לה מטרה"), TEXT("אין לה מנגנון"),
			TEXT("העיקרון לא מתאים למטרה"), TEXT("הבסיס של העיקרון עוד לא ידוע"), TEXT("חסרים חומרים"), TEXT("מוקדם מדי לעידן"),
			TEXT("אין לה תועלת במשחק"), TEXT("חזקה מדי"), TEXT("כמעט זהה להמצאה קיימת"), TEXT("מעבר למדע המוכר, לפני שהעם מתקדם מספיק"), TEXT("העיקרון מיושן מזמן")
		};
		for (int32 R = 1; R < CivRejectCount && R < UE_ARRAY_COUNT(RejectWords); ++R)
		{
			if (S.Rejected[R] > 0) { Lines.Add(FString::Printf(TEXT("  %s: %d"), RejectWords[R], S.Rejected[R])); }
		}
		Lines.Add(TEXT(""));
		return Lines;
	}

	static int32 CountCities(const FCivSimulation& Sim, int32 RealOnly = 1)
	{
		int32 Count = 0;
		for (const FCivPeople& P : Sim.GetPeoples())
		{
			for (const FCivCity& C : P.Cities) { if (!RealOnly || C.RealId != INDEX_NONE) { ++Count; } }
		}
		return Count;
	}

	static bool HasCity(const FCivSimulation& Sim, const FString& Name)
	{
		for (const FCivPeople& P : Sim.GetPeoples())
		{
			for (const FCivCity& C : P.Cities) { if (C.Name == Name) { return true; } }
		}
		return false;
	}
}

int32 UCivHistoryCommandlet::Main(const FString& Params)
{
	using namespace CivHistoryTest;

	FString OutDir;
	if (!FParse::Value(*Params, TEXT("Out="), OutDir)) { OutDir = FPaths::ProjectDir() / TEXT("samples"); }
	int32 Seeds = 8;
	FParse::Value(*Params, TEXT("Seeds="), Seeds);
	const FCivTuning Tuning = ReadTuning(Params);
	const bool bTuneOnly = FParse::Param(*Params, TEXT("TuneOnly"));

	TArray<FString> Report;
	int32 Failures = 0;
	const auto Say = [&Report](const FString& Line) { Report.Add(Line); UE_LOG(LogCivHistory, Display, TEXT("%s"), *Line); };
	const auto Check = [&Say, &Failures](bool bOk, const FString& Line) { Say(FString(bOk ? TEXT("PASS  ") : TEXT("FAIL  ")) + Line); if (!bOk) { ++Failures; } };

	const FCivInventionTable& Table = FCivInventionTable::Get();
	Say(FString::Printf(TEXT("Starting invention table: %d entries"), Table.Num()));
	for (const FString& Problem : Table.Problems()) { Say(TEXT("  table problem: ") + Problem); }
	Check(Table.Problems().Num() == 0 && Table.Num() >= 40, TEXT("invention table is valid and has tens of entries"));

	// Results per IQ
	struct FIQRun { double IQ; int32 MaxYears; FSeries Moon; FSeries Launch; FSeries Gap; FSeries City; };
	int32 MaxLow = 12000;
	FParse::Value(*Params, TEXT("MaxLow="), MaxLow);
	TArray<FIQRun> Runs = { { 200.0, 6000 }, { 100.0, MaxLow }, { 80.0, MaxLow } };
	double SimSeconds = 0.0;
	int64 SimYears = 0;
	for (FIQRun& Run : Runs)
	{
		Say(TEXT(""));
		Say(FString::Printf(TEXT("--- Average IQ %.0f, %d seeds, at most %d years ---"), Run.IQ, Seeds, Run.MaxYears));
		TArray<int32> Moons, Launches, Gaps, Cities;
		for (int32 Seed = 1; Seed <= Seeds; ++Seed)
		{
			FCivSimulation Sim(MakeSettings(Seed, Run.IQ, Tuning));
			const double Start = FPlatformTime::Seconds();
			RunUntil(Sim, Run.MaxYears, ECivMilestone::OtherStar);
			SimSeconds += FPlatformTime::Seconds() - Start;
			SimYears += Sim.GetYear();
			Say(Row(Sim));
			const int32 Moon = Sim.GetMilestoneYear(ECivMilestone::Moon);
			const int32 City = Sim.GetMilestoneYear(ECivMilestone::FirstCity);
			Moons.Add(Moon);
			Cities.Add(City);
			Gaps.Add(Moon != INDEX_NONE && City != INDEX_NONE ? Moon - City : INDEX_NONE);
			Launches.Add(Sim.GetMilestoneYear(ECivMilestone::StarLaunch));
		}
		Run.Moon = Measure(Moons);
		Run.Launch = Measure(Launches);
		Run.Gap = Measure(Gaps);
		Run.City = Measure(Cities);
		Say(FString::Printf(TEXT("IQ %.0f moon: reached %d/%d, mean %.0f, min %.0f, max %.0f | first city mean %.0f | first city to moon: mean %.0f, min %.0f, max %.0f | first starship: reached %d/%d, mean %.0f"),
			Run.IQ, Run.Moon.Reached, Seeds, Run.Moon.Mean, Run.Moon.Min, Run.Moon.Max, Run.City.Mean, Run.Gap.Mean, Run.Gap.Min, Run.Gap.Max, Run.Launch.Reached, Seeds, Run.Launch.Mean));
	}
	const double YearsPerSecond = SimYears / FMath::Max(1e-6, SimSeconds);
	Say(FString::Printf(TEXT("Speed: %.0f simulated years per real second (%lld years)"), YearsPerSecond, SimYears));

	if (!bTuneOnly)
	{
		const FSeries& High = Runs[0].Moon; const FSeries& Mid = Runs[1].Moon; const FSeries& Low = Runs[2].Moon;
		Say(TEXT(""));
		Say(TEXT("--- IQ acceptance ---"));
		Check(FCivWorldSettings().AverageIQ == 100.0 && !FCivWorldSettings().bRealCities && !FCivWorldSettings().bRealDisasters, TEXT("default world: IQ 100, real history off"));
		Check(High.Reached == Seeds && High.Mean >= 700.0 && High.Mean <= 900.0, FString::Printf(TEXT("IQ 200 moon mean %.0f is around year 800"), High.Mean));
		Check(High.Max > High.Min, FString::Printf(TEXT("IQ 200 moon year varies by seed (%.0f..%.0f)"), High.Min, High.Max));
		// Ordinary people move like real humanity or slower: real first cities to the Moon took about 5,500 years.
		const FSeries& MidGap = Runs[1].Gap;
		Check(Mid.Reached == 0 || (MidGap.Min >= 4500.0 && MidGap.Mean >= 5000.0),
			FString::Printf(TEXT("IQ 100 is slow like real history: moon in %d/%d seeds, first city to moon mean %.0f years (min %.0f, max %.0f)"), Mid.Reached, Seeds, MidGap.Mean, MidGap.Min, MidGap.Max));
		Check(Mid.Reached == 0 || Mid.Mean >= 5.0 * High.Mean, FString::Printf(TEXT("IQ 100 takes at least 5 times as long as IQ 200 (mean moon %.0f vs %.0f)"), Mid.Mean, High.Mean));
		Check(Runs[1].City.Mean >= 2.5 * Runs[0].City.Mean, FString::Printf(TEXT("IQ 100 founds its first city later too (mean year %.0f vs %.0f)"), Runs[1].City.Mean, Runs[0].City.Mean));
		Check(Low.Reached <= Seeds / 2 && Low.Reached <= Mid.Reached && (Low.Reached == 0 || Mid.Reached == 0 || Low.Mean > Mid.Mean),
			FString::Printf(TEXT("IQ 80 is slower still and usually never gets there (moon in %d/%d seeds within %d years)"), Low.Reached, Seeds, Runs[2].MaxYears));
		Check(Runs[2].City.Reached == Seeds && Runs[2].City.Mean > Runs[1].City.Mean, FString::Printf(TEXT("IQ 80 still builds cities, later (mean year %.0f)"), Runs[2].City.Mean));
		Check(YearsPerSecond >= 100.0, FString::Printf(TEXT("speed %.0f years/second is well above 1"), YearsPerSecond));

		Say(TEXT("")); Say(TEXT("--- Settings ---"));
		{
			FCivWorldSettings Quiet = MakeSettings(5, 100, Tuning); Quiet.DisasterFrequency = 0.0;
			FCivWorldSettings Wild = MakeSettings(5, 100, Tuning); Wild.DisasterFrequency = 3.0; Wild.DisasterStrength = 2.0;
			FCivWorldSettings Peace = MakeSettings(5, 100, Tuning); Peace.WarTendency = 0.0;
			FCivWorldSettings Few = MakeSettings(5, 100, Tuning); Few.NumPeoples = 3;
			FCivWorldSettings Modern = MakeSettings(5, 100, Tuning); Modern.StartEra = 5;
			FCivSimulation A(Quiet), B(Wild), C(Peace), D(Few), E(Modern);
			RunYears(A, 1000); RunYears(B, 1000); RunYears(C, 1000); RunYears(D, 1); RunYears(E, 1);
			Check(A.GetStats().Events == 0 && B.GetStats().Events > 100, FString::Printf(TEXT("disaster frequency setting works (0 -> %d events, 3x -> %d)"), A.GetStats().Events, B.GetStats().Events));
			Check(C.GetStats().Wars == 0, TEXT("war tendency 0 means no wars"));
			Check(D.GetPeoples().Num() == 3, TEXT("number of peoples setting works"));
			Check(E.GetPeoples()[0].KnownCount >= 30, FString::Printf(TEXT("start era 5 starts with %d inventions known"), E.GetPeoples()[0].KnownCount));
			FCivWorldSettings Slow = MakeSettings(5, 200, Tuning); Slow.InventionSpeed = 0.3;
			FCivSimulation F(MakeSettings(5, 200, Tuning)), G(Slow);
			RunYears(F, 500); RunYears(G, 500);
			Check(G.GetPeoples()[0].KnownCount < F.GetPeoples()[0].KnownCount, TEXT("invention speed setting works"));
		}

		Say(TEXT("")); Say(TEXT("--- Determinism ---"));
		{
			const int32 Y = 2500;
			FCivSimulation A(MakeSettings(7, 200, Tuning)), B(MakeSettings(7, 200, Tuning)), C(MakeSettings(8, 200, Tuning));
			RunYears(A, Y); RunYears(B, Y); RunYears(C, Y);
			Check(A.ComputeHash() == B.ComputeHash() && A.BuildBook() == B.BuildBook(), FString::Printf(TEXT("same seed, same history (hash %llx)"), A.ComputeHash()));
			Check(GeneratedList(A) == GeneratedList(B) && GeneratedList(A).Num() > 0, FString::Printf(TEXT("same seed, same generated inventions (%d)"), GeneratedList(A).Num()));
			Check(A.ComputeHash() != C.ComputeHash(), TEXT("different seed, different history"));

			FCivSimulation D(MakeSettings(7, 200, Tuning)), E(MakeSettings(7, 200, Tuning));
			E.GodSetSpeed(50.0);
			RunYears(D, 500);
			int32 Played = 0;
			for (int32 Tick = 0; Tick < 1000; ++Tick) { Played += E.Advance(0.01); }
			Check(Played == 500 && D.ComputeHash() == E.ComputeHash(), FString::Printf(TEXT("real-time playback matches year stepping (%d years at 50/s)"), Played));
			FCivSimulation Paused(MakeSettings(7, 200, Tuning));
			Paused.GodSetSpeed(0.0);
			Check(Paused.Advance(100.0) == 0, TEXT("speed 0 pauses time"));
		}

		Say(TEXT("")); Say(TEXT("--- God actions ---"));
		{
			FCivSimulation Struck(MakeSettings(7, 200, Tuning)), Blessed(MakeSettings(7, 200, Tuning));
			RunYears(Struck, 300); RunYears(Blessed, 300);
			int32 Target = 0;
			for (int32 I = 0; I < Struck.GetPeoples().Num(); ++I) { if (Struck.GetPeoples()[I].Population > Struck.GetPeoples()[Target].Population) { Target = I; } }
			const double Before = Struck.GetPeoples()[Target].Population;
			Struck.GodDisaster(Target, ECivEvent::Plague, 1.0);
			const double After = Struck.GetPeoples()[Target].Population;
			Check(After < Before * 0.95, FString::Printf(TEXT("disaster kills people (%.0f -> %.0f)"), Before, After));
			const int32 KnownBefore = Blessed.GetPeoples()[Target].KnownCount;
			Check(Blessed.GodMiracle(Target, ECivMiracle::Revelation) && Blessed.GetPeoples()[Target].KnownCount == KnownBefore + 1, TEXT("miracle of revelation gives an invention"));
			Blessed.GodMiracle(Target, ECivMiracle::Abundance);
			Check(Blessed.GetPeoples()[Target].Food >= Blessed.GetPeoples()[Target].Population * 2.9, TEXT("miracle of abundance fills the stores"));
			const int32 Id = Blessed.GodInspire(Target);
			Check(Id != INDEX_NONE && Blessed.GetPersons()[Id].InspiredUntil > Blessed.GetYear(), TEXT("inspire marks an inventor as inspired"));

			TArray<int32> Plain, Helped, Ruined;
			int32 LaterOrNever = 0;
			for (int32 Seed = 1; Seed <= 6; ++Seed)
			{
				FCivSimulation P1(MakeSettings(Seed, 200, Tuning)), P2(MakeSettings(Seed, 200, Tuning)), P3(MakeSettings(Seed, 200, Tuning));
				RunUntil(P1, 6000, ECivMilestone::Moon);
				while (P2.GetYear() < 6000 && !P2.IsExtinct() && !Reached(P2, ECivMilestone::Moon)) { P2.StepYear(); if (P2.GetYear() % 25 == 0) { InspireAll(P2); } }
				while (P3.GetYear() < 6000 && !P3.IsExtinct() && !Reached(P3, ECivMilestone::Moon))
				{
					P3.StepYear();
					if (P3.GetYear() % 10 == 0)
					{
						for (int32 I = 0; I < P3.GetPeoples().Num(); ++I) { if (P3.GetPeoples()[I].bAlive) { P3.GodDisaster(I, ECivEvent::Plague, 1.0); } }
					}
				}
				const int32 M1 = P1.GetMilestoneYear(ECivMilestone::Moon), M2 = P2.GetMilestoneYear(ECivMilestone::Moon), M3 = P3.GetMilestoneYear(ECivMilestone::Moon);
				Plain.Add(M1); Helped.Add(M2); Ruined.Add(M3);
				if (M3 == INDEX_NONE || M3 > M1) { ++LaterOrNever; }
				Say(FString::Printf(TEXT("  seed %d moon: plain %d, inspired every 25y %d, plague every 10y %d (extinct %d)"), Seed, M1, M2, M3, P3.IsExtinct() ? 1 : 0));
			}
			Check(Measure(Helped).Mean < Measure(Plain).Mean - 10.0, FString::Printf(TEXT("inspiration brings the moon earlier (mean %.0f vs %.0f)"), Measure(Helped).Mean, Measure(Plain).Mean));
			Check(LaterOrNever == 6, FString::Printf(TEXT("relentless plagues delay or prevent the moon (%d of 6)"), LaterOrNever));
		}

		Say(TEXT("")); Say(TEXT("--- Real history (off by default) ---"));
		{
			FCivSimulation Default(MakeSettings(3, 100, Tuning));
			RunYears(Default, 50);
			Check(CountCities(Default) == 0 && !Default.UsesRealCalendar(), TEXT("default world has no real cities"));

			const int32 Earliest = CivRealHistory::EarliestCityYear();
			FCivWorldSettings EarlyS = MakeSettings(3, 100, Tuning); EarlyS.bRealCities = true; EarlyS.bRealDisasters = true;
			FCivSimulation Early(EarlyS);
			Say(FString::Printf(TEXT("  earliest default start: calendar year %d, real cities present at start: %d"), Early.GetCalendarYear(), CountCities(Early)));
			Check(Early.GetCalendarYear() == Earliest && CountCities(Early) == 1 && HasCity(Early, TEXT("אורוך")), TEXT("earliest start has only the earliest city"));
			Check(!HasCity(Early, TEXT("ממפיס")), TEXT("a later city is not there yet"));
			RunYears(Early, 250);   // to about 2950 BCE
			Say(FString::Printf(TEXT("  after 250 years (calendar %d): real cities %d"), Early.GetCalendarYear(), CountCities(Early)));
			Check(HasCity(Early, TEXT("ממפיס")), TEXT("Memphis appears at its own date"));

			FCivWorldSettings ZeroS = EarlyS; ZeroS.RealHistoryStartYear = 0;
			FCivSimulation Zero(ZeroS);
			Say(FString::Printf(TEXT("  start at year 0: real cities present %d"), CountCities(Zero)));
			Check(Zero.GetCalendarYear() == 0 && HasCity(Zero, TEXT("רומא")) && HasCity(Zero, TEXT("אלכסנדריה")) && HasCity(Zero, TEXT("ירושלים")), TEXT("year 0 start has Rome, Alexandria and Jerusalem"));
			Check(!HasCity(Zero, TEXT("מארי")) && !HasCity(Zero, TEXT("מוהנג'ו דארו")), TEXT("year 0 start does not have cities abandoned earlier"));
			Check(!HasCity(Zero, TEXT("טאוטיהואקאן")), TEXT("year 0 start does not have Teotihuacan yet"));

			RunYears(Zero, 2030);
			Check(Zero.GetStats().RealDisasters >= 10, FString::Printf(TEXT("real disasters arrive by date (%d fired by calendar year %d, data set has %d)"), Zero.GetStats().RealDisasters, Zero.GetCalendarYear(), CivRealHistory::Disasters().Num()));
			bool bBlackDeath = false, bVesuvius = false;
			for (const FCivEntry& E : Zero.GetEntries())
			{
				if (E.Text.Contains(TEXT("המוות השחור"))) { bBlackDeath = E.Year == 1347; }
				if (E.Text.Contains(TEXT("וזוב"))) { bVesuvius = E.Year == 79; }
			}
			Check(bBlackDeath && bVesuvius, TEXT("Vesuvius and the Black Death are in the book at their exact years"));

			FCivWorldSettings CitiesOnly = MakeSettings(3, 100, Tuning); CitiesOnly.bRealCities = true; CitiesOnly.RealHistoryStartYear = 0;
			FCivWorldSettings DisastersOnly = MakeSettings(3, 100, Tuning); DisastersOnly.bRealDisasters = true; DisastersOnly.RealHistoryStartYear = 0;
			FCivSimulation CO(CitiesOnly), DO(DisastersOnly);
			RunYears(CO, 100); RunYears(DO, 100);
			Check(CountCities(CO) > 0 && CO.GetStats().RealDisasters == 0, TEXT("cities toggle works alone"));
			Check(CountCities(DO) == 0 && DO.GetStats().RealDisasters > 0, TEXT("disasters toggle works alone"));

			const FString EarlyPath = OutDir / TEXT("history-sample-real-earliest.txt");
			const FString ZeroPath = OutDir / TEXT("history-sample-real-year0.txt");
			// The sample reads on from the earliest city to the start of the common era, as cities arrive at their own dates.
			RunYears(Early, -Early.GetCalendarYear());
			Say(FString::Printf(TEXT("  earliest-start sample runs to calendar year %d with %d real cities"), Early.GetCalendarYear(), CountCities(Early)));
			FFileHelper::SaveStringToFile(Early.BuildBook(), *EarlyPath, FFileHelper::EEncodingOptions::ForceUTF8WithoutBOM);
			FFileHelper::SaveStringToFile(Zero.BuildBook(), *ZeroPath, FFileHelper::EEncodingOptions::ForceUTF8WithoutBOM);
		}

		Say(TEXT("")); Say(TEXT("--- Open-ended inventions ---"));
		{
			int32 Tried = 0, Accepted = 0, Chained = 0, Speculative = 0, LateSpeculative = 0, BadParents = 0;
			int32 RejectedBy[CivRejectCount] = { 0 };
			TSet<FString> Names;
			bool bNoDuplicates = true;
			for (int32 Seed = 1; Seed <= 4; ++Seed)
			{
				FCivSimulation Sim(MakeSettings(Seed, 200, Tuning));
				RunYears(Sim, 4000);
				Names.Reset();
				for (const FCivInventionDef& Def : Sim.GetTree())
				{
					bool bAlready = false;
					Names.Add(Def.Name, &bAlready);
					if (bAlready) { bNoDuplicates = false; }
					if (!Def.bGenerated) { continue; }
					if (Def.bSpeculative) { ++Speculative; if (Def.Era >= 7) { ++LateSpeculative; } }
					if (Def.Prereqs.Num() == 0) { ++BadParents; }
					for (int32 Parent : Def.Prereqs) { if (!Sim.GetTree().IsValidIndex(Parent) || Sim.GetTree()[Parent].ConceivedYear > Def.ConceivedYear) { ++BadParents; } }
				}
				Tried += Sim.GetStats().ProposalsTried;
				Accepted += Sim.GetStats().ProposalsAccepted;
				for (int32 R = 0; R < CivRejectCount; ++R) { RejectedBy[R] += Sim.GetStats().Rejected[R]; }
				for (const FCivInventionDef& Def : Sim.GetTree())
				{
					if (!Def.bGenerated) { continue; }
					for (int32 Parent : Def.Prereqs) { if (Sim.GetTree()[Parent].bGenerated) { ++Chained; break; } }
				}
			}
			Say(FString::Printf(TEXT("  proposals tried %d, accepted %d, rejected by rules %.1f%%"), Tried, Accepted, 100.0 * (Tried - Accepted) / FMath::Max(1, Tried)));
			for (int32 R = 1; R < CivRejectCount; ++R)
			{
				if (RejectedBy[R] > 0) { Say(FString::Printf(TEXT("    %-40s %d"), CivGenerator::RejectName(static_cast<ECivReject>(R)), RejectedBy[R])); }
			}
			Check(Accepted >= 20, FString::Printf(TEXT("long runs generate new inventions (%d accepted)"), Accepted));
			Check(Chained > 0, FString::Printf(TEXT("generated inventions are used as prerequisites of later ones (%d)"), Chained));
			Check(BadParents == 0, TEXT("every generated invention has known, earlier parents"));
			Check(bNoDuplicates, TEXT("no two inventions in a world share a name"));
			Check(Speculative < Accepted / 2 && LateSpeculative == Speculative, FString::Printf(TEXT("ideas beyond known science come only at the highest knowledge and stay the minority (%d of %d)"), Speculative, Accepted));

			// The owner's example of nonsense, and near misses.
			FCivSimulation Judge(MakeSettings(2, 200, Tuning));
			RunYears(Judge, 1500);
			int32 Rich = 0;
			for (int32 I = 0; I < Judge.GetPeoples().Num(); ++I) { if (Judge.GetPeoples()[I].KnownCount > Judge.GetPeoples()[Rich].KnownCount) { Rich = I; } }
			const FCivProposalContext Context = Judge.MakeContext(Rich);
			const int32 FireIndex = Table.Find(TEXT("fire"));

			FCivInventionProposal Apple;
			Apple.Name = TEXT("תפוח עם מקל");
			Apple.Effects.War = 1.1;
			Check(CivGenerator::Validate(Apple, Context) == ECivReject::NoParents, TEXT("apple-on-a-stick weapon with no basis is rejected"));
			Apple.Parents = { FireIndex };
			Check(CivGenerator::Validate(Apple, Context) == ECivReject::NoPurpose, TEXT("same idea with a parent but no purpose is rejected"));
			Apple.PurposeKey = TEXT("defend");
			Check(CivGenerator::Validate(Apple, Context) == ECivReject::NoMechanism, TEXT("same idea with a purpose but no mechanism is rejected"));
			Apple.PrincipleKey = TEXT("genetic");
			Check(CivGenerator::Validate(Apple, Context) == ECivReject::Incompatible, TEXT("same idea with a mismatched principle is rejected"));
			ECivReject Reason = ECivReject::None;
			Check(Judge.AddCustomInvention(Apple, Rich, false, &Reason) == INDEX_NONE && Reason != ECivReject::None, TEXT("adding it by hand under the rules is refused"));

			// By hand: a sensible custom invention, with the player's force option too.
			FCivInventionProposal Custom;
			Custom.Key = TEXT("custom_test");
			Custom.Name = TEXT("אבן שחיקה משופרת");
			Custom.NameDefinite = TEXT("אבן השחיקה המשופרת");
			Custom.Parents = { Table.Find(TEXT("stone_tools")) };
			Custom.Effects.Resources = 1.1;
			const int32 TreeBefore = Judge.GetTree().Num();
			const int32 Added = Judge.AddCustomInvention(Custom, Rich, true);
			Check(Added == TreeBefore && Judge.GetTree().Num() == TreeBefore + 1, TEXT("a custom invention can be added by hand"));

			// Save and load keep the whole world, generated inventions included.
			FCivSimulation Original(MakeSettings(4, 200, Tuning));
			RunYears(Original, 2500);
			TArray<uint8> Bytes;
			Original.SaveToBytes(Bytes);
			TUniquePtr<FCivSimulation> Loaded = FCivSimulation::LoadFromBytes(Bytes);
			Check(Loaded.IsValid() && Loaded->ComputeHash() == Original.ComputeHash(), FString::Printf(TEXT("save and load restore the world exactly (%d bytes)"), Bytes.Num()));
			Check(Loaded.IsValid() && GeneratedList(*Loaded) == GeneratedList(Original) && GeneratedList(Original).Num() > 0, FString::Printf(TEXT("save keeps generated inventions (%d)"), GeneratedList(Original).Num()));
			if (Loaded.IsValid())
			{
				RunYears(Original, 500); RunYears(*Loaded, 500);
				Check(Original.ComputeHash() == Loaded->ComputeHash(), TEXT("a loaded world continues identically"));
			}
		}

		Say(TEXT("")); Say(TEXT("--- Individual lives ---"));
		{
			// Counts over several ordinary worlds.
			FCivStats Sum;
			int32 TotalYears = 0;
			for (int32 Seed = 21; Seed <= 26; ++Seed)
			{
				FCivSimulation Sim(MakeSettings(Seed, 100, Tuning));
				RunYears(Sim, 2500);
				TotalYears += Sim.GetYear();
				if (Seed == 21)
				{
					int32 Soldiers = 0, Battles = 0, TwoBattles = 0, Knights = 0;
					for (const FCivPerson& C : Sim.GetPersons())
					{
						int32 B = 0; bool bSoldier = false;
						for (const FCivLifeEvent& E : C.Log)
						{
							if (E.Kind == ECivLife::Levied || (E.Kind == ECivLife::Work && E.Param == static_cast<int32>(ECivOccupation::Soldier))) { bSoldier = true; }
							if (E.Kind == ECivLife::Battle) { ++B; }
							if (E.Kind == ECivLife::Knighted) { ++Knights; }
						}
						Soldiers += (bSoldier && C.OriginRank == ECivRank::Commoner) ? 1 : 0; Battles += B; TwoBattles += B >= 2 ? 1 : 0;
					}
					Say(FString::Printf(TEXT("  one world in detail (seed 21, remembered lives only): commoner soldiers %d, battles %d, soldiers with two or more battles %d, knighted %d, named people %d"), Soldiers, Battles, TwoBattles, Knights, Sim.GetPersons().Num()));
				}
				const FCivStats& S = Sim.GetStats();
				Sum.PersonsCreated += S.PersonsCreated; Sum.DiedYoung += S.DiedYoung; Sum.Knighted += S.Knighted; Sum.Ennobled += S.Ennobled;
				Sum.RulersFromCommon += S.RulersFromCommon; Sum.CoupsTried += S.CoupsTried; Sum.CoupsWon += S.CoupsWon; Sum.Deposed += S.Deposed;
				Sum.Tyrants += S.Tyrants; Sum.Preachers += S.Preachers; Sum.Saints += S.Saints; Sum.Healers += S.Healers; Sum.RichMerchants += S.RichMerchants;
				Sum.Ruined += S.Ruined; Sum.Rebels += S.Rebels; Sum.RebellionsWon += S.RebellionsWon; Sum.Explorers += S.Explorers; Sum.InventorsBorn += S.InventorsBorn;
			}
			Say(FString::Printf(TEXT("  6 worlds at IQ 100, %d world-years, %d named people"), TotalYears, Sum.PersonsCreated));
			Say(FString::Printf(TEXT("  died young %d | commoner to knight %d | commoner to lord %d | commoner to ruler %d | coups tried %d, won %d | rulers deposed %d | tyrants %d"),
				Sum.DiedYoung, Sum.Knighted, Sum.Ennobled, Sum.RulersFromCommon, Sum.CoupsTried, Sum.CoupsWon, Sum.Deposed, Sum.Tyrants));
			Say(FString::Printf(TEXT("  preachers %d | venerated saints %d | healers %d | rich merchants %d | ruined %d | rebels %d, won %d | explorers %d | inventors %d"),
				Sum.Preachers, Sum.Saints, Sum.Healers, Sum.RichMerchants, Sum.Ruined, Sum.Rebels, Sum.RebellionsWon, Sum.Explorers, Sum.InventorsBorn));
			const double Lives = FMath::Max(1, Sum.PersonsCreated);
			Say(FString::Printf(TEXT("  per 1000 lives: knighted %.2f, ennobled %.2f, commoner to ruler %.2f, coups tried %.2f, saints %.2f, ruined merchants %.2f"),
				1000.0 * Sum.Knighted / Lives, 1000.0 * Sum.Ennobled / Lives, 1000.0 * Sum.RulersFromCommon / Lives, 1000.0 * Sum.CoupsTried / Lives, 1000.0 * Sum.Saints / Lives, 1000.0 * Sum.Ruined / Lives));
			Check(Sum.RulersFromCommon < Sum.PersonsCreated / 100 && Sum.RulersFromCommon > 0, FString::Printf(TEXT("a commoner reaching the throne happens, and is rare (%d in %d lives, under 1 in 100)"), Sum.RulersFromCommon, Sum.PersonsCreated));
			Check(Sum.Knighted > Sum.Ennobled && Sum.Ennobled > 0 && Sum.Knighted < Sum.PersonsCreated / 50, FString::Printf(TEXT("the ladder is used and narrows: knighted %d > ennobled %d > 0"), Sum.Knighted, Sum.Ennobled));
			Check(Sum.CoupsTried > 0 && Sum.CoupsWon < Sum.CoupsTried, FString::Printf(TEXT("coups happen and can fail (%d tried, %d won)"), Sum.CoupsTried, Sum.CoupsWon));
			Check(Sum.Rebels > 0 && Sum.RebellionsWon * 3 < Sum.Rebels, FString::Printf(TEXT("most rebels fail (%d of %d won)"), Sum.RebellionsWon, Sum.Rebels));
			Check(Sum.Ruined > 0 && Sum.Deposed > 0, FString::Printf(TEXT("fortunes fall too: %d merchants ruined, %d rulers deposed"), Sum.Ruined, Sum.Deposed));
			Check(Sum.Saints > 0 && Sum.Saints < Sum.PersonsCreated / 100, TEXT("sainthood happens, and is rare"));

			// Find a world in which someone climbed the whole ladder, so the stories can show it. God also touches two lives there.
			const auto HasKind = [](const FCivPerson& Person, ECivLife Kind) { return Person.Log.ContainsByPredicate([Kind](const FCivLifeEvent& E) { return E.Kind == Kind; }); };
			// The classic ladder: a commoner soldier made knight, then given land, then the throne, in the age of kings.
			const auto IsLadder = [&HasKind](const FCivPerson& C)
			{
				const bool bThrone = C.Log.ContainsByPredicate([](const FCivLifeEvent& E) { return (E.Kind == ECivLife::CoupWon || E.Kind == ECivLife::Chosen) && E.Era < 5; });
				return C.OriginRank == ECivRank::Commoner && HasKind(C, ECivLife::Knighted) && HasKind(C, ECivLife::Ennobled) && bThrone;
			};
			TUniquePtr<FCivSimulation> Found;
			int32 BlessedId = INDEX_NONE, CursedId = INDEX_NONE, StorySeed = 0;
			for (int32 Seed = 11; Seed <= 110 && !Found.IsValid(); ++Seed)
			{
				TUniquePtr<FCivSimulation> Candidate = MakeUnique<FCivSimulation>(MakeSettings(Seed, 100, Tuning));
				RunYears(*Candidate, 2700);
				int32 Biggest = INDEX_NONE;
				for (int32 I = 0; I < Candidate->GetPeoples().Num(); ++I)
				{
					if (Candidate->GetPeoples()[I].bAlive && (Biggest == INDEX_NONE || Candidate->GetPeoples()[I].Population > Candidate->GetPeoples()[Biggest].Population)) { Biggest = I; }
				}
				int32 Blessed = INDEX_NONE, Cursed = INDEX_NONE;
				if (Biggest != INDEX_NONE)
				{
					for (int32 Id : Candidate->GetPeoples()[Biggest].LivingPersons)
					{
						const FCivPerson& C = Candidate->GetPersons()[Id];
						const int32 Age = Candidate->GetYear() - C.BornYear;
						if (C.Rank != ECivRank::Commoner || C.bInventor || Age < 22 || Age > 35) { continue; }
						if (Blessed == INDEX_NONE && C.Occupation == ECivOccupation::Farmer) { Blessed = Id; }
						else if (Cursed == INDEX_NONE && C.Id != Blessed && (C.Occupation == ECivOccupation::Merchant || C.Occupation == ECivOccupation::Artisan || C.Occupation == ECivOccupation::Farmer)) { Cursed = Id; }
					}
				}
				Candidate->GodBlessPerson(Blessed);
				Candidate->GodCursePerson(Cursed);
				RunYears(*Candidate, 300);
				if (Candidate->GetPersons().ContainsByPredicate([&](const FCivPerson& C) { return !C.IsAlive() && IsLadder(C); }) && Blessed != INDEX_NONE && Cursed != INDEX_NONE)
				{
					Found = MoveTemp(Candidate);
					BlessedId = Blessed; CursedId = Cursed; StorySeed = Seed;
				}
			}
			Check(Found.IsValid(), FString::Printf(TEXT("a world where a commoner climbed from soldier to the throne was found (seed %d)"), StorySeed));

			int32 Written = 0;
			TSet<int32> Used;
			TArray<FString> Missing;
			FString Stories;
			if (Found.IsValid())
			{
				const FCivSimulation& World = *Found;
				Stories = FString::Printf(TEXT("סיפורי חיים מעולם אחד (זרע %d, מנת משכל 100), עד שנה %d.\nכל החיים האלה התרחשו באותו עולם, באותה היסטוריה. רובם חיים רגילים, וחלקם חיים שנכשלו; מעטים בלטו.\n\n"), StorySeed, World.GetYear());
				const auto Pick = [&](const TCHAR* Heading, int32 Want, bool bAllowAlive, TFunctionRef<bool(const FCivPerson&)> Test)
				{
					int32 Taken = 0;
					for (int32 I = World.GetPersons().Num() - 1; I >= 0 && Taken < Want; --I)
					{
						const FCivPerson& Person = World.GetPersons()[I];
						if ((!bAllowAlive && Person.IsAlive()) || Person.Log.Num() < 2 || Used.Contains(Person.Id) || !Test(Person)) { continue; }
						Used.Add(Person.Id);
						Stories += FString(TEXT("=== ")) + Heading + TEXT(" ===\n") + World.BuildLifeStory(Person.Id) + TEXT("\n");
						++Taken; ++Written;
					}
					if (Taken < Want) { Missing.Add(Heading); }
				};
				const auto Ordinary = [&](const FCivPerson& C)
				{
					return C.OriginRank == ECivRank::Commoner && C.Rank == ECivRank::Commoner && !C.bInventor && C.Father != INDEX_NONE && !C.bChildDeath && C.Log.Num() >= 7
						&& (C.Occupation == ECivOccupation::Farmer || C.Occupation == ECivOccupation::Artisan) && !HasKind(C, ECivLife::Levied) && !HasKind(C, ECivLife::Retired);
				};
				Pick(TEXT("מחייל פשוט אל השלטון"), 1, false, IsLadder);
				Pick(TEXT("חיים רגילים"), 2, false, Ordinary);
				Pick(TEXT("מת בילדותו"), 1, false, [&](const FCivPerson& C) { return C.bChildDeath && C.Father != INDEX_NONE; });
				Pick(TEXT("חייל שנפל"), 1, false, [&](const FCivPerson& C) { return C.OriginRank == ECivRank::Commoner && (C.DeathCause == TEXT("פצעי מלחמה") || C.DeathCause == TEXT("פצעים מקרב בגבול")); });
				Pick(TEXT("מורד שנכשל"), 1, false, [&](const FCivPerson& C) { return HasKind(C, ECivLife::Rebel) && !HasKind(C, ECivLife::RebelWon); });
				Pick(TEXT("קדוש"), 1, false, [&](const FCivPerson& C) { return C.bVenerated; });
				Pick(TEXT("חיים רגילים"), 1, false, Ordinary);
				Pick(TEXT("סוחר שאיבד הכול"), 1, false, [&](const FCivPerson& C) { return HasKind(C, ECivLife::Ruined); });
				Pick(TEXT("ממציא"), 1, false, [&](const FCivPerson& C) { return C.Log.ContainsByPredicate([](const FCivLifeEvent& E) { return E.Kind == ECivLife::Invented && E.Other == 1; }); });
				Pick(TEXT("ברכת האל"), 1, true, [&](const FCivPerson& C) { return C.Id == BlessedId; });
				Pick(TEXT("קללת האל"), 1, true, [&](const FCivPerson& C) { return C.Id == CursedId; });
				Pick(TEXT("חייל שחזר הביתה"), 1, false, [&](const FCivPerson& C) { return HasKind(C, ECivLife::Retired) && C.Rank == ECivRank::Commoner; });
				Pick(TEXT("מטיף שלא נעשה קדוש"), 1, false, [&](const FCivPerson& C) { return HasKind(C, ECivLife::Awakening) && !C.bVenerated; });
				Pick(TEXT("קשר שנכשל"), 1, false, [&](const FCivPerson& C) { return HasKind(C, ECivLife::CoupLost); });
				Pick(TEXT("חיים רגילים"), 1, false, Ordinary);
				Pick(TEXT("אביר שלא עלה יותר"), 1, false, [&](const FCivPerson& C) { return C.OriginRank == ECivRank::Commoner && HasKind(C, ECivLife::Knighted) && !IsLadder(C); });
				Pick(TEXT("שליט שהודח"), 1, false, [&](const FCivPerson& C) { return HasKind(C, ECivLife::Deposed); });
				Pick(TEXT("חיים רגילים"), 1, false, Ordinary);
				while (Written < 20) { const int32 Before = Written; Pick(TEXT("חיים רגילים"), 1, false, Ordinary); if (Written == Before) { break; } }
			}
			const FString StoryPath = OutDir / TEXT("life-stories.txt");
			FFileHelper::SaveStringToFile(Stories, *StoryPath, FFileHelper::EEncodingOptions::ForceUTF8WithoutBOM);
			Check(Written == 20, FString::Printf(TEXT("life stories written (%d), missing kinds: %s"), Written, Missing.Num() ? *FString::Join(Missing, TEXT(", ")) : TEXT("none")));
			Check(!Stories.Contains(TEXT("{")) && !Stories.Contains(TEXT("}")), TEXT("life stories have no unfilled template slots"));
			if (!Found.IsValid()) { Found = MakeUnique<FCivSimulation>(MakeSettings(11, 100, Tuning)); RunYears(*Found, 1000); }
			FCivSimulation& World = *Found;

			// God and the player's focus.
			int32 Target = 0;
			for (int32 I = 0; I < World.GetPeoples().Num(); ++I) { if (World.GetPeoples()[I].bAlive) { Target = I; break; } }
			const int32 Promoted = World.PromoteFromCrowd(Target);
			Check(Promoted != INDEX_NONE && !World.BuildLifeStory(Promoted).IsEmpty(), TEXT("anyone can be promoted from the crowd with a written past"));
			if (Promoted != INDEX_NONE)
			{
				const FCivPerson& Pr = World.GetPersons()[Promoted];
				bool bOrdered = true;
				for (int32 I = 1; I < Pr.Log.Num(); ++I) { bOrdered &= Pr.Log[I - 1].Year <= Pr.Log[I].Year; }
				const bool bFamily = Pr.Spouse == INDEX_NONE || (World.GetPersons()[Pr.Spouse].Spouse == Promoted && World.GetPersons()[Pr.Spouse].IsAlive());
				Check(bOrdered && bFamily && Pr.Log[0].Year == Pr.BornYear, TEXT("the promoted person's past is consistent: in order, from birth, with a real family"));
				Say(TEXT("  promoted person:\n") + World.BuildLifeStory(Promoted));
			}
			Check(World.GodBlessPerson(Promoted) && World.GodCursePerson(Promoted) && World.GodInspirePerson(Promoted), TEXT("god can bless, curse and inspire a person"));

			FCivSimulation A(MakeSettings(12, 100, Tuning)), B(MakeSettings(12, 100, Tuning));
			RunYears(A, 800); RunYears(B, 800);
			bool bSame = A.GetPersons().Num() == B.GetPersons().Num();
			for (int32 I = 0; bSame && I < A.GetPersons().Num(); ++I) { bSame = A.BuildLifeStory(I) == B.BuildLifeStory(I); }
			Check(bSame, TEXT("same seed gives the same life stories"));
			TArray<uint8> Bytes;
			A.SaveToBytes(Bytes);
			TUniquePtr<FCivSimulation> L = FCivSimulation::LoadFromBytes(Bytes);
			Check(L.IsValid() && L->BuildLifeStory(A.GetPersons().Num() / 2) == A.BuildLifeStory(A.GetPersons().Num() / 2), TEXT("life stories survive save and load"));
		}

		Say(TEXT("")); Say(TEXT("--- Sample books ---"));
		{
			struct FSample { double IQ; const TCHAR* File; int32 Years; };
			const FSample Samples[] = { { 100.0, TEXT("history-sample.txt"), MaxLow }, { 200.0, TEXT("history-sample-iq200.txt"), 6000 } };
			TArray<FString> InventionLines;
			InventionLines.Add(TEXT("המצאות חדשות שנולדו במהלך המשחק"));
			InventionLines.Add(TEXT("============================="));
			InventionLines.Add(TEXT("אלה ההמצאות שאינן בעץ ההתחלתי, מאותם שני עולמות של ספרי ההיסטוריה לדוגמה. כל אחת עברה את כל הכללים:"));
			InventionLines.Add(TEXT("היא נשענת על המצאות שהעם כבר הכיר, עונה על צורך אמיתי, פועלת בעיקרון שמתאים למטרה, דורשת חומרים שהעם יכול להשיג,"));
			InventionLines.Add(TEXT("ונותנת תועלת צנועה וברורה במשחק. רעיונות שמעבר למדע המוכר מותרים רק לעמים המתקדמים ביותר, והם נדירים ויקרים יותר."));
			InventionLines.Add(TEXT(""));
			for (const FSample& Sample : Samples)
			{
				FCivSimulation Sim(MakeSettings(7, Sample.IQ, Tuning));
				if (Sample.IQ < 150.0)
				{
					// An ordinary world: read it up to a few centuries after the Moon, or to the end of the run.
					RunUntil(Sim, Sample.Years, ECivMilestone::Moon);
					RunYears(Sim, FMath::Min(300, FMath::Max(0, Sample.Years - Sim.GetYear())));
				}
				else
				{
					RunUntil(Sim, Sample.Years, ECivMilestone::OtherStar);
				}
				InventionLines.Append(InventionReport(Sim));
				const FString Book = Sim.BuildBook();
				const FString Path = OutDir / Sample.File;
				const bool bSaved = FFileHelper::SaveStringToFile(Book, *Path, FFileHelper::EEncodingOptions::ForceUTF8WithoutBOM);
				FString Reloaded;
				const bool bBack = FFileHelper::LoadFileToString(Reloaded, *Path) && Reloaded == Book;
				Check(bSaved && bBack, FString::Printf(TEXT("IQ %.0f sample saved and reads back through UTF-8 (year %d)"), Sample.IQ, Sim.GetYear()));

				int32 Hebrew = 0, BadEnd = 0, BadMiddle = 0, Question = 0;
				const FString EndOnly = TEXT("ךםןףץ"), NeverEnd = TEXT("כמנפצ");
				for (int32 I = 0; I < Book.Len(); ++I)
				{
					const TCHAR Ch = Book[I];
					const bool bLetter = Ch >= 0x05D0 && Ch <= 0x05EA;
					if (Ch == TEXT('?')) { ++Question; }
					if (!bLetter) { continue; }
					++Hebrew;
					const bool bNext = I + 1 < Book.Len() && Book[I + 1] >= 0x05D0 && Book[I + 1] <= 0x05EA;
					int32 Found = INDEX_NONE;
					if (bNext && EndOnly.FindChar(Ch, Found)) { ++BadMiddle; }
					if (!bNext && NeverEnd.FindChar(Ch, Found)) { ++BadEnd; }
				}
				Check(Hebrew > 1000 && Question == 0 && BadEnd == 0 && BadMiddle == 0, FString::Printf(TEXT("IQ %.0f book text is clean (%d Hebrew letters, %d '?', %d bad endings, %d bad middles)"), Sample.IQ, Hebrew, Question, BadEnd, BadMiddle));
				Check(!Book.Contains(TEXT("גאון")), FString::Printf(TEXT("IQ %.0f book does not call anyone a genius"), Sample.IQ));

				// Readable size, and no single kind of line flooding the book.
				TArray<FString> BookLines;
				Book.ParseIntoArrayLines(BookLines);
				TMap<FString, int32> Shapes;
				int32 Worst = 0;
				FString WorstShape;
				for (const FString& Line : BookLines)
				{
					// The shape of a line: its words with names and numbers blurred, so repeated templates show up.
					FString Shape;
					TArray<FString> Words;
					Line.ParseIntoArrayWS(Words);
					for (int32 W = 2; W < FMath::Min(Words.Num(), 6); ++W) { Shape += Words[W] + TEXT(" "); }
					if (Shape.IsEmpty()) { continue; }
					const int32 N = ++Shapes.FindOrAdd(Shape);
					if (N > Worst) { Worst = N; WorstShape = Shape; }
				}
				const double WorstShare = BookLines.Num() > 0 ? double(Worst) / BookLines.Num() : 0.0;
				Say(FString::Printf(TEXT("  IQ %.0f book: %d lines, %d KB, most common line shape %.1f%% (%s)"), Sample.IQ, BookLines.Num(), Book.Len() * 2 / 1024, 100.0 * WorstShare, *WorstShape));
				Check(WorstShare < 0.12 && Book.Len() < 160000, FString::Printf(TEXT("IQ %.0f book is readable: no line shape above 12%%, under 160 thousand characters"), Sample.IQ));
			}
			FFileHelper::SaveStringArrayToFile(InventionLines, *(OutDir / TEXT("generated-inventions.txt")), FFileHelper::EEncodingOptions::ForceUTF8WithoutBOM);
		}
	}

	Say(TEXT(""));
	Say(FString::Printf(TEXT("RESULT: %s (%d failures)"), Failures == 0 ? TEXT("ALL PASSED") : TEXT("FAILED"), Failures));
	FFileHelper::SaveStringArrayToFile(Report, *(OutDir / TEXT("test-report.txt")), FFileHelper::EEncodingOptions::ForceUTF8WithoutBOM);
	return Failures == 0 ? 0 : 1;
}
