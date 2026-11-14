// Open-ended invention tree: proposes inventions that are not in the starting table, and judges them.
// The judge (Validate) is separate from the proposer, so a language model could be plugged in later
// behind ICivInventionProposer and would still have to pass the same rules. No network code here.
#pragma once

#include "CoreMinimal.h"
#include "CivInventions.h"
#include "CivRandom.h"

struct FCivPeople;

struct FCivInventionProposal
{
	FString Key;
	FString Name;
	FString NameDefinite;
	ECivField Field = ECivField::Craft;
	int32 Era = 0;
	double Cost = 0.0;
	TArray<int32> Parents;           // indices into the world's tree
	double Materials[CivResourceCount] = { 0.0, 0.0, 0.0, 0.0, 0.0 };
	FCivInventionEffects Effects;
	FString PurposeKey;              // what it is for
	FString PrincipleKey;            // how it works
	FString Mechanism;               // the sentence for the book
	ECivNeed Need = ECivNeed::None;
	bool bSpeculative = false;       // beyond known science
};

enum class ECivReject : uint8
{
	None, NoParents, ParentUnknown, NoPurpose, NoMechanism, Incompatible, MissingBasis,
	MaterialsLocked, TooEarly, NoEffect, TooStrong, Duplicate, SpeculativeTooSoon, Obsolete, Count
};
constexpr int32 CivRejectCount = static_cast<int32>(ECivReject::Count);

struct FCivProposalContext
{
	const TArray<FCivInventionDef>* Tree = nullptr;
	const FCivPeople* People = nullptr;
	int32 PeopleEra = 0;
	bool bAllowSpeculative = true;
};

/** Anything that can suggest a new invention. Must use only the given random source, so worlds stay repeatable. */
class ICivInventionProposer
{
public:
	virtual ~ICivInventionProposer() = default;
	/** Fills Out and returns true if it has a candidate. The candidate is judged afterwards. */
	virtual bool Propose(const FCivProposalContext& Context, FCivRandom& Rng, FCivInventionProposal& Out) = 0;
};

/** Combines the curated lists of purposes and principles, plus a curated list of far-future concepts. */
class FCivCuratedProposer : public ICivInventionProposer
{
public:
	virtual bool Propose(const FCivProposalContext& Context, FCivRandom& Rng, FCivInventionProposal& Out) override;
};

namespace CivGenerator
{
	/** The rules every new invention must pass. */
	ECivReject Validate(const FCivInventionProposal& Proposal, const FCivProposalContext& Context);
	const TCHAR* RejectName(ECivReject Reason);
}
