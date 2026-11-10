#include "PlanetGenerator.h"

namespace
{
	FORCEINLINE double Sstep(double A, double B, double X)
	{
		const double T = FMath::Clamp((X - A) / (B - A), 0.0, 1.0);
		return T * T * (3.0 - 2.0 * T);
	}

	FORCEINLINE double Grad(uint8 Hash, double X, double Y, double Z)
	{
		switch (Hash & 15)
		{
		case 0: return X + Y;   case 1: return -X + Y;
		case 2: return X - Y;   case 3: return -X - Y;
		case 4: return X + Z;   case 5: return -X + Z;
		case 6: return X - Z;   case 7: return -X - Z;
		case 8: return Y + Z;   case 9: return -Y + Z;
		case 10: return Y - Z;  case 11: return -Y - Z;
		case 12: return X + Y;  case 13: return -X + Y;
		case 14: return -Y + Z; default: return -Y - Z;
		}
	}

	FORCEINLINE FVector3f Mix(const FVector3f& A, const FVector3f& B, double T)
	{
		return A + (B - A) * (float)T;
	}

	FVector3d RandomUnit(FRandomStream& R)
	{
		for (;;)
		{
			const FVector3d V(R.FRandRange(-1.f, 1.f), R.FRandRange(-1.f, 1.f), R.FRandRange(-1.f, 1.f));
			const double L = V.Size();
			if (L > 0.05 && L <= 1.0) { return V / L; }
		}
	}

	FVector3d RandomOffset(FRandomStream& R)
	{
		return FVector3d(R.FRandRange(-90.f, 90.f), R.FRandRange(-90.f, 90.f), R.FRandRange(-90.f, 90.f));
	}
}

FPlanetGenerator::FPlanetGenerator(int32 InSeed)
	: Seed(InSeed)
{
	FRandomStream R(Seed);
	for (int32 i = 0; i < 256; ++i) { Perm[i] = (uint8)i; }
	for (int32 i = 255; i > 0; --i) { Swap(Perm[i], Perm[R.RandRange(0, i)]); }
	for (int32 i = 0; i < 256; ++i) { Perm[i + 256] = Perm[i]; }

	OffsetA = RandomOffset(R); OffsetB = RandomOffset(R); OffsetC = RandomOffset(R);
	OffsetD = RandomOffset(R); OffsetE = RandomOffset(R); OffsetF = RandomOffset(R);

	const int32 PlateCount = R.RandRange(11, 17);
	Plates.SetNum(PlateCount);
	for (FPlate& P : Plates)
	{
		P.Center = RandomUnit(R);
		P.Bias = R.FRandRange(-0.34f, 0.34f);
	}
	PairStress.SetNumUninitialized(PlateCount * PlateCount);
	for (int32 A = 0; A < PlateCount; ++A)
	{
		for (int32 B = A; B < PlateCount; ++B)
		{
			const double Stress = FMath::Pow((double)R.FRand(), 1.6) * 1.1 + 0.05;
			PairStress[A * PlateCount + B] = Stress;
			PairStress[B * PlateCount + A] = Stress;
		}
	}

	// Choose the sea level that gives this world its ocean share, so every seed has real continents.
	const double OceanShare = R.FRandRange(0.60f, 0.72f);
	TArray<double> Values;
	Values.Reserve(6000);
	FRandomStream SampleStream(Seed ^ 0x5A17);
	for (int32 i = 0; i < 6000; ++i)
	{
		double Boundary, Belt;
		Values.Add(ContinentField(Warp(RandomUnit(SampleStream)), Boundary, Belt));
	}
	Values.Sort();
	SeaLevel = Values[FMath::Clamp((int32)(OceanShare * Values.Num()), 0, Values.Num() - 1)];
}

