#include "PlanetWorld.h"

#include "PlanetGenerator.h"
#include "Async/ParallelFor.h"
#include "Camera/PlayerCameraManager.h"
#include "Components/DirectionalLightComponent.h"
#include "Components/SkyAtmosphereComponent.h"
#include "Components/SkyLightComponent.h"
#include "Components/StaticMeshComponent.h"
#include "Misc/CommandLine.h"
#include "Misc/Parse.h"
#include "Containers/Queue.h"
#include "Engine/StaticMesh.h"
#include "Engine/Texture2D.h"
#include "GameFramework/PlayerController.h"
#include "HAL/PlatformTime.h"
#include "Kismet/GameplayStatics.h"
#include "Materials/MaterialInstanceDynamic.h"
#include "Materials/MaterialInterface.h"
#include "MaterialShared.h"
#include "Materials/Material.h"
#include "RHIGlobals.h"
#include "ProceduralMeshComponent.h"
#include "RenderingThread.h"
#include "ShaderCompiler.h"
#include "Tasks/Task.h"
#include "TextureResource.h"

namespace
{
	constexpr int32 GridQuads = 32;
	constexpr int32 MaxLevel = 15;
	constexpr int32 MaxBuildsInFlight = 48;
	constexpr double SplitPixels = 3.0;
	constexpr int32 MaxLiveChunks = 5000; // Memory guard: stop refining rather than run away.
	constexpr double MeshUploadBudgetSeconds = 0.006;
	constexpr double CleanupAfterSeconds = 4.0;
	constexpr double MaxReliefCm = 9000.0 * 100.0 * FPlanetGenerator::VerticalScale;
	constexpr double CameraNearPad = 5000000.0; // cm, keeps nearby chunks out of the culling tests.
	constexpr double CloudAltitudeCm = 1200000.0; // 12 km, above nearly all of the exaggerated relief.
	const FVector3d SunDirection = FVector3d(0.72, -0.62, 0.32).GetSafeNormal(); // Points toward the sun.

	const FVector3d FaceNormals[6] = {
		{1, 0, 0}, {-1, 0, 0}, {0, 1, 0}, {0, -1, 0}, {0, 0, 1}, {0, 0, -1}
	};
	const FVector3d FaceRight[6] = {
		{0, 1, 0}, {0, -1, 0}, {-1, 0, 0}, {1, 0, 0}, {0, 1, 0}, {0, 1, 0}
	};

	FVector3d CubeToDir(int32 Face, double A, double B)
	{
		const FVector3d Up = FVector3d::CrossProduct(FaceNormals[Face], FaceRight[Face]);
		const double Ta = FMath::Tan(A * UE_DOUBLE_PI * 0.25);
		const double Tb = FMath::Tan(B * UE_DOUBLE_PI * 0.25);
		return (FaceNormals[Face] + FaceRight[Face] * Ta + Up * Tb).GetSafeNormal();
	}

	const TArray<int32>& SharedIndices()
	{
		static const TArray<int32> Indices = []
		{
			TArray<int32> Out;
			const int32 Row = GridQuads + 1;
			Out.Reserve(GridQuads * GridQuads * 6 + GridQuads * 4 * 12);
			for (int32 Y = 0; Y < GridQuads; ++Y)
			{
				for (int32 X = 0; X < GridQuads; ++X)
				{
					const int32 I = Y * Row + X;
					Out.Add(I); Out.Add(I + Row); Out.Add(I + 1);
					Out.Add(I + 1); Out.Add(I + Row); Out.Add(I + Row + 1);
				}
			}
			// A skirt hangs from the chunk border and hides gaps between detail levels.
			TArray<int32> Border;
			for (int32 X = 0; X < GridQuads; ++X) { Border.Add(X); }
			for (int32 Y = 0; Y < GridQuads; ++Y) { Border.Add(Y * Row + GridQuads); }
			for (int32 X = GridQuads; X > 0; --X) { Border.Add(GridQuads * Row + X); }
			for (int32 Y = GridQuads; Y > 0; --Y) { Border.Add(Y * Row); }
			const int32 SkirtStart = Row * Row;
			for (int32 i = 0; i < Border.Num(); ++i)
			{
				const int32 J = (i + 1) % Border.Num();
				const int32 A = Border[i], B = Border[J], Sa = SkirtStart + i, Sb = SkirtStart + J;
				Out.Add(A); Out.Add(B); Out.Add(Sa);
				Out.Add(B); Out.Add(Sb); Out.Add(Sa);
				Out.Add(A); Out.Add(Sa); Out.Add(B);
				Out.Add(B); Out.Add(Sa); Out.Add(Sb);
			}
			return Out;
		}();
		return Indices;
	}
}

struct FPlanetNode
{
	enum class EState : uint8 { None, Building, Ready };

