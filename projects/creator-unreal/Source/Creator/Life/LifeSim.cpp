#include "LifeSim.h"

using namespace LifeBrain;

namespace
{
	// Distances in metres, one tick = 0.1 s.
	constexpr float TopSpeed = 1.1f;      // Metres per tick at full speed and speed gene 1 (11 m/s).
	constexpr float MaxTurn = 0.22f;
	constexpr float PlantE = 30.f;
	constexpr float BaseCost = 0.015f, MoveCost = 0.03f, SenseCost = 0.006f, BrainCost = 0.0015f;
	constexpr int32 Maturity = 660, Lifespan = 6000;
	constexpr int32 MinPop = 25, SoftPop = 110, MaxPop = 150;
	constexpr int32 RegrowT = 1200;
	constexpr float RegrowP = 0.6f;
	constexpr float PlantRate = 2.5f;     // New plants per tick before the season factor.
	constexpr int32 MaxPlants = 3600;
	constexpr int32 InitialPlants = 2600;
	const float SeasonGrow[4] = { 1.3f, 1.05f, 0.9f, 0.75f };

	struct FLim { float Lo, Hi; };
	const FLim BodyLim[FLifeBody::Num] = {
		{ 0.6f, 1.8f }, { 0.5f, 1.9f }, { 0.5f, 1.6f }, { 0.f, 1.f }, { 0.6f, 1.6f }, { 0.4f, 1.8f },
		{ 0.f, 1.f }, { 0.f, 1.2f }, { 0.f, 1.f }, { 0.f, 1.f }, { 0.f, 1.f }, { 0.f, 1.f } };

	float Think(const TArray<float>& W, const float* In, float* Hid, float* Out)
	{
		float Act = 0.f;
		int32 K = 0;
		for (int32 H = 0; H < NH; ++H)
		{
			float S = 0.f;
			for (int32 I = 0; I < NI; ++I)
			{
				S += W[K++] * In[I];
			}
			Hid[H] = FMath::Tanh(S);
			Act += FMath::Abs(Hid[H]);
		}
		for (int32 O = 0; O < NO; ++O)
		{
			float S = 0.f;
			for (int32 H = 0; H < NH; ++H)
			{
				S += W[K++] * Hid[H];
			}
			S += W[K++];
			Out[O] = FMath::Tanh(S);
		}
		return Act;
	}

	/** Inputs: 0 food right, 1 food ahead, 2 food near, 3 food is meat, 4 creature right, 5 creature ahead,
	 *  6 creature near, 7 similar to me, 8 its diet vs mine (threat > 0, prey < 0), 9 energy, 10 water ahead,
	 *  11 age, 12-13 memory, 14-16 nest (unused), 17 constant. */
	TArray<float> InstinctWeights(bool bHunter)
	{
		TArray<float> W;
		W.SetNumZeroed(NW);
		auto Hw = [&W](int32 H, int32 I, float V) { W[H * NI + I] = V; };
		auto Ow = [&W](int32 O, int32 H, float V) { W[NI * NH + O * (NH + 1) + H] = V; };
		auto Ob = [&W](int32 O, float V) { W[NI * NH + O * (NH + 1) + NH] = V; };

		Hw(0, 0, 3.f);                                              // h0: food to the right.
		Hw(1, 2, 3.f);                                              // h1: food close.
		Hw(2, 4, 3.f);  Hw(2, 8, 5.f);  Hw(2, 17, -5.f);            // h2/h3: threat right/left (gated).
		Hw(3, 4, -3.f); Hw(3, 8, 5.f);  Hw(3, 17, -5.f);
		Hw(4, 4, 3.f);  Hw(4, 8, -5.f); Hw(4, 17, -5.f);            // h4/h5: prey right/left (gated).
		Hw(5, 4, -3.f); Hw(5, 8, -5.f); Hw(5, 17, -5.f);
		Hw(6, 8, 5.f);  Hw(6, 6, 3.f);  Hw(6, 17, -5.5f);           // h6: threat in range -> run.
		Hw(7, 8, -5.f); Hw(7, 6, 3.f);  Hw(7, 17, -5.5f);           // h7: prey in range -> chase.
		Hw(8, 8, -5.f); Hw(8, 6, 10.f); Hw(8, 17, -14.f);           // h8: prey within a lunge.
		Hw(9, 9, 4.f);  Hw(9, 17, -2.6f);                           // h9: well fed.

		// Turn: toward food, away from threats, toward prey.
		Ow(0, 0, bHunter ? 0.4f : 1.5f);
		Ow(0, 2, -2.f); Ow(0, 3, 2.f);
		Ow(0, 4, 2.f);  Ow(0, 5, -2.f);
		// Speed: slow while grazing, a gallop when a threat or prey is in range.
		if (bHunter)
		{
			Ow(1, 1, -0.5f); Ow(1, 7, 2.2f); Ob(1, 1.1f);
		}
		else
		{
			Ow(1, 1, -0.75f); Ow(1, 6, 2.2f); Ob(1, 1.2f);
		}
		Ow(2, 9, -2.5f); Ob(2, 1.f);     // Eat what is in reach unless full.
		Ow(3, 8, 3.f);                   // Attack prey within a lunge.
		Ow(4, 9, 2.5f);                  // Breed when well fed.
		Ob(7, -2.f);                     // No nests yet.
		return W;
	}

