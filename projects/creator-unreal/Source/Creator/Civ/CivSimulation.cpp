#include "CivSimulation.h"
#include "CivNames.h"
#include "CivRealHistory.h"
#include "Serialization/MemoryWriter.h"
#include "Serialization/MemoryReader.h"

using CivText::Fill;
using CivText::Count;

namespace CivSimData
{
	constexpr int32 MaxPeoples = 16;
	constexpr int32 MaxCitiesPerPeople = 12;
	constexpr int32 MaxYearsPerAdvance = 20000;
	constexpr int32 AdultAge = 18;

	struct FEventDef
	{
		ECivEvent Type;
		double YearlyRate;
		const TCHAR* Name;
		double PopLossMin, PopLossMax;
		double FoodLoss;
		double MaterialLoss;
		double KnowledgeLoss;
		ECivNeed Need;
		double ClimateFactor;       // 1 = climate not affected
		int32 ClimateYearsMin, ClimateYearsMax;
		bool bWorldwide;
		const TCHAR* Report;
	};

	static const FEventDef Events[] =
	{
		{ ECivEvent::Earthquake, 0.035, TEXT("רעידת אדמה"), 0.01, 0.12, 0.10, 0.20, 0.03, ECivNeed::Disaster, 1.0, 0, 0, false, TEXT("רעידת אדמה הרסה את {0} של עם {1}. אבדו {2} נפשות.") },
		{ ECivEvent::Volcano, 0.015, TEXT("התפרצות הר געש"), 0.02, 0.20, 0.30, 0.25, 0.04, ECivNeed::Disaster, 0.85, 2, 5, false, TEXT("הר געש התפרץ ליד {0} של עם {1}. אפר כיסה את השדות ואבדו {2} נפשות.") },
		{ ECivEvent::Flood, 0.05, TEXT("שיטפון"), 0.005, 0.08, 0.30, 0.08, 0.01, ECivNeed::Disaster, 1.0, 0, 0, false, TEXT("שיטפון גדול שטף את {0} של עם {1}. אבדו {2} נפשות.") },
		{ ECivEvent::Drought, 0.045, TEXT("בצורת"), 0.0, 0.03, 0.40, 0.03, 0.0, ECivNeed::Famine, 0.70, 3, 9, false, TEXT("בצורת ירדה על אדמת עם {1}, סביב {0}. הבארות יבשו ואבדו {2} נפשות.") },
		{ ECivEvent::Plague, 0.03, TEXT("מגפה"), 0.03, 0.30, 0.05, 0.02, 0.03, ECivNeed::Plague, 1.0, 0, 0, false, TEXT("מגפה פרצה ב{0} והתפשטה בכל עם {1}. אבדו {2} נפשות.") },
		{ ECivEvent::Storm, 0.05, TEXT("סופה"), 0.002, 0.04, 0.12, 0.08, 0.0, ECivNeed::Disaster, 1.0, 0, 0, false, TEXT("סופה עזה פגעה ב{0} של עם {1}. אבדו {2} נפשות.") },
		{ ECivEvent::Meteor, 0.0015, TEXT("פגיעת מטאור"), 0.05, 0.25, 0.50, 0.40, 0.10, ECivNeed::Disaster, 0.75, 4, 12, true, TEXT("אבן ענק מהשמיים פגעה בעולם, ליד {0} של עם {1}. אבק חסם את השמש ואבדו {2} נפשות.") },
		{ ECivEvent::IceAge, 0.0008, TEXT("עידן קרח"), 0.01, 0.06, 0.40, 0.10, 0.02, ECivNeed::Famine, 0.72, 40, 110, true, TEXT("הקור ירד על העולם ועידן קרח החל. הכפור הגיע גם אל {0} של עם {1}, ואבדו {2} נפשות.") },
		{ ECivEvent::Bumper, 0.05, TEXT("שנות שפע"), 0.0, 0.0, 0.0, 0.0, 0.0, ECivNeed::None, 1.25, 3, 6, false, TEXT("שנות שפע באו על עם {1}. השדות סביב {0} הניבו כפליים.") },
		{ ECivEvent::Comet, 0.008, TEXT("כוכב שביט"), 0.0, 0.0, 0.0, 0.0, 0.0, ECivNeed::None, 1.0, 0, 0, true, TEXT("כוכב שביט בוהק נראה בשמי {0}. אצל עם {1} ובכל העולם התחילו לשאול שאלות חדשות.") },
		{ ECivEvent::SolarStorm, 0.006, TEXT("סערת שמש"), 0.0, 0.01, 0.05, 0.30, 0.05, ECivNeed::Disaster, 1.0, 0, 0, false, TEXT("סערה מהשמש שרפה את המכונות ב{0} של עם {1}. אבדו {2} נפשות.") },
	};

	static const FEventDef& EventOf(ECivEvent Type)
	{
		return Events[static_cast<int32>(Type)];
	}

	static const TCHAR* const EraNames[] =
	{
		TEXT("עידן האש"), TEXT("עידן הכפרים"), TEXT("עידן הכתב"), TEXT("עידן הברזל והמחשבה"), TEXT("עידן הדפוס והמדע"),
		TEXT("עידן הקיטור והחשמל"), TEXT("עידן האטום והמחשב"), TEXT("עידן החלל"), TEXT("עידן הכוכבים")
	};

	static const TCHAR* MilestoneText(ECivMilestone Milestone)
	{
		switch (Milestone)
		{
		case ECivMilestone::Fire: return TEXT("עם {0} הדליק את האש הראשונה בעולם, בהובלת {1}.");
		case ECivMilestone::Agriculture: return TEXT("אצל עם {0} נזרע השדה הראשון בעולם, בהובלת {1}.");
		case ECivMilestone::FirstCity: return TEXT("עם {0} הקים את העיר הראשונה בעולם, בהובלת {1}.");
		case ECivMilestone::Writing: return TEXT("אצל עם {0} נכתבו המילים הראשונות בעולם, בידי {1}.");
		case ECivMilestone::Printing: return TEXT("בעם {0} הודפס הספר הראשון בעולם, במכונה של {1}.");
		case ECivMilestone::Steam: return TEXT("אצל עם {0} זז לראשונה מנוע קיטור, בתכנון של {1}.");
		case ECivMilestone::Electricity: return TEXT("בעם {0} נדלק האור החשמלי הראשון בעולם, בזכות {1}.");
		case ECivMilestone::Flight: return TEXT("מטוס של עם {0} המריא לראשונה לשמיים, בתכנון של {1}.");
		case ECivMilestone::Computer: return TEXT("בעם {0} חישב לראשונה מחשב, בבנייה של {1}.");
		case ECivMilestone::Satellite: return TEXT("עם {0} שיגר את הלוויין הראשון אל מעבר לשמיים, בהובלת {1}.");
		case ECivMilestone::Moon: return TEXT("בני עם {0} נחתו על הירח! המשימה יצאה לדרך בהובלת {1}.");
		case ECivMilestone::Mars: return TEXT("עם {0} הקים את המושבה הראשונה על מאדים, בהובלת {1}.");
		case ECivMilestone::StarLaunch: return TEXT("ספינת הכוכבים הראשונה של עם {0} יצאה מהעולם אל כוכבים אחרים, בתכנון של {1}.");
		default: return TEXT("");
		}
	}

	static const TCHAR* MilestoneTitle(ECivMilestone Milestone)
	{
		switch (Milestone)
		{
		case ECivMilestone::Fire: return TEXT("האש הראשונה");
		case ECivMilestone::Agriculture: return TEXT("השדה הראשון");
		case ECivMilestone::FirstCity: return TEXT("העיר הראשונה");
		case ECivMilestone::Writing: return TEXT("הכתב הראשון");
		case ECivMilestone::Printing: return TEXT("הספר המודפס הראשון");
		case ECivMilestone::Steam: return TEXT("מנוע הקיטור");
		case ECivMilestone::Electricity: return TEXT("החשמל");
		case ECivMilestone::Flight: return TEXT("הטיסה הראשונה");
		case ECivMilestone::Computer: return TEXT("המחשב הראשון");
		case ECivMilestone::Satellite: return TEXT("הלוויין הראשון");
		case ECivMilestone::Moon: return TEXT("נחיתה על הירח");
		case ECivMilestone::Mars: return TEXT("מושבה על מאדים");
		case ECivMilestone::StarLaunch: return TEXT("יציאה אל הכוכבים");
		case ECivMilestone::OtherStar: return TEXT("הגעה לכוכב אחר");
		default: return TEXT("");
		}
	}

	static const double DegToRad = UE_DOUBLE_PI / 180.0;
}

using namespace CivSimData;

FString FCivPerson::PersonalityWord() const
{
	double Best = Curiosity;
	const TCHAR* Word = bFemale ? TEXT("הסקרנית") : TEXT("הסקרן");
	if (Boldness > Best) { Best = Boldness; Word = bFemale ? TEXT("הנועזת") : TEXT("הנועז"); }
	if (Patience > Best) { Best = Patience; Word = bFemale ? TEXT("העקשנית") : TEXT("העקשן"); }
	if (Compassion > Best) { Word = bFemale ? TEXT("הרחומה") : TEXT("הרחום"); }
	return Word;
}

// ---------------------------------------------------------------------------
// Setup
// ---------------------------------------------------------------------------

void FCivSimulation::ComputeFactors()
{
	const double IQRatio = FMath::Max(0.05, Settings.AverageIQ / 200.0);
	for (int32 Era = 0; Era < 9; ++Era)
	{
		const double Exponent = Settings.Tuning.BirthIQExponentByEra[Era] > 0.0 ? Settings.Tuning.BirthIQExponentByEra[Era] : Settings.Tuning.BirthIQExponent;
		BirthFactors[Era] = Settings.Tuning.BirthFactorAt200 * FMath::Pow(IQRatio, Exponent);
	}
	SpreadFactor = Settings.Tuning.SpreadFactorAt200 * FMath::Pow(IQRatio, Settings.Tuning.SpreadIQExponent);
}

int32 FCivSimulation::ResolveStartEra() const
{
	if (Settings.StartEra >= 0) { return FMath::Clamp(Settings.StartEra, 0, 8); }
	if (!bRealCalendar) { return 0; }
	// Automatic: a broad match between the calendar year and the tree's eras.
	if (StartCalendarYear < -1200) { return 2; }
	if (StartCalendarYear < 1400) { return 3; }
	if (StartCalendarYear < 1750) { return 4; }
	if (StartCalendarYear < 1900) { return 5; }
	return 6;
}

