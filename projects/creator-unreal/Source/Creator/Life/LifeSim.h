// Animal simulation for the nature view. Plain C++ (Core only), deterministic per seed.
// Port of the browser prototype (js/sim.js + js/brain.js): each creature has body genes and a tiny
// neural network (18 inputs -> 10 hidden -> 8 outputs), spends energy to live and move, eats plants
// or meat, attacks, reproduces with mutation, ages and dies. Species are clusters of similar genes.
//
// Differences from the prototype, all deliberate:
// - The world is a flat local area measured in metres (the prototype ran on a whole unit sphere).
// - Founders start with an instinct brain (graze, flee hunters, chase prey) instead of random weights,
//   so grazers and hunters behave like animals from the first second. Mutation then evolves it.
// - Input 8 is "the other one's diet compared to mine" (a threat / prey signal) instead of relative
//   size, and the sensed creature is the nearest predator or prey if one is in range, otherwise the
//   nearest creature. Without this a grazer in a herd only ever sees its neighbour.
// - Nests and random weather events are not ported yet.
#pragma once

#include "CoreMinimal.h"
#include "Math/RandomStream.h"

namespace LifeBrain
{
	constexpr int32 NI = 18;
	constexpr int32 NH = 10;
	constexpr int32 NO = 8;
	constexpr int32 NW = NI * NH + (NH + 1) * NO;
}

/** Visual body plan genes. Drift slowly so a species keeps its look over generations. */
struct FLifeBody
{
	float Len = 1.f;     // Torso length.
	float Wid = 1.f;     // Girth.
	float Hgt = 1.f;     // Leg length.
	float Neck = 0.4f;   // Neck length.
	float Head = 1.f;    // Head size.
	float Snout = 1.f;   // Snout length.
	float Tail = 0.4f;   // Tail length.
	float Horn = 0.f;    // Antlers / tusks size.
	float HornType = 0.5f; // < 0.4 tusks, otherwise antlers.
	float Ears = 0.5f;
	float Hue2 = 0.5f;   // Coat darkness.
	float Pat = 0.5f;    // Belly contrast.

	static constexpr int32 Num = 12;
	float& operator[](int32 I) { return (&Len)[I]; }
	float operator[](int32 I) const { return (&Len)[I]; }
};

struct FLifeGenes
{
	float Size = 1.f;
	float Speed = 1.f;
	float Sense = 1.f;
	float Diet = 0.f;   // 0 plants only, 1 meat only.
	float Hue = 0.f;    // Coat colour along a natural palette.
	float Life = 1.f;
	FLifeBody Body;
	TArray<float> W;    // Brain weights, LifeBrain::NW.
};

enum class ELifeActivity : uint8
{
	Resting, Walking, Grazing, Fleeing, Chasing, Running
};

struct FCreature
{
	int32 Id = 0;
	FVector2f Pos = FVector2f::ZeroVector;
	FVector2f PrevPos = FVector2f::ZeroVector;
	FVector2f Dir = FVector2f(1.f, 0.f);
	FLifeGenes Genes;
	int32 Gen = 0;
	float Energy = 60.f;
	int32 Age = 0;
	int32 Lifespan = 6000;
	int32 Maturity = 660;
	float Mem0 = 0.f, Mem1 = 0.f;
	int32 Cooldown = 0;
	int32 Kids = 0;
	int32 Eaten = 0;
	int32 SpeciesId = 0;
	bool bAlive = true;
	float Hid[LifeBrain::NH] = {};
	float Out[LifeBrain::NO] = {};
	float Spd = 0.f;          // 0..1 chosen speed this tick.
	int32 EatTicks = 0;       // > 0 just after eating (head down).
	int32 AttackTicks = 0;    // > 0 just after a lunge.
	ELifeActivity Activity = ELifeActivity::Resting;
};

struct FLifeFood
{
	FVector2f Pos = FVector2f::ZeroVector;
	float Energy = 0.f;
	uint8 Type = 0;  // 0 plant, 1 meat.
	bool bAlive = false;
};