	FLifeGenes Founder(int32 Kind)
	{
		FLifeGenes G;
		FLifeBody& B = G.Body;
		if (Kind == 0) // Deer-like grazer.
		{
			G.Size = 1.0f; G.Speed = 1.08f; G.Sense = 1.1f; G.Diet = 0.03f; G.Hue = 0.18f; G.Life = 1.0f;
			B.Len = 1.15f; B.Wid = 0.85f; B.Hgt = 1.35f; B.Neck = 0.75f; B.Head = 0.85f; B.Snout = 0.9f;
			B.Tail = 0.12f; B.Horn = 0.8f; B.HornType = 0.7f; B.Ears = 0.75f; B.Hue2 = 0.45f; B.Pat = 0.75f;
		}
		else if (Kind == 1) // Stocky boar-like rooter.
		{
			G.Size = 0.95f; G.Speed = 0.95f; G.Sense = 0.9f; G.Diet = 0.22f; G.Hue = 0.78f; G.Life = 1.1f;
			B.Len = 1.05f; B.Wid = 1.55f; B.Hgt = 0.62f; B.Neck = 0.05f; B.Head = 1.35f; B.Snout = 1.45f;
			B.Tail = 0.25f; B.Horn = 0.4f; B.HornType = 0.1f; B.Ears = 0.45f; B.Hue2 = 0.6f; B.Pat = 0.15f;
		}
		else // Slender wolf-like hunter.
		{
			G.Size = 0.85f; G.Speed = 1.35f; G.Sense = 1.35f; G.Diet = 0.92f; G.Hue = 0.6f; G.Life = 1.05f;
			B.Len = 1.15f; B.Wid = 0.8f; B.Hgt = 1.25f; B.Neck = 0.35f; B.Head = 1.0f; B.Snout = 1.3f;
			B.Tail = 0.85f; B.Horn = 0.f; B.HornType = 0.5f; B.Ears = 0.8f; B.Hue2 = 0.4f; B.Pat = 0.6f;
		}
		G.W = InstinctWeights(Kind == 2);
		return G;
	}
}

FLifeSim::FLifeSim(int32 Seed, float InHalfSize, FFertilityFn InFertility)
	: Rng(Seed * 31 + 7), HalfSize(InHalfSize), Fertility(MoveTemp(InFertility))
{
	GridN = FMath::Max(1, FMath::CeilToInt(2.f * HalfSize / CellSize));
	FoodCells.SetNum(GridN * GridN);
	CreatureHead.Init(-1, GridN * GridN);
	Food.SetNum(MaxFood);
	for (int32 I = MaxFood - 1; I >= 0; --I)
	{
		FreeFood.Add(I);
	}
}

int32 FLifeSim::CellOf(FVector2f P) const
{
	const int32 X = FMath::Clamp((int32)((P.X + HalfSize) / CellSize), 0, GridN - 1);
	const int32 Y = FMath::Clamp((int32)((P.Y + HalfSize) / CellSize), 0, GridN - 1);
	return X + Y * GridN;
}

float FLifeSim::Gaussian()
{
	const float U = FMath::Max(R(), 1e-7f), V = R();
	return FMath::Sqrt(-2.f * FMath::Loge(U)) * FMath::Cos(2.f * PI * V);
}

FString FLifeSim::MakeName(uint32 Key)
{
	static const TCHAR* Cons[] = { TEXT("k"), TEXT("t"), TEXT("r"), TEXT("m"), TEXT("n"), TEXT("s"), TEXT("v"), TEXT("l"), TEXT("d"), TEXT("b"), TEXT("sh"), TEXT("z") };
	static const TCHAR* Vow[] = { TEXT("a"), TEXT("e"), TEXT("i"), TEXT("o"), TEXT("u"), TEXT("ai") };
	uint32 H = Key * 2654435761u + 12345u;
	auto Next = [&H]() { H ^= H >> 13; H *= 0x5bd1e995u; H ^= H >> 15; return H; };
	const int32 Syl = 2 + (int32)(Next() % 2);
	FString S;
	for (int32 I = 0; I < Syl; ++I)
	{
		S += Cons[Next() % UE_ARRAY_COUNT(Cons)];
		S += Vow[Next() % UE_ARRAY_COUNT(Vow)];
	}
	S[0] = FChar::ToUpper(S[0]);
	return S;
}

