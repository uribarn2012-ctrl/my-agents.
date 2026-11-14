// Runs the animal simulation with no graphics and logs how the populations develop.
//   UnrealEditor-Cmd.exe <project> -run=LifeTest -nullrhi -unattended -Ticks=30000 -Seed=1
#pragma once

#include "CoreMinimal.h"
#include "Commandlets/Commandlet.h"
#include "LifeTestCommandlet.generated.h"

UCLASS()
class ULifeTestCommandlet : public UCommandlet
{
	GENERATED_BODY()

public:
	virtual int32 Main(const FString& Params) override;
};
