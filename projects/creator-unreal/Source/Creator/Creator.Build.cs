using UnrealBuildTool;

public class Creator : ModuleRules
{
	public Creator(ReadOnlyTargetRules Target) : base(Target)
	{
		PCHUsage = PCHUsageMode.UseExplicitOrSharedPCHs;
		PublicDependencyModuleNames.AddRange(new string[] { "Core", "CoreUObject", "Engine", "InputCore", "ProceduralMeshComponent", "RenderCore", "RHI", "MeshDescription", "StaticMeshDescription" });
	}
}