FString FLifeSim::Describe(const FLifeGenes& G)
{
	const FLifeBody& B = G.Body;
	FString Shape;
	if (B.Wid > 1.3f && B.Hgt < 0.85f) Shape = TEXT("stocky");
	else if (B.Hgt > 1.2f) Shape = TEXT("long-legged");
	else if (B.Len > 1.15f) Shape = TEXT("slender");
	else Shape = TEXT("medium");
	FString Extra;
	if (B.Horn > 0.45f && B.HornType >= 0.4f) Extra = TEXT(" antlered");
	else if (B.Horn > 0.2f && B.HornType < 0.4f) Extra = TEXT(" tusked");
	const TCHAR* Role = G.Diet > 0.6f ? TEXT("hunter") : G.Diet > 0.15f ? TEXT("forager") : TEXT("grazer");
	return Shape + Extra + TEXT(" ") + Role;
}

FLifeGenes FLifeSim::RandomGenes()
{
	FLifeGenes G = Founder((int32)(R() * 3.f) % 3);
	return MutateGenes(G);
}

FLifeGenes FLifeSim::MutateGenes(const FLifeGenes& G)
{
	auto M = [this](float V, float S, float Lo, float Hi) { return FMath::Clamp(V + (R() < 0.3f ? Gaussian() * S : 0.f), Lo, Hi); };
	FLifeGenes C;
	for (int32 K = 0; K < FLifeBody::Num; ++K)
	{
		const FLim L = BodyLim[K];
		C.Body[K] = R() < 0.25f ? FMath::Clamp(G.Body[K] + Gaussian() * 0.025f * (L.Hi - L.Lo), L.Lo, L.Hi) : G.Body[K];
	}
	C.Size = M(G.Size, 0.06f, 0.5f, 2.2f);
	C.Speed = M(G.Speed, 0.06f, 0.4f, 2.2f);
	C.Sense = M(G.Sense, 0.06f, 0.4f, 2.2f);
	C.Diet = M(G.Diet, 0.05f, 0.f, 1.f);
	C.Hue = FMath::Fmod(G.Hue + Gaussian() * 0.006f + 1.f, 1.f);
	C.Life = M(G.Life, 0.05f, 0.5f, 2.5f);
	C.W = G.W;
	for (float& V : C.W)
	{
		if (R() < 0.08f) V += Gaussian() * 0.3f;
		if (R() < 0.002f) V = Gaussian(); // Rare big jump.
	}
	return C;
}

FLifeGenes FLifeSim::CrossGenes(const FLifeGenes& A, const FLifeGenes& B)
{
	FLifeGenes C;
	auto Pick = [this](float X, float Y) { return R() < 0.5f ? X : Y; };
	C.Size = Pick(A.Size, B.Size); C.Speed = Pick(A.Speed, B.Speed); C.Sense = Pick(A.Sense, B.Sense);
	C.Diet = Pick(A.Diet, B.Diet); C.Hue = Pick(A.Hue, B.Hue); C.Life = Pick(A.Life, B.Life);
	for (int32 K = 0; K < FLifeBody::Num; ++K)
	{
		C.Body[K] = Pick(A.Body[K], B.Body[K]);
	}
	C.W.SetNumZeroed(NW);
	const int32 Cut = (int32)(R() * NH); // Swap whole hidden neurons.
	for (int32 H = 0; H < NH; ++H)
	{
		const TArray<float>& Src = H < Cut ? A.W : B.W;
		for (int32 I = 0; I < NI; ++I)
		{
			C.W[H * NI + I] = Src[H * NI + I];
		}
	}
	for (int32 K = NI * NH; K < NW; ++K)
	{
		C.W[K] = R() < 0.5f ? A.W[K] : B.W[K];
	}
	return MutateGenes(C);
}

FCreature& FLifeSim::AddCreature(FVector2f P, FLifeGenes Genes, int32 Gen, float Energy)
{
	FCreature& C = Creatures.AddDefaulted_GetRef();
	C.Id = NextId++;
	C.Pos = C.PrevPos = P;
	const float A = R() * 2.f * PI;
	C.Dir = FVector2f(FMath::Cos(A), FMath::Sin(A));
	C.Genes = MoveTemp(Genes);
	C.Gen = Gen;
	C.Energy = Energy > 0.f ? Energy : 60.f * C.Genes.Size;
	C.Lifespan = FMath::RoundToInt(Lifespan * C.Genes.Life * (0.9f + R() * 0.2f));
	C.Maturity = FMath::RoundToInt(Maturity * (0.6f + 0.4f * C.Genes.Life));
	Stats.MaxGen = FMath::Max(Stats.MaxGen, Gen);
	return C;
}

