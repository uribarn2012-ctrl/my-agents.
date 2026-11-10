#include "PlanetGame.h"

#include "PlanetGenerator.h"
#include "PlanetWorld.h"
#include "Camera/CameraComponent.h"
#include "Components/InputComponent.h"
#include "Engine/Canvas.h"
#include "Engine/Engine.h"
#include "Engine/GameViewportClient.h"
#include "Engine/World.h"
#include "EngineUtils.h"
#include "GameFramework/WorldSettings.h"
#include "HighResScreenshot.h"
#include "InputCoreTypes.h"
#include "Misc/CommandLine.h"
#include "Misc/Parse.h"
#include "UnrealClient.h"

namespace
{
	constexpr double MinAltitudeM = 400.0;
	constexpr double MaxAltitudeM = 60000000.0;
	constexpr double DragRadiansPerPixel = 0.0024;

	/** Camera tilt grows as it descends, so space looks straight down and the ground shows a horizon. */
	double TiltForAltitude(double AltitudeM)
	{
		const double T = FMath::Clamp((FMath::LogX(10.0, AltitudeM) - 4.0) / 2.6, 0.0, 1.0);
		return FMath::Lerp(78.0, 0.0, T * T * (3.0 - 2.0 * T));
	}
}

APlanetPawn::APlanetPawn()
{
	PrimaryActorTick.bCanEverTick = true;
	PrimaryActorTick.TickGroup = TG_PrePhysics;

	Camera = CreateDefaultSubobject<UCameraComponent>(TEXT("Camera"));
	SetRootComponent(Camera);
	Camera->SetFieldOfView(50.0f);
	Camera->bConstrainAspectRatio = false;

	// A fixed exposure: space must stay black and the planet must not pump as it fills the frame.
	FPostProcessSettings& P = Camera->PostProcessSettings;
	Camera->PostProcessBlendWeight = 1.0f;
	P.bOverride_AutoExposureMethod = true;
	P.AutoExposureMethod = AEM_Manual;
	P.bOverride_AutoExposureBias = true;
	P.AutoExposureBias = -1.0f;
	P.bOverride_AutoExposureApplyPhysicalCameraExposure = true;
	P.AutoExposureApplyPhysicalCameraExposure = false;
	P.bOverride_VignetteIntensity = true;
	P.VignetteIntensity = 0.0f;
	P.bOverride_BloomIntensity = true;
	P.BloomIntensity = 0.05f;
	P.bOverride_MotionBlurAmount = true;
	P.MotionBlurAmount = 0.0f;
}

void APlanetPawn::BeginPlay()
{
	Super::BeginPlay();

	double Lat = 22.0, Lon = 18.0, AltKm = 20000.0;
	FParse::Value(FCommandLine::Get(), TEXT("CreatorLat="), Lat);
	FParse::Value(FCommandLine::Get(), TEXT("CreatorLon="), Lon);
	FParse::Value(FCommandLine::Get(), TEXT("CreatorAltKm="), AltKm);
	FParse::Value(FCommandLine::Get(), TEXT("CreatorTilt="), FixedTiltDeg);
	TargetAltitudeM = AltitudeM = FMath::Clamp(AltKm * 1000.0, MinAltitudeM, MaxAltitudeM);

	const FVector3d Up = FVector3d(
		FMath::Cos(FMath::DegreesToRadians(Lat)) * FMath::Cos(FMath::DegreesToRadians(Lon)),
		FMath::Cos(FMath::DegreesToRadians(Lat)) * FMath::Sin(FMath::DegreesToRadians(Lon)),
		FMath::Sin(FMath::DegreesToRadians(Lat)));
	const FVector3d North = (FVector3d::UpVector - Up * Up.Z).GetSafeNormal();
	TargetOrientation = Orientation = FRotationMatrix::MakeFromXZ(North, Up).ToQuat();
}

APlanetWorld* APlanetPawn::FindWorld()
{
	if (!World.IsValid())
	{
		for (TActorIterator<APlanetWorld> It(GetWorld()); It; ++It)
		{
			World = *It;
			break;
		}
	}
	return World.Get();
}

