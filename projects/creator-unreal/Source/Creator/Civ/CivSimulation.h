// The civilization engine. Core types only: no rendering, no UObjects, no world access.
// Stage 3 connects it to the planet through Latitude / Longitude on peoples and cities.
#pragma once

#include "CoreMinimal.h"
#include "CivInventions.h"
#include "CivGenerator.h"
#include "CivRandom.h"

/** Engine constants for developers. What the player chooses lives in FCivWorldSettings. */
struct FCivTuning
{
	// What average IQ does: notable inventors are born faster, and knowledge spreads faster.
	// Both factors are anchored at IQ 200 (a world of geniuses reaching the moon around year 800);
	// the exponents decide how steeply that falls off toward ordinary people.
	double BirthFactorAt200 = 9.18959;   // 2 to the power 3.2
	double SpreadFactorAt200 = 2.828427;  // 2 to the power 1.5
	double BirthIQExponent = 4.5;      // used only if the per-era list below is cleared to zeros
	// How steeply invention depends on IQ, era by era. Early breakthroughs needed rare minds; from the age of
	// schools, printing and laboratories, institutions carry ordinary people further. This gives an IQ 100 world
	// the real pace of history: very slow ancient centuries, then a quickening modern age.
	double BirthIQExponentByEra[9] = { 4.5, 4.5, 5.5, 7.5, 4.2, 2.8, 2.6, 2.2, 2.2 };
	double SpreadIQExponent = 2.5;

	double InventorRate = 0.0009;      // per year, per square root of population, at IQ 100
	double PopulationExponent = 0.5;   // how strongly population feeds the inventor birth rate
	int32 InventorCapPerPeople = 24;   // named inventors alive at once; the excess becomes their "school"
	double CostScale = 14.0;           // multiplies the cost of every invention
	double DiffusionRate = 0.006;      // share of an invention's cost learned from a neighbour per year, at IQ 100
	double MaterialScale = 1.0;        // multiplies the material bill of every invention
	double MiningRate = 0.09;          // resource income per year per square root of population
	double StartingFoodPerPerson = 1.0;
	double PopulationGrowth = 0.022;
	double BaseCapacity = 25000.0;     // people one homeland feeds before any invention
	double GenerationChance = 0.01;    // yearly chance per working inventor to attempt a new idea
	double GeneratedEffectCap = 2.5;   // all generated inventions together cannot multiply one channel beyond this
	double KnowledgeBonus = 0.1;        // research bonus per factor of ten in accumulated knowledge
	double ResearchExponent = 0.4;      // how fully research inventions compound
	double SchoolExponent = 1.0;        // how fully the unnamed followers of inventors add up
	double EraCostFactor = 2.0;         // each era multiplies invention cost by this
	// A further multiplier per era, to give the ages their real pace: slow ancient centuries, a fast modern rush.
	double EraCostShape[9] = { 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0 };
};

/** Everything the player chooses when creating a world. The defaults are an ordinary random world. */
struct FCivWorldSettings
{
	static constexpr int32 EarliestRealCities = -999999;

	uint64 Seed = 1;
	double AverageIQ = 100.0;              // about 70 to 200; 100 is ordinary people
	int32 NumPeoples = 6;
	int32 StartEra = -1;                   // 0..8; -1 = automatic (era 0 for a random world)
	double StartPopulation = 1.0;
	double DisasterFrequency = 1.0;
	double DisasterStrength = 1.0;
	double WarTendency = 1.0;
	double InventionSpeed = 1.0;
	double KnowledgeSpread = 1.0;
	double ResourceAbundance = 1.0;
	double LandFertility = 1.0;

	// Open-ended invention tree
	bool bGeneratedInventions = true;
	bool bSpeculativeInventions = true;
	double GeneratedInventionRate = 1.0;
	int32 MaxGeneratedInventions = 300;

	// Real history: off by default, separately for cities and for disasters
	bool bRealCities = false;
	bool bRealDisasters = false;
	int32 NamedPersonsPerPeople = 30;      // fully simulated individuals per people; everyone else is statistics
	bool bKeepRandomDisasters = true;     // keep unrecorded natural events running alongside real ones
	int32 RealHistoryStartYear = EarliestRealCities;   // calendar year, negative for BCE

	FCivTuning Tuning;
};