int32 FLifeSim::AddFood(FVector2f P, float E, uint8 Type)
{
	if (FreeFood.Num() == 0)
	{
		return -1;
	}
	const int32 I = FreeFood.Pop(EAllowShrinking::No);
	FLifeFood& F = Food[I];
	F.Pos = P; F.Energy = E; F.Type = Type; F.bAlive = true;
	FoodCells[CellOf(P)].Add(I);
	FoodChanged.Add(I);
	++FoodCount;
	if (Type == 0)
	{
		++PlantCount;
	}
	return I;
}

void FLifeSim::RemoveFood(int32 I)
{
	FLifeFood& F = Food[I];
	if (!F.bAlive)
	{
		return;
	}
	F.bAlive = false;
	FoodCells[CellOf(F.Pos)].RemoveSingleSwap(I, EAllowShrinking::No);
	FreeFood.Add(I);
	FoodChanged.Add(I);
	--FoodCount;
	if (F.Type == 0)
	{
		--PlantCount;
	}
}

void FLifeSim::SpawnPlant(const FVector2f* Near, float Spread, bool bForce)
{
	FVector2f P;
	if (Near)
	{
		P = *Near + FVector2f(R() - 0.5f, R() - 0.5f) * Spread;
	}
	else if (PlantCount > 50 && R() < 0.5f)
	{
		// Seeds fall near an existing plant.
		int32 I = 0, Tries = 0;
		do { I = (int32)(R() * MaxFood) % MaxFood; } while ((!Food[I].bAlive || Food[I].Type != 0) && ++Tries < 20);
		if (!Food[I].bAlive)
		{
			return;
		}
		P = Food[I].Pos + FVector2f(R() - 0.5f, R() - 0.5f) * 14.f;
	}
	else
	{
		P = FVector2f(R() * 2.f - 1.f, R() * 2.f - 1.f) * HalfSize;
	}
	float F = Fertility(P.X, P.Y);
	if (F <= 0.02f)
	{
		return;
	}
	if (!bForce)
	{
		F *= SeasonGrow[GetSeason()];
	}
	if (FoodCells[CellOf(P)].Num() >= (int32)(10.f * FMath::Min(1.6f, F)) + 1)
	{
		return;
	}
	if (bForce || R() < F)
	{
		AddFood(P, PlantE, 0);
	}
}

bool FLifeSim::JitterLand(FVector2f P, float Rad, FVector2f& Out)
{
	for (int32 T = 0; T < 30; ++T)
	{
		const FVector2f Q = P + FVector2f(R() - 0.5f, R() - 0.5f) * Rad;
		if (IsLand(Q))
		{
			Out = Q;
			return true;
		}
	}
	return false;
}

void FLifeSim::Populate()
{
	for (int32 I = 0; I < InitialPlants * 3 && PlantCount < InitialPlants; ++I)
	{
		SpawnPlant(nullptr, 0.f, false);
	}

	// Founder groups: two deer herds, a sounder of boars, two wolf packs further out.
	struct FGroup { int32 Kind; int32 Count; float Dist; };
	const FGroup Groups[] = { { 0, 22, 40.f }, { 0, 18, 170.f }, { 1, 16, 130.f }, { 2, 4, 260.f }, { 2, 4, 300.f } };
	for (const FGroup& G : Groups)
	{
		FVector2f Center = FVector2f::ZeroVector;
		for (int32 T = 0; T < 60; ++T)
		{
			const float A = R() * 2.f * PI;
			const FVector2f C = FVector2f(FMath::Cos(A), FMath::Sin(A)) * G.Dist * (0.8f + 0.4f * R());
			if (Fertility(C.X, C.Y) > 0.15f)
			{
				Center = C;
				break;
			}
		}
		for (int32 I = 0; I < 40; ++I)
		{
			SpawnPlant(&Center, 70.f, true); // A meadow to start in.
		}
		const FLifeGenes Base = Founder(G.Kind);
		for (int32 I = 0; I < G.Count; ++I)
		{
			FVector2f P;
			if (JitterLand(Center, G.Kind == 2 ? 14.f : 36.f, P))
			{
				FLifeGenes Genes = I == 0 ? Base : MutateGenes(Base);
				for (float& V : Genes.W)
				{
					V += Gaussian() * 0.12f; // Individual temperament.
				}
				FCreature& C = AddCreature(P, MoveTemp(Genes), 0, 0.f);
				// Mixed ages so a herd has young and old from the start.
				C.Age = (int32)(R() * C.Lifespan * 0.6f);
				C.Energy = (55.f + R() * 30.f) * C.Genes.Size;
			}
		}
	}
	UpdateSpecies();
}

