// Seeded random numbers for the civilization engine (PCG32).
// The engine never touches FMath::Rand or any other global state, so the same seed gives the same history.
#pragma once

#include "CoreMinimal.h"

struct FCivRandom
{
	uint64 State = 0;
	uint64 Inc = 1;

	FCivRandom() { Reseed(1, 1); }
	FCivRandom(uint64 Seed, uint64 Stream) { Reseed(Seed, Stream); }

	void Reseed(uint64 Seed, uint64 Stream)
	{
		State = 0;
		Inc = (Stream << 1u) | 1u;
		NextU32();
		State += Seed;
		NextU32();
	}

	uint32 NextU32()
	{
		const uint64 Old = State;
		State = Old * 6364136223846793005ULL + Inc;
		const uint32 Shifted = static_cast<uint32>(((Old >> 18u) ^ Old) >> 27u);
		const uint32 Rot = static_cast<uint32>(Old >> 59u);
		return (Shifted >> Rot) | (Shifted << ((~Rot + 1u) & 31u));
	}

	/** Uniform in [0, 1). */
	double Unit() { return NextU32() / 4294967296.0; }

	double Range(double Min, double Max) { return Min + (Max - Min) * Unit(); }

	/** Uniform integer, both ends included. */
	int32 RangeInt(int32 Min, int32 Max)
	{
		if (Max <= Min) { return Min; }
		return Min + static_cast<int32>(Unit() * (Max - Min + 1));
	}

	bool Chance(double Probability) { return Unit() < Probability; }

	double Normal()
	{
		const double U1 = FMath::Max(1e-12, Unit());
		const double U2 = Unit();
		return FMath::Sqrt(-2.0 * FMath::Loge(U1)) * FMath::Cos(2.0 * UE_DOUBLE_PI * U2);
	}

	/** Number of events in one year for an average rate Lambda. */
	int32 Poisson(double Lambda)
	{
		if (Lambda <= 0.0) { return 0; }
		if (Lambda > 30.0)
		{
			return FMath::Max(0, FMath::RoundToInt32(Lambda + FMath::Sqrt(Lambda) * Normal()));
		}
		const double Limit = FMath::Exp(-Lambda);
		double Product = Unit();
		int32 Count = 0;
		while (Product > Limit)
		{
			++Count;
			Product *= Unit();
		}
		return Count;
	}

	template <typename T>
	const T& Pick(const TArray<T>& Items) { return Items[RangeInt(0, Items.Num() - 1)]; }
};
