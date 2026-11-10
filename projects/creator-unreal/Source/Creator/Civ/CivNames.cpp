#include "CivNames.h"
#include "CivRandom.h"

namespace CivNameData
{
	static const TCHAR* const Openers[] =
	{
		TEXT("אל"), TEXT("בר"), TEXT("גל"), TEXT("דור"), TEXT("זמ"), TEXT("חנ"), TEXT("טל"), TEXT("יר"),
		TEXT("כל"), TEXT("לב"), TEXT("מור"), TEXT("נע"), TEXT("סב"), TEXT("עד"), TEXT("פל"), TEXT("צור"),
		TEXT("קר"), TEXT("רו"), TEXT("של"), TEXT("תמ"), TEXT("אור"), TEXT("הד"), TEXT("ור"), TEXT("שח")
	};
	static const TCHAR* const Middles[] =
	{
		TEXT("מי"), TEXT("רי"), TEXT("לו"), TEXT("נו"), TEXT("תי"), TEXT("בו"), TEXT("די"), TEXT("קו"),
		TEXT("סי"), TEXT("ני"), TEXT("רו"), TEXT("גי")
	};
	static const TCHAR* const MaleEnds[] =
	{
		TEXT("ון"), TEXT("יר"), TEXT("אל"), TEXT("ור"), TEXT("ם"), TEXT("ן"), TEXT("ד"), TEXT("ק"), TEXT("ש")
	};
	static const TCHAR* const FemaleEnds[] =
	{
		TEXT("ית"), TEXT("לה"), TEXT("נה"), TEXT("רה"), TEXT("מה"), TEXT("אה"), TEXT("ילה")
	};
	static const TCHAR* const PeopleEnds[] =
	{
		TEXT("אן"), TEXT("ור"), TEXT("ים"), TEXT("ון"), TEXT("אי"), TEXT("ית"), TEXT("ון")
	};
	static const TCHAR* const CityPrefixes[] =
	{
		TEXT("מצפה"), TEXT("נווה"), TEXT("רמת"), TEXT("גבעת"), TEXT("עין"), TEXT("כפר"), TEXT("קרית"), TEXT("שער")
	};

	template <int32 N>
	static FString PickOf(FCivRandom& Rng, const TCHAR* const (&Items)[N])
	{
		return Items[Rng.RangeInt(0, N - 1)];
	}

	static bool IsHebrewLetter(TCHAR Ch) { return Ch >= 0x05D0 && Ch <= 0x05EA; }

	static TCHAR ToFinal(TCHAR Ch)
	{
		switch (Ch)
		{
		case 0x05DB: return 0x05DA; // kaf
		case 0x05DE: return 0x05DD; // mem
		case 0x05E0: return 0x05DF; // nun
		case 0x05E4: return 0x05E3; // pe
		case 0x05E6: return 0x05E5; // tsadi
		default: return Ch;
		}
	}

	static TCHAR ToRegular(TCHAR Ch)
	{
		switch (Ch)
		{
		case 0x05DA: return 0x05DB;
		case 0x05DD: return 0x05DE;
		case 0x05DF: return 0x05E0;
		case 0x05E3: return 0x05E4;
		case 0x05E5: return 0x05E6;
		default: return Ch;
		}
	}
}

FString CivText::FixFinalForms(const FString& Text)
{
	using namespace CivNameData;
	FString Out = Text;
	for (int32 Index = 0; Index < Out.Len(); ++Index)
	{
		const TCHAR Ch = Out[Index];
		if (!IsHebrewLetter(Ch)) { continue; }
		const bool bLast = Index + 1 >= Out.Len() || !IsHebrewLetter(Out[Index + 1]);
		Out[Index] = bLast ? ToFinal(Ch) : ToRegular(Ch);
	}
	return Out;
}

FString CivText::PeopleName(FCivRandom& Rng)
{
	using namespace CivNameData;
	FString Name = PickOf(Rng, Openers);
	if (Rng.Chance(0.6)) { Name += PickOf(Rng, Middles); }
	Name += PickOf(Rng, PeopleEnds);
	return FixFinalForms(Name);
}

FString CivText::CityName(FCivRandom& Rng)
{
	using namespace CivNameData;
	FString Name = PickOf(Rng, CityPrefixes);
	Name += TEXT(" ");
	Name += PickOf(Rng, Openers);
	Name += PickOf(Rng, Middles);
	Name += PickOf(Rng, MaleEnds);
	return FixFinalForms(Name);
}

FString CivText::StarName(FCivRandom& Rng)
{
	using namespace CivNameData;
	FString Name = PickOf(Rng, Openers);
	Name += PickOf(Rng, Middles);
	Name += PickOf(Rng, PeopleEnds);
	return FixFinalForms(Name);
}

FString CivText::PersonName(FCivRandom& Rng, bool bFemale)
{
	using namespace CivNameData;
	FString First = PickOf(Rng, Openers);
	if (Rng.Chance(0.5)) { First += PickOf(Rng, Middles); }
	First += bFemale ? PickOf(Rng, FemaleEnds) : PickOf(Rng, MaleEnds);

	FString Parent = PickOf(Rng, Openers);
	Parent += PickOf(Rng, Middles);
	Parent += PickOf(Rng, MaleEnds);

	FString Full = First;
	Full += bFemale ? TEXT(" בת ") : TEXT(" בן ");
	Full += Parent;
	return FixFinalForms(Full);
}

FString CivText::FirstName(FCivRandom& Rng, bool bFemale)
{
	using namespace CivNameData;
	FString First = PickOf(Rng, Openers);
	if (Rng.Chance(0.5)) { First += PickOf(Rng, Middles); }
	First += bFemale ? PickOf(Rng, FemaleEnds) : PickOf(Rng, MaleEnds);
	return FixFinalForms(First);
}

FString CivText::Fill(const TCHAR* Template, std::initializer_list<FString> Args)
{
	FString Out = Template;
	int32 Index = 0;
	for (const FString& Arg : Args)
	{
		const FString Token = FString::Printf(TEXT("{%d}"), Index++);
		Out.ReplaceInline(*Token, *Arg, ESearchCase::CaseSensitive);
	}
	return Out;
}

FString CivText::Count(double Value)
{
	if (Value >= 1e9) { return FString::Printf(TEXT("%.1f מיליארד"), Value / 1e9); }
	if (Value >= 1e6) { return FString::Printf(TEXT("%.1f מיליון"), Value / 1e6); }
	if (Value >= 1e4) { return FString::Printf(TEXT("%.0f אלף"), Value / 1e3); }
	return FString::Printf(TEXT("%.0f"), Value);
}