int32 FLifeSim::NearestFood(const FCreature& C, float Range) const
{
	int32 Best = -1;
	float Bd = Range * Range;
	const int32 Rc = FMath::CeilToInt(Range / CellSize);
	const int32 Cx = FMath::Clamp((int32)((C.Pos.X + HalfSize) / CellSize), 0, GridN - 1);
	const int32 Cy = FMath::Clamp((int32)((C.Pos.Y + HalfSize) / CellSize), 0, GridN - 1);
	for (int32 Y = FMath::Max(0, Cy - Rc); Y <= FMath::Min(GridN - 1, Cy + Rc); ++Y)
	{
		for (int32 X = FMath::Max(0, Cx - Rc); X <= FMath::Min(GridN - 1, Cx + Rc); ++X)
		{
			for (int32 I : FoodCells[X + Y * GridN])
			{
				const float D = (Food[I].Pos - C.Pos).SizeSquared();
				if (D < Bd)
				{
					Bd = D;
					Best = I;
				}
			}
		}
	}
	return Best;
}

int32 FLifeSim::SalientCreature(int32 Self, float Range) const
{
	const FCreature& C = Creatures[Self];
	int32 Nearest = -1, Salient = -1;
	float Bn = Range * Range, Bs = Range * Range;
	const int32 Rc = FMath::CeilToInt(Range / CellSize);
	const int32 Cx = FMath::Clamp((int32)((C.Pos.X + HalfSize) / CellSize), 0, GridN - 1);
	const int32 Cy = FMath::Clamp((int32)((C.Pos.Y + HalfSize) / CellSize), 0, GridN - 1);
	for (int32 Y = FMath::Max(0, Cy - Rc); Y <= FMath::Min(GridN - 1, Cy + Rc); ++Y)
	{
		for (int32 X = FMath::Max(0, Cx - Rc); X <= FMath::Min(GridN - 1, Cx + Rc); ++X)
		{
			for (int32 J = CreatureHead[X + Y * GridN]; J >= 0; J = CreatureNext[J])
			{
				const FCreature& O = Creatures[J];
				if (J == Self || !O.bAlive)
				{
					continue;
				}
				const float D = (O.Pos - C.Pos).SizeSquared();
				if (D < Bn)
				{
					Bn = D;
					Nearest = J;
				}
				if (D < Bs && FMath::Abs(O.Genes.Diet - C.Genes.Diet) > 0.4f)
				{
					Bs = D;
					Salient = J;
				}
			}
		}
	}
	return Salient >= 0 ? Salient : Nearest;
}

float FLifeSim::Similarity(const FLifeGenes& A, const FLifeGenes& B) const
{
	float D = FMath::Square(A.Size - B.Size) + FMath::Square(A.Speed - B.Speed) + FMath::Square(A.Sense - B.Sense)
		+ 2.f * FMath::Square(A.Diet - B.Diet) + 0.5f * FMath::Square(A.Life - B.Life);
	float Dh = FMath::Abs(A.Hue - B.Hue);
	Dh = FMath::Min(Dh, 1.f - Dh);
	D += 4.f * Dh * Dh;
	const FLifeBody& Ba = A.Body;
	const FLifeBody& Bb = B.Body;
	D += 0.6f * (FMath::Square(Ba.Len - Bb.Len) + FMath::Square(Ba.Wid - Bb.Wid) + FMath::Square(Ba.Hgt - Bb.Hgt)
		+ FMath::Square(Ba.Neck - Bb.Neck) + FMath::Square(Ba.Horn - Bb.Horn) + FMath::Square(Ba.Tail - Bb.Tail));
	float Bw = 0.f;
	for (int32 I = 0; I < NW; I += 3)
	{
		Bw += FMath::Square(A.W[I] - B.W[I]);
	}
	// The instinct weights are larger than the prototype's random ones, so brain distance counts less.
	D += Bw / (NW / 3) * 0.1f;
	return FMath::Exp(-D * 3.f);
}

