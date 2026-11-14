// The nature view: a detailed local landscape a few km across, built from the planet's data at one
// spot, with the animal simulation running on it and every animal drawn as a procedural 3D body.
// The actor sits on the planet surface at its real place, so the planet's sun and sky light it.
#pragma once

#include "CoreMinimal.h"
#include "GameFramework/Actor.h"
#include "LifeSim.h"
#include "NatureWorld.generated.h"

class FPlanetGenerator;
class FLifeSim;
struct FCreature;
class UInstancedStaticMeshComponent;
class UProceduralMeshComponent;
class UStaticMesh;
class UMaterialInterface;

struct FNatureAnim
{
	FVector2D Pos = FVector2D::ZeroVector;
	double Yaw = 0.0;
	double Speed = 0.0;      // Metres per second, smoothed.
	double Phase = 0.0;      // Gait cycle 0..1.
	double Duty = 0.62;
	double Lift = 0.12;
	double Offsets[4] = { 0.25, 0.75, 0.0, 0.5 };
	double HeadDown = 0.0;
	double Bob = 0.0;
	FVector Center = FVector::ZeroVector; // Local cm, for picking and the camera.
	double Radius = 50.0;
	bool bSeen = false;
};

UCLASS()
class ANatureWorld : public AActor
{
	GENERATED_BODY()

public:
	ANatureWorld();
	virtual ~ANatureWorld() override;
	virtual void Tick(float DeltaSeconds) override;

	/** Builds the landscape and starts the animals at this planet direction (which must be land). */
	void Build(const FPlanetGenerator& Generator, const FVector3d& Dir, int32 Seed);

	/** Finds the nearest land to a direction; false when there is only open sea around. */
	static bool FindLand(const FPlanetGenerator& Generator, const FVector3d& Dir, FVector3d& OutDir);

	/** Ground height in local centimetres (water counts as its surface). */
	double GroundCm(double X, double Y) const;

	/** Centre of the biggest grazing herd, local cm. */
	FVector HerdCenter() const;
	/** Id of a hunter that is chasing right now, or 0. */
	int32 FindChasingHunter() const;
	/** Id of a hunter, chasing or not, or 0. */
	int32 FindAnyHunter() const;

	bool GetAnimal(int32 Id, FVector& OutCenter, FVector2D& OutDir, int32& OutActivity) const;
	int32 PickAnimal(const FVector& WorldOrigin, const FVector& WorldDir) const;
	bool PickGround(const FVector& WorldOrigin, const FVector& WorldDir, FVector& OutLocal) const;

	FString HudLine() const;
	FString AnimalPanel(int32 Id) const;

	FVector3d GetCenterDir() const { return CenterDir; }
	/** Horizontal direction toward the sun in local coordinates. */
	FVector LocalSunDir() const;

	/** Runs the simulation forward quickly (used for start-up and screenshots). */
	void RunSim(int32 Ticks);

	/** Simulation speed multiplier (0 = paused). */
	double TimeScale = 1.0;

private:
	struct FGrid
	{
		int32 N = 0;
		double Half = 0.0;
		TArray<float> H, Moist, Temp;
	};

	double BaseM(double X, double Y) const;
	void Climate(double X, double Y, float& Moist, float& Temp) const;
	double HeightM(double X, double Y) const;
	float TreeDensity(double X, double Y, float Moist, float Temp) const;
	float Fertility(float X, float Y) const;
	FLinearColor GroundColor(double X, double Y, double Hm, float Nz, float& OutAlpha) const;
	void SampleGrid(const FPlanetGenerator& Gen, FGrid& G, int32 N, double Half);
	void BuildTerrain();
	void BuildScenery();
	void CreateUnitMeshes();
	void UpdateFood();
	void UpdateAnimals(double Dt, double Alpha);
	void PoseAnimal(const FCreature& C, FNatureAnim& A, double Dt);

	UPROPERTY() TObjectPtr<USceneComponent> Root;
	UPROPERTY() TObjectPtr<UMaterialInterface> GroundMaterial;
	UPROPERTY() TObjectPtr<UMaterialInterface> SkinMaterial;
	UPROPERTY() TArray<TObjectPtr<UProceduralMeshComponent>> Meshes;
	UPROPERTY() TArray<TObjectPtr<UStaticMesh>> UnitMeshes;
	UPROPERTY() TArray<TObjectPtr<UInstancedStaticMeshComponent>> Parts;
	UPROPERTY() TObjectPtr<UInstancedStaticMeshComponent> FoodParts;

	TUniquePtr<FLifeSim> Sim;
	TMap<int32, FNatureAnim> Anim;
	FGrid Inner, Outer;
	FVector3d CenterDir = FVector3d::UpVector;
	uint32 NoiseSeed = 1;
	double CenterBaseM = 0.0;
	double Accum = 0.0;

	// Per-frame instance buffers, one per unit mesh.
	TArray<TArray<FTransform>> PartXf;
	TArray<TArray<float>> PartData;
};
