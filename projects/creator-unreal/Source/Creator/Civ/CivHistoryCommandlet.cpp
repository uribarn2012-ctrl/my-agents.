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
		return FString::Printf(TEXT("seed=%-3llu iq=%3.0f city=%6d writing=%6d electric=%6d moon=%6d mars=%6d launch=%6d arrival=%6d end=%6d pop=%9.2e wars=%3d events=%4d inventors=%5d generated=%3d persons=%6d lost=%2d extinct=%d"),
			Sim.GetSettings().Seed, Sim.GetSettings().AverageIQ, Sim.GetMilestoneYear(ECivMilestone::FirstCity), Sim.GetMilestoneYear(ECivMilestone::Writing),
			Sim.GetMilestoneYear(ECivMilestone::Electricity), Sim.GetMilestoneYear(ECivMilestone::Moon), Sim.GetMilestoneYear(ECivMilestone::Mars),
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
		FParse::Value(*Params, TEXT("BirthExp="), T.BirthIQExponent);
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
	struct FIQRun { double IQ; int32 MaxYears; FSeries Moon; FSeries Launch; };
	int32 MaxLow = 12000;
	FParse::Value(*Params, TEXT("MaxLow="), MaxLow);
	TArray<FIQRun> Runs = { { 200.0, 6000 }, { 100.0, MaxLow }, { 80.0, MaxLow } };
	double SimSeconds = 0.0;
	int64 SimYears = 0;
	for (FIQRun& Run : Runs)
	{
		Say(TEXT(""));
		Say(FString::Printf(TEXT("--- Average IQ %.0f, %d seeds, at most %d years ---"), Run.IQ, Seeds, Run.MaxYears));
		TArray<int32> Moons, Launches;
		for (int32 Seed = 1; Seed <= Seeds; ++Seed)
		{
			FCivSimulation Sim(MakeSettings(Seed, Run.IQ, Tuning));
			const double Start = FPlatformTime::Seconds();
			RunUntil(Sim, Run.MaxYears, ECivMilestone::OtherStar);
			SimSeconds += FPlatformTime::Seconds() - Start;
			SimYears += Sim.GetYear();
			Say(Row(Sim));
			Moons.Add(Sim.GetMilestoneYear(ECivMilestone::Moon));
			Launches.Add(Sim.GetMilestoneYear(ECivMilestone::StarLaunch));
		}
		Run.Moon = Measure(Moons);
		Run.Launch = Measure(Launches);
		Say(FString::Printf(TEXT("IQ %.0f moon: reached %d/%d, mean %.0f, min %.0f, max %.0f | first starship: reached %d/%d, mean %.0f"),
			Run.IQ, Run.Moon.Reached, Seeds, Run.Moon.Mean, Run.Moon.Min, Run.Moon.Max, Run.Launch.Reached, Seeds, Run.Launch.Mean));
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
		Check(Mid.Reached == 0 || Mid.Min > 3000.0, FString::Printf(TEXT("IQ 100 is slow: moon in %d/%d seeds, earliest %.0f"), Mid.Reached, Seeds, Mid.Min));
		Check(Low.Reached <= Mid.Reached && (Low.Reached == 0 || Mid.Reached == 0 || Low.Mean > Mid.Mean), FString::Printf(TEXT("IQ 80 is slower than IQ 100 (reached %d, mean %.0f)"), Low.Reached, Low.Mean));
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
			FFileHelper::SaveStringToFile(Early.BuildBook(), *EarlyPath, FFileHelper::EEncodingOptions::ForceUTF8WithoutBOM);
			FFileHelper::SaveStringToFile(Zero.BuildBook(), *ZeroPath, FFileHelper::EEncodingOptions::ForceUTF8WithoutBOM);
		}

		Say(TEXT("")); Say(TEXT("--- Open-ended inventions ---"));
		{
			TArray<FString> AllLines;
			int32 Tried = 0, Accepted = 0, Chained = 0;
			int32 RejectedBy[CivRejectCount] = { 0 };
			for (int32 Seed = 1; Seed <= 4; ++Seed)
			{
				FCivSimulation Sim(MakeSettings(Seed, 200, Tuning));
				RunYears(Sim, 4000);
				AllLines.Add(FString::Printf(TEXT("=== עולם %d (מנת משכל 200, 4000 שנה) ==="), Seed));
				AllLines.Append(GeneratedList(Sim));
				Tried += Sim.GetStats().ProposalsTried;
				Accepted += Sim.GetStats().ProposalsAccepted;
				for (int32 R = 0; R < CivRejectCount; ++R) { RejectedBy[R] += Sim.GetStats().Rejected[R]; }
				for (const FCivInventionDef& Def : Sim.GetTree())
				{
					if (!Def.bGenerated) { continue; }
					for (int32 Parent : Def.Prereqs) { if (Sim.GetTree()[Parent].bGenerated) { ++Chained; break; } }
				}
			}
			const FString Path = OutDir / TEXT("generated-inventions.txt");
			FFileHelper::SaveStringArrayToFile(AllLines, *Path, FFileHelper::EEncodingOptions::ForceUTF8WithoutBOM);
			Say(FString::Printf(TEXT("  proposals tried %d, accepted %d, rejected by rules %.1f%%"), Tried, Accepted, 100.0 * (Tried - Accepted) / FMath::Max(1, Tried)));
			for (int32 R = 1; R < CivRejectCount; ++R)
			{
				if (RejectedBy[R] > 0) { Say(FString::Printf(TEXT("    %-40s %d"), CivGenerator::RejectName(static_cast<ECivReject>(R)), RejectedBy[R])); }
			}
			Check(Accepted >= 20, FString::Printf(TEXT("long runs generate new inventions (%d accepted)"), Accepted));
			Check(Chained > 0, FString::Printf(TEXT("generated inventions are used as prerequisites of later ones (%d)"), Chained));

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
			Check(Sum.RulersFromCommon < Sum.PersonsCreated / 100 && Sum.RulersFromCommon > 0, TEXT("a commoner reaching the throne happens, and is rare (under 1 in 100 lives)"));
			Check(Sum.Saints > 0 && Sum.Saints < Sum.PersonsCreated / 100, TEXT("sainthood happens, and is rare"));

			FCivSimulation World(MakeSettings(11, 100, Tuning));
			RunYears(World, 1400);
			FString Stories;
			int32 Written = 0;
			const auto Pick = [&](const TCHAR* Heading, int32 Want, TFunctionRef<bool(const FCivPerson&)> Test)
			{
				int32 Taken = 0;
				for (int32 I = World.GetPersons().Num() - 1; I >= 0 && Taken < Want; --I)
				{
					const FCivPerson& Person = World.GetPersons()[I];
					if (Person.IsAlive() || Person.Log.Num() < 2 || !Test(Person)) { continue; }
					Stories += FString(TEXT("=== ")) + Heading + TEXT(" ===\n") + World.BuildLifeStory(Person.Id) + TEXT("\n");
					++Taken; ++Written;
				}
			};
			const auto HasKind = [](const FCivPerson& Person, ECivLife Kind) { return Person.Log.ContainsByPredicate([Kind](const FCivLifeEvent& E) { return E.Kind == Kind; }); };
			Pick(TEXT("חיים רגילים"), 6, [&](const FCivPerson& C) { return C.Rank == ECivRank::Commoner && C.Occupation == ECivOccupation::Farmer && C.Log.Num() >= 7 && !C.bInventor; });
			Pick(TEXT("מת צעיר"), 2, [&](const FCivPerson& C) { return C.bChildDeath; });
			Pick(TEXT("מפשוט עם לשלטון"), 3, [&](const FCivPerson& C) { return C.OriginRank == ECivRank::Commoner && (HasKind(C, ECivLife::CoupWon) || HasKind(C, ECivLife::RebelWon)); });
			Pick(TEXT("קדוש"), 2, [&](const FCivPerson& C) { return C.bVenerated; });
			Pick(TEXT("עלה לאצולה"), 2, [&](const FCivPerson& C) { return C.OriginRank == ECivRank::Commoner && HasKind(C, ECivLife::Knighted); });
			Pick(TEXT("קשר שנכשל"), 2, [&](const FCivPerson& C) { return HasKind(C, ECivLife::CoupLost); });
			Pick(TEXT("סוחר"), 1, [&](const FCivPerson& C) { return HasKind(C, ECivLife::Rich); });
			Pick(TEXT("ממציא"), 1, [&](const FCivPerson& C) { return HasKind(C, ECivLife::Invented); });
			Pick(TEXT("מורד"), 1, [&](const FCivPerson& C) { return HasKind(C, ECivLife::Rebel); });
			const FString StoryPath = OutDir / TEXT("life-stories.txt");
			FFileHelper::SaveStringToFile(Stories, *StoryPath, FFileHelper::EEncodingOptions::ForceUTF8WithoutBOM);
			Check(Written >= 15, FString::Printf(TEXT("life stories written (%d)"), Written));

			// God and the player's focus.
			int32 Target = 0;
			for (int32 I = 0; I < World.GetPeoples().Num(); ++I) { if (World.GetPeoples()[I].bAlive) { Target = I; break; } }
			const int32 Promoted = World.PromoteFromCrowd(Target);
			Check(Promoted != INDEX_NONE && !World.BuildLifeStory(Promoted).IsEmpty(), TEXT("anyone can be promoted from the crowd with a written past"));
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
			const FSample Samples[] = { { 100.0, TEXT("history-sample.txt"), 4000 }, { 200.0, TEXT("history-sample-iq200.txt"), 6000 } };
			for (const FSample& Sample : Samples)
			{
				FCivSimulation Sim(MakeSettings(7, Sample.IQ, Tuning));
				RunUntil(Sim, Sample.Years, ECivMilestone::OtherStar);
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
			}
		}
	}

	Say(TEXT(""));
	Say(FString::Printf(TEXT("RESULT: %s (%d failures)"), Failures == 0 ? TEXT("ALL PASSED") : TEXT("FAILED"), Failures));
	FFileHelper::SaveStringArrayToFile(Report, *(OutDir / TEXT("test-report.txt")), FFileHelper::EEncodingOptions::ForceUTF8WithoutBOM);
	return Failures == 0 ? 0 : 1;
}