void FLifeSim::Step()
{
	++TickCount;
	const int32 Season = GetSeason();

	// Plants grow by themselves, more in spring and less in winter.
	if (PlantCount < MaxPlants)
	{
		float Pr = PlantRate * SeasonGrow[Season];
		while (Pr > 0.f)
		{
			if (Pr >= 1.f || R() < Pr)
			{
				SpawnPlant(nullptr, 0.f, false);
			}
			Pr -= 1.f;
		}
	}
	// Eaten plants regrow where they stood (roots survive), so meadows recover.
	while (Regrow.Num() && Regrow[0].Key <= TickCount)
	{
		const FVector2f P = Regrow[0].Value;
		Regrow.RemoveAt(0, 1, EAllowShrinking::No);
		if (FoodCount < MaxFood - 300)
		{
			SpawnPlant(&P, 3.f, false);
		}
	}
	// Meat rots.
	if (TickCount % 20 == 0)
	{
		for (int32 K = 0; K < 30; ++K)
		{
			const int32 I = (int32)(R() * MaxFood) % MaxFood;
			if (Food[I].bAlive && Food[I].Type != 0 && R() < 0.08f)
			{
				RemoveFood(I);
			}
		}
	}

	// Rebuild the creature hash.
	for (int32& H : CreatureHead)
	{
		H = -1;
	}
	CreatureNext.SetNum(Creatures.Num());
	for (int32 I = 0; I < Creatures.Num(); ++I)
	{
		const int32 K = CellOf(Creatures[I].Pos);
		CreatureNext[I] = CreatureHead[K];
		CreatureHead[K] = I;
	}

	struct FBirth { FVector2f P; FLifeGenes Genes; int32 Gen; float Energy; int32 Species; };
	TArray<FBirth> Born;
	float Inp[NI];
	const int32 Cn = Creatures.Num();
	for (int32 Ci = 0; Ci < Cn; ++Ci)
	{
		FCreature& C = Creatures[Ci];
		if (!C.bAlive)
		{
			continue;
		}
		const FLifeGenes& G = C.Genes;
		C.PrevPos = C.Pos;
		const float Range = 20.f + 20.f * G.Sense;
		const FVector2f Right(-C.Dir.Y, C.Dir.X);

		// Senses.
		const int32 Fi = NearestFood(C, Range);
		if (Fi >= 0)
		{
			const FVector2f D = Food[Fi].Pos - C.Pos;
			const float L = FMath::Max(D.Size(), 1e-4f);
			Inp[0] = FVector2f::DotProduct(D, Right) / L;
			Inp[1] = FVector2f::DotProduct(D, C.Dir) / L;
			Inp[2] = 1.f - L / Range;
			Inp[3] = Food[Fi].Type == 1 ? 1.f : -1.f;
		}
		else
		{
			Inp[0] = Inp[1] = Inp[2] = Inp[3] = 0.f;
		}
		const int32 Oi = SalientCreature(Ci, Range);
		float Sim = 0.f;
		float OtherDist = 1e9f;
		if (Oi >= 0)
		{
			const FCreature& O = Creatures[Oi];
			const FVector2f D = O.Pos - C.Pos;
			const float L = FMath::Max(D.Size(), 1e-4f);
			OtherDist = L;
			Sim = Similarity(G, O.Genes);
			Inp[4] = FVector2f::DotProduct(D, Right) / L;
			Inp[5] = FVector2f::DotProduct(D, C.Dir) / L;
			Inp[6] = 1.f - L / Range;
			Inp[7] = Sim * 2.f - 1.f;
			Inp[8] = FMath::Clamp((O.Genes.Diet - G.Diet) * 2.5f, -1.f, 1.f);
		}
		else
		{
			Inp[4] = Inp[5] = Inp[6] = Inp[7] = Inp[8] = 0.f;
		}
		const float MaxE = 100.f * G.Size;
		Inp[9] = C.Energy / MaxE;
		Inp[10] = IsLand(C.Pos + C.Dir * 6.f) ? -1.f : 1.f;
		Inp[11] = (float)C.Age / C.Lifespan;
		Inp[12] = C.Mem0;
		Inp[13] = C.Mem1;
		Inp[14] = Inp[15] = Inp[16] = 0.f;
		Inp[17] = 1.f;

		// Think.
		const float Act = Think(G.W, Inp, C.Hid, C.Out);
		C.Mem0 = C.Out[5];
		C.Mem1 = C.Out[6];

		// Turn and move.
		const float Turn = C.Out[0] * MaxTurn;
		const float Cs = FMath::Cos(Turn), Sn = FMath::Sin(Turn);
		FVector2f H = C.Dir * Cs + Right * Sn;
		const float Spd = (C.Out[1] + 1.f) * 0.5f;
		C.Spd = Spd;
		const float StepLen = Spd * TopSpeed * G.Speed;
		const FVector2f Np = C.Pos + H * StepLen;
		if (IsLand(Np))
		{
			C.Pos = Np;
		}
		else
		{
			// Water or the edge of the land: swing round instead of standing stuck.
			const float A = (R() < 0.5f ? 1.f : -1.f) * (0.6f + R() * 0.8f);
			H = FVector2f(H.X * FMath::Cos(A) - H.Y * FMath::Sin(A), H.X * FMath::Sin(A) + H.Y * FMath::Cos(A));
		}
		C.Dir = H.GetSafeNormal();

		// Energy costs (longer-lived bodies burn a bit more).
		const float Base = BaseCost * FMath::Pow(G.Size, 0.8f) * (0.8f + 0.2f * G.Life);
		C.Energy -= Base + MoveCost * Spd * Spd * G.Speed * G.Speed * G.Size + SenseCost * G.Sense + BrainCost * Act;
		if (C.Cooldown > 0) --C.Cooldown;
		if (C.EatTicks > 0) --C.EatTicks;
		if (C.AttackTicks > 0) --C.AttackTicks;
		const float Reach = 1.6f + G.Size * 0.8f;

		// Eat.
		if (C.Out[2] > -0.3f && Fi >= 0 && Food[Fi].bAlive && (Food[Fi].Pos - C.Pos).SizeSquared() < Reach * Reach)
		{
			const float Eff = Food[Fi].Type == 1 ? 0.2f + 0.8f * G.Diet : 1.f - 0.8f * G.Diet;
			C.Energy = FMath::Min(MaxE, C.Energy + Food[Fi].Energy * Eff);
			++C.Eaten;
			C.EatTicks = 25;
			if (Food[Fi].Type == 0 && Regrow.Num() < 6000 && R() < RegrowP)
			{
				Regrow.Add(TPair<int32, FVector2f>(TickCount + RegrowT + (int32)(R() * RegrowT), Food[Fi].Pos));
			}
			RemoveFood(Fi);
		}

		// Attack.
		if (C.Out[3] > 0.f && Oi >= 0 && Creatures[Oi].bAlive && C.Cooldown == 0)
		{
			FCreature& O = Creatures[Oi];
			C.Energy -= 0.6f * G.Size;
			C.Cooldown = 30;
			C.AttackTicks = 6;
			if (OtherDist < Reach + 0.6f && R() < G.Size / (G.Size + O.Genes.Size) * (0.04f + 0.7f * G.Diet * G.Diet))
			{
				const float Gain = (FMath::Max(0.f, O.Energy) * 0.5f + 30.f * O.Genes.Size) * (0.1f + 0.9f * G.Diet);
				C.Energy = FMath::Min(MaxE, C.Energy + Gain);
				++C.Eaten;
				C.EatTicks = 40;
				Kill(Oi, 0);
				++Stats.Kills;
			}
		}

		// Reproduce.
		const int32 Pop = Cn + Born.Num();
		if (C.Out[4] > 0.f && C.Age > C.Maturity && C.Cooldown == 0 && C.Energy > 0.55f * MaxE
			&& (Pop < SoftPop || R() < (float)(MaxPop - Pop) / (MaxPop - SoftPop)))
		{
			FLifeGenes Genes;
			if (Oi >= 0 && Creatures[Oi].bAlive && Sim > 0.4f && Creatures[Oi].Out[4] > 0.f && OtherDist < Reach * 2.f + 4.f)
			{
				Genes = CrossGenes(G, Creatures[Oi].Genes);
			}
			else
			{
				Genes = MutateGenes(G);
			}
			const float ChildE = 0.35f * MaxE;
			C.Energy -= ChildE + 5.f;
			C.Cooldown = 300;
			++C.Kids;
			FVector2f P = C.Pos;
			JitterLand(C.Pos, 3.f, P);
			Born.Add({ P, MoveTemp(Genes), C.Gen + 1, ChildE, C.SpeciesId });
		}

		// What it looks like it is doing, for the camera and the info panel.
		const bool bThreat = Oi >= 0 && Inp[8] > 0.5f;
		const bool bPrey = Oi >= 0 && Inp[8] < -0.5f;
		if (bThreat && Spd > 0.5f) C.Activity = ELifeActivity::Fleeing;
		else if (bPrey && Spd > 0.5f) C.Activity = ELifeActivity::Chasing;
		else if (C.EatTicks > 0 || (Fi >= 0 && Inp[2] > 0.6f && Spd < 0.25f)) C.Activity = ELifeActivity::Grazing;
		else if (Spd > 0.55f) C.Activity = ELifeActivity::Running;
		else if (Spd > 0.04f) C.Activity = ELifeActivity::Walking;
		else C.Activity = ELifeActivity::Resting;

		++C.Age;
		if (C.Energy <= 0.f) Kill(Ci, 1);
		else if (C.Age > C.Lifespan) Kill(Ci, 2);
	}

	Creatures.RemoveAll([](const FCreature& C) { return !C.bAlive; });
	for (FBirth& B : Born)
	{
		FCreature& C = AddCreature(B.P, MoveTemp(B.Genes), B.Gen, B.Energy);
		C.SpeciesId = B.Species;
		++Stats.Births;
	}

	if (TickCount % 200 == 0)
	{
		UpdateSpecies();
	}
	if (Creatures.Num() < MinPop && TickCount - LastRescue > 150)
	{
		Rescue();
	}
	// Immigration: when hunters or grazers die out locally, a few wander in from beyond the area.
	if (TickCount % 1200 == 0)
	{
		int32 Hunters = 0, Grazers = 0;
		for (const FCreature& C : Creatures)
		{
			(C.Genes.Diet > 0.6f ? Hunters : Grazers)++;
		}
		auto Arrive = [this](int32 Kind, int32 N)
		{
			const float A = R() * 2.f * PI;
			const FVector2f Edge = FVector2f(FMath::Cos(A), FMath::Sin(A)) * HalfSize * 0.85f;
			const FLifeGenes Base = Founder(Kind);
			for (int32 I = 0; I < N; ++I)
			{
				FVector2f P;
				if (JitterLand(Edge, 20.f, P))
				{
					AddCreature(P, MutateGenes(Base), 0, 0.f);
				}
			}
			UpdateSpecies();
		};
		if (Hunters < 2) Arrive(2, 3);
		if (Grazers < 12) Arrive((TickCount / 1200) % 2, 8);
	}
}

