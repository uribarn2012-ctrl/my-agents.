// The game shell for the planet view: orbit camera, input, on-screen text and game mode.
#pragma once

#include "CoreMinimal.h"
#include "GameFramework/GameModeBase.h"
#include "GameFramework/HUD.h"
#include "GameFramework/Pawn.h"
#include "GameFramework/PlayerController.h"
#include "PlanetGame.generated.h"

class APlanetWorld;
class UCameraComponent;

UCLASS()
class APlanetPawn : public APawn
{
	GENERATED_BODY()

public:
	APlanetPawn();
	virtual void BeginPlay() override;
	virtual void Tick(float DeltaSeconds) override;

	void Drag(const FVector2D& ScreenDelta);
	void Zoom(float WheelSteps);
	void Turn(float ScreenDeltaX);

	double GetAltitudeKm() const { return AltitudeM / 1000.0; }

private:
	void UpdateCamera(double GroundM);
	APlanetWorld* FindWorld();

	UPROPERTY(VisibleAnywhere) TObjectPtr<UCameraComponent> Camera;

	TWeakObjectPtr<APlanetWorld> World;

	FQuat Orientation = FQuat::Identity;
	FQuat TargetOrientation = FQuat::Identity;
	double AltitudeM = 20000000.0;
	double TargetAltitudeM = 20000000.0;
	double FixedTiltDeg = -1.0;
};

UCLASS()
class APlanetPlayerController : public APlayerController
{
	GENERATED_BODY()

public:
	APlanetPlayerController();
	virtual void SetupInputComponent() override;
	virtual void PlayerTick(float DeltaTime) override;
	virtual void BeginPlay() override;

private:
	void OnWheel(float Value);
	void OnNewSeed();

	FVector2D LastMouse = FVector2D::ZeroVector;
	bool bHadMouse = false;
};

UCLASS()
class APlanetHUD : public AHUD
{
	GENERATED_BODY()

public:
	virtual void DrawHUD() override;
};

UCLASS()
class APlanetGameMode : public AGameModeBase
{
	GENERATED_BODY()

public:
	APlanetGameMode();
	virtual void InitGame(const FString& MapName, const FString& Options, FString& ErrorMessage) override;
	virtual void StartPlay() override;
	virtual void Tick(float DeltaSeconds) override;

private:
	void CaptureTick(float DeltaSeconds);

	UPROPERTY() TObjectPtr<APlanetWorld> PlanetWorld;

	// Automated capture settings for -CreatorShot.
	FString ShotPath;
	double SettledTime = 0.0;
	double ShotWait = 8.0;
	int32 FramesAfterShot = -1;
	double SecondsTotal = 0.0;
	int32 FramesTotal = 0;
};
