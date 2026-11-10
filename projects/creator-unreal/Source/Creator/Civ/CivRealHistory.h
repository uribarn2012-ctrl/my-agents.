// Optional real-history data: only well-established cities and well-documented disasters, each with a date and a source note.
// Years are calendar years, negative for BCE. Off by default.
#pragma once

#include "CoreMinimal.h"

enum class ECivEvent : uint8;

namespace CivRealHistory
{
	struct FRegion
	{
		const TCHAR* Key;
		const TCHAR* Name;     // Hebrew
		double LatDeg;
		double LonDeg;
	};

	struct FCity
	{
		const TCHAR* Name;     // Hebrew
		const TCHAR* Region;
		double LatDeg;
		double LonDeg;
		int32 FoundedYear;     // earliest date its existence as a city is well established
		int32 EndYear;         // abandoned or destroyed; MAX_int32 if it outlasts the data
		const TCHAR* Source;
	};

	struct FDisaster
	{
		const TCHAR* Text;     // Hebrew, for the history book
		int32 Year;
		ECivEvent Type;
		double Severity;       // simulation strength, 0..1 (not a historical death count)
		double LatDeg;
		double LonDeg;
		double RadiusRad;      // peoples within this angle are hit
		const TCHAR* Source;
	};

	const TArray<FRegion>& Regions();
	const TArray<FCity>& Cities();
	const TArray<FDisaster>& Disasters();
	int32 EarliestCityYear();
	int32 LatestCityYear();
}