void FLifeSim::Kill(int32 Index, int32 Cause)
{
	FCreature& C = Creatures[Index];
	if (!C.bAlive)
	{
		return;
	}
	C.bAlive = false;
	++Stats.Deaths;
	if (Cause == 1) ++Stats.Starved;
	if (Cause == 2) ++Stats.OldAge;
	if (C.Kids >= 2)
	{
		Bank.Add(TPair<float, FLifeGenes>(C.Kids + (float)C.Age / C.Lifespan, C.Genes));
		if (Bank.Num() > 60)
		{
			Bank.RemoveAt(0);
		}
	}
	if (Cause != 0)
	{
		AddFood(C.Pos, 25.f * C.Genes.Size, 1); // Carcass = meat.
	}
}

void FLifeSim::Rescue()
{
	LastRescue = TickCount;
	FVector2f Center = FVector2f::ZeroVector;
	if (Creatures.Num())
	{
		Center = Creatures[(int32)(R() * Creatures.Num()) % Creatures.Num()].Pos;
	}
	for (int32 I = 0; I < 30; ++I)
	{
		SpawnPlant(&Center, 40.f, true);
	}
	Bank.Sort([](const TPair<float, FLifeGenes>& A, const TPair<float, FLifeGenes>& B) { return A.Key > B.Key; });
	for (int32 I = 0; I < 8; ++I)
	{
		FLifeGenes Src = Bank.Num() ? Bank[(int32)(R() * FMath::Min(8, Bank.Num()))].Value : RandomGenes();
		FVector2f P;
		if (JitterLand(Center, 20.f, P))
		{
			AddCreature(P, MutateGenes(Src), 1, 70.f * Src.Size);
		}
	}
	++Stats.Rescues;
	UpdateSpecies();
}

