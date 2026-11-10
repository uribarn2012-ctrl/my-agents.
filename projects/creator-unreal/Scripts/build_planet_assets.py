# Creates the planet materials in /Game/Planet. Binary .uasset files cannot be hand-written,
# so this script is their source of truth. Re-run it after changing any shader text below.
#
# "C:\Program Files\Epic Games\UE_5.8\Engine\Binaries\Win64\UnrealEditor-Cmd.exe" ^
#   C:\Users\User\UEProjects\Creator\Creator.uproject -run=pythonscript ^
#   -script=C:\Users\User\UEProjects\Creator\Scripts\build_planet_assets.py -unattended -nosplash
import unreal

FOLDER = "/Game/Planet"
LIB = unreal.MaterialEditingLibrary
ASSETS = unreal.AssetToolsHelpers.get_asset_tools()
SUBSYS = unreal.get_editor_subsystem(unreal.EditorAssetSubsystem)

NOISE = """
struct FN
{
    float H(float3 P) { P = frac(P * 0.3183099 + 0.1); P *= 17.0; return frac(P.x * P.y * P.z * (P.x + P.y + P.z)); }
    float V(float3 X)
    {
        float3 I = floor(X); float3 F = frac(X); F = F * F * (3.0 - 2.0 * F);
        return lerp(lerp(lerp(H(I), H(I + float3(1,0,0)), F.x), lerp(H(I + float3(0,1,0)), H(I + float3(1,1,0)), F.x), F.y),
                    lerp(lerp(H(I + float3(0,0,1)), H(I + float3(1,0,1)), F.x), lerp(H(I + float3(0,1,1)), H(I + float3(1,1,1)), F.x), F.y), F.z);
    }
    float Fbm(float3 P, int O)
    {
        float S = 0.0, A = 0.5;
        for (int i = 0; i < O; i++) { S += V(P) * A; A *= 0.5; P = P * 2.02 + float3(3.1, 1.7, 5.3); }
        return S;
    }
};
FN N;
"""

COLOR_CODE = NOISE + """
float3 Base = VC.rgb * VC.rgb;
float Land = 1.0 - VC.a;
float Near = 1.0 - smoothstep(1.2e7, 1.2e8, Dist);
if (Near > 0.0 && Land > 0.01)
{
    float3 P = Pos * 3.0e-5;
    float A = N.Fbm(P, 5);
    float B = N.Fbm(P * 0.09 + 11.0, 4);
    float Detail = (A - 0.48) * 1.1 + (B - 0.48) * 0.9;
    Base *= 1.0 + Land * Near * Detail;
}
return max(Base, 0.0);
"""

ROUGH_CODE = NOISE + """
return saturate(R);
"""

NORMAL_CODE = NOISE + """
float3 Up = normalize(Pos);
float3 Out = Vn;
float Near = 1.0 - smoothstep(4.0e6, 6.0e7, Dist);
if (Near > 0.0)
{
    float E = 12000.0;
    float Scale = Ocean > 0.5 ? 2.2e-5 : 4.0e-5;
    float3 Drift = Ocean > 0.5 ? float3(Time * 0.05, Time * 0.03, 0.0) : float3(0, 0, 0);
    float3 P = Pos * Scale + Drift;
    float S = E * Scale;
    float C = N.Fbm(P, 4);
    float3 G = float3(N.Fbm(P + float3(S,0,0), 4) - C, N.Fbm(P + float3(0,S,0), 4) - C, N.Fbm(P + float3(0,0,S), 4) - C);
    G -= Up * dot(G, Up);
    float Strength = (Ocean > 0.5 ? 2.0 : 3.5) * Near;
    Out = normalize(Vn - G / max(S, 1e-6) * Strength * 0.04);
}
return Out;
"""

CLOUD_CODE = NOISE + """
float R = length(Pos);
float3 Dir = Pos / R;
float U = atan2(Dir.y, Dir.x) / 6.2831853 + 0.5;
float V = acos(clamp(Dir.z, -1.0, 1.0)) / 3.1415927;
float Cover = Texture2DSampleLevel(Weather, WeatherSampler, float2(U, V), 0.0).r;
float H = saturate((R - BottomCm) / HeightCm);
float Fill = Cover * 1.15;
float Shape = smoothstep(0.0, 0.14, H) * (1.0 - smoothstep(0.35 + 0.6 * Cover, 1.0, H));
float D = saturate(Fill - 0.05) * Shape;
float Near = 1.0 - smoothstep(1.5e8, 9.0e8, length(Pos - Cam));
if (D > 0.01 && Near > 0.0)
{
    float3 P = Pos * 2.0e-6 + float3(Time * 0.004, 0.0, 0.0);
    float Billow = N.Fbm(P, 3);
    float Eroded = saturate((D + Billow - 0.72) * 3.0) * saturate(D * 3.0);
    D = lerp(D, Eroded, Near);
}
return D;
"""