enum class ECivEvent : uint8
{
	Earthquake, Volcano, Flood, Drought, Plague, Storm, Meteor, IceAge, Bumper, Comet, SolarStorm, Count
};

enum class ECivMiracle : uint8 { Abundance, Healing, Revelation, Treasure, Count };

enum class ECivEntryKind : uint8 { Chapter, Milestone, Invention, Adoption, Event, War, Peace, City, People, Inventor, God, Chronicle, Space };

struct FCivCity
{
	FString Name;
	double Latitude = 0.0;     // radians
	double Longitude = 0.0;    // radians
	double Weight = 1.0;       // share of the people's population
	int32 FoundedYear = 0;
	int32 RealId = INDEX_NONE; // index in the real-history data, or none
};

enum class ECivRank : uint8 { Commoner, Knight, Lord, Ruler };
enum class ECivOccupation : uint8 { None, Farmer, Artisan, Soldier, Lord, Merchant, Priest, Healer, Inventor, Rebel, Explorer };

enum class ECivLife : uint8
{
	Born, FromCrowd, Work, Married, MarriedUp, Child, ChildDied, Widowed, Illness, PlagueSurvived, Hunger, Levied, Battle,
	Knighted, Ennobled, Inherited, Crowned, Chosen, CoupWon, CoupLost, Deposed, Disgraced, Tyrant, Law,
	Awakening, Miracle, Holy, Faith, Persecuted, Rich, Ruined, Healer, Rebel, RebelWon, Explorer, Discovery,
	BecameInventor, Invented, Inspired, Blessed, Cursed, Died, Venerated, MovedCity, GoodYear, Feud, Grandchild,
	FromNobility, Retired, RebelFaded, General
};

/** One line of a life, kept small because there are very many; the Hebrew is written only when someone reads it. */
struct FCivLifeEvent
{
	int32 Year = 0;
	ECivLife Kind = ECivLife::Born;
	int32 Other = INDEX_NONE;     // another person
	int32 Param = INDEX_NONE;     // depends on the kind
	uint8 Era = 0;                // the people's era at the time, so titles read as they were then
	FString OtherName;            // only for people who were never fully simulated
};

/** Every named individual. An inventor is simply a person whose life went that way. */
struct FCivPerson
{
	int32 Id = 0;
	FString Name;
	FString FirstName;
	FString House;
	bool bFemale = false;
	int32 People = INDEX_NONE;
	int32 BornYear = 0;
	int32 DeathYear = INDEX_NONE;   // INDEX_NONE while alive
	int32 PlannedDeathYear = 0;
	FString DeathCause;

	// Traits (0..1), fixed at birth, partly inherited
	double Curiosity = 0.5;
	double Boldness = 0.5;
	double Patience = 0.5;
	double Compassion = 0.5;
	double Ambition = 0.5;
	double Piety = 0.5;
	double Cruelty = 0.5;
	double Cunning = 0.5;
	double Charisma = 0.5;
	double Brilliance = 1.0;

	// State that life changes
	double Health = 1.0;
	double Arms = 0.0;
	double Reputation = 0.0;
	double Faith = 0.0;
	double Wealth = 0.05;
	ECivRank Rank = ECivRank::Commoner;
	ECivRank OriginRank = ECivRank::Commoner;
	ECivOccupation Occupation = ECivOccupation::None;
	ECivNeed AwakeningCause = ECivNeed::None;
	int32 RebelStart = 0;

	// Relationships
	int32 Father = INDEX_NONE;
	int32 Mother = INDEX_NONE;
	int32 Spouse = INDEX_NONE;
	int32 Rival = INDEX_NONE;
	int32 Patron = INDEX_NONE;
	int32 ChildCount = 0;

	bool bInventor = false;
	bool bHeir = false;
	bool bHoly = false;
	bool bVenerated = false;
	bool bTyrant = false;
	bool bRich = false;
	bool bChildDeath = false;
	bool bPromoted = false;
	bool bMoved = false;

	TArray<FCivLifeEvent> Log;

	// Inventor work
	ECivField Passion = ECivField::Craft;
	int32 Project = INDEX_NONE;
	int32 InspiredUntil = INDEX_NONE;
	int32 InventionCount = 0;