FCivSimulation::FCivSimulation(const FCivWorldSettings& InSettings)
	: Settings(InSettings)
	, Rng(InSettings.Seed, 0x43495631ULL)
	, Proposer(MakeUnique<FCivCuratedProposer>())
{
	ComputeFactors();
	Tree = FCivInventionTable::Get().All();

	bRealCalendar = Settings.bRealCities || Settings.bRealDisasters;
	if (bRealCalendar)
	{
		StartCalendarYear = Settings.RealHistoryStartYear == FCivWorldSettings::EarliestRealCities
			? CivRealHistory::EarliestCityYear()
			: Settings.RealHistoryStartYear;
	}

	Peoples.Reserve(MaxPeoples);
	if (Settings.bRealCities)
	{
		// One people per historical region; the setting can still add invented peoples beyond those.
		for (const CivRealHistory::FRegion& Region : CivRealHistory::Regions())
		{
			const FString RegionName = Region.Name;
			const double LatRad = Region.LatDeg * DegToRad;
			const double LonRad = Region.LonDeg * DegToRad;
			CreatePeople(AddPeopleSlot(), &RegionName, &LatRad, &LonRad);
		}
	}
	const int32 Wanted = FMath::Clamp(Settings.NumPeoples, 1, MaxPeoples);
	while (Peoples.Num() < Wanted)
	{
		CreatePeople(AddPeopleSlot(), nullptr, nullptr, nullptr);
	}

	// A later start era means the older inventions are already common knowledge.
	const int32 StartEra = ResolveStartEra();
	if (StartEra > 0)
	{
		for (FCivPeople& P : Peoples)
		{
			for (int32 Inv = 0; Inv < Tree.Num(); ++Inv)
			{
				if (Tree[Inv].Era < StartEra) { P.Known[Inv] = true; }
			}
			Recalculate(P);
			P.Population *= FMath::Pow(5.0, StartEra);
			P.Food = P.Population * Settings.Tuning.StartingFoodPerPerson;
			for (int32 R = 0; R < CivResourceCount; ++R)
			{
				P.Stock[R] = FMath::Sqrt(P.Population) * Settings.Tuning.MiningRate * 40.0 * P.ResourceRate[R];
			}
		}
		WorldEra = StartEra - 1;
	}

	// One opening line for the whole world instead of one per people.
	{
		FString Opening = bRealCalendar ? TEXT("בתחילת הספר חיים בעולם ") : TEXT("בתחילת הזמן חיים בעולם ");
		Opening += FString::FromInt(Peoples.Num());
		Opening += TEXT(" עמים, רחוקים זה מזה: ");
		for (int32 Index = 0; Index < Peoples.Num(); ++Index)
		{
			if (Index > 0) { Opening += Index + 1 == Peoples.Num() ? TEXT(" ו") : TEXT(", "); }
			Opening += Peoples[Index].Name + TEXT(" (") + Count(Peoples[Index].Population) + TEXT(" נפשות)");
		}
		Opening += StartEra == 0 ? TEXT(". הם חיים בלהקות קטנות של ציידים ולקטים, סביב מדורות.") : TEXT(".");
		Write(ECivEntryKind::Chronicle, 2, INDEX_NONE, Opening);
	}

	SetupRealHistory();
	SeedPersonPool();
	// Each people starts with a few adult thinkers, so the story can begin at once.
	for (int32 Index = 0; Index < Peoples.Num(); ++Index)
	{
		const int32 Founders = Rng.RangeInt(1, 2);
		for (int32 F = 0; F < Founders; ++F)
		{
			BirthInventor(Index, Rng.RangeInt(AdultAge, 30));
		}
	}
}

void FCivSimulation::SetupRealHistory()
{
	RealCityDone.Init(false, CivRealHistory::Cities().Num());
	RealDisasterDone.Init(false, CivRealHistory::Disasters().Num());
	if (!bRealCalendar) { return; }

	for (int32 D = 0; D < RealDisasterDone.Num(); ++D)
	{
		RealDisasterDone[D] = !Settings.bRealDisasters || CivRealHistory::Disasters()[D].Year <= StartCalendarYear;
	}
	for (int32 C = 0; C < RealCityDone.Num(); ++C)
	{
		const CivRealHistory::FCity& City = CivRealHistory::Cities()[C];
		if (!Settings.bRealCities) { RealCityDone[C] = true; continue; }
		if (City.FoundedYear <= StartCalendarYear)
		{
			RealCityDone[C] = true;
			if (City.EndYear > StartCalendarYear) { AddRealCity(C, true); }
		}
	}
}

void FCivSimulation::AddRealCity(int32 DataIndex, bool bAtStart)
{
	const CivRealHistory::FCity& Data = CivRealHistory::Cities()[DataIndex];
	const double LatRad = Data.LatDeg * DegToRad;
	const double LonRad = Data.LonDeg * DegToRad;

	int32 Owner = INDEX_NONE;
	const TArray<CivRealHistory::FRegion>& Regions = CivRealHistory::Regions();
	for (int32 R = 0; R < Regions.Num() && R < Peoples.Num(); ++R)
	{
		if (FCString::Strcmp(Regions[R].Key, Data.Region) == 0 && Peoples[R].bAlive) { Owner = R; break; }
	}
	if (Owner == INDEX_NONE) { Owner = NearestPeople(LatRad, LonRad); }
	if (Owner == INDEX_NONE) { return; }

	FCivCity City;
	City.Name = Data.Name;
	City.Latitude = LatRad;
	City.Longitude = LonRad;
	City.FoundedYear = Year;
	City.RealId = DataIndex;
	Peoples[Owner].Cities.Add(City);
	++Stats.CitiesFounded;
	Write(ECivEntryKind::City, 2, Owner, Fill(bAtStart ? TEXT("העיר {0} כבר עומדת, בארץ {1}.") : TEXT("העיר {0} קמה בארץ {1}, כפי שהיה בהיסטוריה."), { City.Name, Peoples[Owner].Name }));
	// Only a start at the earliest city makes it the first city of the world; a later start finds many already standing.
	if (GetMilestoneYear(ECivMilestone::FirstCity) == INDEX_NONE && StartCalendarYear <= CivRealHistory::EarliestCityYear())
	{
		RecordMilestone(ECivMilestone::FirstCity, Owner, FString(), MilestoneTitle(ECivMilestone::FirstCity));
	}
}

int32 FCivSimulation::NearestPeople(double LatRad, double LonRad) const
{
	int32 Best = INDEX_NONE;
	double BestCos = -2.0;
	for (int32 Index = 0; Index < Peoples.Num(); ++Index)
	{
		if (!Peoples[Index].bAlive) { continue; }
		const double Cosine = FMath::Sin(LatRad) * FMath::Sin(Peoples[Index].Latitude)
			+ FMath::Cos(LatRad) * FMath::Cos(Peoples[Index].Latitude) * FMath::Cos(LonRad - Peoples[Index].Longitude);
		if (Cosine > BestCos) { BestCos = Cosine; Best = Index; }
	}
	return Best;
}

void FCivSimulation::TickRealHistory()
{
	if (!bRealCalendar) { return; }
	const int32 Calendar = GetCalendarYear();

	for (int32 C = 0; C < RealCityDone.Num(); ++C)
	{
		if (!RealCityDone[C] && CivRealHistory::Cities()[C].FoundedYear <= Calendar)
		{
			RealCityDone[C] = true;
			AddRealCity(C, false);
		}
	}

	// Cities the record says were abandoned leave the map at their date.
	for (int32 Index = 0; Index < Peoples.Num(); ++Index)
	{
		FCivPeople& P = Peoples[Index];
		for (int32 C = P.Cities.Num() - 1; C >= 0; --C)
		{
			const int32 RealId = P.Cities[C].RealId;
			if (RealId != INDEX_NONE && CivRealHistory::Cities()[RealId].EndYear <= Calendar)
			{
				Write(ECivEntryKind::City, 2, Index, Fill(TEXT("העיר {0} ננטשה."), { P.Cities[C].Name }));
				P.Cities.RemoveAt(C);
				++Stats.CitiesLost;
			}
		}
	}

	for (int32 D = 0; D < RealDisasterDone.Num(); ++D)
	{
		if (RealDisasterDone[D]) { continue; }
		const CivRealHistory::FDisaster& Data = CivRealHistory::Disasters()[D];
		if (Data.Year > Calendar) { continue; }
		RealDisasterDone[D] = true;
		++Stats.RealDisasters;

		const double LatRad = Data.LatDeg * DegToRad;
		const double LonRad = Data.LonDeg * DegToRad;
		const int32 Nearest = NearestPeople(LatRad, LonRad);
		if (Nearest == INDEX_NONE) { continue; }

		const FString Report = Data.Text;
		ApplyEvent(Data.Type, Nearest, Data.Severity, false, &Report);
		for (int32 Index = 0; Index < Peoples.Num(); ++Index)
		{
			if (Index == Nearest || !Peoples[Index].bAlive) { continue; }
			const double Cosine = FMath::Sin(LatRad) * FMath::Sin(Peoples[Index].Latitude)
				+ FMath::Cos(LatRad) * FMath::Cos(Peoples[Index].Latitude) * FMath::Cos(LonRad - Peoples[Index].Longitude);
			if (FMath::Acos(FMath::Clamp(Cosine, -1.0, 1.0)) < Data.RadiusRad)
			{
				ApplyEvent(Data.Type, Index, Data.Severity * 0.5, false);
			}
		}
	}
}

int32 FCivSimulation::AddPeopleSlot()
{
	const int32 Index = Peoples.AddDefaulted();
	FCivPeople& P = Peoples[Index];
	P.Relations.Init(0.0, MaxPeoples);
	P.Known.Init(false, Tree.Num());
	P.Progress.Init(0.0, Tree.Num());
	return Index;
}

void FCivSimulation::CreatePeople(int32 Index, const FString* FixedName, const double* LatRad, const double* LonRad)
{
	FCivPeople& P = Peoples[Index];
	P.Name = FixedName ? *FixedName : CivText::PeopleName(Rng);
	P.FoundedYear = Year;
	P.Latitude = LatRad ? *LatRad : FMath::Asin(Rng.Range(-0.85, 0.85));
	P.Longitude = LonRad ? *LonRad : Rng.Range(-UE_DOUBLE_PI, UE_DOUBLE_PI);
	P.LandQuality = Rng.Range(0.7, 1.4);
	P.Population = Rng.Range(600.0, 1800.0) * Settings.StartPopulation;
	P.Food = P.Population * Settings.Tuning.StartingFoodPerPerson;
	for (int32 R = 0; R < CivResourceCount; ++R)
	{
		P.Richness[R] = Rng.Range(0.4, 1.6);
		P.Stock[R] = R < 2 ? 40.0 : 0.0;
	}
	for (int32 Other = 0; Other < Peoples.Num(); ++Other)
	{
		if (Other == Index) { continue; }
		const double Start = Rng.Range(-20.0, 20.0);
		P.Relations[Other] = Start;
		Peoples[Other].Relations[Index] = Start;
	}
	Recalculate(P);
	Write(ECivEntryKind::People, 1, Index, Fill(TEXT("עם {0} התגבש, {1} נפשות."), { P.Name, Count(P.Population) }));
}

void FCivSimulation::Recalculate(FCivPeople& P)
{
	P.Resist = 0.0; P.Range = 0.0;
	P.ResourceRate[0] = 1.0; P.ResourceRate[1] = 1.0; P.ResourceRate[2] = 0.0; P.ResourceRate[3] = 0.0; P.ResourceRate[4] = 0.0;

	// Generated inventions add up in their own bucket, with a ceiling, so a long list cannot run away.
	FCivInventionEffects Base, Gen;
	P.KnownCount = 0;
	for (int32 Index = 0; Index < Tree.Num(); ++Index)
	{
		if (!P.Known[Index]) { continue; }
		++P.KnownCount;
		const FCivInventionEffects& E = Tree[Index].Effects;
		FCivInventionEffects& Sum = Tree[Index].bGenerated ? Gen : Base;
		Sum.Food *= E.Food;
		Sum.Capacity *= E.Capacity;
		Sum.Resources *= E.Resources;
		Sum.Research *= E.Research;
		Sum.Spread *= E.Spread;
		Sum.Health *= E.Health;
		Sum.War *= E.War;
		P.Resist += E.Resist;
		P.Range += E.Range;
		for (int32 R = 0; R < CivResourceCount; ++R) { P.ResourceRate[R] += E.ResourceRate[R]; }
	}
	const double GenCap = Settings.Tuning.GeneratedEffectCap;
	P.FoodMult = Base.Food * FMath::Min(Gen.Food, GenCap);
	P.CapacityMult = Base.Capacity * FMath::Min(Gen.Capacity, GenCap);
	P.ResourceMult = Base.Resources * FMath::Min(Gen.Resources, GenCap);
	P.ResearchMult = Base.Research * FMath::Min(Gen.Research, GenCap);
	P.SpreadMult = Base.Spread * FMath::Min(Gen.Spread, GenCap);
	P.HealthMult = Base.Health * FMath::Min(Gen.Health, GenCap);
	P.WarMult = Base.War * FMath::Min(Gen.War, GenCap);
	P.Resist = FMath::Min(P.Resist, 0.85);
	P.Range += P.ExplorerRange;

	P.Era = 0;
	for (int32 Index = 0; Index < Tree.Num(); ++Index)
	{
		if (P.Known[Index]) { P.Era = FMath::Max(P.Era, Tree[Index].Era); }
	}
}