void APlanetPawn::Drag(const FVector2D& ScreenDelta)
{
	// Movement slows as the camera nears the ground so the surface follows the hand.
	const double Scale = FMath::Clamp(AltitudeM / 4000000.0, 0.0004, 1.0) * DragRadiansPerPixel;
	const FQuat Pitch(FVector::RightVector, -ScreenDelta.Y * Scale);
	const FQuat Roll(FVector::ForwardVector, ScreenDelta.X * Scale);
	TargetOrientation = (TargetOrientation * Pitch * Roll).GetNormalized();
}

void APlanetPawn::Turn(float ScreenDeltaX)
{
	const FQuat Heading(FVector::UpVector, ScreenDeltaX * 0.004);
	TargetOrientation = (TargetOrientation * Heading).GetNormalized();
}

void APlanetPawn::Zoom(float WheelSteps)
{
	TargetAltitudeM = FMath::Clamp(TargetAltitudeM * FMath::Pow(0.82, (double)WheelSteps), MinAltitudeM, MaxAltitudeM);
}

void APlanetPawn::UpdateCamera(double GroundM)
{
	const FVector3d Up = Orientation.GetAxisZ();
	const FVector3d Forward = Orientation.GetAxisX();
	const double TiltDeg = FixedTiltDeg >= 0.0 ? FixedTiltDeg : TiltForAltitude(AltitudeM);
	const double Tilt = FMath::DegreesToRadians(TiltDeg);

	const FVector3d Look = (-Up * FMath::Cos(Tilt) + Forward * FMath::Sin(Tilt)).GetSafeNormal();
	const FVector3d CamUp = (Forward * FMath::Cos(Tilt) + Up * FMath::Sin(Tilt)).GetSafeNormal();

	SetActorLocationAndRotation(
		Up * (FPlanetGenerator::RadiusCm + (GroundM + AltitudeM) * 100.0),
		FRotationMatrix::MakeFromXZ(Look, CamUp).ToQuat());
}

void APlanetPawn::Tick(float DeltaSeconds)
{
	Super::Tick(DeltaSeconds);

	const double Blend = 1.0 - FMath::Exp(-DeltaSeconds * 8.0);
	AltitudeM = FMath::Exp(FMath::Lerp(FMath::Loge(AltitudeM), FMath::Loge(TargetAltitudeM), Blend));
	Orientation = FQuat::Slerp(Orientation, TargetOrientation, Blend).GetNormalized();

	double GroundM = 0.0;
	if (APlanetWorld* W = FindWorld())
	{
		GroundM = W->GroundHeightM(Orientation.GetAxisZ());
	}
	UpdateCamera(GroundM);
}

APlanetPlayerController::APlanetPlayerController()
{
	bShowMouseCursor = true;
	bEnableClickEvents = false;
	bEnableMouseOverEvents = false;
}

void APlanetPlayerController::BeginPlay()
{
	Super::BeginPlay();
	FInputModeGameAndUI Mode;
	Mode.SetLockMouseToViewportBehavior(EMouseLockMode::DoNotLock);
	Mode.SetHideCursorDuringCapture(false);
	SetInputMode(Mode);
}

void APlanetPlayerController::SetupInputComponent()
{
	Super::SetupInputComponent();
	InputComponent->BindAxisKey(EKeys::MouseWheelAxis, this, &APlanetPlayerController::OnWheel);
	InputComponent->BindKey(EKeys::N, IE_Pressed, this, &APlanetPlayerController::OnNewSeed);
}

void APlanetPlayerController::OnWheel(float Value)
{
	if (Value != 0.0f)
	{
		if (APlanetPawn* P = Cast<APlanetPawn>(GetPawn()))
		{
			P->Zoom(Value);
		}
	}
}

void APlanetPlayerController::OnNewSeed()
{
	for (TActorIterator<APlanetWorld> It(GetWorld()); It; ++It)
	{
		It->SetSeed(FMath::RandRange(1, 2000000000));
		break;
	}
}

void APlanetPlayerController::PlayerTick(float DeltaTime)
{
	Super::PlayerTick(DeltaTime);

	float X = 0.f, Y = 0.f;
	const bool bHasMouse = GetMousePosition(X, Y);
	APlanetPawn* P = Cast<APlanetPawn>(GetPawn());
	if (bHasMouse && bHadMouse && P)
	{
		// Screen Y grows downward; the pawn expects positive Y to mean a move up the screen.
		const FVector2D Delta(X - LastMouse.X, LastMouse.Y - Y);
		if (IsInputKeyDown(EKeys::LeftMouseButton))
		{
			P->Drag(Delta);
		}
		else if (IsInputKeyDown(EKeys::RightMouseButton))
		{
			P->Turn((float)Delta.X);
		}
	}
	bHadMouse = bHasMouse;
	if (bHasMouse)
	{
		LastMouse = FVector2D(X, Y);
	}
}

