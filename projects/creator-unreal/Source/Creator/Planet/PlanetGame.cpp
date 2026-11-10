#include "PlanetGame.h"

#include "PlanetGenerator.h"
#include "PlanetWorld.h"
#include "../Life/NatureWorld.h"
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
	// Closest view is about space-station height: the ground is not detailed enough for lower.
	constexpr double MinAltitudeM = 1500000.0;
	constexpr double MaxAltitudeM = 60000000.0;
	constexpr double DragRadiansPerPixel = 0.0024;
	// Nature camera distance limits (cm). Zooming out past the far limit goes back up to the planet.
	constexpr double NatureMinDist = 300.0;
	constexpr double NatureMaxDist = 900000.0;
	constexpr double NatureDefaultDist = 4500.0;

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

void APlanetPawn::JumpTo(const FVector3d& TargetDir, double AltKm)
{
	const double Alt = FMath::Clamp(AltKm * 1000.0, MinAltitudeM, MaxAltitudeM);
	// The camera stands south of the target so its tilted view lands on it.
	const FVector3d T = TargetDir.GetSafeNormal();
	FVector3d North = (FVector3d::UpVector - T * T.Z).GetSafeNormal();
	if (North.IsNearlyZero())
	{
		North = FVector3d::ForwardVector;
	}
	const double Reach = Alt * FMath::Tan(FMath::DegreesToRadians(TiltForAltitude(Alt))) / FPlanetGenerator::RadiusM;
	const FVector3d Up = (T * FMath::Cos(Reach) - North * FMath::Sin(Reach)).GetSafeNormal();
	const FVector3d CamNorth = (FVector3d::UpVector - Up * Up.Z).GetSafeNormal();
	TargetOrientation = Orientation = FRotationMatrix::MakeFromXZ(CamNorth, Up).ToQuat();
	TargetAltitudeM = AltitudeM = Alt;
}

void APlanetPawn::Drag(const FVector2D& ScreenDelta)
{
	// Movement slows as the camera nears the ground so the surface follows the hand.
	const double Scale = FMath::Clamp(AltitudeM / 4000000.0, 0.0004, 1.0) * DragRadiansPerPixel;
	const FQuat PitchQ(FVector::RightVector, -ScreenDelta.Y * Scale);
	const FQuat Roll(FVector::ForwardVector, ScreenDelta.X * Scale);
	TargetOrientation = (TargetOrientation * PitchQ * Roll).GetNormalized();
}

void APlanetPawn::Turn(float ScreenDeltaX)
{
	const FQuat Heading(FVector::UpVector, ScreenDeltaX * 0.004);
	TargetOrientation = (TargetOrientation * Heading).GetNormalized();
}

void APlanetPawn::Zoom(float WheelSteps)
{
	if (View == ECreatorView::Nature)
	{
		if (WheelSteps < 0.f && TargetDist >= NatureMaxDist * 0.999)
		{
			BeginAscent();
			return;
		}
		TargetDist = FMath::Clamp(TargetDist * FMath::Pow(0.82, (double)WheelSteps), NatureMinDist, NatureMaxDist);
		return;
	}
	if (View != ECreatorView::Planet)
	{
		return;
	}
	// Zooming in past the closest planet view keeps going: down into the nature view.
	if (WheelSteps > 0.f && TargetAltitudeM <= MinAltitudeM * 1.001 && AltitudeM < MinAltitudeM * 1.08)
	{
		BeginDescent(AimDir());
		return;
	}
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

	if (View == ECreatorView::Nature || View == ECreatorView::Ascending)
	{
		if (View == ECreatorView::Nature)
		{
			Fade = FMath::Max(0.f, Fade - DeltaSeconds / 0.9f);
		}
		else
		{
			Fade = FMath::Min(1.f, Fade + DeltaSeconds / 0.55f);
			TargetDist = NatureMaxDist * 3.0;
		}
		TickNatureCamera(DeltaSeconds);
		if (View == ECreatorView::Ascending && Fade >= 1.f)
		{
			LeaveNature();
		}
		return;
	}
	if (View == ECreatorView::Descending)
	{
		Fade = FMath::Min(1.f, Fade + DeltaSeconds / 0.55f);
		if (Fade >= 1.f)
		{
			bArriveAtSpot = true;
			EnterNatureNow(DescentDir, 2500.0);
			bArriveAtSpot = false;
			Fade = 1.f;
			return;
		}
	}
	else
	{
		Fade = FMath::Max(0.f, Fade - DeltaSeconds / 0.8f);
	}

	const double Blend = 1.0 - FMath::Exp(-DeltaSeconds * (View == ECreatorView::Descending ? 3.0 : 8.0));
	AltitudeM = FMath::Exp(FMath::Lerp(FMath::Loge(AltitudeM), FMath::Loge(TargetAltitudeM), Blend));
	Orientation = FQuat::Slerp(Orientation, TargetOrientation, Blend).GetNormalized();

	double GroundM = 0.0;
	if (APlanetWorld* W = FindWorld())
	{
		GroundM = W->GroundHeightM(Orientation.GetAxisZ());
	}
	UpdateCamera(GroundM);
}