double FPlanetGenerator::Noise(const FVector3d& P) const
{
	const double Fx = FMath::FloorToDouble(P.X), Fy = FMath::FloorToDouble(P.Y), Fz = FMath::FloorToDouble(P.Z);
	const int32 Xi = (int32)((int64)Fx & 255), Yi = (int32)((int64)Fy & 255), Zi = (int32)((int64)Fz & 255);
	const double X = P.X - Fx, Y = P.Y - Fy, Z = P.Z - Fz;
	const double U = X * X * X * (X * (X * 6 - 15) + 10);
	const double V = Y * Y * Y * (Y * (Y * 6 - 15) + 10);
	const double W = Z * Z * Z * (Z * (Z * 6 - 15) + 10);

	const int32 A = Perm[Xi] + Yi, Aa = Perm[A] + Zi, Ab = Perm[A + 1] + Zi;
	const int32 B = Perm[Xi + 1] + Yi, Ba = Perm[B] + Zi, Bb = Perm[B + 1] + Zi;

	return FMath::Lerp(
		FMath::Lerp(
			FMath::Lerp(Grad(Perm[Aa], X, Y, Z), Grad(Perm[Ba], X - 1, Y, Z), U),
			FMath::Lerp(Grad(Perm[Ab], X, Y - 1, Z), Grad(Perm[Bb], X - 1, Y - 1, Z), U), V),
		FMath::Lerp(
			FMath::Lerp(Grad(Perm[Aa + 1], X, Y, Z - 1), Grad(Perm[Ba + 1], X - 1, Y, Z - 1), U),
			FMath::Lerp(Grad(Perm[Ab + 1], X, Y - 1, Z - 1), Grad(Perm[Bb + 1], X - 1, Y - 1, Z - 1), U), V), W);
}

double FPlanetGenerator::Fbm(const FVector3d& P, int32 Octaves, double Gain) const
{
	double Sum = 0.0, Amp = 1.0, Norm = 0.0;
	FVector3d Q = P;
	for (int32 i = 0; i < Octaves; ++i)
	{
		Sum += Noise(Q) * Amp;
		Norm += Amp;
		Amp *= Gain;
		Q = Q * 2.03 + FVector3d(1.7, 9.2, 4.1);
	}
	return Sum / Norm * 1.6;
}

double FPlanetGenerator::Ridged(const FVector3d& P, int32 Octaves) const
{
	double Sum = 0.0, Amp = 1.0, Norm = 0.0, Prev = 1.0;
	FVector3d Q = P;
	for (int32 i = 0; i < Octaves; ++i)
	{
		const double R = 1.0 - FMath::Abs(Noise(Q)) * 1.7;
		const double Ridge = R * R;
		Sum += Ridge * Amp * Prev;
		Norm += Amp;
		Prev = FMath::Clamp(Ridge * 1.6, 0.0, 1.0);
		Amp *= 0.5;
		Q = Q * 2.1 + FVector3d(4.3, 1.1, 7.7);
	}
	return Sum / Norm;
}

FVector3d FPlanetGenerator::Warp(const FVector3d& Dir) const
{
	const FVector3d W(
		Fbm(Dir * 1.9 + OffsetA, 4),
		Fbm(Dir * 1.9 + OffsetB, 4),
		Fbm(Dir * 1.9 + OffsetC, 4));
	return (Dir + W * 0.12).GetSafeNormal();
}

double FPlanetGenerator::ContinentField(const FVector3d& Q, double& OutBoundary, double& OutBelt) const
{
	double D1 = -2.0, D2 = -2.0;
	int32 I1 = 0, I2 = 0;
	for (int32 i = 0; i < Plates.Num(); ++i)
	{
		const double D = FVector3d::DotProduct(Q, Plates[i].Center);
		if (D > D1) { D2 = D1; I2 = I1; D1 = D; I1 = i; }
		else if (D > D2) { D2 = D; I2 = i; }
	}
	OutBoundary = FMath::Sqrt(FMath::Max(2.0 - 2.0 * D2, 0.0)) - FMath::Sqrt(FMath::Max(2.0 - 2.0 * D1, 0.0));
	OutBelt = PairStress[I1 * Plates.Num() + I2];

	const double Blend = Sstep(0.0, 0.3, OutBoundary);
	const double Bias = FMath::Lerp((Plates[I1].Bias + Plates[I2].Bias) * 0.5, Plates[I1].Bias, Blend);
	// A gain under 0.5 keeps coastlines detailed without a spray of one-pixel islands offshore.
	return Fbm(Q * 1.15 + OffsetD, 10, 0.46) + Bias;
}