	bool IsAlive() const { return DeathYear == INDEX_NONE; }
	/** The personality word for the history book, in the right gender. */
	FString PersonalityWord() const;
};

struct FCivPeople
{
	FString Name;
	bool bAlive = true;
	int32 FoundedYear = 0;
	double Latitude = 0.0;
	double Longitude = 0.0;
	double LandQuality = 1.0;
	double Population = 0.0;
	double Food = 0.0;
	double Knowledge = 0.0;
	double Stock[CivResourceCount] = { 0.0, 0.0, 0.0, 0.0, 0.0 };
	double Richness[CivResourceCount] = { 1.0, 1.0, 1.0, 1.0, 1.0 };
	double NeedPressure[CivNeedCount] = { 0.0, 0.0, 0.0, 0.0, 0.0 };
	TArray<FCivCity> Cities;
	TArray<double> Relations;   // one value per people index, -100 .. 100
	TArray<bool> Known;
	TArray<double> Progress;
	TArray<int32> LivingInventors;
	TArray<int32> LivingPersons;
	int32 KnownCount = 0;
	int32 Era = 0;

	// What the people's own individuals have done to it
	int32 Ruler = INDEX_NONE;
	double RulerAggression = 1.0;
	double LawBonus = 0.0;
	double Faith = 0.0;
	double ExplorerRange = 0.0;

	// Temporary conditions
	double ClimateFactor = 1.0;
	int32 ClimateUntil = 0;
	int32 CuriosityUntil = 0;
	int32 HealingUntil = 0;

	// Cached from the known inventions
	double FoodMult = 1.0;
	double CapacityMult = 1.0;
	double ResourceMult = 1.0;
	double ResearchMult = 1.0;
	double SpreadMult = 1.0;
	double HealthMult = 1.0;
	double WarMult = 1.0;
	double Resist = 0.0;
	double Range = 0.0;
	double ResourceRate[CivResourceCount] = { 1.0, 1.0, 0.0, 0.0, 0.0 };
};

struct FCivWar
{
	int32 A = INDEX_NONE;
	int32 B = INDEX_NONE;
	int32 StartYear = 0;
};

struct FCivEntry
{
	int32 Year = 0;
	ECivEntryKind Kind = ECivEntryKind::Chronicle;
	int32 Importance = 1;      // 1 = footnote (hidden from the book), 2 = normal, 3 = major
	int32 People = INDEX_NONE;
	FString Text;
};

struct FCivMilestoneRecord
{
	ECivMilestone Milestone = ECivMilestone::None;
	int32 Year = 0;
	int32 People = INDEX_NONE;
	FString PeopleName;
	FString InventorName;
	FString Title;
};

struct FCivStats
{
	int32 Events = 0;
	int32 Wars = 0;
	int32 InventorsBorn = 0;
	int32 PeoplesLost = 0;
	int32 CitiesFounded = 0;
	int32 CitiesLost = 0;
	int32 Starships = 0;
	int32 StarColonies = 0;
	int32 ProposalsTried = 0;
	int32 ProposalsAccepted = 0;
	int32 Rejected[CivRejectCount] = { 0 };
	int32 RealDisasters = 0;

	// How lives turned out
	int32 PersonsCreated = 0;
	int32 DiedYoung = 0;
	int32 Knighted = 0;
	int32 Ennobled = 0;
	int32 RulersFromCommon = 0;
	int32 CoupsTried = 0;
	int32 CoupsWon = 0;
	int32 Deposed = 0;
	int32 Tyrants = 0;
	int32 Preachers = 0;
	int32 Saints = 0;
	int32 Healers = 0;
	int32 RichMerchants = 0;
	int32 Ruined = 0;
	int32 Rebels = 0;
	int32 RebellionsWon = 0;
	int32 Explorers = 0;
};

struct FCivYearContext
{
	int32 PeopleIndex = 0;
	int32 Era = 0;
	bool bAtWar = false;
	bool bPlague = false;
	bool bFamine = false;
	bool bDisaster = false;
	bool bRulerIsTyrant = false;
	int32 Enemy = INDEX_NONE;     // the people fought this year, if any
};

class FCivSimulation
{
public:
	explicit FCivSimulation(const FCivWorldSettings& InSettings);