FVector3d APlanetPawn::ScreenCenterDir() const
{
	FVector3d Dir;
	if (!RayToPlanet(GetActorLocation(), GetActorForwardVector(), Dir))
	{
		Dir = Orientation.GetAxisZ();
	}
	return Dir;
}

bool APlanetPawn::RayToPlanet(const FVector& Origin, const FVector& Dir, FVector3d& OutDir) const
{
	const FVector3d O(Origin), D = FVector3d(Dir).GetSafeNormal();
	const double R = FPlanetGenerator::RadiusCm;
	const double B = FVector3d::DotProduct(O, D);
	const double C = O.SizeSquared() - R * R;
	const double Disc = B * B - C;
	if (Disc < 0.0)
	{
		return false;
	}
	const double T = -B - FMath::Sqrt(Disc);
	if (T < 0.0)
	{
		return false;
	}
	OutDir = (O + D * T).GetSafeNormal();
	return true;
}

bool APlanetPawn::BeginDescent(const FVector3d& Dir)
{
	APlanetWorld* W = FindWorld();
	if (View != ECreatorView::Planet || !W || !W->GetGenerator())
	{
		return false;
	}
	FVector3d Land;
	if (!ANatureWorld::FindLand(*W->GetGenerator(), Dir, Land))
	{
		Message = TEXT("Only open sea here - aim at land to go down.");
		MessageUntil = FPlatformTime::Seconds() + 3.0;
		return false;
	}
	DescentDir = Land;
	View = ECreatorView::Descending;
	// Keep flying down toward the spot while the view fades through haze.
	JumpTo(Land, AltitudeM / 1000.0);
	TargetAltitudeM = 250000.0;
	return true;
}

void APlanetPawn::EnterNatureNow(const FVector3d& Dir, double DistM)
{
	APlanetWorld* W = FindWorld();
	if (!W || !W->GetGenerator())
	{
		return;
	}
	if (Nature.IsValid())
	{
		Nature->Destroy();
	}
	FActorSpawnParameters Params;
	Params.SpawnCollisionHandlingOverride = ESpawnActorCollisionHandlingMethod::AlwaysSpawn;
	ANatureWorld* N = GetWorld()->SpawnActor<ANatureWorld>(ANatureWorld::StaticClass(), FTransform::Identity, Params);
	const uint32 Spot = GetTypeHash(FIntVector((int32)(Dir.X * 1e5), (int32)(Dir.Y * 1e5), (int32)(Dir.Z * 1e5)));
	N->Build(*W->GetGenerator(), Dir, (int32)(HashCombine((uint32)W->GetSeed(), Spot) & 0x7fffffff));
	Nature = N;
	W->SetSurfaceVisible(false);
	DescentDir = Dir;
	View = ECreatorView::Nature;
	FollowId = 0;
	// Coming down from the planet, arrive exactly at the spot that was aimed at.
	Focus = FocusTarget = bArriveAtSpot
		? FVector(0.0, 0.0, N->GroundCm(0.0, 0.0) + 60.0)
		: N->HerdCenter() + FVector(0, 0, 60.0);
	// Look with the sun behind and a little to the side, so the animals are lit from the front.
	const FVector Sun = N->LocalSunDir();
	Yaw = FMath::Atan2(-Sun.Y, -Sun.X) + FMath::DegreesToRadians(35.0);
	Pitch = -14.0;
	Dist = DistM * 100.0;
	TargetDist = DistM > 100.0 ? NatureDefaultDist : Dist;
	TickNatureCamera(0.f);
}

