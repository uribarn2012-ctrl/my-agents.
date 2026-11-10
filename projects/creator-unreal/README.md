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

## Owner's decision: IQ is a setting

People are not geniuses by default. Average IQ is a number the player picks for each world (default 100, ordinary people). IQ 200, the "what if everyone was a genius" idea, is only the high end of that option.

## Owner's decisions: customization and inventions

- As many world options as possible are chosen by the player.
- Following real history (real cities at year 0, real disasters) is an option and never the default.
- The real-history start year is selectable. Its default is the earliest date when cities are known for certain, and it includes only well-established facts.
- Every person can have their own destiny, emerging from their traits and circumstances (a knight who becomes king, someone who becomes a holy figure), as realistically as possible. This matters very much to the owner.
- The invention tree is open-ended: peoples can invent things not in it, even beyond what is possible today (for example living inside a computer), and each one is added to the tree.
- Inventions must be credible next steps from what a people knows, never nonsense such as an apple on a stick becoming a weapon.

## Tools confirmed working

- Unreal Engine 5.8.4
- Visual Studio Community 2022 17.14, compiler 14.44.35229
- Windows SDK 10.0.22621.0