	// --- Time ---------------------------------------------------------------
	/** Plays one year. Does nothing once every people has died out. */
	void StepYear();
	/** Runs by real time at the current speed. Returns how many years were played. */
	int32 Advance(double DeltaSeconds);

	// --- God actions --------------------------------------------------------
	/** Speed up, slow down or pause time. 0 pauses. */
	void GodSetSpeed(double NewYearsPerSecond);
	/** Inspires the people's brightest inventor (or calls a new one). Invention is optional; INDEX_NONE lets the inventor choose. Returns the inventor id. */
	int32 GodInspire(int32 PeopleIndex, int32 Invention = INDEX_NONE);
	/** Sends a natural disaster. Severity 0 .. 1. Returns false if the target people is gone. */
	bool GodDisaster(int32 PeopleIndex, ECivEvent Disaster, double Severity);
	/** Sends a miracle. Returns false if the target people is gone. */
	bool GodMiracle(int32 PeopleIndex, ECivMiracle Miracle);

	/** God acting on one person. Returns false if that person is dead or unknown. */
	bool GodBlessPerson(int32 Id);
	bool GodCursePerson(int32 Id);
	bool GodInspirePerson(int32 Id);

	// --- Individual lives ---------------------------------------------------
	/** Brings someone out of the statistics as a full person with a generated past. Returns their id. */
	int32 PromoteFromCrowd(int32 PeopleIndex);
	/** The person's life, written out in Hebrew. */
	FString BuildLifeStory(int32 Id) const;

	// --- The open tree ------------------------------------------------------
	/** Adds an invention by hand for the player or god. It must pass the rules unless bForce is set. Returns its index, or INDEX_NONE with OutReason filled. */
	int32 AddCustomInvention(const FCivInventionProposal& Proposal, int32 PeopleIndex, bool bForce, ECivReject* OutReason = nullptr);
	/** Replaces the idea source, for example with a language-model bridge later. */
	void SetProposer(TUniquePtr<ICivInventionProposer> NewProposer) { Proposer = MoveTemp(NewProposer); }
	FCivProposalContext MakeContext(int32 PeopleIndex) const;
	const TArray<FCivInventionDef>& GetTree() const { return Tree; }

	// --- Saving -------------------------------------------------------------
	void SaveToBytes(TArray<uint8>& OutBytes);
	/** Returns nullptr if the data is not a valid save. */
	static TUniquePtr<FCivSimulation> LoadFromBytes(const TArray<uint8>& Bytes);

	// --- Reading the world --------------------------------------------------
	int32 GetYear() const { return Year; }
	/** The calendar year when real history is on (negative is BCE); otherwise the world's own year. */
	int32 GetCalendarYear() const { return StartCalendarYear + Year; }
	bool UsesRealCalendar() const { return bRealCalendar; }
	double GetYearsPerSecond() const { return YearsPerSecond; }
	const FCivWorldSettings& GetSettings() const { return Settings; }
	const TArray<FCivPeople>& GetPeoples() const { return Peoples; }
	const TArray<FCivPerson>& GetPersons() const { return Persons; }
	const TArray<FCivWar>& GetWars() const { return Wars; }
	const TArray<FCivEntry>& GetEntries() const { return Entries; }
	const TArray<FCivMilestoneRecord>& GetMilestones() const { return Milestones; }
	const FCivStats& GetStats() const { return Stats; }
	bool IsExtinct() const { return bExtinct; }
	double GetWorldPopulation() const;
	int32 GetAlivePeoples() const;
	/** The year of a milestone, or INDEX_NONE if it has not happened. */
	int32 GetMilestoneYear(ECivMilestone Milestone) const;

	/** The full history book as text. */
	FString BuildBook() const;
	/** A fingerprint of the whole state; equal fingerprints mean equal histories. */
	uint64 ComputeHash() const;

private:
	FCivWorldSettings Settings;
	FCivRandom Rng;
	int32 Year = 0;
	double YearsPerSecond = 1.0;
	double TimeAccumulator = 0.0;
	bool bExtinct = false;
	int32 WorldEra = -1;
	bool bRealCalendar = false;
	int32 StartCalendarYear = 0;