	int32 Face = 0;
	int32 Level = 0;
	int32 X = 0;
	int32 Y = 0;
	FVector3d CenterDir = FVector3d::ZeroVector;
	FVector3d Center = FVector3d::ZeroVector;
	double BoundRadius = 0.0;
	double SpacingCm = 0.0;
	double AngularRadius = 0.0;
	double LastNeeded = 0.0;
	double Priority = 0.0;
	EState State = EState::None;
	bool bShown = false;
	UProceduralMeshComponent* Mesh = nullptr;
	TUniquePtr<FPlanetNode> Children[4];

	bool HasChildren() const { return Children[0].IsValid(); }
};

struct FPlanetChunkData
{
	FPlanetNode* Node = nullptr;
	int32 Generation = 0;
	FVector3d Origin = FVector3d::ZeroVector;
	TArray<FVector> Positions;
	TArray<FVector> Normals;
	TArray<FVector2D> UV0;
	TArray<FColor> Colors;
};

struct FPlanetBuildQueue
{
	TQueue<TUniquePtr<FPlanetChunkData>, EQueueMode::Mpsc> Finished;
};

namespace
{
	TUniquePtr<FPlanetNode> MakeNode(int32 Face, int32 Level, int32 X, int32 Y)
	{
		TUniquePtr<FPlanetNode> Node = MakeUnique<FPlanetNode>();
		Node->Face = Face;
		Node->Level = Level;
		Node->X = X;
		Node->Y = Y;
		const double Size = 2.0 / (double)(1 << Level);
		const double A = -1.0 + X * Size, B = -1.0 + Y * Size;
		Node->CenterDir = CubeToDir(Face, A + Size * 0.5, B + Size * 0.5);
		Node->Center = Node->CenterDir * FPlanetGenerator::RadiusCm;

		double MaxChord = 0.0;
		for (int32 Corner = 0; Corner < 4; ++Corner)
		{
			const FVector3d D = CubeToDir(Face, A + (Corner & 1) * Size, B + (Corner >> 1) * Size);
			MaxChord = FMath::Max(MaxChord, FVector3d::Distance(D * FPlanetGenerator::RadiusCm, Node->Center));
		}
		Node->BoundRadius = MaxChord + MaxReliefCm;
		Node->AngularRadius = FMath::Asin(FMath::Clamp(MaxChord / FPlanetGenerator::RadiusCm, 0.0, 1.0));
		Node->SpacingCm = MaxChord * 2.0 / FMath::Sqrt(2.0) / GridQuads;
		return Node;
	}