void APlanetPawn::BeginAscent()
{
	if (View == ECreatorView::Nature)
	{
		View = ECreatorView::Ascending;
	}
}

void APlanetPawn::LeaveNature()
{
	if (Nature.IsValid())
	{
		Nature->Destroy();
	}
	Nature.Reset();
	if (APlanetWorld* W = FindWorld())
	{
		W->SetSurfaceVisible(true);
	}
	View = ECreatorView::Planet;
	FollowId = 0;
	JumpTo(DescentDir, MinAltitudeM / 1000.0 * 1.15);
}

void APlanetPawn::TickNatureCamera(float DeltaSeconds)
{
	ANatureWorld* N = Nature.Get();
	if (!N)
	{
		return;
	}
	Dist = FMath::Exp(FMath::Lerp(FMath::Loge(Dist), FMath::Loge(TargetDist), 1.0 - FMath::Exp(-DeltaSeconds * 2.6)));

	if (bHuntShot)
	{
		int32 Act = 0;
		FVector C;
		FVector2D D;
		const bool bHave = FollowId && N->GetAnimal(FollowId, C, D, Act);
		if (!bHave || Act != 4)
		{
			ChaseSeen = 0.0;
			if (const int32 Id = N->FindChasingHunter())
			{
				FollowId = Id;
			}
			else if (!bHave)
			{
				FollowId = N->FindAnyHunter();
			}
		}
		else
		{
			ChaseSeen += DeltaSeconds;
		}
	}

	if (FollowId)
	{
		FVector C;
		FVector2D D;
		int32 Act = 0;
		if (N->GetAnimal(FollowId, C, D, Act))
		{
			FocusTarget = C;
			if (bHuntShot)
			{
				// From the side and a little behind, so the hunter and the prey ahead are both in frame.
				FocusTarget += FVector(D.X, D.Y, 0.0) * 700.0;
				const double Want = FMath::Atan2(D.Y, D.X) + FMath::DegreesToRadians(-62.0);
				Yaw += FMath::UnwindRadians(Want - Yaw) * FMath::Min(1.0, DeltaSeconds * 1.5);
			}
		}
		else
		{
			FollowId = 0;
		}
	}
	Focus += (FocusTarget - Focus) * (DeltaSeconds <= 0.f ? 1.0 : FMath::Min(1.0, DeltaSeconds * 4.0));

	// High up, the view tips down so the descent looks at the land, not the horizon.
	const double High = FMath::Clamp(FMath::LogX(10.0, FMath::Max(Dist, 1.0) / 30000.0) / 1.3, 0.0, 1.0);
	const double P = FMath::DegreesToRadians(FMath::Lerp(Pitch, -52.0, High));
	const FVector Fwd(FMath::Cos(P) * FMath::Cos(Yaw), FMath::Cos(P) * FMath::Sin(Yaw), FMath::Sin(P));
	FVector Cam = Focus - Fwd * Dist;
	const double Ground = N->GroundCm(Cam.X, Cam.Y) + 150.0;
	Cam.Z = FMath::Max(Cam.Z, Ground);
	const FVector Look = (Focus - Cam).GetSafeNormal();
	const FTransform Xf = N->GetActorTransform();
	SetActorLocationAndRotation(Xf.TransformPosition(Cam), Xf.TransformRotation(FRotationMatrix::MakeFromXZ(Look, FVector::UpVector).ToQuat()));
}

void APlanetPawn::NatureOrbit(const FVector2D& Delta)
{
	Yaw += Delta.X * 0.005;
	Pitch = FMath::Clamp(Pitch - Delta.Y * 0.2, -85.0, -2.0);
}

