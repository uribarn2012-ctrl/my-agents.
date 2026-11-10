// Hebrew text helpers: invented names (with correct final letter forms), template filling, numbers.
#pragma once

#include "CoreMinimal.h"

struct FCivRandom;

namespace CivText
{
	/** Puts final letter forms at word ends and regular forms everywhere else. */
	FString FixFinalForms(const FString& Text);

	FString PeopleName(FCivRandom& Rng);
	FString CityName(FCivRandom& Rng);
	FString StarName(FCivRandom& Rng);
	FString PersonName(FCivRandom& Rng, bool bFemale);
	FString FirstName(FCivRandom& Rng, bool bFemale);

	/** Replaces {0}, {1}, ... in the template. */
	FString Fill(const TCHAR* Template, std::initializer_list<FString> Args);

	/** A population count in Hebrew words: 3.2 million is written with the Hebrew word for million. */
	FString Count(double Value);
}