STAR_CODE = """
struct FS
{
    float H(float3 P) { P = frac(P * 0.1031); P += dot(P, P.yzx + 33.33); return frac((P.x + P.y) * P.z); }
    float3 Layer(float3 D, float Cells, float Density)
    {
        float3 G = D * Cells; float3 C = floor(G); float3 F = frac(G);
        float R = H(C + 7.0);
        if (R < 1.0 - Density) return 0.0;
        float3 O = 0.2 + 0.6 * float3(H(C + 1.0), H(C + 2.0), H(C + 3.0));
        float L = length(F - O);
        float S = smoothstep(0.09, 0.0, L);
        float T = H(C + 4.0);
        return S * lerp(float3(1.0, 0.82, 0.68), float3(0.72, 0.84, 1.0), T) * (0.2 + 2.0 * pow(H(C + 5.0), 6.0));
    }
};
FS Sf;
float3 D = normalize(-CameraVectorIn);
float3 Col = Sf.Layer(D, 180.0, 0.05) + Sf.Layer(D, 520.0, 0.03) * 0.6 + Sf.Layer(D, 1500.0, 0.02) * 0.35;
return Col * Intensity;
"""


def new_material(name):
    path = FOLDER + "/" + name
    if SUBSYS.does_asset_exist(path):
        SUBSYS.delete_asset(path)
    return ASSETS.create_asset(name, FOLDER, unreal.Material, unreal.MaterialFactoryNew())


def node(mat, cls, x, y):
    return LIB.create_material_expression(mat, cls, x, y)


def custom(mat, name, code, output, inputs, x, y):
    expr = node(mat, unreal.MaterialExpressionCustom, x, y)
    expr.set_editor_property("description", name)
    expr.set_editor_property("code", code)
    expr.set_editor_property("output_type", output)
    items = []
    for key in inputs:
        item = unreal.CustomInput()
        item.set_editor_property("input_name", key)
        items.append(item)
    expr.set_editor_property("inputs", items)
    # A Custom node's pins only exist once the node refreshes with its inputs.
    for key, source in inputs.items():
        src, pin = source if isinstance(source, tuple) else (source, "")
        LIB.connect_material_expressions(src, pin, expr, key)
    return expr


def scalar(mat, name, value, x, y):
    expr = node(mat, unreal.MaterialExpressionScalarParameter, x, y)
    expr.set_editor_property("parameter_name", name)
    expr.set_editor_property("default_value", value)
    return expr


def build_terrain():
    mat = new_material("M_PlanetTerrain")
    mat.set_editor_property("shading_model", unreal.MaterialShadingModel.MSM_DEFAULT_LIT)
    mat.set_editor_property("tangent_space_normal", False)

    vc = node(mat, unreal.MaterialExpressionVertexColor, -1200, 0)
    append = node(mat, unreal.MaterialExpressionAppendVector, -1000, 0)
    LIB.connect_material_expressions(vc, "", append, "A")
    LIB.connect_material_expressions(vc, "A", append, "B")
    pos = node(mat, unreal.MaterialExpressionWorldPosition, -1200, 200)
    dist = node(mat, unreal.MaterialExpressionPixelDepth, -1200, 350)
    vn = node(mat, unreal.MaterialExpressionVertexNormalWS, -1200, 500)
    uv = node(mat, unreal.MaterialExpressionTextureCoordinate, -1200, 650)
    time = node(mat, unreal.MaterialExpressionTime, -1200, 800)
    mask = node(mat, unreal.MaterialExpressionComponentMask, -1000, 650)
    mask.set_editor_property("r", True)
    mask.set_editor_property("g", False)
    mask.set_editor_property("b", False)
    mask.set_editor_property("a", False)
    LIB.connect_material_expressions(uv, "", mask, "")

    F1 = unreal.CustomMaterialOutputType.CMOT_FLOAT1
    F3 = unreal.CustomMaterialOutputType.CMOT_FLOAT3

    color = custom(mat, "Surface colour", COLOR_CODE, F3,
                   {"VC": append, "Pos": pos, "Dist": dist}, -600, 0)
    rough = custom(mat, "Surface roughness", ROUGH_CODE, F1, {"R": mask}, -600, 250)
    normal = custom(mat, "Surface normal", NORMAL_CODE, F3,
                    {"Vn": vn, "Pos": pos, "Dist": dist, "Ocean": (vc, "A"), "Time": time}, -600, 500)

    LIB.connect_material_property(color, "", unreal.MaterialProperty.MP_BASE_COLOR)
    LIB.connect_material_property(rough, "", unreal.MaterialProperty.MP_ROUGHNESS)
    spec = scalar(mat, "Specular", 0.3, -300, 300)
    LIB.connect_material_property(spec, "", unreal.MaterialProperty.MP_SPECULAR)
    LIB.connect_material_property(normal, "", unreal.MaterialProperty.MP_NORMAL)
    LIB.recompile_material(mat)
    SUBSYS.save_loaded_asset(mat, False)