int32 FCivSimulation::InventorCap(const FCivPeople& P) const
{
	// Notable inventors are few among ordinary people and more common only as average IQ rises.
	return FMath::Clamp(FMath::RoundToInt32(3.0 * FMath::Pow(BirthFactorFor(P), 0.4)), 1, Settings.Tuning.InventorCapPerPeople);
}

double FCivSimulation::CostOf(const FCivInventionDef& Def) const
{
	return Def.Cost * Settings.Tuning.CostScale * FMath::Pow(Settings.Tuning.EraCostFactor, Def.Era) * Settings.Tuning.EraCostShape[FMath::Clamp(Def.Era, 0, 8)];
}

double FCivSimulation::ExpectedLifespan(const FCivPeople& P) const
{
	return FMath::Min(38.0 * FMath::Pow(P.HealthMult, 0.45), 140.0);
}


// ---------------------------------------------------------------------------
// Time
// ---------------------------------------------------------------------------

void FCivSimulation::StepYear()
{
	if (bExtinct) { return; }
	++Year;
	if (!bRealCalendar || Settings.bKeepRandomDisasters) { TickEvents(); }
	TickRealHistory();
	TickEconomy();
	TickCities();
	TickPersons();
	if (Year % 50 == 0) { ForgetOldLives(); }
	TickInventors();
	TickResearch();
	TickDiffusion();
	TickDiplomacy();
	TickWars();
	TickSpace();
	TickChronicle();

	if (GetAlivePeoples() == 0)
	{
		bExtinct = true;
		Write(ECivEntryKind::Chronicle, 3, INDEX_NONE, TEXT("לא נשאר איש בעולם. הספר הזה נסגר כאן."));
	}
}

int32 FCivSimulation::Advance(double DeltaSeconds)
{
	if (YearsPerSecond <= 0.0 || bExtinct) { return 0; }
	TimeAccumulator += FMath::Max(0.0, DeltaSeconds) * YearsPerSecond;
	int32 Steps = FMath::FloorToInt32(TimeAccumulator);
	TimeAccumulator -= Steps;
	Steps = FMath::Min(Steps, MaxYearsPerAdvance);
	for (int32 I = 0; I < Steps; ++I) { StepYear(); }
	return Steps;
}

void FCivSimulation::GodSetSpeed(double NewYearsPerSecond)
{
	YearsPerSecond = FMath::Max(0.0, NewYearsPerSecond);
}

double FCivSimulation::GetWorldPopulation() const
{
	double Total = 0.0;
	for (const FCivPeople& P : Peoples) { if (P.bAlive) { Total += P.Population; } }
	return Total;
}

int32 FCivSimulation::GetAlivePeoples() const
{
	int32 Total = 0;
	for (const FCivPeople& P : Peoples) { if (P.bAlive) { ++Total; } }
	return Total;
}

int32 FCivSimulation::GetMilestoneYear(ECivMilestone Milestone) const
{
	for (const FCivMilestoneRecord& Record : Milestones)
	{
		if (Record.Milestone == Milestone) { return Record.Year; }
	}
	return INDEX_NONE;
}

void FCivSimulation::Write(ECivEntryKind Kind, int32 Importance, int32 PeopleIndex, const FString& Text)
{
	FCivEntry E;
	E.Year = Year;
	E.Kind = Kind;
	E.Importance = Importance;
	E.People = PeopleIndex;
	E.Text = Text;
	Entries.Add(MoveTemp(E));
}

const FString& FCivSimulation::CityOrName(const FCivPeople& P) const
{
	static const FString Camp = TEXT("מחנה המדורות");
	static const FString Villages = TEXT("הכפרים");
	return P.Cities.Num() > 0 ? P.Cities[0].Name : (P.Era <= 1 ? Camp : Villages);
}

// ---------------------------------------------------------------------------
// Natural events
// ---------------------------------------------------------------------------

void FCivSimulation::TickEvents()
{
	for (const FEventDef& Def : Events)
	{
		if (!Rng.Chance(Def.YearlyRate * Settings.DisasterFrequency)) { continue; }

		TArray<int32> Candidates;
		for (int32 Index = 0; Index < Peoples.Num(); ++Index)
		{
			if (!Peoples[Index].bAlive) { continue; }
			// Machines can only burn out once there are machines.
			if (Def.Type == ECivEvent::SolarStorm && Peoples[Index].ResourceRate[3] <= 0.0) { continue; }
			Candidates.Add(Index);
		}
		if (Candidates.Num() == 0) { continue; }

		const double Severity = FMath::Square(Rng.Unit());
		const int32 Target = Rng.Pick(Candidates);
		ApplyEvent(Def.Type, Target, Severity, false);
	}
}

void FCivSimulation::KillPopulation(int32 PeopleIndex, double Fraction, const TCHAR* Cause)
{
	FCivPeople& P = Peoples[PeopleIndex];
	P.Population *= (1.0 - FMath::Clamp(Fraction, 0.0, 1.0));
	// Each named inventor shares the danger of the crowd.
	for (int32 Slot = P.LivingPersons.Num() - 1; Slot >= 0; --Slot)
	{
		if (Rng.Chance(Fraction))
		{
			KillPerson(Persons[P.LivingPersons[Slot]], Cause);
		}
	}
}


void FCivSimulation::ApplyEvent(ECivEvent Event, int32 PeopleIndex, double Severity, bool bFromGod, const FString* Report)
{
	const FEventDef& Def = EventOf(Event);
	++Stats.Events;

	if (Event == ECivEvent::Meteor && bAnyShield && !bFromGod)
	{
		Write(ECivEntryKind::Event, 2, PeopleIndex, TEXT("אבן ענק טסה לעבר העולם, והמגן הפלנטרי הסיט אותה לחלל."));
		return;
	}

	double WorldDeaths = 0.0;
	TArray<int32> Targets;
	if (Def.bWorldwide)
	{
		for (int32 Index = 0; Index < Peoples.Num(); ++Index) { if (Peoples[Index].bAlive) { Targets.Add(Index); } }
	}
	else
	{
		Targets.Add(PeopleIndex);
	}

	for (int32 Target : Targets)
	{
		FCivPeople& P = Peoples[Target];
		// Worldwide events hit the struck place hardest and the rest less.
		const double Reach = (Target == PeopleIndex) ? 1.0 : 0.55;
		const double Soft = 1.0 - P.Resist;
		const double Loss = FMath::Min(0.9, FMath::Lerp(Def.PopLossMin, Def.PopLossMax, Severity) * Soft * Reach * Settings.DisasterStrength);
		const double Before = P.Population;
		if (Loss > 0.0) { KillPopulation(Target, Loss, Def.Name); }
		WorldDeaths += Before - P.Population;

		P.Food *= 1.0 - FMath::Clamp(Def.FoodLoss * (0.4 + 0.6 * Severity) * Soft * Reach, 0.0, 1.0);
		for (int32 R = 0; R < CivResourceCount; ++R)
		{
			P.Stock[R] *= 1.0 - FMath::Clamp(Def.MaterialLoss * Severity * Soft * Reach, 0.0, 1.0);
		}
		P.Knowledge *= 1.0 - FMath::Clamp(Def.KnowledgeLoss * Severity * Soft * Reach, 0.0, 1.0);
		if (Def.Need != ECivNeed::None) { P.NeedPressure[static_cast<int32>(Def.Need)] += 1.0; }

		if (Def.ClimateFactor != 1.0)
		{
			const double Softened = Def.ClimateFactor < 1.0 ? 1.0 - (1.0 - Def.ClimateFactor) * Soft : Def.ClimateFactor;
			P.ClimateFactor = Softened;
			P.ClimateUntil = FMath::Max(P.ClimateUntil, Year + Rng.RangeInt(Def.ClimateYearsMin, Def.ClimateYearsMax));
		}
		if (Event == ECivEvent::Comet) { P.CuriosityUntil = Year + 20; }

		// A hard blow can wipe out a city altogether.
		if (Severity > 0.8 && Loss > 0.04 && P.Cities.Num() > 1 && Rng.Chance(0.5))
		{
			// Cities from the historical record stand until their recorded end; only invented cities can vanish at random.
			const int32 Doomed = Rng.RangeInt(0, P.Cities.Num() - 1);
			if (P.Cities[Doomed].RealId == INDEX_NONE) { DestroyCity(Target, Doomed); }
		}
		else if (P.Cities.Num() > 0 && Loss > 0.0)
		{
			FCivCity& City = P.Cities[Rng.RangeInt(0, P.Cities.Num() - 1)];
			City.Weight = FMath::Max(0.2, City.Weight * (1.0 - Loss));
		}
	}

	const FCivPeople& Struck = Peoples[PeopleIndex];
	// The book keeps the blows people remembered for generations; ordinary bad years stay in the records only.
	const bool bHarmless = Event == ECivEvent::Bumper || Event == ECivEvent::Comet;
	const bool bBig = bFromGod || Report != nullptr || (!bHarmless && (Def.bWorldwide || (Severity > 0.8 && Def.PopLossMax >= 0.08)));
	FString Text = Report ? (*Report + FString::Printf(TEXT(" (%s נפשות אבדו בעולם המשחק)"), *Count(WorldDeaths))) : Fill(Def.Report, { CityOrName(Struck), Struck.Name, Count(WorldDeaths) });
	Text.ReplaceInline(TEXT("בהכפרים"), TEXT("בכפרים"));
	if (bFromGod)
	{
		Text = FString(TEXT("זעם האל: ")) + Text;
	}
	Write(bFromGod ? ECivEntryKind::God : ECivEntryKind::Event, bBig ? 2 : 1, PeopleIndex, Text);

	for (int32 Target : Targets)
	{
		if (Peoples[Target].bAlive && Peoples[Target].Population < 40.0)
		{
			EndPeople(Target, INDEX_NONE, FString(Def.Name));
		}
	}
}

void FCivSimulation::DestroyCity(int32 PeopleIndex, int32 CityIndex)
{
	FCivPeople& P = Peoples[PeopleIndex];
	if (!P.Cities.IsValidIndex(CityIndex)) { return; }
	Write(ECivEntryKind::City, 2, PeopleIndex, Fill(TEXT("העיר {0} של עם {1} חרבה ולא נבנתה עוד."), { P.Cities[CityIndex].Name, P.Name }));
	P.Cities.RemoveAt(CityIndex);
	++Stats.CitiesLost;
}

// ---------------------------------------------------------------------------
// Food, population and cities
// ---------------------------------------------------------------------------

