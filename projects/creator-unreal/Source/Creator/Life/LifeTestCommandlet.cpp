#include "LifeTestCommandlet.h"

#include "LifeSim.h"
#include "Misc/Parse.h"

DEFINE_LOG_CATEGORY_STATIC(LogLifeTest, Log, All);

int32 ULifeTestCommandlet::Main(const FString& Params)
{
	int32 Ticks = 30000, Seed = 1;
	FParse::Value(*Params, TEXT("Ticks="), Ticks);
	FParse::Value(*Params, TEXT("Seed="), Seed);
	const float Half = 400.f;
	// A meadowy area with a pond, like a typical nature view.
	FLifeSim Sim(Seed, Half, [Half](float X, float Y)
	{
		if (FMath::Abs(X) > Half || FMath::Abs(Y) > Half) return -1.f;
		if (FMath::Square(X - 150.f) + FMath::Square(Y + 100.f) < 60.f * 60.f) return -1.f;
		return 0.35f + 0.4f * (0.5f + 0.5f * FMath::Sin(X * 0.02f) * FMath::Cos(Y * 0.017f));
	});
	Sim.Populate();
	for (int32 T = 0; T <= Ticks; ++T)
	{
		if (T % 1000 == 0)
		{
			int32 Grazers = 0, Hunters = 0, Babies = 0;
			int32 Act[6] = {};
			for (const FCreature& C : Sim.GetCreatures())
			{
				(C.Genes.Diet > 0.6f ? Hunters : Grazers)++;
				Babies += C.Age < C.Maturity ? 1 : 0;
				Act[(int32)C.Activity]++;
			}
			const FLifeStats& S = Sim.GetStats();
			FString Sp;
			for (const FLifeSpecies& X : Sim.GetSpecies())
			{
				Sp += FString::Printf(TEXT("%s(%d,%.2f) "), *X.Name, X.Count, X.MeanDiet);
			}
			UE_LOG(LogLifeTest, Display, TEXT("t=%d grazers=%d hunters=%d babies=%d plants=%d births=%d kills=%d starved=%d old=%d gen=%d rescues=%d | rest %d walk %d graze %d flee %d chase %d run %d | %s"),
				T, Grazers, Hunters, Babies, Sim.GetPlantCount(), S.Births, S.Kills, S.Starved, S.OldAge, S.MaxGen, S.Rescues,
				Act[0], Act[1], Act[2], Act[3], Act[4], Act[5], *Sp);
		}
		Sim.Step();
	}
	return 0;
}
