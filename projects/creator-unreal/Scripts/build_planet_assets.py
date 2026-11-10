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

# Value noise with an integer hash (no float-precision patterns at large coordinates) and a
# band-limited fBm: each octave fades to its average once its cells shrink below ~4 pixels, so
# distant surfaces never sparkle. CellPx is the size of the first octave's cell in pixels.
NOISE = """
struct FN
{
    float H(float3 P)
    {
        uint3 Q = uint3(int3(P) + 1048576);
        uint K = Q.x * 73856093u ^ Q.y * 19349663u ^ Q.z * 83492791u;
        K = (K ^ (K >> 13)) * 1274126177u;
        K ^= K >> 16;
        return float(K) * (1.0 / 4294967296.0);
    }
    float V(float3 X)
    {
        float3 I = floor(X); float3 F = X - I; F = F * F * (3.0 - 2.0 * F);
        return lerp(lerp(lerp(H(I), H(I + float3(1,0,0)), F.x), lerp(H(I + float3(0,1,0)), H(I + float3(1,1,0)), F.x), F.y),
                    lerp(lerp(H(I + float3(0,0,1)), H(I + float3(1,0,1)), F.x), lerp(H(I + float3(0,1,1)), H(I + float3(1,1,1)), F.x), F.y), F.z);
    }
    float Fbm(float3 P, int O, float CellPx)
    {
        float S = 0.0, A = 0.5;
        for (int i = 0; i < O; i++)
        {
            float W = saturate(CellPx * 0.5 - 1.0);
            S += lerp(0.5, V(P), W) * A;
            A *= 0.5; CellPx *= 0.495; P = P * 2.02 + float3(3.1, 1.7, 5.3);
        }
        return S / (1.0 - A * 2.0 + 1e-6) * 1.0;
    }
};
FN N;
"""

# Land detail finer than the mesh: brightness and dryness variation at 60 km down to 150 m.
COLOR_CODE = NOISE + """
float3 Base = VC.rgb * VC.rgb;
float Land = 1.0 - VC.a;
float3 Dir = normalize(Pos);
// Cloud shadows: the cloud that shades this point sits 12 km up, toward the sun.
float3 Sd = normalize(Dir + SunDir * (0.00189 / max(dot(Dir, SunDir), 0.2)));
float2 SUV = float2(atan2(Sd.y, Sd.x) / 6.2831853 + 0.5, acos(clamp(Sd.z, -1.0, 1.0)) / 3.1415927);
float Shadow = smoothstep(0.15, 0.85, Texture2DSampleLevel(Weather, WeatherSampler, SUV, 0.0).r);
Base *= 1.0 - 0.5 * Shadow;
if (Land > 0.01)
{
    float Px = max(length(fwidth(Pos)), 1.0);
    float A = N.Fbm(Dir * 110.0, 6, 5.8e6 / Px);
    float B = N.Fbm(Dir * 3500.0 + 7.0, 6, 1.8e5 / Px);
    float Dry = (A - 0.5) * 1.3;
    float3 DryTint = float3(1.25, 1.05, 0.8);
    Base *= lerp(float3(1, 1, 1), DryTint, saturate(Dry) * Land) * lerp(float3(1, 1, 1), float3(0.85, 1.0, 0.9), saturate(-Dry) * Land);
    Base *= 1.0 + Land * ((B - 0.5) * 0.7 + (A - 0.5) * 0.4);
}
return max(Base, 0.0);
"""

ROUGH_CODE = """
return saturate(R);
"""