	TUniquePtr<FPlanetChunkData> BuildChunk(const FPlanetGenerator& Gen, int32 Face, int32 Level, int32 NodeX, int32 NodeY)
	{
		const double Size = 2.0 / (double)(1 << Level);
		const double A0 = -1.0 + NodeX * Size, B0 = -1.0 + NodeY * Size;
		const double Step = Size / GridQuads;
		const int32 Extra = Level >= 7 ? FMath::Clamp((Level - 6) * 1, 1, 8) : 0;
		// Lighting relief is boosted from far away and eases off near the ground.
		const double ShadeBoost = FMath::Lerp(3.5, 1.2, FMath::Clamp(Level / 11.0, 0.0, 1.0));

		const int32 Row = GridQuads + 3;
		TArray<FPlanetSample> Samples;
		TArray<FVector3d> Dirs;
		Samples.SetNum(Row * Row);
		Dirs.SetNum(Row * Row);
		for (int32 Y = 0; Y < Row; ++Y)
		{
			for (int32 X = 0; X < Row; ++X)
			{
				const FVector3d D = CubeToDir(Face, A0 + (X - 1) * Step, B0 + (Y - 1) * Step);
				Dirs[Y * Row + X] = D;
				Samples[Y * Row + X] = Gen.Sample(D, Extra);
			}
		}

		TUniquePtr<FPlanetChunkData> Out = MakeUnique<FPlanetChunkData>();
		const FVector3d Origin = CubeToDir(Face, A0 + Size * 0.5, B0 + Size * 0.5) * FPlanetGenerator::RadiusCm;
		Out->Origin = Origin;

		const int32 Border = GridQuads * 4;
		const int32 VertCount = (GridQuads + 1) * (GridQuads + 1) + Border;
		Out->Positions.Reserve(VertCount);
		Out->Normals.Reserve(VertCount);
		Out->UV0.Reserve(VertCount);
		Out->Colors.Reserve(VertCount);

		auto ShadedPoint = [&](int32 X, int32 Y)
		{
			return Dirs[Y * Row + X] * (FPlanetGenerator::RadiusCm + FPlanetGenerator::MeshHeightM(Samples[Y * Row + X]) * ShadeBoost * 100.0);
		};
		auto AddVertex = [&](int32 GridX, int32 GridY, double DropCm)
		{
			const int32 X = GridX + 1, Y = GridY + 1;
			const FPlanetSample& S = Samples[Y * Row + X];
			const FVector3d& D = Dirs[Y * Row + X];
			const double RadiusCm = FPlanetGenerator::RadiusCm + FPlanetGenerator::MeshHeightM(S) * 100.0 - DropCm;
			Out->Positions.Add(FVector(D * RadiusCm - Origin));

			const FVector3d Dx = ShadedPoint(X + 1, Y) - ShadedPoint(X - 1, Y);
			const FVector3d Dy = ShadedPoint(X, Y + 1) - ShadedPoint(X, Y - 1);
			FVector3d N = FVector3d::CrossProduct(Dx, Dy).GetSafeNormal();
			if (FVector3d::DotProduct(N, D) < 0.0) { N = -N; }
			Out->Normals.Add(FVector(N));

			Out->UV0.Add(FVector2D(S.Roughness, 0.0));
			// The colour is stored as its square root so dark oceans keep their precision in 8 bits.
			Out->Colors.Add(FColor(
				(uint8)FMath::Clamp(FMath::Sqrt(S.Albedo.X) * 255.0f + 0.5f, 0.0f, 255.0f),
				(uint8)FMath::Clamp(FMath::Sqrt(S.Albedo.Y) * 255.0f + 0.5f, 0.0f, 255.0f),
				(uint8)FMath::Clamp(FMath::Sqrt(S.Albedo.Z) * 255.0f + 0.5f, 0.0f, 255.0f),
				(uint8)FMath::Clamp(S.Ocean * 255.0f + 0.5f, 0.0f, 255.0f)));
		};

		for (int32 Y = 0; Y <= GridQuads; ++Y)
		{
			for (int32 X = 0; X <= GridQuads; ++X)
			{
				AddVertex(X, Y, 0.0);
			}
		}
		const double Spacing = FPlanetGenerator::RadiusCm * UE_DOUBLE_PI * 0.5 / ((1 << Level) * (double)GridQuads);
		const double Drop = FMath::Max(Spacing * 1.2, 30000.0);
		for (int32 X = 0; X < GridQuads; ++X) { AddVertex(X, 0, Drop); }
		for (int32 Y = 0; Y < GridQuads; ++Y) { AddVertex(GridQuads, Y, Drop); }
		for (int32 X = GridQuads; X > 0; --X) { AddVertex(X, GridQuads, Drop); }
		for (int32 Y = GridQuads; Y > 0; --Y) { AddVertex(0, Y, Drop); }
		return Out;
	}
}

APlanetWorld::APlanetWorld()
{
	PrimaryActorTick.bCanEverTick = true;
	PrimaryActorTick.TickGroup = TG_PostUpdateWork;
	Root = CreateDefaultSubobject<USceneComponent>(TEXT("Root"));
	Root->SetMobility(EComponentMobility::Movable);
	SetRootComponent(Root);
}

APlanetWorld::~APlanetWorld() = default;