void APlanetPawn::NaturePan(const FVector2D& Delta)
{
	ANatureWorld* N = Nature.Get();
	if (!N)
	{
		return;
	}
	FollowId = 0;
	bHuntShot = false;
	const FVector F(FMath::Cos(Yaw), FMath::Sin(Yaw), 0.0), R(-FMath::Sin(Yaw), FMath::Cos(Yaw), 0.0);
	FocusTarget += (-R * Delta.X - F * Delta.Y) * (Dist * 0.0016);
	FocusTarget.X = FMath::Clamp(FocusTarget.X, -500000.0, 500000.0);
	FocusTarget.Y = FMath::Clamp(FocusTarget.Y, -500000.0, 500000.0);
	FocusTarget.Z = N->GroundCm(FocusTarget.X, FocusTarget.Y) + 60.0;
}

void APlanetPawn::ClickAt(const FVector& Origin, const FVector& Dir)
{
	ANatureWorld* N = Nature.Get();
	if (View == ECreatorView::Planet)
	{
		FVector3d Hit;
		if (RayToPlanet(Origin, Dir, Hit))
		{
			BeginDescent(Hit);
		}
		return;
	}
	if (View != ECreatorView::Nature || !N)
	{
		return;
	}
	bHuntShot = false;
	if (const int32 Id = N->PickAnimal(Origin, Dir))
	{
		FollowId = Id;
		TargetDist = FMath::Min(TargetDist, 2500.0);
		return;
	}
	FollowId = 0;
	FVector G;
	if (N->PickGround(Origin, Dir, G))
	{
		FocusTarget = G + FVector(0, 0, 60.0);
	}
}

bool APlanetPawn::IsShotReady() const
{
	return !bHuntShot || ChaseSeen > 1.2;
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
	InputComponent->BindKey(EKeys::E, IE_Pressed, this, &APlanetPlayerController::OnEnter);
	InputComponent->BindKey(EKeys::Escape, IE_Pressed, this, &APlanetPlayerController::OnLeave);
	InputComponent->BindKey(EKeys::Q, IE_Pressed, this, &APlanetPlayerController::OnLeave);
	InputComponent->BindKey(EKeys::T, IE_Pressed, this, &APlanetPlayerController::OnTime);
}

void APlanetPlayerController::OnEnter()
{
	if (APlanetPawn* P = Cast<APlanetPawn>(GetPawn()))
	{
		if (P->GetView() == ECreatorView::Planet)
		{
			P->BeginDescent(P->AimDir());
		}
	}
}

void APlanetPlayerController::OnLeave()
{
	if (APlanetPawn* P = Cast<APlanetPawn>(GetPawn()))
	{
		P->BeginAscent();
	}
}

void APlanetPlayerController::OnTime()
{
	APlanetPawn* P = Cast<APlanetPawn>(GetPawn());
	if (ANatureWorld* N = P ? P->GetNature() : nullptr)
	{
		N->TimeScale = N->TimeScale == 1.0 ? 5.0 : 1.0;
	}
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
	const APlanetPawn* P = Cast<APlanetPawn>(GetPawn());
	if (P && P->GetView() != ECreatorView::Planet)
	{
		return;
	}
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
	if (P)
	{
		FVector O, D;
		P->bMouseAimValid = bHasMouse && P->GetView() == ECreatorView::Planet
			&& DeprojectScreenPositionToWorld(X, Y, O, D) && P->RayToPlanet(O, D, P->MouseAim);
	}
	if (bHasMouse && bHadMouse && P)
	{
		// Screen Y grows downward; the pawn expects positive Y to mean a move up the screen.
		const FVector2D Delta(X - LastMouse.X, LastMouse.Y - Y);
		const bool bNature = P->GetView() == ECreatorView::Nature;
		if (IsInputKeyDown(EKeys::LeftMouseButton))
		{
			PressMoved += Delta.Size();
			if (bNature) P->NatureOrbit(Delta);
			else if (P->GetView() == ECreatorView::Planet) P->Drag(Delta);
		}
		else if (IsInputKeyDown(EKeys::RightMouseButton))
		{
			if (bNature) P->NaturePan(Delta);
			else if (P->GetView() == ECreatorView::Planet) P->Turn((float)Delta.X);
		}
	}
	// A click (press and release without dragging) picks an animal, or goes down to the land.
	const bool bDown = IsInputKeyDown(EKeys::LeftMouseButton);
	if (bDown && !bWasDown)
	{
		PressMoved = 0.0;
	}
	if (!bDown && bWasDown && PressMoved < 6.0 && P && bHasMouse)
	{
		FVector O, D;
		if (DeprojectScreenPositionToWorld(X, Y, O, D))
		{
			P->ClickAt(O, D);
		}
	}
	bWasDown = bDown;
	bHadMouse = bHasMouse;
	if (bHasMouse)
	{
		LastMouse = FVector2D(X, Y);
	}
}

