// The invention tree: one data table, from fire to interstellar travel.
#pragma once

#include "CoreMinimal.h"

enum class ECivResource : uint8 { Wood, Stone, Metal, Energy, Rare, Count };
enum class ECivField : uint8 { Food, Craft, Society, War, Medicine, Science, Space, Count };
enum class ECivNeed : uint8 { None, Disaster, War, Famine, Plague, Count };

enum class ECivMilestone : uint8
{
	None, Fire, Agriculture, FirstCity, Writing, Printing, Steam, Electricity, Flight,
	Computer, Satellite, Moon, Mars, StarLaunch, OtherStar, Count
};

constexpr int32 CivResourceCount = static_cast<int32>(ECivResource::Count);
constexpr int32 CivNeedCount = static_cast<int32>(ECivNeed::Count);
constexpr int32 CivFieldCount = static_cast<int32>(ECivField::Count);

/** What knowing an invention does for a people. Multipliers default to 1, additions to 0. */
struct FCivInventionEffects
{
	double Food = 1.0;
	double Capacity = 1.0;
	double Resources = 1.0;
	double Research = 1.0;
	double Spread = 1.0;
	double Health = 1.0;
	double War = 1.0;
	double Resist = 0.0;
	double Range = 0.0;
	double ResourceRate[CivResourceCount] = { 0.0, 0.0, 0.0, 0.0, 0.0 };
};

struct FCivInventionDef
{
	FString Key;
	FString Name;            // Hebrew, plain form
	FString NameDefinite;    // Hebrew, form that follows the word "et"
	ECivField Field = ECivField::Craft;
	int32 Era = 0;
	double Cost = 1.0;       // years of one inventor's work
	TArray<int32> Prereqs;
	double Materials[CivResourceCount] = { 0.0, 0.0, 0.0, 0.0, 0.0 };
	ECivNeed Need = ECivNeed::None;
	bool bNeedRequired = false;   // true: cannot start without the need. false: the need only speeds it up.
	FCivInventionEffects Effects;
	ECivMilestone Milestone = ECivMilestone::None;

	// Only for inventions added during play.
	bool bGenerated = false;
	bool bSpeculative = false;
	FString PurposeKey;
	FString PrincipleKey;
	FString Mechanism;
	int32 ConceivedYear = 0;
	int32 ConceivedPeople = INDEX_NONE;
};

class FCivInventionTable
{
public:
	/** The single shared table, built on first use. */
	static const FCivInventionTable& Get();

	const TArray<FCivInventionDef>& All() const { return Defs; }
	int32 Num() const { return Defs.Num(); }
	const FCivInventionDef& operator[](int32 Index) const { return Defs[Index]; }
	int32 Find(const FString& Key) const;

	/** Empty when the table is sound; otherwise one line per problem. */
	const TArray<FString>& Problems() const { return BuildProblems; }

private:
	FCivInventionTable();
	TArray<FCivInventionDef> Defs;
	TArray<FString> BuildProblems;
};
