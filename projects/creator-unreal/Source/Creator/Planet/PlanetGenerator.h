// Seeded, deterministic description of a procedural planet. Plain C++, safe to call from worker threads.
#pragma once

#include "CoreMinimal.h"

struct FPlanetSample
{
	double HeightM = 0.0;     // Above sea level. Negative is ocean depth.
	FVector3f Albedo = FVector3f::ZeroVector; // Linear colour.
	float Ocean = 0.0f;       // 1 = open water, 0 = land or ice.
	float Roughness = 0.8f;
	float TemperatureC = 15.0f; // Climate, used by the nature view.
	float Moisture = 0.5f;
};

class FPlanetGenerator
{
public:
	static constexpr double RadiusM = 6360000.0;
	static constexpr double RadiusCm = RadiusM * 100.0;
	/** Relief is exaggerated so mountains stay readable at planetary scale. */
	static constexpr double VerticalScale = 1.6;

	explicit FPlanetGenerator(int32 InSeed);

	int32 GetSeed() const { return Seed; }

	/** ExtraOctaves adds fine detail for close chunks; 0 is the base shape. */
	FPlanetSample Sample(const FVector3d& Dir, int32 ExtraOctaves) const;

	/** Height of the rendered mesh above the sphere, metres; oceans are flat at 0. */
	static double MeshHeightM(const FPlanetSample& S) { return FMath::Max(S.HeightM, 0.0) * VerticalScale; }

	/** Cloud cover 0..1 for a direction, used to bake the weather map. */
	float CloudCover(const FVector3d& Dir) const;

private:
	struct FPlate
	{
		FVector3d Center;
		double Bias;
	};

	double Noise(const FVector3d& P) const;
	double Fbm(const FVector3d& P, int32 Octaves, double Gain = 0.5) const;
	double Ridged(const FVector3d& P, int32 Octaves) const;
	double ContinentField(const FVector3d& Q, double& OutBoundary, double& OutBelt) const;
	FVector3d Warp(const FVector3d& Dir) const;

	int32 Seed;
	uint8 Perm[512];
	TArray<FPlate> Plates;
	TArray<double> PairStress; // Mountain strength per plate pair.
	double SeaLevel = 0.0;
	FVector3d OffsetA, OffsetB, OffsetC, OffsetD, OffsetE, OffsetF;
};