void FCivSimulation::TickEconomy()
{
	const FCivTuning& T = Settings.Tuning;
	for (int32 Index = 0; Index < Peoples.Num(); ++Index)
	{
		FCivPeople& P = Peoples[Index];
		if (!P.bAlive) { continue; }

		if (Year >= P.ClimateUntil) { P.ClimateFactor = 1.0; }
		for (int32 N = 0; N < CivNeedCount; ++N) { P.NeedPressure[N] *= 0.95; }

		const double Capacity = FMath::Min(T.BaseCapacity * P.LandQuality * P.FoodMult * P.CapacityMult * Settings.LandFertility, 1.0e9);   // no homeland feeds more than about a billion
		const double Crowding = P.Population / FMath::Max(1.0, Capacity);
		const double PerPerson = 1.2 * P.ClimateFactor * (Crowding > 1.0 ? 1.0 / Crowding : 1.0);
		P.Food += P.Population * (PerPerson - 1.0);
		P.Food = FMath::Min(P.Food, P.Population * 3.0);

		if (P.Food < 0.0)
		{
			const double Shortage = FMath::Min(-P.Food / FMath::Max(1.0, P.Population), 1.0);
			KillPopulation(Index, Shortage * 0.25 * (1.0 - P.Resist * 0.5), TEXT("רעב"));
			P.Food = 0.0;
			P.NeedPressure[static_cast<int32>(ECivNeed::Famine)] += 0.5 + Shortage;
			if (Shortage > 0.3 && Rng.Chance(0.15))
			{
				Write(ECivEntryKind::Event, 2, Index, Fill(TEXT("רעב כבד פשט בעם {0}. האנשים אכלו את זרעי השנה הבאה."), { P.Name }));
			}
		}
		else if (Crowding < 1.0)
		{
			const double Blessed = (P.HealingUntil > Year ? 1.3 : 1.0) * (1.0 + 0.1 * P.Faith);
			const double Rate = T.PopulationGrowth * FMath::Min(P.HealthMult, 2.0) * Blessed;
			P.Population += P.Population * Rate * (1.0 - Crowding);
		}

		const double RootPop = FMath::Sqrt(FMath::Max(0.0, P.Population));
		for (int32 R = 0; R < CivResourceCount; ++R)
		{
			P.Stock[R] += RootPop * T.MiningRate * P.Richness[R] * P.ResourceRate[R] * P.ResourceMult * Settings.ResourceAbundance;
			P.Stock[R] *= 0.995;
		}

		if (P.Population < 40.0)
		{
			EndPeople(Index, INDEX_NONE, TEXT("רעב"));
		}
	}
}

void FCivSimulation::TickCities()
{
	static const int32 SettlementIndex = FCivInventionTable::Get().Find(TEXT("settlement"));
	// While real cities are still arriving by their dates, no invented city competes with them.
	if (Settings.bRealCities && GetCalendarYear() < CivRealHistory::LatestCityYear()) { return; }
	for (int32 Index = 0; Index < Peoples.Num(); ++Index)
	{
		FCivPeople& P = Peoples[Index];
		if (!P.bAlive || !P.Known[SettlementIndex]) { continue; }
		if (P.Cities.Num() >= MaxCitiesPerPeople) { continue; }
		const double Needed = 3000.0 * FMath::Pow(2.2, P.Cities.Num());
		if (P.Population > Needed && Rng.Chance(0.2))
		{
			FoundCity(Index);
		}
		if (P.Cities.Num() >= 5 && Peoples.Num() < MaxPeoples && Rng.Chance(0.0012))
		{
			Secede(Index);
		}
	}
}

void FCivSimulation::FoundCity(int32 PeopleIndex)
{
	FCivPeople& P = Peoples[PeopleIndex];
	FCivCity City;
	City.Name = CivText::CityName(Rng);
	City.FoundedYear = Year;
	City.Latitude = P.Latitude + Rng.Range(-0.15, 0.15);
	City.Longitude = P.Longitude + Rng.Range(-0.15, 0.15);
	City.Weight = Rng.Range(0.5, 1.2);
	P.Cities.Add(City);
	++Stats.CitiesFounded;
	Write(ECivEntryKind::City, P.Cities.Num() == 1 ? 2 : 1, PeopleIndex, Fill(TEXT("עם {0} ייסד את העיר {1}."), { P.Name, City.Name }));
}

void FCivSimulation::Secede(int32 PeopleIndex)
{
	const int32 NewIndex = AddPeopleSlot();
	FCivPeople& Old = Peoples[PeopleIndex];
	FCivPeople& P = Peoples[NewIndex];
	P.Name = CivText::PeopleName(Rng);
	P.FoundedYear = Year;
	P.Latitude = Old.Latitude + Rng.Range(-0.4, 0.4);
	P.Longitude = Old.Longitude + Rng.Range(-0.4, 0.4);
	P.LandQuality = Old.LandQuality;
	for (int32 R = 0; R < CivResourceCount; ++R)
	{
		P.Richness[R] = Old.Richness[R];
		P.Stock[R] = Old.Stock[R] * 0.3;
		Old.Stock[R] *= 0.7;
	}
	P.Known = Old.Known;
	P.Knowledge = Old.Knowledge * 0.5;
	P.Population = Old.Population * 0.3;
	P.Food = Old.Food * 0.3;
	Old.Population *= 0.7;
	Old.Food *= 0.7;
	const int32 Moving = Old.Cities.Num() / 3;
	for (int32 I = 0; I < Moving; ++I)
	{
		P.Cities.Add(Old.Cities.Last());
		Old.Cities.Pop();
	}
	for (int32 Other = 0; Other < NewIndex; ++Other)
	{
		const double Start = Other == PeopleIndex ? -40.0 : Peoples[PeopleIndex].Relations[Other];
		P.Relations[Other] = Start;
		Peoples[Other].Relations[NewIndex] = Start;
	}
	Recalculate(P);
	Write(ECivEntryKind::People, 3, NewIndex, Fill(TEXT("ערים של עם {0} מרדו וקמו כעם חדש: עם {1}."), { Old.Name, P.Name }));
}

void FCivSimulation::EndPeople(int32 PeopleIndex, int32 Conqueror, const FString& Reason)
{
	FCivPeople& P = Peoples[PeopleIndex];
	if (!P.bAlive) { return; }
	P.bAlive = false;
	++Stats.PeoplesLost;

	const TArray<int32> Living = P.LivingPersons;
	for (int32 Id : Living)
	{
		if (Conqueror != INDEX_NONE)
		{
			// The conquered live on under the winner, and their rulers lose their thrones.
			FCivPerson& Moved = Persons[Id];
			Moved.People = Conqueror;
			Moved.Project = INDEX_NONE;
			if (Moved.Rank == ECivRank::Ruler) { Moved.Rank = ECivRank::Commoner; Moved.Occupation = ECivOccupation::Farmer; Moved.bTyrant = false; }
			Peoples[Conqueror].LivingPersons.Add(Id);
			if (Moved.bInventor) { Peoples[Conqueror].LivingInventors.Add(Id); }
		}
		else
		{
			KillPerson(Persons[Id], *Reason);
		}
	}
	P.LivingPersons.Reset();
	P.LivingInventors.Reset();

	if (Conqueror != INDEX_NONE)
	{
		FCivPeople& Winner = Peoples[Conqueror];
		Winner.Population += P.Population;
		Winner.Food += P.Food;
		for (int32 R = 0; R < CivResourceCount; ++R) { Winner.Stock[R] += P.Stock[R]; }
		for (int32 Inv = 0; Inv < P.Known.Num(); ++Inv)
		{
			if (P.Known[Inv] && !Winner.Known[Inv]) { Winner.Known[Inv] = true; }
		}
		Winner.Cities.Append(P.Cities);
		while (Winner.Cities.Num() > MaxCitiesPerPeople) { Winner.Cities.Pop(); }
		Recalculate(Winner);
		Write(ECivEntryKind::People, 3, Conqueror, Fill(TEXT("עם {0} נבלע בתוך עם {1}, וכל ידיעותיו עברו אליו."), { P.Name, Winner.Name }));
	}
	else
	{
		Write(ECivEntryKind::People, 3, PeopleIndex, Fill(TEXT("עם {0} נעלם מן העולם בגלל {1}. נשארו ממנו רק סיפורים."), { P.Name, Reason }));
	}
	P.Population = 0.0;
	P.Cities.Reset();

	for (int32 W = Wars.Num() - 1; W >= 0; --W)
	{
		if (Wars[W].A == PeopleIndex || Wars[W].B == PeopleIndex) { Wars.RemoveAt(W); }
	}
}

// ---------------------------------------------------------------------------
// Persons and invention
// ---------------------------------------------------------------------------

void FCivSimulation::TickInventors()
{
	const FCivTuning& T = Settings.Tuning;
	for (int32 Index = 0; Index < Peoples.Num(); ++Index)
	{
		FCivPeople& P = Peoples[Index];
		if (!P.bAlive) { continue; }

		for (int32 Slot = P.LivingInventors.Num() - 1; Slot >= 0; --Slot)
		{
			FCivPerson& G = Persons[P.LivingInventors[Slot]];
			if (Year >= G.PlannedDeathYear)
			{
				KillPerson(G, TEXT("זקנה"));
			}
		}

		const double Yearly = T.InventorRate * BirthFactorFor(P) * FMath::Pow(FMath::Max(1.0, P.Population), T.PopulationExponent);
		const int32 Room = InventorCap(P) - P.LivingInventors.Num();
		if (Room > 0)
		{
			const int32 Births = FMath::Min(Room, Rng.Poisson(FMath::Min(Yearly, 8.0)));
			for (int32 B = 0; B < Births; ++B) { BirthInventor(Index, 0); }
		}
	}
}

bool FCivSimulation::CanWorkOn(const FCivPeople& P, int32 Invention) const
{
	if (P.Known[Invention]) { return false; }
	const FCivInventionDef& Def = Tree[Invention];
	for (int32 Prereq : Def.Prereqs)
	{
		if (!P.Known[Prereq]) { return false; }
	}
	if (Def.bNeedRequired && P.NeedPressure[static_cast<int32>(Def.Need)] < 0.2) { return false; }

	const bool bFinished = P.Progress[Invention] >= CostOf(Def);
	const double Share = bFinished ? 1.0 : 0.3;
	for (int32 R = 0; R < CivResourceCount; ++R)
	{
		if (P.Stock[R] < Def.Materials[R] * Settings.Tuning.MaterialScale * Share) { return false; }
	}
	return true;
}

int32 FCivSimulation::ChooseProject(int32 PeopleIndex, const FCivPerson& G)
{
	const FCivPeople& P = Peoples[PeopleIndex];
	const TArray<FCivInventionDef>& Table = Tree;

	int32 Best = INDEX_NONE;
	double BestScore = 0.0;
	for (int32 Index = 0; Index < Table.Num(); ++Index)
	{
		if (!CanWorkOn(P, Index)) { continue; }
		const FCivInventionDef& Def = Table[Index];

		double Score = Rng.Range(0.5, 1.5);
		Score *= (Def.Field == G.Passion) ? 2.0 : 1.0;
		// Compassionate minds lean to healing and food and away from weapons; bold ones to space and war.
		if (Def.Field == ECivField::Medicine || Def.Field == ECivField::Food) { Score *= 1.0 + G.Compassion; }
		if (Def.Field == ECivField::War) { Score *= 1.5 - G.Compassion; }
		if (Def.Field == ECivField::Space) { Score *= 1.0 + G.Boldness; }
		if (Def.Field == ECivField::Science) { Score *= 1.0 + G.Curiosity; }
		if (Def.Need != ECivNeed::None && P.NeedPressure[static_cast<int32>(Def.Need)] > 0.2) { Score *= 3.0; }
		// Unfinished work attracts company.
		Score *= 1.0 + 2.0 * FMath::Min(1.0, P.Progress[Index] / (CostOf(Def)));
		if (Score > BestScore)
		{
			BestScore = Score;
			Best = Index;
		}
	}
	return Best;
}