# Per-pixel relief: a band-limited height field turned into a normal with screen-space derivatives
# (surface gradient bump mapping). Land gets ridges and gullies; the sea gets gentle swell.
NORMAL_CODE = NOISE + """
float3 Dir = normalize(Pos);
float Px = max(length(fwidth(Pos)), 1.0);
float Hgt;
if (Ocean > 0.5)
{
    float3 P = Dir * 60000.0 + float3(Time * 0.15, Time * 0.1, 0.0);
    Hgt = (N.Fbm(P, 4, 1.06e4 / Px) - 0.5) * 300.0;
}
else
{
    float Ridge = 1.0 - abs(N.Fbm(Dir * 2400.0, 6, 2.65e5 / Px) * 2.0 - 1.0);
    Hgt = (Ridge * Ridge - 0.45) * 22000.0 + (N.Fbm(Dir * 30000.0 + 3.0, 5, 2.1e4 / Px) - 0.5) * 3500.0;
}
// The sea is a perfect sphere: its exact normal avoids the banding and glitter that 8-bit
// vertex normals cause in the sun glint.
float3 Nb = Ocean > 0.5 ? Dir : Vn;
float3 Dpx = ddx(Pos), Dpy = ddy(Pos);
float3 R1 = cross(Dpy, Nb), R2 = cross(Nb, Dpx);
float Det = dot(Dpx, R1);
float3 Grad = sign(Det) * (ddx(Hgt) * R1 + ddy(Hgt) * R2);
float3 Out = normalize(abs(Det) * Nb - Grad);
return (abs(Det) > 1e-12 && all(Out == Out)) ? Out : Nb;
"""

