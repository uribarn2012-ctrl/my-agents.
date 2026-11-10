// Renders a seeded planet: a cube-sphere quadtree of mesh chunks plus sky, sun and clouds.
#pragma once

#include "CoreMinimal.h"
#include "GameFramework/Actor.h"
#include "PlanetWorld.generated.h"

class FPlanetGenerator;
class UProceduralMeshComponent;
class UDirectionalLightComponent;
class USkyAtmosphereComponent;
class USkyLightComponent;
class UStaticMeshComponent;
class UMaterialInterface;
class UMaterialInstanceDynamic;
class UTexture2D;

struct FPlanetNode;
struct FPlanetChunkData;
struct FPlanetBuildQueue;

UCLASS()
class APlanetWorld : public AActor
{
	GENERATED_BODY()

public:
	APlanetWorld();
	virtual ~APlanetWorld() override;

	virtual void BeginPlay() override;
	virtual void Tick(float DeltaSeconds) override;
	virtual void EndPlay(const EEndPlayReason::Type Reason) override;

	/** Throws the current world away and builds the one for this seed. */
	void SetSeed(int32 NewSeed);
	int32 GetSeed() const;

	/** Height of the visible ground under a direction, in metres above the sphere. */
	double GroundHeightM(const FVector3d& Dir) const;

	/** True once no chunks are waiting, meaning the view has finished refining. */
	bool IsSettled() const;

	int32 GetVisibleChunkCount() const { return VisibleChunks; }

	/** Unit vector pointing from the planet toward the sun. */
	static FVector3d GetSunDirection();

	/** Picks a sunlit spot worth looking at: Kind 0 = coastline with land, 1 = mountains by the sea. */
	FVector3d FindScenicSpot(int32 Kind) const;

private:
	void CreateSkyAndSun();
	void BakeWeatherMap();
	void BuildCloudShell();
	bool MaterialsReady() const;
	void DrainFinishedChunks();
	void Visit(FPlanetNode& Node);
	void RequestBuild(FPlanetNode& Node);
	void LaunchRequests();
	void SetShown(FPlanetNode& Node, bool bShown);
	void HideDescendants(FPlanetNode& Node);
	void ReleaseSubtree(FPlanetNode& Node);
	void ReleaseStale(FPlanetNode& Node, double Now);
	bool AnyBuilding(const FPlanetNode& Node) const;
	UProceduralMeshComponent* AcquireMesh();

	UPROPERTY() TObjectPtr<USceneComponent> Root;
	UPROPERTY() TObjectPtr<UDirectionalLightComponent> Sun;
	UPROPERTY() TObjectPtr<USkyAtmosphereComponent> Atmosphere;
	UPROPERTY() TObjectPtr<USkyLightComponent> SkyLight;
	UPROPERTY() TObjectPtr<UProceduralMeshComponent> CloudShell;
	UPROPERTY() TObjectPtr<UStaticMeshComponent> StarDome;
	UPROPERTY() TObjectPtr<UMaterialInstanceDynamic> TerrainMaterial;
	UPROPERTY() TObjectPtr<UMaterialInstanceDynamic> CloudMaterial;
	UPROPERTY() TObjectPtr<UTexture2D> WeatherMap;
	UPROPERTY() TArray<TObjectPtr<UProceduralMeshComponent>> FreeMeshes;
	UPROPERTY() TArray<TObjectPtr<UProceduralMeshComponent>> AllMeshes;

	TSharedPtr<FPlanetGenerator, ESPMode::ThreadSafe> Generator;
	TSharedPtr<FPlanetBuildQueue, ESPMode::ThreadSafe> BuildQueue;
	TArray<TSharedPtr<FPlanetNode>> Faces;
	TArray<FPlanetNode*> Requests;

	FVector3d CameraPos = FVector3d::ZeroVector;
	FVector3d CameraForward = FVector3d::ForwardVector;
	double PixelsPerRadian = 1000.0;
	double ViewConeCos = 0.0;
	double HorizonAngle = 1.0;
	int32 Generation = 0;
	int32 VisibleChunks = 0;
	double LastCleanup = 0.0;
	int32 InFlight = 0;
};