def build_clouds():
    mat = new_material("M_PlanetClouds")
    mat.set_editor_property("material_domain", unreal.MaterialDomain.MD_VOLUME)
    mat.set_editor_property("blend_mode", unreal.BlendMode.BLEND_ADDITIVE)
    mat.set_editor_property("shading_model", unreal.MaterialShadingModel.MSM_DEFAULT_LIT)

    pos = node(mat, unreal.MaterialExpressionWorldPosition, -1200, 0)
    tex = node(mat, unreal.MaterialExpressionTextureObjectParameter, -1200, 200)
    tex.set_editor_property("parameter_name", "CloudWeather")
    tex.set_editor_property("texture", unreal.load_asset("/Engine/EngineResources/DefaultTexture"))
    bottom = scalar(mat, "BottomCm", 6360.0e5 + 4.0e5, -1200, 400)
    height = scalar(mat, "HeightCm", 9.0e5, -1200, 500)
    time = node(mat, unreal.MaterialExpressionTime, -1200, 600)
    density = custom(mat, "Cloud density", CLOUD_CODE, unreal.CustomMaterialOutputType.CMOT_FLOAT1,
                     {"Pos": pos, "Weather": tex, "BottomCm": bottom, "HeightCm": height, "Time": time,
                      "Cam": node(mat, unreal.MaterialExpressionCameraPositionWS, -1200, 700)}, -700, 200)

    ext = scalar(mat, "Extinction", 0.11, -700, 500)
    mul = node(mat, unreal.MaterialExpressionMultiply, -350, 400)
    LIB.connect_material_expressions(density, "", mul, "A")
    LIB.connect_material_expressions(ext, "", mul, "B")

    albedo = node(mat, unreal.MaterialExpressionConstant3Vector, -350, 100)
    albedo.set_editor_property("constant", unreal.LinearColor(0.97, 0.97, 0.98, 1.0))

    LIB.connect_material_property(albedo, "", unreal.MaterialProperty.MP_BASE_COLOR)
    LIB.connect_material_property(mul, "", unreal.MaterialProperty.MP_SUBSURFACE_COLOR)
    LIB.recompile_material(mat)
    SUBSYS.save_loaded_asset(mat, False)


def build_stars():
    mat = new_material("M_PlanetStars")
    mat.set_editor_property("shading_model", unreal.MaterialShadingModel.MSM_UNLIT)
    mat.set_editor_property("two_sided", True)
    mat.set_editor_property("is_sky", True)
    cam = node(mat, unreal.MaterialExpressionCameraVectorWS, -800, 0)
    intensity = scalar(mat, "Intensity", 1.2, -800, 200)
    stars = custom(mat, "Stars", STAR_CODE, unreal.CustomMaterialOutputType.CMOT_FLOAT3,
                   {"CameraVectorIn": cam, "Intensity": intensity}, -500, 0)
    LIB.connect_material_property(stars, "", unreal.MaterialProperty.MP_EMISSIVE_COLOR)
    LIB.recompile_material(mat)
    SUBSYS.save_loaded_asset(mat, False)


build_terrain()
build_clouds()
build_stars()
unreal.log("PLANET ASSETS BUILT")