void FCivSimulation::TickResearch()
{
	const FCivTuning& T = Settings.Tuning;

	for (int32 Index = 0; Index < Peoples.Num(); ++Index)
	{
		FCivPeople& P = Peoples[Index];
		if (!P.bAlive || P.LivingInventors.Num() == 0) { continue; }

		// When more thinkers are born than the book can name, the named ones lead a school.
		const double Yearly = T.InventorRate * BirthFactorFor(P) * FMath::Pow(FMath::Max(1.0, P.Population), T.PopulationExponent);
		const double ExpectedAlive = Yearly * ExpectedLifespan(P);
		const double School = FMath::Max(1.0, ExpectedAlive / InventorCap(P));
		const double KnowledgeBonus = 1.0 + T.KnowledgeBonus * FMath::LogX(10.0, 1.0 + P.Knowledge);
		const double Mood = (P.CuriosityUntil > Year) ? 1.2 : 1.0;
		const double Hunger = P.Food > 0.0 ? 1.0 : 0.6;

		bool bAtWar = false;
		for (const FCivWar& War : Wars) { if (War.A == Index || War.B == Index) { bAtWar = true; break; } }
		const double WarDrag = bAtWar ? 0.8 : 1.0;

		// A copy, because a finished project can reshuffle what follows.
		const TArray<int32> Working = P.LivingInventors;
		for (int32 Id : Working)
		{
			FCivPerson& G = Persons[Id];
			if (!G.IsAlive() || Year - G.BornYear < AdultAge) { continue; }

			if (G.Project == INDEX_NONE || !CanWorkOn(P, G.Project))
			{
				G.Project = ChooseProject(Index, G);
			}

			const bool bInspired = G.InspiredUntil >= Year;
			if (Settings.bGeneratedInventions && Rng.Chance(T.GenerationChance * Settings.GeneratedInventionRate * (0.4 + G.Curiosity)))
			{
				TryGenerateInvention(Index, G);
			}

			double Output = G.Brilliance * (0.7 + 0.6 * G.Patience) * FMath::Pow(P.ResearchMult, T.ResearchExponent) * FMath::Pow(School, T.SchoolExponent) * KnowledgeBonus * Mood * Hunger * WarDrag * Settings.InventionSpeed * (1.0 + P.LawBonus);
			if (bInspired) { Output *= 3.0; }

			// A bold mind sometimes makes a leap, and sometimes pays for one.
			if (Rng.Chance(0.02 * G.Boldness)) { Output *= 5.0; }
			if (G.Boldness > 0.85 && Rng.Chance(0.0015))
			{
				KillPerson(G, TEXT("ניסוי שהשתבש"));
				continue;
			}
			P.Knowledge += Output;

			if (G.Project == INDEX_NONE)
			{
				continue;
			}

			const FCivInventionDef& Def = Tree[G.Project];
			double Gain = Output;
			if (!Def.bNeedRequired && Def.Need != ECivNeed::None && P.NeedPressure[static_cast<int32>(Def.Need)] > 0.2)
			{
				Gain *= 2.0;   // necessity is the mother of invention
			}
			P.Progress[G.Project] += Gain;

			if (P.Progress[G.Project] >= CostOf(Def))
			{
				bool bAffordable = true;
				for (int32 R = 0; R < CivResourceCount; ++R)
				{
					if (P.Stock[R] < Def.Materials[R] * T.MaterialScale) { bAffordable = false; break; }
				}
				if (bAffordable)
				{
					for (int32 R = 0; R < CivResourceCount; ++R) { P.Stock[R] -= Def.Materials[R] * T.MaterialScale; }
					GrantInvention(Index, G.Project, &G, false);
				}
				else
				{
					G.Project = INDEX_NONE;
				}
			}
		}
	}
}

FCivProposalContext FCivSimulation::MakeContext(int32 PeopleIndex) const
{
	FCivProposalContext Context;
	Context.Tree = &Tree;
	Context.People = &Peoples[PeopleIndex];
	Context.bAllowSpeculative = Settings.bSpeculativeInventions;
	for (int32 Index = 0; Index < Tree.Num(); ++Index)
	{
		if (Peoples[PeopleIndex].Known[Index]) { Context.PeopleEra = FMath::Max(Context.PeopleEra, Tree[Index].Era); }
	}
	return Context;
}

void FCivSimulation::TryGenerateInvention(int32 PeopleIndex, FCivPerson& G)
{
	int32 Generated = 0;
	for (const FCivInventionDef& Def : Tree) { if (Def.bGenerated) { ++Generated; } }
	if (Generated >= Settings.MaxGeneratedInventions || !Proposer) { return; }

	const FCivProposalContext Context = MakeContext(PeopleIndex);
	FCivInventionProposal Proposal;
	if (!Proposer->Propose(Context, Rng, Proposal)) { return; }

	++Stats.ProposalsTried;
	const ECivReject Verdict = CivGenerator::Validate(Proposal, Context);
	if (Verdict != ECivReject::None)
	{
		++Stats.Rejected[static_cast<int32>(Verdict)];
		return;
	}

	// Ideas beyond known science are rare even when allowed.
	if (Proposal.bSpeculative && !Rng.Chance(0.2)) { return; }

	++Stats.ProposalsAccepted;
	G.Project = AddToTree(Proposal, PeopleIndex);
	Write(ECivEntryKind::Invention, 1, PeopleIndex, Fill(
		G.bFemale ? TEXT("{0} מעם {1} הגתה רעיון חדש: {2}. הרעיון: {3}.") : TEXT("{0} מעם {1} הגה רעיון חדש: {2}. הרעיון: {3}."),
		{ G.Name, Peoples[PeopleIndex].Name, Proposal.Name, Proposal.Mechanism }));
}

int32 FCivSimulation::AddToTree(const FCivInventionProposal& Proposal, int32 PeopleIndex)
{
	FCivInventionDef Def;
	Def.Key = Proposal.Key;
	Def.Name = Proposal.Name;
	Def.NameDefinite = Proposal.NameDefinite;
	Def.Field = Proposal.Field;
	Def.Era = Proposal.Era;
	Def.Cost = Proposal.Cost;
	Def.Prereqs = Proposal.Parents;
	for (int32 R = 0; R < CivResourceCount; ++R) { Def.Materials[R] = Proposal.Materials[R]; }
	Def.Need = Proposal.Need;
	Def.bNeedRequired = false;
	Def.Effects = Proposal.Effects;
	Def.bGenerated = true;
	Def.bSpeculative = Proposal.bSpeculative;
	Def.PurposeKey = Proposal.PurposeKey;
	Def.PrincipleKey = Proposal.PrincipleKey;
	Def.Mechanism = Proposal.Mechanism;
	Def.ConceivedYear = Year;
	Def.ConceivedPeople = PeopleIndex;
	const int32 Index = Tree.Add(MoveTemp(Def));
	for (FCivPeople& P : Peoples)
	{
		P.Known.Add(false);
		P.Progress.Add(0.0);
	}
	return Index;
}

int32 FCivSimulation::AddCustomInvention(const FCivInventionProposal& Proposal, int32 PeopleIndex, bool bForce, ECivReject* OutReason)
{
	if (OutReason) { *OutReason = ECivReject::None; }
	if (!Peoples.IsValidIndex(PeopleIndex) || !Peoples[PeopleIndex].bAlive)
	{
		if (OutReason) { *OutReason = ECivReject::ParentUnknown; }
		return INDEX_NONE;
	}
	if (!bForce)
	{
		const ECivReject Verdict = CivGenerator::Validate(Proposal, MakeContext(PeopleIndex));
		if (Verdict != ECivReject::None)
		{
			if (OutReason) { *OutReason = Verdict; }
			return INDEX_NONE;
		}
	}
	FCivInventionProposal Copy = Proposal;
	if (Copy.Key.IsEmpty()) { Copy.Key = FString::Printf(TEXT("custom_%d"), Tree.Num()); }
	if (Copy.Cost <= 0.0) { Copy.Cost = 10.0; }
	if (bForce) { Copy.Parents.RemoveAll([this](int32 Parent) { return !Tree.IsValidIndex(Parent); }); }
	const int32 Index = AddToTree(Copy, PeopleIndex);
	Write(ECivEntryKind::God, 2, PeopleIndex, Fill(TEXT("רעיון חדש נוסף לעולם: {0}."), { Copy.Name }));
	return Index;
}

void FCivSimulation::GrantInvention(int32 PeopleIndex, int32 Invention, FCivPerson* Inventor, bool bFromNeighbour)
{
	FCivPeople& P = Peoples[PeopleIndex];
	const FCivInventionDef& Def = Tree[Invention];
	if (P.Known[Invention]) { return; }

	bool bFirstInWorld = true;
	for (int32 Index = 0; Index < Peoples.Num(); ++Index)
	{
		if (Peoples[Index].Known[Invention]) { bFirstInWorld = false; break; }
	}

	P.Known[Invention] = true;
	P.Progress[Invention] = 0.0;
	Recalculate(P);
	if (Def.Key == TEXT("planet_shield")) { bAnyShield = true; }

	if (Inventor)
	{
		++Inventor->InventionCount;
		Inventor->Reputation = FMath::Min(1.0, Inventor->Reputation + 0.1);
		Log(*Inventor, ECivLife::Invented, bFirstInWorld ? 1 : 0, Invention);
	}

	if (bFirstInWorld)
	{
		const FString Who = Inventor ? Inventor->Name : FString(TEXT("חכמי העם"));
		if (Def.Milestone != ECivMilestone::None)
		{
			RecordMilestone(Def.Milestone, PeopleIndex, Who, MilestoneTitle(Def.Milestone));
			Write(ECivEntryKind::Milestone, 3, PeopleIndex, Fill(MilestoneText(Def.Milestone), { P.Name, Who }));
		}
		else if (Inventor)
		{
			static const TCHAR* const Male[] = { TEXT("{0} {1} מעם {2} פיתח לראשונה את {3}."), TEXT("בעם {2} הגיע {0} {1} ראשון אל {3}."), TEXT("{0} {1} מעם {2} הציג, אחרי שנים של עבודה, את {3}."), TEXT("{0} מעם {2}, {1} שבחכמיו, היה הראשון בעולם שהגיע אל {3}."), TEXT("{0} {1} השלים בעם {2} את {3}, ראשון בעולם.") };
			static const TCHAR* const Female[] = { TEXT("{0} {1} מעם {2} פיתחה לראשונה את {3}."), TEXT("בעם {2} הגיעה {0} {1} ראשונה אל {3}."), TEXT("{0} {1} מעם {2} הציגה, אחרי שנים של עבודה, את {3}."), TEXT("{0} מעם {2}, {1} שבחכמיו, הייתה הראשונה בעולם שהגיעה אל {3}."), TEXT("{0} {1} השלימה בעם {2} את {3}, ראשונה בעולם.") };
			const int32 Variant = Rng.RangeInt(0, UE_ARRAY_COUNT(Male) - 1);
			Write(ECivEntryKind::Invention, 2, PeopleIndex, Fill(Inventor->bFemale ? Female[Variant] : Male[Variant], { Inventor->Name, Inventor->PersonalityWord(), P.Name, Def.NameDefinite }));
		}
		else
		{
			Write(ECivEntryKind::Invention, 2, PeopleIndex, Fill(TEXT("חכמי עם {0} חשפו את {1}."), { P.Name, Def.NameDefinite }));
		}

		// The first world era this invention opens gets its own chapter.
		if (Def.Era > WorldEra)
		{
			WorldEra = Def.Era;
			Write(ECivEntryKind::Chapter, 3, PeopleIndex, EraNames[FMath::Clamp(Def.Era, 0, UE_ARRAY_COUNT(EraNames) - 1)]);
		}
	}
	else if (bFromNeighbour)
	{
		Write(ECivEntryKind::Adoption, 1, PeopleIndex, Fill(TEXT("עם {0} למד משכניו את {1}."), { P.Name, Def.NameDefinite }));
	}
	else
	{
		Write(ECivEntryKind::Adoption, 1, PeopleIndex, Fill(TEXT("{0} מעם {1} הגיע בעצמו אל {2}."), { Inventor ? Inventor->Name : P.Name, P.Name, Def.NameDefinite }));
	}
}