void APlanetHUD::DrawHUD()
{
	Super::DrawHUD();
	if (!Canvas || !GEngine)
	{
		return;
	}
	const APlanetPawn* Pawn = Cast<APlanetPawn>(GetOwningPawn());
	if (Pawn && Pawn->GetFade() > 0.f)
	{
		// The fly-through haze between the planet and the ground.
		DrawRect(FLinearColor(0.01f, 0.012f, 0.02f, Pawn->GetFade()), 0.f, 0.f, Canvas->SizeX, Canvas->SizeY);
	}
	if (FParse::Param(FCommandLine::Get(), TEXT("CreatorNoHud")))
	{
		return;
	}
	const FLinearColor TextColor(0.75f, 0.85f, 1.0f, 0.9f);
	if (Pawn && !Pawn->Message.IsEmpty() && FPlatformTime::Seconds() < Pawn->MessageUntil)
	{
		DrawText(Pawn->Message, FLinearColor(1.f, 0.85f, 0.6f, 1.f), 24.f, Canvas->SizeY - 80.f, GEngine->GetMediumFont());
	}
	if (Pawn && Pawn->GetView() == ECreatorView::Nature)
	{
		if (const ANatureWorld* N = Pawn->GetNature())
		{
			DrawText(N->HudLine(), TextColor, 24.f, Canvas->SizeY - 70.f, GEngine->GetMediumFont());
			DrawText(TEXT("Drag orbit   Right drag move   Wheel zoom (all the way out = back to the planet)   Click an animal to follow   T time x5   Esc / Q planet"),
				TextColor, 24.f, Canvas->SizeY - 44.f, GEngine->GetMediumFont());
			const FString Panel = Pawn->GetFollowId() ? N->AnimalPanel(Pawn->GetFollowId()) : FString();
			if (!Panel.IsEmpty())
			{
				TArray<FString> Lines;
				Panel.ParseIntoArrayLines(Lines);
				DrawRect(FLinearColor(0.f, 0.f, 0.f, 0.45f), 16.f, 16.f, 430.f, 16.f + 24.f * Lines.Num());
				for (int32 I = 0; I < Lines.Num(); ++I)
				{
					DrawText(Lines[I], I == 0 ? FLinearColor(1.f, 0.92f, 0.7f, 1.f) : FLinearColor(0.9f, 0.92f, 0.95f, 1.f),
						28.f, 24.f + 24.f * I, GEngine->GetMediumFont());
				}
			}
		}
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
	const FString Text = FString::Printf(TEXT("World %d   |   %.0f km   |   N new world   Drag rotate   Right drag turn   Wheel zoom (keep going in to land)   E or click land: go down to the animals"), Seed, Altitude);
	DrawText(Text, TextColor, 24.f, Canvas->SizeY - 44.f, GEngine->GetMediumFont());
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

	// -CreatorZoom=far|mid|near frames a whole globe, a continent, or mountains near the ground.
	FString Zoom;
	if (FParse::Value(FCommandLine::Get(), TEXT("CreatorZoom="), Zoom))
	{
		APlayerController* PC = GetWorld()->GetFirstPlayerController();
		APlanetPawn* Pawn = PC ? Cast<APlanetPawn>(PC->GetPawn()) : nullptr;
		UE_LOG(LogTemp, Display, TEXT("Planet: zoom preset '%s', pawn %s."), *Zoom, Pawn ? TEXT("found") : TEXT("missing"));
		if (Pawn)
		{
			const FVector3d Sun = APlanetWorld::GetSunDirection();
			if (Zoom == TEXT("far"))
			{
				// Mostly the day side, with the night edge just showing on one limb.
				const FVector3d Side = FVector3d::CrossProduct(Sun, FVector3d::UpVector).GetSafeNormal();
				Pawn->JumpTo((Sun + Side * 0.42 + FVector3d::UpVector * 0.1).GetSafeNormal(), 19000.0);
			}
			else if (Zoom == TEXT("mid"))
			{
				Pawn->JumpTo(PlanetWorld->FindScenicSpot(0), 2600.0);
			}
			else if (Zoom == TEXT("near"))
			{
				double AltKm = 5.0;
				FParse::Value(FCommandLine::Get(), TEXT("CreatorAltKm="), AltKm);
				Pawn->JumpTo(PlanetWorld->FindScenicSpot(1), AltKm);
			}
		}
	}

	// -CreatorNature starts on the ground at a sunlit spot. Options: -CreatorNatureDist=<m> camera distance,
	// -CreatorPitch=<deg>, -CreatorSimSeconds=<s> extra life before the shot, -CreatorFollow=hunt.
	if (FParse::Param(FCommandLine::Get(), TEXT("CreatorNature")))
	{
		APlayerController* PC = GetWorld()->GetFirstPlayerController();
		APlanetPawn* Pawn = PC ? Cast<APlanetPawn>(PC->GetPawn()) : nullptr;
		if (Pawn && PlanetWorld->GetGenerator())
		{
			FVector3d Spot = PlanetWorld->FindScenicSpot(0), Land;
			if (ANatureWorld::FindLand(*PlanetWorld->GetGenerator(), Spot, Land))
			{
				Spot = Land;
			}
			double DistM = 45.0, PitchDeg = -14.0;
			int32 SimSeconds = 0;
			FString Follow;
			FParse::Value(FCommandLine::Get(), TEXT("CreatorNatureDist="), DistM);
			FParse::Value(FCommandLine::Get(), TEXT("CreatorPitch="), PitchDeg);
			FParse::Value(FCommandLine::Get(), TEXT("CreatorSimSeconds="), SimSeconds);
			Pawn->EnterNatureNow(Spot, DistM);
			Pawn->SetNaturePitch(PitchDeg);
			Pawn->SetNatureDist(DistM);
			if (SimSeconds > 0 && Pawn->GetNature())
			{
				Pawn->GetNature()->RunSim(SimSeconds * 10);
			}
			if (FParse::Value(FCommandLine::Get(), TEXT("CreatorFollow="), Follow) && Follow == TEXT("hunt"))
			{
				Pawn->StartHuntShot();
			}
		}
	}

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

	APlayerController* PC = GetWorld()->GetFirstPlayerController();
	const APlanetPawn* Pawn = PC ? Cast<APlanetPawn>(PC->GetPawn()) : nullptr;
	// A hunt shot waits (up to a minute) until a hunter is really chasing.
	const bool bPawnReady = !Pawn || Pawn->IsShotReady() || SecondsTotal > 60.0;
	if (PlanetWorld && PlanetWorld->IsSettled() && (bPawnReady || SettledTime < ShotWait))
	{
		SettledTime += DeltaSeconds;
		SecondsTotal += DeltaSeconds;
		++FramesTotal;
	}
	else
	{
		SettledTime = 0.0;
	}
	// A high-resolution shot renders the view again into its own 1600x900 target, so it works the
	// same in an offscreen or minimized window. (A plain screenshot copies the window's back buffer,
	// which shrinks to 8x8 when the window is minimized and crashed the renderer.)
	UGameViewportClient* ViewportClient = GetWorld()->GetGameViewport();
	if (SettledTime >= ShotWait && ViewportClient && ViewportClient->Viewport)
	{
		FHighResScreenshotConfig& Config = GetHighResScreenshotConfig();
		Config.SetResolution(1600, 900);
		Config.SetFilename(ShotPath);
		Config.SetHDRCapture(false);
		ViewportClient->Viewport->TakeHighResScreenShot();
		FramesAfterShot = 0;
	}
}