void APlanetWorld::CreateSkyAndSun()
{
	// The sky system measures in kilometres; the planet's centre sits at the actor origin.
	Atmosphere = NewObject<USkyAtmosphereComponent>(this, TEXT("Atmosphere"));
	Atmosphere->TransformMode = ESkyAtmosphereTransformMode::PlanetCenterAtComponentTransform;
	Atmosphere->SetupAttachment(Root);
	// The atmosphere's own ground sphere sits 2 km under sea level. At exactly sea level it
	// z-fights with the ocean and the sky shows through the water as glitter and curved bands.
	Atmosphere->SetBottomRadius((float)((FPlanetGenerator::RadiusM - 2000.0) / 1000.0));
	Atmosphere->SetAtmosphereHeight(102.0f);
	Atmosphere->RegisterComponent();

	Sun = NewObject<UDirectionalLightComponent>(this, TEXT("Sun"));
	Sun->SetMobility(EComponentMobility::Movable);
	Sun->SetupAttachment(Root);
	Sun->SetWorldRotation((-FVector(SunDirection)).Rotation());
	Sun->SetIntensity(11.0f);
	Sun->SetLightColor(FLinearColor(1.0f, 0.97f, 0.92f));
	Sun->SetAtmosphereSunLight(true);
	Sun->bPerPixelAtmosphereTransmittance = true;
	Sun->CastShadows = true;
	Sun->DynamicShadowDistanceMovableLight = 0.0f;
	Sun->RegisterComponent();

	SkyLight = NewObject<USkyLightComponent>(this, TEXT("SkyLight"));
	SkyLight->SetMobility(EComponentMobility::Movable);
	SkyLight->SetupAttachment(Root);
	SkyLight->bRealTimeCapture = true;
	SkyLight->SourceType = SLS_CapturedScene;
	SkyLight->SetIntensity(1.0f);
	SkyLight->SetVisibility(!FParse::Param(FCommandLine::Get(), TEXT("CreatorNoSkyLight")));
	SkyLight->RegisterComponent();

	// Clouds are a thin translucent shell around the planet. The volumetric cloud renderer was tried
	// first, but seen from orbit its ray march is far too sparse: it covered the globe in speckles and
	// dark arcs. The shell is drawn with its own lighting, so it is identical in every frame.
	if (UMaterialInterface* Base = LoadObject<UMaterialInterface>(nullptr, TEXT("/Game/Planet/M_PlanetClouds.M_PlanetClouds")))
	{
		CloudMaterial = UMaterialInstanceDynamic::Create(Base, this);
		CloudMaterial->SetVectorParameterValue(TEXT("SunDir"), FLinearColor(FVector(SunDirection)));
		if (!FParse::Param(FCommandLine::Get(), TEXT("CreatorNoClouds")))
		{
			BuildCloudShell();
		}
	}
	else
	{
		UE_LOG(LogTemp, Error, TEXT("Planet: cloud material missing. Run Scripts/build_planet_assets.py."));
	}

	UStaticMesh* Sphere = LoadObject<UStaticMesh>(nullptr, TEXT("/Engine/BasicShapes/Sphere.Sphere"));
	UMaterialInterface* StarMaterial = LoadObject<UMaterialInterface>(nullptr, TEXT("/Game/Planet/M_PlanetStars.M_PlanetStars"));
	if (Sphere && StarMaterial && !FParse::Param(FCommandLine::Get(), TEXT("CreatorNoStars")))
	{
		StarDome = NewObject<UStaticMeshComponent>(this, TEXT("StarDome"));
		StarDome->SetMobility(EComponentMobility::Movable);
		StarDome->SetupAttachment(Root);
		StarDome->SetStaticMesh(Sphere);
		StarDome->SetMaterial(0, StarMaterial);
		StarDome->SetCollisionEnabled(ECollisionEnabled::NoCollision);
		StarDome->SetCastShadow(false);
		StarDome->bAffectDistanceFieldLighting = false;
		// Kept out of the sky light capture: otherwise the ocean mirrors thousands of stars as speckles.
		StarDome->bVisibleInRealTimeSkyCaptures = false;
		StarDome->bVisibleInReflectionCaptures = false;
		StarDome->SetWorldScale3D(FVector(4.0e8)); // Radius 2e10 cm, well outside any camera position.
		StarDome->SetBoundsScale(100.0f);
		StarDome->RegisterComponent();
	}

	if (UMaterialInterface* Base = LoadObject<UMaterialInterface>(nullptr, TEXT("/Game/Planet/M_PlanetTerrain.M_PlanetTerrain")))
	{
		TerrainMaterial = UMaterialInstanceDynamic::Create(Base, this);
		TerrainMaterial->SetVectorParameterValue(TEXT("SunDir"), FLinearColor(FVector(SunDirection)));
	}
	else
	{
		UE_LOG(LogTemp, Error, TEXT("Planet: terrain material missing. Run Scripts/build_planet_assets.py."));
	}
}

void APlanetWorld::BuildCloudShell()
{
	// A cube sphere: no pole pinching and an even triangle size everywhere. 96 quads per face keep
	// the facets within about 120 m of the true sphere, invisible at any zoom.
	constexpr int32 Quads = 96;
	const double RadiusCm = FPlanetGenerator::RadiusCm + CloudAltitudeCm;
	CloudShell = NewObject<UProceduralMeshComponent>(this, TEXT("CloudShell"));
	CloudShell->SetMobility(EComponentMobility::Movable);
	CloudShell->SetCollisionEnabled(ECollisionEnabled::NoCollision);
	CloudShell->SetCastShadow(false);
	CloudShell->SetupAttachment(Root);
	CloudShell->RegisterComponent();

	TArray<int32> Indices;
	const int32 Row = Quads + 1;
	Indices.Reserve(Quads * Quads * 6);
	for (int32 Y = 0; Y < Quads; ++Y)
	{
		for (int32 X = 0; X < Quads; ++X)
		{
			const int32 I = Y * Row + X;
			Indices.Append({ I, I + Row, I + 1, I + 1, I + Row, I + Row + 1 });
		}
	}
	for (int32 Face = 0; Face < 6; ++Face)
	{
		TArray<FVector> Positions, Normals;
		Positions.Reserve(Row * Row);
		Normals.Reserve(Row * Row);
		for (int32 Y = 0; Y <= Quads; ++Y)
		{
			for (int32 X = 0; X <= Quads; ++X)
			{
				const FVector3d D = CubeToDir(Face, -1.0 + 2.0 * X / Quads, -1.0 + 2.0 * Y / Quads);
				Positions.Add(FVector(D * RadiusCm));
				Normals.Add(FVector(D));
			}
		}
		CloudShell->CreateMeshSection(Face, Positions, Indices, Normals, TArray<FVector2D>(), TArray<FColor>(), TArray<FProcMeshTangent>(), false);
		CloudShell->SetMaterial(Face, CloudMaterial);
	}
}

