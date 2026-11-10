// The game shell: orbit camera over the planet, the descent into the nature view, input, on-screen
// text and game mode.
#pragma once

#include "CoreMinimal.h"
#include "GameFramework/GameModeBase.h"
#include "GameFramework/HUD.h"
#include "GameFramework/Pawn.h"
#include "GameFramework/PlayerController.h"
#include "PlanetGame.generated.h"

class APlanetWorld;
class ANatureWorld;
class UCameraComponent;

UENUM()
enum class ECreatorView : uint8
{
	Planet, Descending, Nature, Ascending
};

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

	/** Jumps the camera so it looks at a ground direction from the given altitude. */
	void JumpTo(const FVector3d& TargetDir, double AltKm);

	// Nature view.
	ECreatorView GetView() const { return View; }
	float GetFade() const { return Fade; }
	/** Starts the fly-down to the land at (or nearest to) this direction. False over open sea. */
	bool BeginDescent(const FVector3d& Dir);
	void BeginAscent();
	/** Builds the nature view right away and puts the camera DistM metres from the herd. */
	void EnterNatureNow(const FVector3d& Dir, double DistM);
	FVector3d ScreenCenterDir() const;
	bool RayToPlanet(const FVector& Origin, const FVector& Dir, FVector3d& OutDir) const;
	void NatureOrbit(const FVector2D& Delta);
	void NaturePan(const FVector2D& Delta);
	void ClickAt(const FVector& Origin, const FVector& Dir);
	ANatureWorld* GetNature() const { return Nature.Get(); }
	int32 GetFollowId() const { return FollowId; }
	void SetNaturePitch(double Deg) { Pitch = Deg; }
	void SetNatureDist(double M) { Dist = TargetDist = M * 100.0; }
	/** Screenshot helper: keep the camera on a hunter that is chasing, seen from the side. */
	void StartHuntShot() { bHuntShot = true; }
	bool IsShotReady() const;

	FString Message;
	double MessageUntil = 0.0;

private:
	void UpdateCamera(double GroundM);
	void TickNatureCamera(float DeltaSeconds);
	void LeaveNature();
	APlanetWorld* FindWorld();

	UPROPERTY(VisibleAnywhere) TObjectPtr<UCameraComponent> Camera;

	TWeakObjectPtr<APlanetWorld> World;
	TWeakObjectPtr<ANatureWorld> Nature;

	FQuat Orientation = FQuat::Identity;
	FQuat TargetOrientation = FQuat::Identity;
	double AltitudeM = 20000000.0;
	double TargetAltitudeM = 20000000.0;
	double FixedTiltDeg = -1.0;

	ECreatorView View = ECreatorView::Planet;
	float Fade = 0.f;
	FVector3d DescentDir = FVector3d::UpVector;

	// Nature camera, in the nature actor's local centimetres.
	FVector Focus = FVector::ZeroVector;
	FVector FocusTarget = FVector::ZeroVector;
	double Yaw = 0.0;      // Radians.
	double Pitch = -14.0;  // Degrees, negative looks down.
	double Dist = 4500.0;
	double TargetDist = 4500.0;
	int32 FollowId = 0;
	bool bHuntShot = false;
	double ChaseSeen = 0.0;
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
	void OnEnter();
	void OnLeave();
	void OnTime();

	FVector2D LastMouse = FVector2D::ZeroVector;
	double PressMoved = 0.0;
	bool bHadMouse = false;
	bool bWasDown = false;
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