# Opacity of the cloud shell. The baked weather map gives the large weather systems; band-limited
# 3D noise (no seams, no pole pinch) adds detail down to the pixel at every zoom level.
CLOUD_CODE = NOISE + """
float3 Dir = normalize(Pos);
float U = atan2(Dir.y, Dir.x) / 6.2831853 + 0.5;
float V = acos(clamp(Dir.z, -1.0, 1.0)) / 3.1415927;
float Cover = Texture2DSampleLevel(Weather, WeatherSampler, float2(U, V), 0.0).r;
float Px = max(length(fwidth(Pos)), 1.0);
float C = Cover;
C += (N.Fbm(Dir * 90.0 + float3(Time * 0.0003, 0, 0), 5, 7.1e6 / Px) - 0.5) * 0.55 * saturate(Cover * 3.0);
// Rotated so the fine noise lattice does not line up with the coarse one (no blocky grid).
float3 Rd = float3(dot(Dir, float3(0.48, 0.6, 0.64)), dot(Dir, float3(-0.8, 0.36, 0.48)), dot(Dir, float3(0.0, -0.71, 0.6)));
C += (N.Fbm(Rd * 2500.0, 5, 2.55e5 / Px) - 0.5) * 0.25 * saturate(C * 2.0);
return smoothstep(0.08, 0.9, C) * 0.93;
"""
# Cloud colour, lit here rather than by the engine so it is the same in every frame: sunlit tops,
# reddened light along the day-night line, near black on the night side.
CLOUD_LIGHT_CODE = """
float3 Dir = normalize(Pos);
float L = dot(Dir, SunDir);
float Light = saturate(L * 0.7 + 0.3) * smoothstep(-0.12, 0.1, L);
float3 Tint = lerp(float3(1.0, 0.55, 0.32), float3(1.0, 0.98, 0.95), smoothstep(0.0, 0.3, L));
float Thick = lerp(0.72, 1.0, saturate(Op * 1.2));
float Night = saturate(-L * 0.7 + 0.3) * (1.0 - smoothstep(-0.12, 0.1, L));
return Albedo * Sun / 3.1415927 * (Light * Tint + Night * 0.145 * float3(0.62, 0.72, 1.0)) * Thick + 0.0015;
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
        float S = smoothstep(0.16, 0.0, L);
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


def vector3(mat, name, value, x, y):
    expr = node(mat, unreal.MaterialExpressionVectorParameter, x, y)
    expr.set_editor_property("parameter_name", name)
    expr.set_editor_property("default_value", unreal.LinearColor(value[0], value[1], value[2], 0.0))
    mask = node(mat, unreal.MaterialExpressionComponentMask, x + 200, y)
    for ch, on in (("r", True), ("g", True), ("b", True), ("a", False)):
        mask.set_editor_property(ch, on)
    LIB.connect_material_expressions(expr, "", mask, "")
    return mask


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

    weather = node(mat, unreal.MaterialExpressionTextureObjectParameter, -1200, 950)
    weather.set_editor_property("parameter_name", "CloudWeather")
    weather.set_editor_property("texture", unreal.load_asset("/Engine/EngineResources/Black"))
    sun = vector3(mat, "SunDir", (0.72, -0.62, 0.32), -1200, 1100)
    color = custom(mat, "Surface colour", COLOR_CODE, F3,
                   {"VC": append, "Pos": pos, "Dist": dist, "Weather": weather, "SunDir": sun}, -600, 0)
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
    mat.set_editor_property("material_domain", unreal.MaterialDomain.MD_SURFACE)
    mat.set_editor_property("blend_mode", unreal.BlendMode.BLEND_TRANSLUCENT)
    mat.set_editor_property("shading_model", unreal.MaterialShadingModel.MSM_UNLIT)
    mat.set_editor_property("two_sided", True)

    pos = node(mat, unreal.MaterialExpressionWorldPosition, -1200, 0)
    tex = node(mat, unreal.MaterialExpressionTextureObjectParameter, -1200, 200)
    tex.set_editor_property("parameter_name", "CloudWeather")
    tex.set_editor_property("texture", unreal.load_asset("/Engine/EngineResources/Black"))
    dist = node(mat, unreal.MaterialExpressionPixelDepth, -1200, 400)
    time = node(mat, unreal.MaterialExpressionTime, -1200, 500)
    sun = vector3(mat, "SunDir", (0.72, -0.62, 0.32), -1200, 600)
    illum = scalar(mat, "SunIlluminance", 11.0, -1200, 750)
    albedo = scalar(mat, "Albedo", 0.88, -1200, 850)

    F1 = unreal.CustomMaterialOutputType.CMOT_FLOAT1
    F3 = unreal.CustomMaterialOutputType.CMOT_FLOAT3
    opacity = custom(mat, "Cloud opacity", CLOUD_CODE, F1,
                     {"Pos": pos, "Weather": tex, "Dist": dist, "Time": time}, -700, 200)
    light = custom(mat, "Cloud light", CLOUD_LIGHT_CODE, F3,
                   {"Pos": pos, "SunDir": sun, "Sun": illum, "Albedo": albedo, "Op": opacity}, -400, 0)

    LIB.connect_material_property(light, "", unreal.MaterialProperty.MP_EMISSIVE_COLOR)
    LIB.connect_material_property(opacity, "", unreal.MaterialProperty.MP_OPACITY)
    LIB.recompile_material(mat)
    SUBSYS.save_loaded_asset(mat, False)

def build_stars():
    mat = new_material("M_PlanetStars")
    mat.set_editor_property("shading_model", unreal.MaterialShadingModel.MSM_UNLIT)
    mat.set_editor_property("two_sided", True)
    # Not a sky mesh: sky meshes are always drawn into the sky light capture, and the ocean then
    # mirrored the star field as glitter.
    mat.set_editor_property("is_sky", False)
    cam = node(mat, unreal.MaterialExpressionCameraVectorWS, -800, 0)
    intensity = scalar(mat, "Intensity", 6.0, -800, 200)
    stars = custom(mat, "Stars", STAR_CODE, unreal.CustomMaterialOutputType.CMOT_FLOAT3,
                   {"CameraVectorIn": cam, "Intensity": intensity}, -500, 0)
    LIB.connect_material_property(stars, "", unreal.MaterialProperty.MP_EMISSIVE_COLOR)
    LIB.recompile_material(mat)
    SUBSYS.save_loaded_asset(mat, False)


build_terrain()
build_clouds()
build_stars()
unreal.log("PLANET ASSETS BUILT")