void FCivSimulation::RecordMilestone(ECivMilestone Milestone, int32 PeopleIndex, const FString& InventorName, const FString& Title)
{
	if (GetMilestoneYear(Milestone) != INDEX_NONE) { return; }
	FCivMilestoneRecord Record;
	Record.Milestone = Milestone;
	Record.Year = Year;
	Record.People = PeopleIndex;
	Record.PeopleName = Peoples.IsValidIndex(PeopleIndex) ? Peoples[PeopleIndex].Name : FString();
	Record.InventorName = InventorName;
	Record.Title = Title;
	Milestones.Add(MoveTemp(Record));
}

// ---------------------------------------------------------------------------
// Knowledge spreads between neighbours
// ---------------------------------------------------------------------------

bool FCivSimulation::InContact(int32 A, int32 B) const
{
	const FCivPeople& PA = Peoples[A];
	const FCivPeople& PB = Peoples[B];
	const double Cosine = FMath::Sin(PA.Latitude) * FMath::Sin(PB.Latitude)
		+ FMath::Cos(PA.Latitude) * FMath::Cos(PB.Latitude) * FMath::Cos(PA.Longitude - PB.Longitude);
	const double Angle = FMath::Acos(FMath::Clamp(Cosine, -1.0, 1.0));
	return Angle < 1.0 + FMath::Max(PA.Range, PB.Range);
}

void FCivSimulation::TickDiffusion()
{
	const FCivTuning& T = Settings.Tuning;
	const TArray<FCivInventionDef>& Table = Tree;

	for (int32 To = 0; To < Peoples.Num(); ++To)
	{
		if (!Peoples[To].bAlive) { continue; }
		for (int32 From = 0; From < Peoples.Num(); ++From)
		{
			if (From == To || !Peoples[From].bAlive) { continue; }
			if (Peoples[From].KnownCount <= Peoples[To].KnownCount * 0.5) { continue; }
			if (!InContact(To, From)) { continue; }

			FCivPeople& Learner = Peoples[To];
			const FCivPeople& Teacher = Peoples[From];
			const double Friendliness = FMath::GetMappedRangeValueClamped(FVector2D(-100.0, 100.0), FVector2D(0.25, 1.5), Learner.Relations[From]);
			const double Rate = T.DiffusionRate * SpreadFactor * FMath::Sqrt(Teacher.SpreadMult * Learner.SpreadMult) * Friendliness * Settings.KnowledgeSpread;

			for (int32 Inv = 0; Inv < Table.Num(); ++Inv)
			{
				if (Learner.Known[Inv] || !Teacher.Known[Inv]) { continue; }
				bool bReady = true;
				for (int32 Prereq : Table[Inv].Prereqs)
				{
					if (!Learner.Known[Prereq]) { bReady = false; break; }
				}
				if (!bReady) { continue; }

				const double Cost = CostOf(Table[Inv]);
				Learner.Progress[Inv] += Cost * Rate;
				if (Learner.Progress[Inv] >= Cost)
				{
					GrantInvention(To, Inv, nullptr, true);
				}
			}
		}
	}
}

// ---------------------------------------------------------------------------
// Relations and war
// ---------------------------------------------------------------------------

void FCivSimulation::TickDiplomacy()
{
	for (int32 A = 0; A < Peoples.Num(); ++A)
	{
		if (!Peoples[A].bAlive) { continue; }
		for (int32 B = A + 1; B < Peoples.Num(); ++B)
		{
			if (!Peoples[B].bAlive || !InContact(A, B)) { continue; }

			double Relation = Peoples[A].Relations[B];
			Relation += Rng.Range(-3.0, 3.0) - Relation * 0.004;

			bool bFighting = false;
			for (const FCivWar& War : Wars)
			{
				if ((War.A == A && War.B == B) || (War.A == B && War.B == A)) { bFighting = true; break; }
			}
			if (bFighting) { Relation -= 1.0; }

			Relation = FMath::Clamp(Relation, -100.0, 100.0);
			Peoples[A].Relations[B] = Relation;
			Peoples[B].Relations[A] = Relation;

			// Friends trade: stockpiles drift toward each other.
			if (Relation > 0.0 && !bFighting)
			{
				for (int32 R = 0; R < CivResourceCount; ++R)
				{
					const double Flow = (Peoples[A].Stock[R] - Peoples[B].Stock[R]) * 0.01;
					Peoples[A].Stock[R] -= Flow;
					Peoples[B].Stock[R] += Flow;
				}
			}

			if (!bFighting && Relation < -25.0 && Rng.Chance(0.03 * Settings.WarTendency * (-Relation / 50.0) * 0.5 * (Peoples[A].RulerAggression + Peoples[B].RulerAggression)))
			{
				FCivWar War;
				War.A = A;
				War.B = B;
				War.StartYear = Year;
				Wars.Add(War);
				++Stats.Wars;
				Write(ECivEntryKind::War, 1, A, Fill(TEXT("פרצה מלחמה בין עם {0} לעם {1}."), { Peoples[A].Name, Peoples[B].Name }));
			}
		}
	}
}

void FCivSimulation::TickWars()
{
	for (int32 W = Wars.Num() - 1; W >= 0; --W)
	{
		if (!Wars.IsValidIndex(W)) { continue; }
		const FCivWar Current = Wars[W];
		FCivPeople& A = Peoples[Current.A];
		FCivPeople& B = Peoples[Current.B];

		const double PowerA = FMath::Sqrt(FMath::Max(1.0, A.Population)) * A.WarMult * Rng.Range(0.7, 1.3);
		const double PowerB = FMath::Sqrt(FMath::Max(1.0, B.Population)) * B.WarMult * Rng.Range(0.7, 1.3);

		KillPopulation(Current.A, 0.006 * PowerB / (PowerA + PowerB) * 2.0, TEXT("מלחמה"));
		KillPopulation(Current.B, 0.006 * PowerA / (PowerA + PowerB) * 2.0, TEXT("מלחמה"));
		A.NeedPressure[static_cast<int32>(ECivNeed::War)] += 0.5;
		B.NeedPressure[static_cast<int32>(ECivNeed::War)] += 0.5;

		if (Rng.Chance(0.14))
		{
			EndWar(W, PowerA >= PowerB ? Current.A : Current.B);
		}
	}
}

void FCivSimulation::EndWar(int32 WarIndex, int32 Winner)
{
	const FCivWar War = Wars[WarIndex];
	Wars.RemoveAt(WarIndex);

	const int32 Loser = Winner == War.A ? War.B : War.A;
	FCivPeople& Win = Peoples[Winner];
	FCivPeople& Lose = Peoples[Loser];
	const int32 Years = FMath::Max(1, Year - War.StartYear);
	const FString Duration = Years == 1 ? FString(TEXT("שנה אחת")) : (Years == 2 ? FString(TEXT("שנתיים")) : FString::Printf(TEXT("%d שנים"), Years));

	for (int32 R = 0; R < CivResourceCount; ++R)
	{
		const double Tribute = Lose.Stock[R] * 0.15;
		Lose.Stock[R] -= Tribute;
		Win.Stock[R] += Tribute;
	}
	Win.Relations[Loser] = FMath::Min(Win.Relations[Loser] + 25.0, 20.0);
	Lose.Relations[Winner] = Win.Relations[Loser];

	if (Win.Population > Lose.Population * 6.0 && Lose.Cities.Num() <= 1 && Rng.Chance(0.5))
	{
		EndPeople(Loser, Winner, TEXT("כיבוש"));
		return;
	}

	if (Lose.Cities.Num() > 1 && Win.Cities.Num() < MaxCitiesPerPeople && Rng.Chance(0.6))
	{
		const FCivCity City = Lose.Cities.Last();
		Lose.Cities.Pop();
		Win.Cities.Add(City);
		const double Moved = Lose.Population * 0.1;
		Lose.Population -= Moved;
		Win.Population += Moved;
		Write(ECivEntryKind::Peace, 2, Winner, Fill(TEXT("אחרי {3} של מלחמה, עם {0} גבר על עם {1} ולקח ממנו את העיר {2}."), { Win.Name, Lose.Name, City.Name, Duration }));
	}
	else
	{
		// Short border wars stay in the records; the book keeps the long ones.
		Write(ECivEntryKind::Peace, Years >= 10 ? 2 : 1, Winner, Fill(TEXT("אחרי {2} של מלחמה בין עם {0} לעם {1}, עם {0} יצא על העליונה."), { Win.Name, Lose.Name, Duration }));
	}
}

// ---------------------------------------------------------------------------
// Space and the running chronicle
// ---------------------------------------------------------------------------

void FCivSimulation::TickSpace()
{
	static const int32 StarshipIndex = FCivInventionTable::Get().Find(TEXT("starship"));

	for (int32 Index = 0; Index < Peoples.Num(); ++Index)
	{
		const FCivPeople& P = Peoples[Index];
		if (!P.bAlive || !P.Known[StarshipIndex] || !Rng.Chance(0.05)) { continue; }

		FStarVoyage Voyage;
		Voyage.People = Index;
		Voyage.ArrivalYear = Year + Rng.RangeInt(25, 70);
		Voyage.Star = CivText::StarName(Rng);
		Voyages.Add(Voyage);
		++Stats.Starships;
		Write(ECivEntryKind::Space, 1, Index, Fill(TEXT("עוד ספינה של עם {0} יצאה לדרך, אל הכוכב {1}."), { P.Name, Voyage.Star }));
	}

	for (int32 V = Voyages.Num() - 1; V >= 0; --V)
	{
		if (Voyages[V].ArrivalYear > Year) { continue; }
		const FStarVoyage Voyage = Voyages[V];
		Voyages.RemoveAt(V);
		++Stats.StarColonies;
		if (GetMilestoneYear(ECivMilestone::OtherStar) == INDEX_NONE)
		{
			RecordMilestone(ECivMilestone::OtherStar, Voyage.People, FString(), MilestoneTitle(ECivMilestone::OtherStar));
			Write(ECivEntryKind::Milestone, 3, Voyage.People, Fill(TEXT("הגיע היום: בני עם {0} נחתו על עולם המקיף את הכוכב {1}. האנושות כבר לא נמצאת בבית אחד."), { Peoples[Voyage.People].Name, Voyage.Star }));
		}
		else
		{
			Write(ECivEntryKind::Space, 2, Voyage.People, Fill(TEXT("מושבה חדשה קמה ליד הכוכב {0}."), { Voyage.Star }));
		}
	}
}

