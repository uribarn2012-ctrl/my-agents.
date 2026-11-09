# Creator (Unreal Engine 5.8)

C++ project for the Unreal version of the game. Plan: `../creator/UNREAL-PLAN.md`.

## Important: always open and build through the English path

Unreal's build system corrupts the Hebrew letters in the repo folder name, and the compile fails.
Use this link, which points at this same folder:

    C:\Users\User\UEProjects\Creator\Creator.uproject

If the link is missing (new computer), create it in PowerShell, changing the target if the repo is elsewhere:

    New-Item -ItemType Junction -Path C:\Users\User\UEProjects\Creator -Target "C:\Users\User\סוכנים\projects\creator-unreal"

Build the editor module:

    & "C:\Program Files\Epic Games\UE_5.8\Engine\Build\BatchFiles\Build.bat" CreatorEditor Win64 Development "-Project=C:\Users\User\UEProjects\Creator\Creator.uproject" -WaitMutex

## Tools confirmed working

- Unreal Engine 5.8.4
- Visual Studio Community 2022 17.14, compiler 14.44.35229
- Windows SDK 10.0.22621.0