FPlanetSample FPlanetGenerator::Sample(const FVector3d& Dir, int32 ExtraOctaves) const
{
	static const FVector3f DeepSea(0.0035f, 0.014f, 0.055f), Shelf(0.012f, 0.075f, 0.13f);
	static const FVector3f Forest(0.018f, 0.055f, 0.017f), Jungle(0.008f, 0.04f, 0.012f);
	static const FVector3f Grass(0.135f, 0.155f, 0.05f), Savanna(0.30f, 0.24f, 0.09f);
	static const FVector3f Sand(0.60f, 0.43f, 0.22f), RedSand(0.47f, 0.22f, 0.09f);
	static const FVector3f Taiga(0.03f, 0.055f, 0.04f), Tundra(0.16f, 0.15f, 0.10f);
	static const FVector3f Rock(0.17f, 0.145f, 0.12f), Snow(0.82f, 0.86f, 0.90f), SeaIce(0.66f, 0.78f, 0.88f);

	const FVector3d Q = Warp(Dir);
	double Boundary = 0.0, Stress = 0.0;
	double Land = ContinentField(Q, Boundary, Stress) - SeaLevel;
	if (ExtraOctaves > 0)
	{
		Land += Fbm(Q * 900.0 + OffsetE, ExtraOctaves, 0.55) * 0.0012;
	}

	const double SinLat = Dir.Z;
	const double LatRad = FMath::Asin(FMath::Clamp(SinLat, -1.0, 1.0));
	const double Belt = FMath::Exp(-FMath::Square(Boundary / 0.052)) * Stress;

	FPlanetSample Out;
	double HeightM;
	if (Land >= 0.0)
	{
		const double L = FMath::Clamp(Land, 0.0, 0.9);
		const double Base = 1700.0 * FMath::Pow(FMath::Min(L / 0.36, 1.6), 1.3);
		const double Coast = Sstep(0.0, 0.05, Land);
		const double Mount = 6800.0 * Belt * FMath::Pow(Ridged(Q * 7.0 + OffsetF, 8), 1.5) * Coast;
		const double Rugged = 420.0 * Ridged(Q * 24.0 + OffsetA, 6) * Sstep(0.02, 0.25, L);
		const double Hills = (Fbm(Q * 11.0 + OffsetB, 8, 0.52) + 0.3) * 240.0;
		double Fine = 0.0;
		if (ExtraOctaves > 0)
		{
			Fine = Fbm(Q * 1400.0 + OffsetC, ExtraOctaves, 0.5) * 60.0 * Coast;
		}
		HeightM = FMath::Max(Base + Mount + Rugged + Hills * Coast + Fine, 1.0);
	}
	else
	{
		const double Ridge = FMath::Exp(-FMath::Square(Boundary / 0.03)) * 1800.0;
		HeightM = FMath::Min(-90.0 - 5200.0 * Sstep(0.0, 0.26, -Land) + Ridge, -30.0);
	}
	Out.HeightM = HeightM;

	// Climate: temperature falls toward the poles and with altitude; moisture follows wind bands.
	const double S2 = SinLat * SinLat;
	const double TNoise = Fbm(Q * 3.2 + OffsetE, 5);
	const double Temperature = 34.0 - 72.0 * FMath::Pow(S2, 1.7) + TNoise * 7.0 - 6.5 * FMath::Max(HeightM, 0.0) / 1000.0;

	const double MNoise = Fbm(Q * 2.7 + OffsetF, 7) * 0.8 + Fbm(Q * 9.0 + OffsetA, 6) * 0.3;
	const double Inland = Sstep(0.12, 0.75, Land);
	const double Moisture = FMath::Clamp(
		0.64 + 0.24 * FMath::Cos(LatRad * 7.2) + 0.55 * MNoise - 0.28 * Inland - 0.22 * Belt, 0.0, 1.0);

	const double Tint = Fbm(Q * 34.0 + OffsetC, 6);

	if (HeightM < 0.0)
	{
		const double Depth = Sstep(0.0, 900.0, -HeightM);
		FVector3f Water = Mix(Shelf, DeepSea, FMath::Pow(Depth, 0.55));
		// A smooth, large-scale wobble keeps the sea-ice edge clean instead of a spray of tiny floes.
		const double Ice = Sstep(-9.0, -15.0, Temperature + Fbm(Q * 5.0 + OffsetB, 4) * 6.0);
		Out.Albedo = Mix(Water, SeaIce, Ice);
		Out.Ocean = (float)(1.0 - Ice);
		Out.Roughness = (float)FMath::Lerp(0.42, 0.65, Ice);
		return Out;
	}

	const double Warm = Sstep(-4.0, 24.0, Temperature);
	const double Variation = Sstep(-0.5, 0.5, Tint * 0.8 + MNoise);

	const FVector3f DesertColor = Mix(Sand, RedSand, Sstep(-0.3, 0.45, Fbm(Q * 5.0 + OffsetD, 6)));
	FVector3f Veg = Mix(Forest, Jungle, Warm);
	Veg = Mix(Veg, Grass, 1.0 - Sstep(0.38, 0.68, Moisture));
	Veg = Mix(Veg, Savanna, Warm * (1.0 - Sstep(0.26, 0.5, Moisture)));
	FVector3f Color = Mix(DesertColor, Veg, Sstep(0.17, 0.36, Moisture));

	// Cold biomes.
	FVector3f Cold = Mix(Taiga, Tundra, Sstep(10.0, -6.0, Temperature + Tint * 4.0));
	Color = Mix(Color, Cold, Sstep(13.0, 2.0, Temperature));

	Color *= (float)FMath::Lerp(0.8, 1.2, Variation);

	// Bare rock on high slopes, then snow where it is cold enough.
	const double RockMask = Sstep(1300.0, 3200.0, HeightM + Tint * 500.0);
	Color = Mix(Color, Rock * (float)FMath::Lerp(0.75, 1.25, Variation), RockMask);
	const double SnowMask = Sstep(-1.5, -8.0, Temperature + Tint * 5.0);
	Color = Mix(Color, Snow, SnowMask);

	Out.Albedo = Color;
	Out.Ocean = 0.0f;
	Out.Roughness = (float)FMath::Lerp(0.82, 0.55, SnowMask);
	return Out;
}