	TArray<FCivInventionDef> Tree;
	TArray<FCivPeople> Peoples;
	TArray<FCivPerson> Persons;
	TArray<FCivWar> Wars;
	TArray<FCivEntry> Entries;
	TArray<FCivMilestoneRecord> Milestones;
	FCivStats Stats;
	TArray<bool> RealCityDone;
	TArray<bool> RealDisasterDone;
	TUniquePtr<ICivInventionProposer> Proposer;

	struct FStarVoyage { int32 People = 0; int32 ArrivalYear = 0; FString Star; };
	TArray<FStarVoyage> Voyages;
	bool bAnyShield = false;
	TArray<TPair<int32, int32>> PendingBirths;
	int32 ForgetCursor = 0;

	double BirthFactors[9] = { 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0 };
	double BirthFactorFor(const FCivPeople& P) const { return BirthFactors[FMath::Clamp(P.Era, 0, 8)]; }
	double SpreadFactor = 1.0;

	void Serialize(FArchive& Ar);
	void ComputeFactors();

	void CreatePeople(int32 Index, const FString* FixedName, const double* LatRad, const double* LonRad);
	int32 AddPeopleSlot();
	void Recalculate(FCivPeople& P);
	FCivPerson& BirthInventor(int32 PeopleIndex, int32 AgeYears);
	void SetupRealHistory();
	int32 ResolveStartEra() const;

	void SeedPersonPool();
	int32 CreatePerson(FCivRandom& Random, int32 PeopleIndex, int32 Father, int32 Mother, int32 AgeYears);
	FCivLifeEvent& Log(FCivPerson& Me, ECivLife Kind, int32 Other = INDEX_NONE, int32 Param = INDEX_NONE);
	/** Brings in an adult from the old families the book has not named yet, so a throne never falls to a stranger by accident. */
	int32 CreateNoble(int32 PeopleIndex);
	/** An ambitious lord or general reaches for the throne. Returns true if it cost them their life. */
	bool TryCoup(int32 Id, const FCivYearContext& Context);
	int32 CountNobles(int32 PeopleIndex) const;
	void TickPersons();
	void LifeYear(int32 Id, const FCivYearContext& Context);
	void UpdateRuler(int32 PeopleIndex, const FCivYearContext& Context);
	void SetRuler(int32 PeopleIndex, int32 Id, ECivLife How, int32 Fallen);
	void ForgetOldLives();

	void TickEvents();
	void TickRealHistory();
	void TickEconomy();
	void TickCities();
	void TickInventors();
	void TickResearch();
	void TickDiffusion();
	void TickDiplomacy();
	void TickWars();
	void TickSpace();
	void TickChronicle();

	void ApplyEvent(ECivEvent Event, int32 PeopleIndex, double Severity, bool bFromGod, const FString* Report = nullptr);
	void KillPopulation(int32 PeopleIndex, double Fraction, const TCHAR* Cause);
	void KillPerson(FCivPerson& G, const TCHAR* Cause);
	int32 ChooseProject(int32 PeopleIndex, const FCivPerson& G);
	bool CanWorkOn(const FCivPeople& P, int32 Invention) const;
	void GrantInvention(int32 PeopleIndex, int32 Invention, FCivPerson* Inventor, bool bFromNeighbour);
	void RecordMilestone(ECivMilestone Milestone, int32 PeopleIndex, const FString& InventorName, const FString& Title);
	void FoundCity(int32 PeopleIndex);
	void DestroyCity(int32 PeopleIndex, int32 CityIndex);
	void EndPeople(int32 PeopleIndex, int32 Conqueror, const FString& Reason);
	void EndWar(int32 WarIndex, int32 Winner);
	void Secede(int32 PeopleIndex);
	bool InContact(int32 A, int32 B) const;
	void Write(ECivEntryKind Kind, int32 Importance, int32 PeopleIndex, const FString& Text);
	const FString& CityOrName(const FCivPeople& P) const;
	double ExpectedLifespan(const FCivPeople& P) const;
	double CostOf(const FCivInventionDef& Def) const;
	int32 InventorCap(const FCivPeople& P) const;
	FString YearLabel(int32 InYear) const;
	int32 NearestPeople(double LatRad, double LonRad) const;
	void AddRealCity(int32 DataIndex, bool bAtStart);

	void TryGenerateInvention(int32 PeopleIndex, FCivPerson& G);
	int32 AddToTree(const FCivInventionProposal& Proposal, int32 PeopleIndex);
};