FVector3d APlanetWorld::GetSunDirection()
{
	return SunDirection;
}

FVector3d APlanetWorld::FindScenicSpot(int32 Kind) const
{
	if (!Generator.IsValid())
	{
		return SunDirection;
	}
	const FPlanetGenerator& Gen = *Generator;
	FRandomStream R(Gen.GetSeed() ^ 0x3C1A);
	// Neighbour distance in radians: about 400 km for coastlines, 60 km for mountains.
	const double Reach = Kind == 0 ? 0.06 : 0.01;
	FVector3d Best = SunDirection;
	double BestScore = -1.0e9;
	for (int32 i = 0; i < 3000; ++i)
	{
		const FVector3d D = R.GetUnitVector();
		const double SunCos = FVector3d::DotProduct(D, SunDirection);
		// Well lit, but with the sun low enough that relief casts readable shading.
		if (SunCos < (Kind == 0 ? 0.7 : 0.45) || SunCos > (Kind == 0 ? 0.98 : 0.8) || FMath::Abs(D.Z) > 0.75)
		{
			continue;
		}
		// Clear skies only, so the view is of the ground and not the top of a cloud deck.
		if (Gen.CloudCover(D) > (Kind == 0 ? 0.6 : 0.12))
		{
			continue;
		}
		const FPlanetSample S = Gen.Sample(D, 0);
		const FVector3d T1 = FVector3d::CrossProduct(D, FVector3d::UpVector).GetSafeNormal();
		const FVector3d T2 = FVector3d::CrossProduct(D, T1);
		int32 Wet = 0;
		double Highest = S.HeightM, Lowest = S.HeightM;
		for (int32 k = 0; k < 8; ++k)
		{
			const double A = k * UE_DOUBLE_PI / 4.0;
			const FPlanetSample N = Gen.Sample((D + (T1 * FMath::Cos(A) + T2 * FMath::Sin(A)) * Reach).GetSafeNormal(), 0);
			Wet += N.HeightM < 0.0 ? 1 : 0;
			Highest = FMath::Max(Highest, N.HeightM);
			Lowest = FMath::Min(Lowest, N.HeightM);
		}
		double Score;
		if (Kind == 0)
		{
			// Mostly land with some sea in view.
			Score = (S.HeightM > 0.0 ? 2.0 : 0.0) - FMath::Abs(Wet - 3) * 0.5 + FMath::Min(Highest, 4000.0) / 4000.0;
		}
		else
		{
			// Steep relief (a big drop within ~60 km) on land, ideally running down to the sea.
			Score = (S.HeightM > 200.0 ? 1.0 : -5.0) + FMath::Min(Highest - FMath::Max(Lowest, 0.0), 6000.0) / 1000.0 + (Wet > 0 && Wet < 5 ? 2.0 : 0.0);
		}
		if (Score > BestScore)
		{
			BestScore = Score;
			Best = D;
		}
	}
	return Best;
}

bool APlanetWorld::MaterialsReady() const
{
	// Uncooked runs compile shaders on demand; a capture waits until nothing is compiling, so
	// no chunk is drawn with the grey placeholder material. Cooked builds have nothing to wait for.
#if WITH_EDITOR
	if (GShaderCompilingManager && GShaderCompilingManager->IsCompiling())
	{
		return false;
	}
#endif
	return TerrainMaterial != nullptr;
}

void APlanetWorld::BeginPlay()
{
	Super::BeginPlay();
	BuildQueue = MakeShared<FPlanetBuildQueue, ESPMode::ThreadSafe>();
	CreateSkyAndSun();
	if (!Generator.IsValid())
	{
		SetSeed(FMath::Rand());
	}
}

void APlanetWorld::EndPlay(const EEndPlayReason::Type Reason)
{
	++Generation;
	Super::EndPlay(Reason);
}

int32 APlanetWorld::GetSeed() const
{
	return Generator.IsValid() ? Generator->GetSeed() : 0;
}

double APlanetWorld::GroundHeightM(const FVector3d& Dir) const
{
	return Generator.IsValid() ? FPlanetGenerator::MeshHeightM(Generator->Sample(Dir, 6)) : 0.0;
}