float FPlanetGenerator::CloudCover(const FVector3d& Dir) const
{
	const FVector3d SwirlA(Fbm(Dir * 1.6 + OffsetB, 3), Fbm(Dir * 1.6 + OffsetE, 3), Fbm(Dir * 1.6 + OffsetF, 3));
	const FVector3d Q = (Dir + SwirlA * 0.25).GetSafeNormal();
	const FVector3d SwirlB(Fbm(Q * 5.0 + OffsetC, 3), Fbm(Q * 5.0 + OffsetA, 3), Fbm(Q * 5.0 + OffsetD, 3));
	const FVector3d P = Q + SwirlB * 0.08;

	// Wet equator, clear subtropics (where the deserts are), stormy mid-latitudes.
	const double Lat = FMath::Asin(FMath::Clamp(Dir.Z, -1.0, 1.0));
	const double Bands = 0.5 + 0.5 * FMath::Cos(Lat * 7.2);
	// Only the big weather systems follow the full swirl; smaller detail is warped less, or it gets
	// smeared into brush-stroke streaks.
	const double Large = Fbm(P * 2.1 + OffsetA, 4) * 0.75;
	const double Mid = Fbm(Q * 7.0 + OffsetE, 4, 0.5) * 0.38;
	// Billowy clumps (sum of absolute noise) give puffy cloud fields instead of solid sheets.
	double Puffs = 0.0, Amp = 0.5;
	FVector3d B = Dir * 34.0 + OffsetB;
	for (int32 i = 0; i < 4; ++i)
	{
		Puffs += FMath::Abs(Noise(B)) * Amp;
		Amp *= 0.5;
		B = B * 2.07 + FVector3d(2.3, 7.1, 5.9);
	}
	const double Fine = (Puffs - 0.2) * 0.9;
	const double Field = Large + Mid + Fine + (Bands - 0.5) * 0.32;
	return (float)Sstep(-0.02, 0.5, Field);
}