void FCivSimulation::TickChronicle()
{
	if (Year % 100 != 0) { return; }

	int32 Leader = INDEX_NONE;
	for (int32 Index = 0; Index < Peoples.Num(); ++Index)
	{
		if (Peoples[Index].bAlive && (Leader == INDEX_NONE || Peoples[Index].KnownCount > Peoples[Leader].KnownCount)) { Leader = Index; }
	}
	if (Leader == INDEX_NONE) { return; }

	// What the century brought, counted from the book itself.
	int32 NewInventions = 0, NewWars = 0;
	for (int32 I = Entries.Num() - 1; I >= 0 && Entries[I].Year > Year - 100; --I)
	{
		const FCivEntry& E = Entries[I];
		if ((E.Kind == ECivEntryKind::Invention || E.Kind == ECivEntryKind::Milestone) && E.Importance >= 2) { ++NewInventions; }
		if (E.Kind == ECivEntryKind::War) { ++NewWars; }
	}
	static const TCHAR* const Openings[] = { TEXT("סוף המאה: {0} עמים ו-{1} נפשות בעולם. "), TEXT("כך נראה העולם כשהמאה הסתיימה: {0} עמים, {1} נפשות. "), TEXT("מאה נוספת עברה. בעולם חיים {1} נפשות, ב-{0} עמים. ") };
	FString Text = Fill(Openings[(Year / 100) % UE_ARRAY_COUNT(Openings)], { FString::FromInt(GetAlivePeoples()), Count(GetWorldPopulation()) });
	if (NewInventions == 0 && NewWars == 0)
	{
		Text += TEXT("הייתה זו מאה שקטה: לא נוסף לעולם דבר חדש, ולא פרצה מלחמה.");
	}
	else
	{
		Text += TEXT("במאה הזו ");
		Text += NewInventions == 0 ? FString(TEXT("לא נוספה אף המצאה")) : (NewInventions == 1 ? FString(TEXT("נוספה המצאה אחת")) : FString::Printf(TEXT("נוספו %d המצאות"), NewInventions));
		Text += TEXT(", ");
		Text += NewWars == 0 ? FString(TEXT("ולא פרצה אף מלחמה.")) : (NewWars == 1 ? FString(TEXT("ופרצה מלחמה אחת.")) : FString::Printf(TEXT("ופרצו %d מלחמות."), NewWars));
	}
	Text += Fill(TEXT(" העם המתקדם ביותר הוא {0}, שיודע {1} המצאות."), { Peoples[Leader].Name, FString::FromInt(Peoples[Leader].KnownCount) });
	Write(ECivEntryKind::Chronicle, 2, Leader, Text);
}

// ---------------------------------------------------------------------------
// God
// ---------------------------------------------------------------------------

int32 FCivSimulation::GodInspire(int32 PeopleIndex, int32 Invention)
{
	if (!Peoples.IsValidIndex(PeopleIndex) || !Peoples[PeopleIndex].bAlive) { return INDEX_NONE; }

	FCivPerson* Chosen = nullptr;
	for (int32 Id : Peoples[PeopleIndex].LivingInventors)
	{
		FCivPerson& G = Persons[Id];
		if (Year - G.BornYear >= AdultAge && (!Chosen || G.Brilliance > Chosen->Brilliance)) { Chosen = &G; }
	}
	if (!Chosen)
	{
		Chosen = &BirthInventor(PeopleIndex, AdultAge);
	}

	Chosen->InspiredUntil = Year + 15;
	Chosen->Brilliance *= 1.3;

	FCivPeople& P = Peoples[PeopleIndex];
	if (Invention != INDEX_NONE && Tree.IsValidIndex(Invention) && CanWorkOn(P, Invention))
	{
		Chosen->Project = Invention;
	}
	else if (Chosen->Project == INDEX_NONE)
	{
		Chosen->Project = ChooseProject(PeopleIndex, *Chosen);
	}
	if (Chosen->Project != INDEX_NONE)
	{
		const double Full = CostOf(Tree[Chosen->Project]);
		P.Progress[Chosen->Project] = FMath::Min(Full, P.Progress[Chosen->Project] + Full * 0.25);
	}

	Write(ECivEntryKind::God, 2, PeopleIndex, Fill(
		Chosen->bFemale ? TEXT("{0} מעם {1} התעוררה בלילה עם רעיון שלא היה שלה. האל נגע בה.") : TEXT("{0} מעם {1} התעורר בלילה עם רעיון שלא היה שלו. האל נגע בו."),
		{ Chosen->Name, P.Name }));
	return Chosen->Id;
}

bool FCivSimulation::GodDisaster(int32 PeopleIndex, ECivEvent Disaster, double Severity)
{
	if (!Peoples.IsValidIndex(PeopleIndex) || !Peoples[PeopleIndex].bAlive) { return false; }
	ApplyEvent(Disaster, PeopleIndex, FMath::Clamp(Severity, 0.0, 1.0), true);
	return true;
}

bool FCivSimulation::GodMiracle(int32 PeopleIndex, ECivMiracle Miracle)
{
	if (!Peoples.IsValidIndex(PeopleIndex) || !Peoples[PeopleIndex].bAlive) { return false; }
	FCivPeople& P = Peoples[PeopleIndex];
	const TArray<FCivInventionDef>& Table = Tree;

	switch (Miracle)
	{
	case ECivMiracle::Abundance:
		P.Food = P.Population * 3.0;
		P.ClimateFactor = 1.4;
		P.ClimateUntil = Year + 10;
		Write(ECivEntryKind::God, 2, PeopleIndex, Fill(TEXT("נס השפע: האדמה של עם {0} הניבה בלי סוף, עשר שנים רצוף."), { P.Name }));
		break;

	case ECivMiracle::Healing:
		P.HealingUntil = Year + 25;
		P.Population *= 1.08;
		P.NeedPressure[static_cast<int32>(ECivNeed::Plague)] = 0.0;
		Write(ECivEntryKind::God, 2, PeopleIndex, Fill(TEXT("נס הריפוי: החולים של עם {0} קמו ממיטותיהם."), { P.Name }));
		break;

	case ECivMiracle::Revelation:
	{
		TArray<int32> Open;
		for (int32 Index = 0; Index < Table.Num(); ++Index)
		{
			if (P.Known[Index]) { continue; }
			bool bReady = true;
			for (int32 Prereq : Table[Index].Prereqs) { if (!P.Known[Prereq]) { bReady = false; break; } }
			if (bReady) { Open.Add(Index); }
		}
		if (Open.Num() == 0) { return false; }
		const int32 Gift = Rng.Pick(Open);
		Write(ECivEntryKind::God, 2, PeopleIndex, Fill(TEXT("נס הגילוי: עם {0} קיבל מן השמיים את {1}."), { P.Name, Table[Gift].NameDefinite }));
		GrantInvention(PeopleIndex, Gift, nullptr, false);
		break;
	}

	case ECivMiracle::Treasure:
		for (int32 R = 0; R < CivResourceCount; ++R)
		{
			const double Income = FMath::Sqrt(FMath::Max(0.0, P.Population)) * Settings.Tuning.MiningRate * P.Richness[R] * P.ResourceRate[R] * P.ResourceMult;
			P.Stock[R] += Income * 100.0 + (R < 2 ? 100.0 : 0.0);
		}
		Write(ECivEntryKind::God, 2, PeopleIndex, Fill(TEXT("נס האוצר: מכרות נפתחו מעצמם באדמת עם {0}."), { P.Name }));
		break;

	default:
		return false;
	}
	return true;
}

// ---------------------------------------------------------------------------
// The book
// ---------------------------------------------------------------------------

FString FCivSimulation::YearLabel(int32 InYear) const
{
	if (!bRealCalendar) { return FString::Printf(TEXT("שנה %d"), InYear); }
	const int32 Calendar = StartCalendarYear + InYear;
	return Calendar < 0
		? FString::Printf(TEXT("שנת %d לפנה\"ס"), -Calendar)
		: FString::Printf(TEXT("שנת %d לספירה"), Calendar);
}

FString FCivSimulation::BuildBook() const
{
	FString Book;
	Book.Reserve(Entries.Num() * 90);
	Book += TEXT("ספר ההיסטוריה של העולם\n");
	Book += FString::Printf(TEXT("זרע העולם: %llu    מנת משכל ממוצעת בעולם: %.0f\n"), Settings.Seed, Settings.AverageIQ);
	Book += TEXT("======================================\n\n");

	Book += TEXT("אבני דרך\n--------\n");
	if (Milestones.Num() == 0) { Book += TEXT("בתקופה שהספר הזה מכסה לא הגיע העולם לאבן דרך חדשה.\n"); }
	for (const FCivMilestoneRecord& Record : Milestones)
	{
		Book += YearLabel(Record.Year);
		Book += TEXT(": ");
		Book += Record.Title;
		if (!Record.PeopleName.IsEmpty()) { Book += TEXT(" (עם "); Book += Record.PeopleName; Book += TEXT(")"); }
		Book += TEXT("\n");
	}
	Book += TEXT("\n");

	int32 ChapterNumber = 0;
	for (const FCivEntry& E : Entries)
	{
		if (E.Importance < 2) { continue; }
		if (E.Kind == ECivEntryKind::Chapter)
		{
			++ChapterNumber;
			Book += FString::Printf(TEXT("\nפרק %d: "), ChapterNumber);
			Book += E.Text;
			Book += TEXT("\n--------------------------------------\n");
			continue;
		}
		Book += YearLabel(E.Year);
		Book += TEXT(": ");
		Book += E.Text;
		Book += TEXT("\n");
	}

	Book += TEXT("\nהיכל הממציאים\n--------\n");
	TArray<const FCivPerson*> Sorted;
	for (const FCivPerson& G : Persons) { if (G.InventionCount > 0) { Sorted.Add(&G); } }
	Sorted.StableSort([](const FCivPerson& X, const FCivPerson& Y) { return X.InventionCount > Y.InventionCount; });
	for (int32 I = 0; I < FMath::Min(15, Sorted.Num()); ++I)
	{
		const FCivPerson& G = *Sorted[I];
		Book += G.Name;
		Book += TEXT(", ");
		Book += G.PersonalityWord();
		Book += TEXT(", מעם ");
		Book += Peoples[G.People].Name;
		Book += G.InventionCount == 1 ? FString(TEXT(": המצאה אחת\n")) : FString::Printf(TEXT(": %d המצאות\n"), G.InventionCount);
	}

	Book += TEXT("\nהעולם בסוף הספר\n--------\n");
	Book += YearLabel(Year);
	Book += FString::Printf(TEXT(". עמים חיים: %d. נפשות: "), GetAlivePeoples());
	Book += Count(GetWorldPopulation());
	Book += FString::Printf(TEXT(". ערים שנוסדו: %d. מלחמות: %d. אירועי טבע: %d. ממציאים שנולדו: %d. המצאות חדשות שנוספו לעץ: %d. ספינות כוכבים: %d. מושבות בכוכבים אחרים: %d.\n"),
		Stats.CitiesFounded, Stats.Wars, Stats.Events, Stats.InventorsBorn, Stats.ProposalsAccepted, Stats.Starships, Stats.StarColonies);

	// With real history on, the reader can see exactly what was taken from the record, with dates and sources.
	if (bRealCalendar)
	{
		const auto DataYear = [](int32 Calendar)
		{
			return Calendar < 0 ? FString::Printf(TEXT("%d לפנה\"ס"), -Calendar) : FString::Printf(TEXT("%d לספירה"), Calendar);
		};
		Book += TEXT("\nנספח: מה בספר הזה לקוח מן ההיסטוריה האמיתית\n--------\n");
		Book += TEXT("כל השאר (העמים, האנשים, ההמצאות והמלחמות) נוצר בידי המשחק. המקורות כתובים באנגלית, כמו שהם מופיעים בספרות המחקר.\n");
		if (Settings.bRealCities)
		{
			Book += TEXT("ערים (שנת הופעה בספר, לפי התאריך המוקדם שבו קיומה כעיר מבוסס):\n");
			for (const CivRealHistory::FCity& City : CivRealHistory::Cities())
			{
				Book += TEXT("  ") + FString(City.Name) + TEXT(": ") + DataYear(City.FoundedYear);
				if (City.EndYear != MAX_int32) { Book += TEXT(", ננטשה או נחרבה ב-") + DataYear(City.EndYear); }
				Book += TEXT(". מקור: ") + FString(City.Source) + TEXT("\n");
			}
		}
		if (Settings.bRealDisasters)
		{
			Book += TEXT("אסונות (עוצמתם במשחק יחסית, לא מספר הרוגים היסטורי):\n");
			for (const CivRealHistory::FDisaster& Disaster : CivRealHistory::Disasters())
			{
				Book += TEXT("  ") + DataYear(Disaster.Year) + TEXT(": ") + FString(Disaster.Text) + TEXT(" מקור: ") + FString(Disaster.Source) + TEXT("\n");
			}
		}
		Book += TEXT("נשארו בחוץ בכוונה, כי התאריך או העובדות שנויים במחלוקת:\n");
		for (const CivRealHistory::FLeftOut& Out : CivRealHistory::LeftOut())
		{
			Book += TEXT("  ") + FString(Out.Name) + TEXT(": ") + FString(Out.Why) + TEXT("\n");
		}
	}
	return Book;
}