bool APlanetWorld::IsSettled() const
{
	const bool bSettled = Generator.IsValid() && Requests.Num() == 0 && InFlight == 0 && MaterialsReady();
	static double LastReport = 0.0;
	const double Now = FPlatformTime::Seconds();
	if (!bSettled && Now - LastReport > 3.0)
	{
		LastReport = Now;
		UE_LOG(LogTemp, Display, TEXT("Planet: waiting. Requests %d, in flight %d, materials ready %d, chunks %d, camera %.1f km up, sun-facing %.2f."),
			Requests.Num(), InFlight, MaterialsReady() ? 1 : 0, VisibleChunks, (CameraPos.Size() - FPlanetGenerator::RadiusCm) / 100000.0,
			FVector3d::DotProduct(CameraPos.GetSafeNormal(), SunDirection));
	}
	return bSettled;
}

void APlanetWorld::SetSeed(int32 NewSeed)
{
	if (BuildQueue.IsValid() == false)
	{
		BuildQueue = MakeShared<FPlanetBuildQueue, ESPMode::ThreadSafe>();
	}
	++Generation;
	InFlight = 0;
	for (TSharedPtr<FPlanetNode>& Face : Faces)
	{
		ReleaseSubtree(*Face);
	}
	Faces.Reset();
	Requests.Reset();

	Generator = MakeShared<FPlanetGenerator, ESPMode::ThreadSafe>(NewSeed);
	for (int32 Face = 0; Face < 6; ++Face)
	{
		Faces.Add(TSharedPtr<FPlanetNode>(MakeNode(Face, 0, 0, 0).Release()));
	}
	BakeWeatherMap();
}

void APlanetWorld::BakeWeatherMap()
{
	if (!CloudMaterial)
	{
		return;
	}
	const int32 Width = 4096, Height = 2048;
	if (!WeatherMap)
	{
		WeatherMap = UTexture2D::CreateTransient(Width, Height, PF_G8);
		WeatherMap->Filter = TF_Bilinear;
		WeatherMap->SRGB = false;
		WeatherMap->AddressX = TA_Wrap;
		WeatherMap->AddressY = TA_Clamp;
		WeatherMap->UpdateResource();
		FlushRenderingCommands();
	}

	TArray<uint8> Pixels;
	Pixels.SetNumUninitialized(Width * Height);
	const FPlanetGenerator* Gen = Generator.Get();
	ParallelFor(Height, [&](int32 Y)
	{
		const double Polar = (Y + 0.5) / Height * UE_DOUBLE_PI;
		const double SinPolar = FMath::Sin(Polar), CosPolar = FMath::Cos(Polar);
		for (int32 X = 0; X < Width; ++X)
		{
			const double Az = (X + 0.5) / Width * UE_DOUBLE_TWO_PI - UE_DOUBLE_PI;
			const FVector3d Dir(SinPolar * FMath::Cos(Az), SinPolar * FMath::Sin(Az), CosPolar);
			Pixels[Y * Width + X] = (uint8)FMath::Clamp(Gen->CloudCover(Dir) * 255.0f + 0.5f, 0.0f, 255.0f);
		}
	});

	FTexture2DMipMap& Mip = WeatherMap->GetPlatformData()->Mips[0];
	void* Dest = Mip.BulkData.Lock(LOCK_READ_WRITE);
	FMemory::Memcpy(Dest, Pixels.GetData(), Pixels.Num());
	Mip.BulkData.Unlock();
	WeatherMap->UpdateResource();
	CloudMaterial->SetTextureParameterValue(TEXT("CloudWeather"), WeatherMap);
	if (TerrainMaterial)
	{
		TerrainMaterial->SetTextureParameterValue(TEXT("CloudWeather"), WeatherMap);
	}
}

UProceduralMeshComponent* APlanetWorld::AcquireMesh()
{
	if (FreeMeshes.Num() > 0)
	{
		return FreeMeshes.Pop();
	}
	UProceduralMeshComponent* Mesh = NewObject<UProceduralMeshComponent>(this);
	Mesh->SetMobility(EComponentMobility::Movable);
	Mesh->SetCollisionEnabled(ECollisionEnabled::NoCollision);
	Mesh->SetCastShadow(false);
	Mesh->bUseAsyncCooking = false;
	Mesh->SetVisibility(false);
	Mesh->SetupAttachment(Root);
	Mesh->RegisterComponent();
	AllMeshes.Add(Mesh);
	return Mesh;
}