void FLifeSim::UpdateSpecies()
{
	TArray<FLifeSpecies> Old = MoveTemp(Species);
	TArray<FLifeSpecies> Next;
	TArray<float> DietSum;
	for (FCreature& C : Creatures)
	{
		int32 Best = -1;
		float Bs = 0.35f;
		for (int32 S = 0; S < Old.Num(); ++S)
		{
			const float V = Similarity(C.Genes, Old[S].Rep);
			if (V > Bs) { Bs = V; Best = S; }
		}
		int32 BestId = Best >= 0 ? Old[Best].Id : 0;
		if (Best < 0)
		{
			for (const FLifeSpecies& S : Next)
			{
				const float V = Similarity(C.Genes, S.Rep);
				if (V > Bs) { Bs = V; BestId = S.Id; }
			}
		}
		if (BestId == 0)
		{
			FLifeSpecies S;
			S.Id = NextSpecies++;
			S.Name = MakeName(S.Id * 7 + 3 + 977u * (uint32)Rng.GetInitialSeed());
			S.Rep = C.Genes;
			Old.Add(S);
			BestId = S.Id;
		}
		int32 Ni = Next.IndexOfByPredicate([BestId](const FLifeSpecies& S) { return S.Id == BestId; });
		if (Ni == INDEX_NONE)
		{
			const FLifeSpecies* Src = Old.FindByPredicate([BestId](const FLifeSpecies& S) { return S.Id == BestId; });
			FLifeSpecies S = *Src;
			S.Count = 0;
			S.Rep = C.Genes; // A living member keeps the species tracking its drifting lineage.
			Ni = Next.Add(S);
			DietSum.Add(0.f);
		}
		Next[Ni].Count++;
		DietSum[Ni] += C.Genes.Diet;
		C.SpeciesId = BestId;
	}
	for (int32 I = 0; I < Next.Num(); ++I)
	{
		Next[I].MeanDiet = DietSum[I] / FMath::Max(1, Next[I].Count);
	}
	Next.Sort([](const FLifeSpecies& A, const FLifeSpecies& B) { return A.Count > B.Count; });
	Species = MoveTemp(Next);
}

const FLifeSpecies* FLifeSim::FindSpecies(int32 Id) const
{
	return Species.FindByPredicate([Id](const FLifeSpecies& S) { return S.Id == Id; });
}