struct FLifeSpecies
{
	int32 Id = 0;
	FString Name;
	int32 Count = 0;
	float MeanDiet = 0.f;
	FLifeGenes Rep;
};

struct FLifeStats
{
	int32 Births = 0, Deaths = 0, Kills = 0, Starved = 0, OldAge = 0, MaxGen = 0, Rescues = 0;
};

class FLifeSim
{
public:
	/** Fertility of the ground at a local position in metres: < 0 is water or out of bounds, 0..1 land. */
	using FFertilityFn = TFunction<float(float X, float Y)>;

	static constexpr float TickSeconds = 0.1f;
	static constexpr int32 YearTicks = 600; // One in-world year = 1 minute at normal speed.
	static constexpr int32 MaxFood = 5000;

	FLifeSim(int32 Seed, float InHalfSize, FFertilityFn InFertility);

	/** Plants meadows and places the founder herds and packs. */
	void Populate();
	void Step();

	const TArray<FCreature>& GetCreatures() const { return Creatures; }
	const TArray<FLifeFood>& GetFood() const { return Food; }
	const TArray<FLifeSpecies>& GetSpecies() const { return Species; }
	const FLifeSpecies* FindSpecies(int32 Id) const;
	const FLifeStats& GetStats() const { return Stats; }
	int32 GetTick() const { return TickCount; }
	int32 GetPlantCount() const { return PlantCount; }
	float GetHalfSize() const { return HalfSize; }
	int32 GetSeason() const { return (TickCount % YearTicks) * 4 / YearTicks; }

	/** Food slots that appeared or vanished since the last call. */
	void ConsumeFoodChanges(TArray<int32>& Out) { Out = MoveTemp(FoodChanged); FoodChanged.Reset(); }

	/** Short name like "Kotari" for a creature id. */
	static FString MakeName(uint32 Key);
	/** Plain description of the body, e.g. "antlered grazer". */
	static FString Describe(const FLifeGenes& G);

private:
	FLifeGenes RandomGenes();
	FLifeGenes MutateGenes(const FLifeGenes& G);
	FLifeGenes CrossGenes(const FLifeGenes& A, const FLifeGenes& B);
	FCreature& AddCreature(FVector2f P, FLifeGenes Genes, int32 Gen, float Energy);
	int32 AddFood(FVector2f P, float E, uint8 Type);
	void RemoveFood(int32 I);
	void SpawnPlant(const FVector2f* Near, float Spread, bool bForce);
	bool IsLand(FVector2f P) const { return Fertility(P.X, P.Y) >= 0.f; }
	bool JitterLand(FVector2f P, float R, FVector2f& Out);
	int32 NearestFood(const FCreature& C, float Range) const;
	int32 SalientCreature(int32 Self, float Range) const;
	float Similarity(const FLifeGenes& A, const FLifeGenes& B) const;
	void Kill(int32 Index, int32 Cause);
	void UpdateSpecies();
	void Rescue();
	float Gaussian();
	float R() { return Rng.GetFraction(); }

	int32 CellOf(FVector2f P) const;

	FRandomStream Rng;
	float HalfSize;
	FFertilityFn Fertility;

	TArray<FCreature> Creatures;
	TArray<FLifeFood> Food;
	TArray<int32> FreeFood;
	TArray<int32> FoodChanged;
	int32 PlantCount = 0;
	int32 FoodCount = 0;

	// Spatial hash.
	float CellSize = 32.f;
	int32 GridN = 1;
	TArray<TArray<int32>> FoodCells;
	TArray<int32> CreatureHead;
	TArray<int32> CreatureNext;

	TArray<TPair<int32, FVector2f>> Regrow; // Eaten plants sprout again where they stood.

	TArray<FLifeSpecies> Species;
	TArray<TPair<float, FLifeGenes>> Bank; // Genomes of successful parents, for the safety net.
	int32 NextId = 1;
	int32 NextSpecies = 1;
	int32 TickCount = 0;
	int32 LastRescue = -100000;
	FLifeStats Stats;
};