void APlanetWorld::DrainFinishedChunks()
{
	const double Deadline = FPlatformTime::Seconds() + MeshUploadBudgetSeconds;
	TUniquePtr<FPlanetChunkData> Data;
	while (FPlatformTime::Seconds() < Deadline && BuildQueue->Finished.Dequeue(Data))
	{
		if (Data->Generation != Generation)
		{
			continue;
		}
		--InFlight;
		FPlanetNode* Node = Data->Node;
		UProceduralMeshComponent* Mesh = AcquireMesh();
		Mesh->SetWorldLocationAndRotation(Data->Origin, FQuat::Identity);
		Mesh->CreateMeshSection(0, Data->Positions, SharedIndices(), Data->Normals, Data->UV0, Data->Colors, TArray<FProcMeshTangent>(), false);
		Mesh->SetMaterial(0, TerrainMaterial);
		Node->Mesh = Mesh;
		Node->State = FPlanetNode::EState::Ready;
		Node->bShown = false;
	}
}

void APlanetWorld::SetShown(FPlanetNode& Node, bool bShown)
{
	if (Node.Mesh && Node.bShown != bShown)
	{
		Node.Mesh->SetVisibility(bShown);
	}
	Node.bShown = bShown;
}

void APlanetWorld::HideDescendants(FPlanetNode& Node)
{
	for (TUniquePtr<FPlanetNode>& Child : Node.Children)
	{
		if (Child)
		{
			SetShown(*Child, false);
			HideDescendants(*Child);
		}
	}
}

bool APlanetWorld::AnyBuilding(const FPlanetNode& Node) const
{
	if (Node.State == FPlanetNode::EState::Building)
	{
		return true;
	}
	for (const TUniquePtr<FPlanetNode>& Child : Node.Children)
	{
		if (Child && AnyBuilding(*Child))
		{
			return true;
		}
	}
	return false;
}

void APlanetWorld::ReleaseSubtree(FPlanetNode& Node)
{
	if (Node.Mesh)
	{
		Node.Mesh->SetVisibility(false);
		Node.Mesh->ClearAllMeshSections();
		FreeMeshes.Add(Node.Mesh);
		Node.Mesh = nullptr;
	}
	Node.State = FPlanetNode::EState::None;
	Node.bShown = false;
	for (TUniquePtr<FPlanetNode>& Child : Node.Children)
	{
		if (Child)
		{
			ReleaseSubtree(*Child);
			Child.Reset();
		}
	}
}

void APlanetWorld::ReleaseStale(FPlanetNode& Node, double Now)
{
	for (TUniquePtr<FPlanetNode>& Child : Node.Children)
	{
		if (!Child)
		{
			continue;
		}
		if (Now - Child->LastNeeded > CleanupAfterSeconds && !AnyBuilding(*Child))
		{
			ReleaseSubtree(*Child);
			Child.Reset();
		}
		else
		{
			ReleaseStale(*Child, Now);
		}
	}
}

void APlanetWorld::RequestBuild(FPlanetNode& Node)
{
	if (Node.State == FPlanetNode::EState::None)
	{
		Node.Priority = FVector3d::DistSquared(Node.Center, CameraPos);
		Requests.Add(&Node);
	}
}

void APlanetWorld::Visit(FPlanetNode& Node)
{
	const double Now = GetWorld()->GetTimeSeconds();
	Node.LastNeeded = Now;

	const FVector3d CamDir = CameraPos.GetSafeNormal();
	const double AngleToCamera = FMath::Acos(FMath::Clamp(FVector3d::DotProduct(Node.CenterDir, CamDir), -1.0, 1.0));
	const bool bBehindHorizon = AngleToCamera > HorizonAngle + Node.AngularRadius + 0.02;

	const FVector3d ToNode = Node.Center - CameraPos;
	const double CenterDist = ToNode.Size();
	const double Dist = FMath::Max(CenterDist - Node.BoundRadius, 100.0);
	bool bInView = true;
	if (CenterDist > Node.BoundRadius + CameraNearPad)
	{
		const double Cos = FVector3d::DotProduct(ToNode / CenterDist, CameraForward);
		const double Spread = FMath::Asin(FMath::Clamp(Node.BoundRadius / CenterDist, 0.0, 1.0));
		bInView = FMath::Acos(FMath::Clamp(Cos, -1.0, 1.0)) < FMath::Acos(ViewConeCos) + Spread;
	}

	if (bBehindHorizon || !bInView)
	{
		if (Node.Level == 0)
		{
			RequestBuild(Node);
		}
		SetShown(Node, false);
		HideDescendants(Node);
		return;
	}

	const double PixelSpacing = Node.SpacingCm / Dist * PixelsPerRadian;
	const bool bWantSplit = Node.Level < MaxLevel && PixelSpacing > SplitPixels && Node.State == FPlanetNode::EState::Ready
		&& AllMeshes.Num() - FreeMeshes.Num() < MaxLiveChunks;
	if (bWantSplit)
	{
		if (!Node.HasChildren())
		{
			for (int32 i = 0; i < 4; ++i)
			{
				Node.Children[i] = MakeNode(Node.Face, Node.Level + 1, Node.X * 2 + (i & 1), Node.Y * 2 + (i >> 1));
			}
		}
		bool bAllReady = true;
		for (TUniquePtr<FPlanetNode>& Child : Node.Children)
		{
			RequestBuild(*Child);
			bAllReady &= Child->State == FPlanetNode::EState::Ready;
			Child->LastNeeded = Now;
		}
		if (bAllReady)
		{
			SetShown(Node, false);
			for (TUniquePtr<FPlanetNode>& Child : Node.Children)
			{
				Visit(*Child);
			}
			return;
		}
	}

	RequestBuild(Node);
	SetShown(Node, Node.State == FPlanetNode::EState::Ready);
	if (Node.bShown)
	{
		++VisibleChunks;
	}
	HideDescendants(Node);
}

