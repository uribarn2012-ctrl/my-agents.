// Runs complete civilization histories with no graphics and checks that they behave.
//   UnrealEditor-Cmd.exe <project> -run=CivHistory -nullrhi -unattended -Out=<folder>
// Optional: -Seeds=8 -BirthExp=3 -InventorRate=0.0005 -CostScale=1 and more, to try numbers without a rebuild.
// -TuneOnly prints only the IQ tables.
#pragma once

#include "CoreMinimal.h"
#include "Commandlets/Commandlet.h"
#include "CivHistoryCommandlet.generated.h"

UCLASS()
class UCivHistoryCommandlet : public UCommandlet
{
	GENERATED_BODY()

public:
	virtual int32 Main(const FString& Params) override;
};