// ---------------------------------------------------------------------------
// Saving
// ---------------------------------------------------------------------------

namespace CivSave
{
	constexpr uint32 Magic = 0x43495653;   // "CIVS"
	constexpr uint32 Version = 2;

	template <typename TEnum>
	static void Enum(FArchive& Ar, TEnum& Value)
	{
		uint8 Raw = static_cast<uint8>(Value);
		Ar << Raw;
		Value = static_cast<TEnum>(Raw);
	}
}

using CivSave::Enum;

	static FArchive& operator<<(FArchive& Ar, FCivInventionEffects& E)
	{
		Ar << E.Food << E.Capacity << E.Resources << E.Research << E.Spread << E.Health << E.War << E.Resist << E.Range;
		for (double& Rate : E.ResourceRate) { Ar << Rate; }
		return Ar;
	}

	static FArchive& operator<<(FArchive& Ar, FCivInventionDef& D)
	{
		Ar << D.Key << D.Name << D.NameDefinite;
		Enum(Ar, D.Field);
		Ar << D.Era << D.Cost << D.Prereqs;
		for (double& M : D.Materials) { Ar << M; }
		Enum(Ar, D.Need);
		Ar << D.bNeedRequired << D.Effects;
		Enum(Ar, D.Milestone);
		Ar << D.bGenerated << D.bSpeculative << D.PurposeKey << D.PrincipleKey << D.Mechanism << D.ConceivedYear << D.ConceivedPeople;
		return Ar;
	}

	static FArchive& operator<<(FArchive& Ar, FCivLifeEvent& E)
	{
		Ar << E.Year;
		Enum(Ar, E.Kind);
		return Ar << E.Other << E.Param << E.Era << E.OtherName;
	}

	static FArchive& operator<<(FArchive& Ar, FCivCity& C)
	{
		return Ar << C.Name << C.Latitude << C.Longitude << C.Weight << C.FoundedYear << C.RealId;
	}

	static FArchive& operator<<(FArchive& Ar, FCivPerson& G)
	{
		Ar << G.Id << G.Name << G.FirstName << G.House << G.bFemale << G.People << G.BornYear << G.DeathYear << G.PlannedDeathYear << G.DeathCause;
		Ar << G.Curiosity << G.Boldness << G.Patience << G.Compassion << G.Ambition << G.Piety << G.Cruelty << G.Cunning << G.Charisma << G.Brilliance;
		Ar << G.Health << G.Arms << G.Reputation << G.Faith << G.Wealth;
		Enum(Ar, G.Rank); Enum(Ar, G.OriginRank); Enum(Ar, G.Occupation); Enum(Ar, G.AwakeningCause);
		Ar << G.RebelStart << G.Father << G.Mother << G.Spouse << G.Rival << G.Patron << G.ChildCount;
		Ar << G.bMoved << G.bInventor << G.bHeir << G.bHoly << G.bVenerated << G.bTyrant << G.bRich << G.bChildDeath << G.bPromoted << G.Log;
		Enum(Ar, G.Passion);
		return Ar << G.Project << G.InspiredUntil << G.InventionCount;
	}

	static FArchive& operator<<(FArchive& Ar, FCivPeople& P)
	{
		Ar << P.Name << P.bAlive << P.FoundedYear << P.Latitude << P.Longitude << P.LandQuality << P.Population << P.Food << P.Knowledge;
		for (double& V : P.Stock) { Ar << V; }
		for (double& V : P.Richness) { Ar << V; }
		for (double& V : P.NeedPressure) { Ar << V; }
		Ar << P.Cities << P.Relations << P.Known << P.Progress << P.LivingInventors << P.LivingPersons;
		Ar << P.Ruler << P.RulerAggression << P.LawBonus << P.Faith << P.ExplorerRange;
		return Ar << P.ClimateFactor << P.ClimateUntil << P.CuriosityUntil << P.HealingUntil;
	}

	static FArchive& operator<<(FArchive& Ar, FCivWar& W) { return Ar << W.A << W.B << W.StartYear; }

	static FArchive& operator<<(FArchive& Ar, FCivEntry& E)
	{
		Ar << E.Year;
		Enum(Ar, E.Kind);
		return Ar << E.Importance << E.People << E.Text;
	}

	static FArchive& operator<<(FArchive& Ar, FCivMilestoneRecord& M)
	{
		Enum(Ar, M.Milestone);
		return Ar << M.Year << M.People << M.PeopleName << M.InventorName << M.Title;
	}

	namespace CivSave
{
	static void Stats(FArchive& Ar, FCivStats& S)
	{
		Ar << S.Events << S.Wars << S.InventorsBorn << S.PeoplesLost << S.CitiesFounded << S.CitiesLost << S.Starships << S.StarColonies;
		Ar << S.ProposalsTried << S.ProposalsAccepted << S.RealDisasters;
		Ar << S.PersonsCreated << S.DiedYoung << S.Knighted << S.Ennobled << S.RulersFromCommon << S.CoupsTried << S.CoupsWon << S.Deposed << S.Tyrants;
		Ar << S.Preachers << S.Saints << S.Healers << S.RichMerchants << S.Ruined << S.Rebels << S.RebellionsWon << S.Explorers;
		for (int32& R : S.Rejected) { Ar << R; }
	}

	static void Settings(FArchive& Ar, FCivWorldSettings& W)
	{
		Ar << W.Seed << W.AverageIQ << W.NumPeoples << W.StartEra << W.StartPopulation << W.DisasterFrequency << W.DisasterStrength << W.WarTendency;
		Ar << W.InventionSpeed << W.KnowledgeSpread << W.ResourceAbundance << W.LandFertility;
		Ar << W.bGeneratedInventions << W.bSpeculativeInventions << W.GeneratedInventionRate << W.MaxGeneratedInventions;
		Ar << W.bRealCities << W.bRealDisasters << W.bKeepRandomDisasters << W.RealHistoryStartYear << W.NamedPersonsPerPeople;
		FCivTuning& T = W.Tuning;
		Ar << T.BirthFactorAt200 << T.SpreadFactorAt200 << T.BirthIQExponent << T.SpreadIQExponent << T.InventorRate << T.PopulationExponent << T.InventorCapPerPeople << T.CostScale;
		Ar << T.DiffusionRate << T.MaterialScale << T.MiningRate << T.StartingFoodPerPerson << T.PopulationGrowth << T.BaseCapacity;
		for (double& Exponent : T.BirthIQExponentByEra) { Ar << Exponent; }
		Ar << T.GenerationChance << T.GeneratedEffectCap << T.KnowledgeBonus << T.ResearchExponent << T.SchoolExponent << T.EraCostFactor;
		for (double& Shape : T.EraCostShape) { Ar << Shape; }
	}
}

void FCivSimulation::Serialize(FArchive& Ar)
{
	using namespace CivSave;
	CivSave::Settings(Ar, Settings);
	Ar << Rng.State << Rng.Inc << Year << YearsPerSecond << TimeAccumulator << bExtinct << WorldEra << bRealCalendar << StartCalendarYear;
	Ar << Tree << Peoples << Persons << Wars << Entries << Milestones;
	CivSave::Stats(Ar, Stats);
	Ar << RealCityDone << RealDisasterDone << bAnyShield << ForgetCursor;

	int32 VoyageCount = Voyages.Num();
	Ar << VoyageCount;
	if (Ar.IsLoading()) { Voyages.SetNum(VoyageCount); }
	for (FStarVoyage& V : Voyages) { Ar << V.People << V.ArrivalYear << V.Star; }

	if (Ar.IsLoading())
	{
		ComputeFactors();
		for (FCivPeople& P : Peoples) { Recalculate(P); }
	}
}

void FCivSimulation::SaveToBytes(TArray<uint8>& OutBytes)
{
	OutBytes.Reset();
	FMemoryWriter Writer(OutBytes);
	uint32 Magic = CivSave::Magic, Version = CivSave::Version;
	Writer << Magic << Version;
	Serialize(Writer);
}

TUniquePtr<FCivSimulation> FCivSimulation::LoadFromBytes(const TArray<uint8>& Bytes)
{
	FMemoryReader Reader(Bytes);
	uint32 Magic = 0, Version = 0;
	Reader << Magic << Version;
	if (Reader.IsError() || Magic != CivSave::Magic || Version != CivSave::Version) { return nullptr; }

	TUniquePtr<FCivSimulation> Sim = MakeUnique<FCivSimulation>(FCivWorldSettings());
	Sim->Peoples.Reset();
	Sim->Persons.Reset();
	Sim->Entries.Reset();
	Sim->Milestones.Reset();
	Sim->Serialize(Reader);
	if (Reader.IsError()) { return nullptr; }
	return Sim;
}

uint64 FCivSimulation::ComputeHash() const
{
	uint64 Hash = 14695981039346656037ULL;
	const auto Mix = [&Hash](uint64 Value)
	{
		for (int32 Byte = 0; Byte < 8; ++Byte)
		{
			Hash ^= (Value >> (Byte * 8)) & 0xFF;
			Hash *= 1099511628211ULL;
		}
	};
	const auto MixDouble = [&Mix](double Value)
	{
		uint64 Bits = 0;
		FMemory::Memcpy(&Bits, &Value, sizeof(Bits));
		Mix(Bits);
	};
	const auto MixText = [&Mix](const FString& Text)
	{
		for (TCHAR Ch : Text) { Mix(static_cast<uint64>(Ch)); }
	};

	Mix(static_cast<uint64>(Year));
	Mix(Rng.State);
	Mix(static_cast<uint64>(Tree.Num()));
	Mix(static_cast<uint64>(Persons.Num()));
	for (const FCivPerson& Person : Persons) { Mix(static_cast<uint64>(Person.Log.Num())); MixDouble(Person.Reputation); Mix(static_cast<uint64>(Person.Rank)); }
	for (const FCivInventionDef& Def : Tree) { if (Def.bGenerated) { MixText(Def.Name); } }
	for (const FCivPeople& P : Peoples)
	{
		MixDouble(P.Population);
		MixDouble(P.Food);
		MixDouble(P.Knowledge);
		Mix(static_cast<uint64>(P.KnownCount));
		for (int32 R = 0; R < CivResourceCount; ++R) { MixDouble(P.Stock[R]); }
	}
	for (const FCivEntry& E : Entries)
	{
		Mix(static_cast<uint64>(E.Year));
		MixText(E.Text);
	}
	return Hash;
}