void APlanetWorld::LaunchRequests()
{
	Requests.Sort([](const FPlanetNode& A, const FPlanetNode& B) { return A.Priority < B.Priority; });

	int32 Launched = 0;
	for (FPlanetNode* Node : Requests)
	{
		if (InFlight >= MaxBuildsInFlight)
		{
			break;
		}
		Node->State = FPlanetNode::EState::Building;
		++InFlight;
		++Launched;

		TSharedPtr<FPlanetGenerator, ESPMode::ThreadSafe> Gen = Generator;
		TSharedPtr<FPlanetBuildQueue, ESPMode::ThreadSafe> Queue = BuildQueue;
		const int32 Gen_Id = Generation, Face = Node->Face, Level = Node->Level, X = Node->X, Y = Node->Y;
		UE::Tasks::Launch(UE_SOURCE_LOCATION, [Gen, Queue, Gen_Id, Face, Level, X, Y, Node]()
		{
			TUniquePtr<FPlanetChunkData> Data = BuildChunk(*Gen, Face, Level, X, Y);
			Data->Node = Node;
			Data->Generation = Gen_Id;
			Queue->Finished.Enqueue(MoveTemp(Data));
		});
	}
	Requests.RemoveAt(0, Launched);
}

void APlanetWorld::Tick(float DeltaSeconds)
{
	Super::Tick(DeltaSeconds);
	if (!Generator.IsValid())
	{
		return;
	}

	APlayerController* PC = GetWorld()->GetFirstPlayerController();
	if (!PC || !PC->PlayerCameraManager)
	{
		return;
	}
	CameraPos = PC->PlayerCameraManager->GetCameraLocation();
	CameraForward = PC->PlayerCameraManager->GetCameraRotation().Vector();

	int32 ViewX = 1920, ViewY = 1080;
	PC->GetViewportSize(ViewX, ViewY);
	ViewX = FMath::Max(ViewX, 1);
	ViewY = FMath::Max(ViewY, 1);
	const double HalfFovTan = FMath::Tan(FMath::DegreesToRadians(PC->PlayerCameraManager->GetFOVAngle()) * 0.5);
	PixelsPerRadian = ViewX * 0.5 / HalfFovTan;
	const double HalfDiagonal = FMath::Atan(HalfFovTan * FMath::Sqrt(1.0 + FMath::Square((double)ViewY / ViewX)));
	ViewConeCos = FMath::Cos(HalfDiagonal + FMath::DegreesToRadians(4.0));

	const double CamRadius = CameraPos.Size();
	HorizonAngle = FMath::Acos(FMath::Clamp(FPlanetGenerator::RadiusCm / FMath::Max(CamRadius, FPlanetGenerator::RadiusCm + 1.0), 0.0, 1.0));

	if (StarDome)
	{
		StarDome->SetWorldLocation(CameraPos);
	}

	// Ambient sky light is only right down in the air; from orbit it would light the night side.
	const double AltitudeKm = (CamRadius - FPlanetGenerator::RadiusCm) / 100000.0;
	const float WantedSkyLight = (float)FMath::GetMappedRangeValueClamped(FVector2D(60.0, 1500.0), FVector2D(1.0, 0.04), AltitudeKm);
	if (!FMath::IsNearlyEqual(WantedSkyLight, SkyLight->Intensity, 0.01f))
	{
		SkyLight->SetIntensity(WantedSkyLight);
	}

	DrainFinishedChunks();

	Requests.Reset();
	VisibleChunks = 0;
	for (TSharedPtr<FPlanetNode>& Face : Faces)
	{
		Visit(*Face);
	}
	LaunchRequests();

	const double Now = GetWorld()->GetTimeSeconds();
	if (Now - LastCleanup > 1.0)
	{
		LastCleanup = Now;
		for (TSharedPtr<FPlanetNode>& Face : Faces)
		{
			ReleaseStale(*Face, Now);
		}
	}
}