void APlanetHUD::DrawHUD()
{
	Super::DrawHUD();
	if (!Canvas || !GEngine || FParse::Param(FCommandLine::Get(), TEXT("CreatorNoHud")))
	{
		return;
	}
	int32 Seed = 0;
	for (TActorIterator<APlanetWorld> It(GetWorld()); It; ++It)
	{
		Seed = It->GetSeed();
		break;
	}
	double Altitude = 0.0;
	if (const APlanetPawn* P = Cast<APlanetPawn>(GetOwningPawn()))
	{
		Altitude = P->GetAltitudeKm();
	}
	const FString Text = FString::Printf(TEXT("World %d   |   %.0f km   |   N new world   Drag rotate   Right drag turn   Wheel zoom"), Seed, Altitude);
	DrawText(Text, FLinearColor(0.75f, 0.85f, 1.0f, 0.9f), 24.f, Canvas->SizeY - 44.f, GEngine->GetMediumFont());
}

APlanetGameMode::APlanetGameMode()
{
	PrimaryActorTick.bCanEverTick = true;
	DefaultPawnClass = APlanetPawn::StaticClass();
	PlayerControllerClass = APlanetPlayerController::StaticClass();
	HUDClass = APlanetHUD::StaticClass();
}

void APlanetGameMode::InitGame(const FString& MapName, const FString& Options, FString& ErrorMessage)
{
	Super::InitGame(MapName, Options, ErrorMessage);
	if (AWorldSettings* Settings = GetWorldSettings())
	{
		Settings->bEnableWorldBoundsChecks = false;
	}
}

void APlanetGameMode::StartPlay()
{
	FActorSpawnParameters Params;
	Params.SpawnCollisionHandlingOverride = ESpawnActorCollisionHandlingMethod::AlwaysSpawn;
	PlanetWorld = GetWorld()->SpawnActor<APlanetWorld>(APlanetWorld::StaticClass(), FTransform::Identity, Params);

	Super::StartPlay();

	int32 Seed = FMath::RandRange(1, 2000000000);
	FParse::Value(FCommandLine::Get(), TEXT("CreatorSeed="), Seed);
	PlanetWorld->SetSeed(Seed);

	FParse::Value(FCommandLine::Get(), TEXT("CreatorShot="), ShotPath);
	FParse::Value(FCommandLine::Get(), TEXT("CreatorWait="), ShotWait);
}

void APlanetGameMode::Tick(float DeltaSeconds)
{
	Super::Tick(DeltaSeconds);
	if (!ShotPath.IsEmpty())
	{
		CaptureTick(DeltaSeconds);
	}
}

void APlanetGameMode::CaptureTick(float DeltaSeconds)
{
	if (FramesAfterShot >= 0)
	{
		if (++FramesAfterShot > 30)
		{
			UE_LOG(LogTemp, Display, TEXT("Planet: capture done. Average frame %.2f ms over %d frames, %d chunks visible."),
				SecondsTotal * 1000.0 / FMath::Max(FramesTotal, 1), FramesTotal, PlanetWorld->GetVisibleChunkCount());
			FPlatformMisc::RequestExit(false, TEXT("PlanetCaptureDone"));
		}
		return;
	}

	if (PlanetWorld && PlanetWorld->IsSettled())
	{
		SettledTime += DeltaSeconds;
		SecondsTotal += DeltaSeconds;
		++FramesTotal;
	}
	else
	{
		SettledTime = 0.0;
	}
	// A minimized window has a tiny back buffer, and copying a screenshot from it crashes the renderer.
	const UGameViewportClient* ViewportClient = GetWorld()->GetGameViewport();
	const bool bViewportUsable = ViewportClient && ViewportClient->Viewport
		&& ViewportClient->Viewport->GetSizeXY().X >= 640 && ViewportClient->Viewport->GetSizeXY().Y >= 360;
	if (SettledTime >= ShotWait && bViewportUsable)
	{
		FScreenshotRequest::RequestScreenshot(ShotPath, false, false);
		FramesAfterShot = 0;
	}
}
