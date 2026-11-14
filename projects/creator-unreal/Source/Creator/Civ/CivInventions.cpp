#include "CivInventions.h"

namespace CivInventionData
{
	struct FRow
	{
		const TCHAR* Key;
		const TCHAR* Name;
		const TCHAR* NameDefinite;
		ECivField Field;
		int32 Era;
		double Cost;
		const TCHAR* Prereqs;    // space separated keys; a prerequisite must appear earlier in the table
		const TCHAR* Materials;  // wood=1 stone=2 metal=3 energy=4 rare=5
		ECivNeed Need;
		bool bNeedRequired;
		const TCHAR* Effects;    // food cap res research spread health war resist range, metal/energy/rare/wood/stone = extra mining
		ECivMilestone Milestone;
	};

	using F = ECivField;
	using N = ECivNeed;
	using M = ECivMilestone;

	static const FRow Rows[] =
	{
		// Era 0: the first fires
		{ TEXT("fire"), TEXT("אש"), TEXT("האש"), F::Craft, 0, 2, TEXT(""), TEXT("wood=1"), N::None, false, TEXT("food=1.3 health=1.1"), M::Fire },
		{ TEXT("stone_tools"), TEXT("כלי אבן"), TEXT("כלי האבן"), F::Craft, 0, 2, TEXT(""), TEXT("stone=1"), N::None, false, TEXT("food=1.15 res=1.2"), M::None },
		{ TEXT("speech"), TEXT("לשון מדוברת"), TEXT("הלשון המדוברת"), F::Society, 0, 3, TEXT(""), TEXT(""), N::None, false, TEXT("research=1.3 spread=1.3"), M::None },
		{ TEXT("spear"), TEXT("רומח ציד"), TEXT("רומח הציד"), F::War, 0, 3, TEXT("stone_tools"), TEXT("wood=2 stone=1"), N::None, false, TEXT("food=1.2 war=1.3"), M::None },
		{ TEXT("clothing"), TEXT("בגדי עור"), TEXT("בגדי העור"), F::Craft, 0, 3, TEXT("stone_tools"), TEXT(""), N::Disaster, false, TEXT("cap=1.3 resist=0.03"), M::None },

		// Era 1: villages
		{ TEXT("pottery"), TEXT("קדרות"), TEXT("הקדרות"), F::Craft, 1, 8, TEXT("fire"), TEXT("stone=3"), N::None, false, TEXT("food=1.15"), M::None },
		{ TEXT("herding"), TEXT("מרעה ובקר"), TEXT("גידול הבקר"), F::Food, 1, 10, TEXT("spear"), TEXT(""), N::Famine, false, TEXT("food=1.5"), M::None },
		{ TEXT("agriculture"), TEXT("חקלאות"), TEXT("החקלאות"), F::Food, 1, 14, TEXT("stone_tools fire"), TEXT("wood=4"), N::Famine, false, TEXT("food=2.5 cap=1.6"), M::Agriculture },
		{ TEXT("weaving"), TEXT("אריגה"), TEXT("האריגה"), F::Craft, 1, 9, TEXT("clothing"), TEXT("wood=3"), N::None, false, TEXT("cap=1.1 res=1.1"), M::None },
		{ TEXT("boats"), TEXT("סירות"), TEXT("הסירות"), F::Craft, 1, 10, TEXT("stone_tools"), TEXT("wood=8"), N::None, false, TEXT("range=0.25 spread=1.1"), M::None },
		{ TEXT("wheel"), TEXT("גלגל"), TEXT("הגלגל"), F::Craft, 1, 14, TEXT("pottery"), TEXT("wood=6"), N::None, false, TEXT("res=1.3 range=0.1"), M::None },
		{ TEXT("settlement"), TEXT("בניית ערים"), TEXT("בניית הערים"), F::Society, 1, 18, TEXT("agriculture pottery speech"), TEXT("wood=12 stone=12"), N::None, false, TEXT("cap=2.2 research=1.2"), M::FirstCity },
		{ TEXT("irrigation"), TEXT("תעלות השקיה"), TEXT("תעלות ההשקיה"), F::Food, 1, 16, TEXT("agriculture"), TEXT("stone=8"), N::Famine, true, TEXT("food=1.8 resist=0.03"), M::None },

		// Era 2: writing and bronze
		{ TEXT("counting"), TEXT("מניין וחשבון"), TEXT("תורת החשבון"), F::Science, 2, 25, TEXT("settlement"), TEXT(""), N::None, false, TEXT("research=1.25 res=1.1"), M::None },
		{ TEXT("writing"), TEXT("כתב"), TEXT("הכתב"), F::Society, 2, 35, TEXT("settlement counting"), TEXT("stone=8"), N::None, false, TEXT("research=1.5 spread=1.6"), M::Writing },
		{ TEXT("bronze"), TEXT("ברונזה"), TEXT("הברונזה"), F::Craft, 2, 35, TEXT("fire pottery"), TEXT("stone=20 wood=15"), N::None, false, TEXT("metal=1 res=1.2 war=1.4"), M::None },
		{ TEXT("walls"), TEXT("חומות עיר"), TEXT("חומות העיר"), F::War, 2, 30, TEXT("settlement"), TEXT("stone=40"), N::War, true, TEXT("war=1.3 resist=0.05"), M::None },
		{ TEXT("sailing"), TEXT("מפרשים"), TEXT("המפרשים"), F::Craft, 2, 35, TEXT("boats weaving"), TEXT("wood=30"), N::None, false, TEXT("range=0.45 spread=1.2 res=1.1"), M::None },
		{ TEXT("calendar"), TEXT("לוח שנה"), TEXT("לוח השנה"), F::Science, 2, 25, TEXT("counting"), TEXT(""), N::None, false, TEXT("food=1.3"), M::None },
		{ TEXT("law"), TEXT("קובץ חוקים"), TEXT("קובץ החוקים"), F::Society, 2, 40, TEXT("writing"), TEXT(""), N::War, false, TEXT("cap=1.2 research=1.1"), M::None },
		{ TEXT("herbal"), TEXT("רפואת צמחים"), TEXT("רפואת הצמחים"), F::Medicine, 2, 30, TEXT("agriculture"), TEXT(""), N::Plague, false, TEXT("health=1.15 resist=0.03"), M::None },
		{ TEXT("money"), TEXT("מטבעות"), TEXT("המטבעות"), F::Society, 2, 45, TEXT("counting bronze"), TEXT("metal=15"), N::None, false, TEXT("res=1.4 spread=1.15"), M::None },
		{ TEXT("roads"), TEXT("דרכים סלולות"), TEXT("הדרכים הסלולות"), F::Craft, 2, 40, TEXT("wheel settlement"), TEXT("stone=45"), N::None, false, TEXT("range=0.2 res=1.2 spread=1.2"), M::None },

		// Era 3: iron and thought
		{ TEXT("iron"), TEXT("ברזל"), TEXT("הברזל"), F::Craft, 3, 90, TEXT("bronze"), TEXT("stone=60 wood=60"), N::None, false, TEXT("metal=2 food=1.3 war=1.5"), M::None },
		{ TEXT("mathematics"), TEXT("הנדסה וחשבון גבוה"), TEXT("ההנדסה והחשבון הגבוה"), F::Science, 3, 110, TEXT("writing counting"), TEXT(""), N::None, false, TEXT("research=1.5"), M::None },
		{ TEXT("philosophy"), TEXT("פילוסופיה"), TEXT("הפילוסופיה"), F::Society, 3, 80, TEXT("writing"), TEXT(""), N::None, false, TEXT("research=1.2 spread=1.2"), M::None },
		{ TEXT("astronomy"), TEXT("מדידת הכוכבים"), TEXT("מדידת הכוכבים"), F::Science, 3, 100, TEXT("mathematics calendar"), TEXT(""), N::None, false, TEXT("range=0.1 research=1.15"), M::None },
		{ TEXT("aqueducts"), TEXT("אמות מים"), TEXT("אמות המים"), F::Craft, 3, 100, TEXT("roads mathematics"), TEXT("stone=120"), N::Disaster, false, TEXT("cap=1.8 health=1.1"), M::None },
		{ TEXT("hygiene"), TEXT("תורת הניקיון"), TEXT("תורת הניקיון"), F::Medicine, 3, 90, TEXT("herbal writing"), TEXT(""), N::Plague, true, TEXT("health=1.25 resist=0.06"), M::None },
		{ TEXT("schools"), TEXT("בתי ספר"), TEXT("בתי הספר"), F::Society, 3, 130, TEXT("writing law"), TEXT("wood=60"), N::None, false, TEXT("research=1.5 spread=1.3"), M::None },
		{ TEXT("plow"), TEXT("מחרשת ברזל"), TEXT("מחרשת הברזל"), F::Food, 3, 80, TEXT("iron irrigation"), TEXT("metal=40"), N::Famine, false, TEXT("food=2.0"), M::None },

		// Era 4: printing and science
		{ TEXT("clockwork"), TEXT("שעון גלגלי שיניים"), TEXT("שעון גלגלי השיניים"), F::Craft, 4, 220, TEXT("iron mathematics"), TEXT("metal=80"), N::None, false, TEXT("res=1.2 research=1.2"), M::None },
		{ TEXT("compass"), TEXT("מצפן"), TEXT("המצפן"), F::Science, 4, 180, TEXT("sailing astronomy"), TEXT("metal=40"), N::None, false, TEXT("range=0.6 spread=1.2"), M::None },
		{ TEXT("printing"), TEXT("דפוס"), TEXT("הדפוס"), F::Society, 4, 300, TEXT("schools clockwork"), TEXT("metal=120 wood=120"), N::None, false, TEXT("research=1.7 spread=2.0"), M::Printing },
		{ TEXT("optics"), TEXT("עדשות"), TEXT("העדשות"), F::Science, 4, 240, TEXT("astronomy clockwork"), TEXT("stone=120"), N::None, false, TEXT("research=1.25 health=1.05"), M::None },
		{ TEXT("gunpowder"), TEXT("אבק שריפה"), TEXT("אבק השריפה"), F::War, 4, 220, TEXT("iron philosophy"), TEXT("rare=0 wood=140"), N::War, true, TEXT("war=2.2"), M::None },
		{ TEXT("banking"), TEXT("בתי מסחר ואשראי"), TEXT("בתי המסחר והאשראי"), F::Society, 4, 260, TEXT("money schools"), TEXT(""), N::None, false, TEXT("res=1.6"), M::None },
		{ TEXT("scimethod"), TEXT("השיטה המדעית"), TEXT("השיטה המדעית"), F::Science, 4, 400, TEXT("printing optics"), TEXT(""), N::None, false, TEXT("research=2.0 spread=1.4"), M::None },
		{ TEXT("anatomy"), TEXT("חקר גוף האדם"), TEXT("חקר גוף האדם"), F::Medicine, 4, 260, TEXT("hygiene optics"), TEXT(""), N::Plague, false, TEXT("health=1.2 resist=0.05"), M::None },

		// Era 5: steam and electricity
		{ TEXT("coal"), TEXT("כריית פחם"), TEXT("כריית הפחם"), F::Craft, 5, 450, TEXT("iron scimethod"), TEXT("metal=250"), N::None, false, TEXT("energy=2 res=1.2"), M::None },
		{ TEXT("steam"), TEXT("מנוע קיטור"), TEXT("מנוע הקיטור"), F::Craft, 5, 800, TEXT("coal clockwork"), TEXT("metal=350 energy=100"), N::None, false, TEXT("res=2.0 food=1.4 energy=1"), M::Steam },
		{ TEXT("steel"), TEXT("פלדה"), TEXT("הפלדה"), F::Craft, 5, 700, TEXT("coal"), TEXT("metal=500 energy=200"), N::None, false, TEXT("metal=4 war=1.5"), M::None },
		{ TEXT("chemistry"), TEXT("כימיה"), TEXT("הכימיה"), F::Science, 5, 750, TEXT("scimethod"), TEXT("energy=60"), N::None, false, TEXT("research=1.4 rare=1"), M::None },
		{ TEXT("railways"), TEXT("מסילות ברזל"), TEXT("מסילות הברזל"), F::Craft, 5, 900, TEXT("steam steel"), TEXT("metal=900 energy=300"), N::None, false, TEXT("res=1.5 spread=1.4 range=0.3"), M::None },
		{ TEXT("vaccines"), TEXT("חיסונים"), TEXT("החיסונים"), F::Medicine, 5, 700, TEXT("anatomy chemistry"), TEXT("rare=30"), N::Plague, true, TEXT("health=1.4 resist=0.08"), M::None },
		{ TEXT("electricity"), TEXT("חשמל"), TEXT("החשמל"), F::Science, 5, 1300, TEXT("chemistry steam"), TEXT("metal=600 energy=400"), N::None, false, TEXT("research=1.8 res=1.5 energy=5"), M::Electricity },
		{ TEXT("telegraph"), TEXT("טלגרף"), TEXT("הטלגרף"), F::Science, 5, 700, TEXT("electricity"), TEXT("metal=500"), N::None, false, TEXT("spread=2.2 range=0.5"), M::None },
		{ TEXT("fertilizer"), TEXT("דשן מלאכותי"), TEXT("הדשן המלאכותי"), F::Food, 5, 900, TEXT("chemistry plow"), TEXT("energy=400 rare=40"), N::Famine, false, TEXT("food=3.0 cap=1.4"), M::None },

		// Era 6: atom and computer
		{ TEXT("combustion"), TEXT("מנוע בעירה"), TEXT("מנוע הבעירה"), F::Craft, 6, 2200, TEXT("steel chemistry"), TEXT("metal=1500 energy=1000"), N::None, false, TEXT("res=1.5 energy=8 range=0.3"), M::None },
		{ TEXT("flight"), TEXT("טיסה ממונעת"), TEXT("הטיסה הממונעת"), F::Craft, 6, 3000, TEXT("combustion"), TEXT("metal=2000 energy=1500"), N::None, false, TEXT("range=2.0 spread=1.5"), M::Flight },
		{ TEXT("antibiotics"), TEXT("אנטיביוטיקה"), TEXT("האנטיביוטיקה"), F::Medicine, 6, 2000, TEXT("vaccines"), TEXT("rare=200"), N::Plague, false, TEXT("health=1.4 resist=0.08"), M::None },
		{ TEXT("radio"), TEXT("רדיו"), TEXT("הרדיו"), F::Science, 6, 2200, TEXT("telegraph"), TEXT("metal=1000 rare=200"), N::None, false, TEXT("spread=1.8"), M::None },
		{ TEXT("nuclear"), TEXT("ביקוע האטום"), TEXT("ביקוע האטום"), F::Science, 6, 5000, TEXT("electricity chemistry"), TEXT("energy=4000 rare=800"), N::War, false, TEXT("energy=20 war=3.0 research=1.2"), M::None },
		{ TEXT("transistor"), TEXT("טרנזיסטור"), TEXT("הטרנזיסטור"), F::Science, 6, 3500, TEXT("radio"), TEXT("rare=600"), N::None, false, TEXT("research=1.5 rare=2"), M::None },
		{ TEXT("computer"), TEXT("מחשב"), TEXT("המחשב"), F::Science, 6, 6000, TEXT("transistor"), TEXT("rare=1200 energy=2000"), N::None, false, TEXT("research=2.2 res=1.3"), M::Computer },
		{ TEXT("rocketry"), TEXT("טילים"), TEXT("הטילים"), F::Space, 6, 6000, TEXT("flight"), TEXT("metal=6000 energy=6000"), N::War, false, TEXT("war=1.6"), M::None },
		{ TEXT("genetics"), TEXT("הנדסת גנים"), TEXT("הנדסת הגנים"), F::Medicine, 6, 6000, TEXT("antibiotics computer"), TEXT("rare=1500"), N::Famine, false, TEXT("food=2.5 health=1.3"), M::None },
		{ TEXT("quake_proof"), TEXT("בנייה עמידה"), TEXT("הבנייה העמידה"), F::Craft, 6, 3000, TEXT("steel computer"), TEXT("metal=6000"), N::Disaster, true, TEXT("resist=0.15 cap=1.4"), M::None },
		{ TEXT("satellite"), TEXT("לוויין מלאכותי"), TEXT("הלוויין המלאכותי"), F::Space, 6, 12000, TEXT("rocketry computer"), TEXT("metal=12000 energy=12000 rare=3000"), N::None, false, TEXT("spread=1.5 resist=0.05"), M::Satellite },
		{ TEXT("internet"), TEXT("רשת עולמית"), TEXT("הרשת העולמית"), F::Science, 6, 9000, TEXT("computer satellite"), TEXT("rare=4000"), N::None, false, TEXT("research=1.8 spread=3.0"), M::None },

		// Era 7: space
		{ TEXT("moon"), TEXT("נחיתה על הירח"), TEXT("הנחיתה על הירח"), F::Space, 7, 30000, TEXT("satellite"), TEXT("metal=30000 energy=30000 rare=8000"), N::None, false, TEXT("research=1.2"), M::Moon },
		{ TEXT("robotics"), TEXT("רובוטים"), TEXT("הרובוטים"), F::Science, 7, 10000, TEXT("computer steel"), TEXT("metal=20000 rare=8000"), N::None, false, TEXT("res=2.0 food=1.3"), M::None },
		{ TEXT("orbital"), TEXT("תחנת מסלול"), TEXT("תחנת המסלול"), F::Space, 7, 11000, TEXT("moon"), TEXT("metal=40000 energy=30000"), N::None, false, TEXT("research=1.1"), M::None },
		{ TEXT("fusion"), TEXT("היתוך גרעיני"), TEXT("ההיתוך הגרעיני"), F::Science, 7, 18000, TEXT("nuclear computer"), TEXT("energy=60000 rare=20000"), N::None, false, TEXT("energy=60 res=1.5"), M::None },
		{ TEXT("thinking_machines"), TEXT("מכונות חושבות"), TEXT("המכונות החושבות"), F::Science, 7, 20000, TEXT("internet robotics"), TEXT("rare=30000 energy=30000"), N::None, false, TEXT("research=2.5"), M::None },
		{ TEXT("mars"), TEXT("מושבה על מאדים"), TEXT("המושבה על מאדים"), F::Space, 7, 24000, TEXT("orbital fusion"), TEXT("metal=80000 energy=80000 rare=20000"), N::None, false, TEXT("cap=1.1"), M::Mars },
		{ TEXT("asteroid_mining"), TEXT("כריית אסטרואידים"), TEXT("כריית האסטרואידים"), F::Space, 7, 24000, TEXT("orbital robotics"), TEXT("energy=100000"), N::None, false, TEXT("metal=80 rare=40 res=1.5"), M::None },
		{ TEXT("planet_shield"), TEXT("מגן פלנטרי"), TEXT("המגן הפלנטרי"), F::Space, 7, 20000, TEXT("orbital"), TEXT("metal=80000 energy=80000"), N::Disaster, false, TEXT("resist=0.2"), M::None },

		// Era 8: the stars
		{ TEXT("ion_drive"), TEXT("מנוע יונים"), TEXT("מנוע היונים"), F::Space, 8, 30000, TEXT("fusion mars"), TEXT("energy=50000 rare=15000"), N::None, false, TEXT(""), M::None },
		{ TEXT("cryosleep"), TEXT("שינה קפואה"), TEXT("השינה הקפואה"), F::Medicine, 8, 25000, TEXT("genetics thinking_machines"), TEXT("rare=15000"), N::None, false, TEXT("health=1.1"), M::None },
		{ TEXT("closed_habitat"), TEXT("מערכת חיים סגורה"), TEXT("מערכת החיים הסגורה"), F::Space, 8, 28000, TEXT("mars genetics"), TEXT("metal=50000"), N::None, false, TEXT("cap=1.1"), M::None },
		{ TEXT("antimatter"), TEXT("אנטי-חומר"), TEXT("האנטי-חומר"), F::Science, 8, 45000, TEXT("fusion thinking_machines"), TEXT("energy=125000 rare=37500"), N::None, false, TEXT("energy=200"), M::None },
		{ TEXT("starship"), TEXT("ספינת כוכבים"), TEXT("ספינת הכוכבים"), F::Space, 8, 70000, TEXT("ion_drive cryosleep closed_habitat antimatter asteroid_mining"), TEXT("metal=200000 energy=200000 rare=75000"), N::None, false, TEXT(""), M::StarLaunch },
	};

	static void ParseMaterials(const TCHAR* Text, double (&Out)[CivResourceCount], TArray<FString>& Problems, const FString& Key)
	{
		TArray<FString> Parts;
		FString(Text).ParseIntoArray(Parts, TEXT(" "));
		for (const FString& Part : Parts)
		{
			FString Name, Value;
			if (!Part.Split(TEXT("="), &Name, &Value)) { Problems.Add(Key + TEXT(": bad material ") + Part); continue; }
			const double Amount = FCString::Atod(*Value);
			if (Name == TEXT("wood")) { Out[0] = Amount; }
			else if (Name == TEXT("stone")) { Out[1] = Amount; }
			else if (Name == TEXT("metal")) { Out[2] = Amount; }
			else if (Name == TEXT("energy")) { Out[3] = Amount; }
			else if (Name == TEXT("rare")) { Out[4] = Amount; }
			else { Problems.Add(Key + TEXT(": unknown material ") + Name); }
		}
	}

	static void ParseEffects(const TCHAR* Text, FCivInventionEffects& Out, TArray<FString>& Problems, const FString& Key)
	{
		TArray<FString> Parts;
		FString(Text).ParseIntoArray(Parts, TEXT(" "));
		for (const FString& Part : Parts)
		{
			FString Name, Value;
			if (!Part.Split(TEXT("="), &Name, &Value)) { Problems.Add(Key + TEXT(": bad effect ") + Part); continue; }
			const double Amount = FCString::Atod(*Value);
			if (Name == TEXT("food")) { Out.Food = Amount; }
			else if (Name == TEXT("cap")) { Out.Capacity = Amount; }
			else if (Name == TEXT("res")) { Out.Resources = Amount; }
			else if (Name == TEXT("research")) { Out.Research = Amount; }
			else if (Name == TEXT("spread")) { Out.Spread = Amount; }
			else if (Name == TEXT("health")) { Out.Health = Amount; }
			else if (Name == TEXT("war")) { Out.War = Amount; }
			else if (Name == TEXT("resist")) { Out.Resist = Amount; }
			else if (Name == TEXT("range")) { Out.Range = Amount; }
			else if (Name == TEXT("wood")) { Out.ResourceRate[0] = Amount; }
			else if (Name == TEXT("stone")) { Out.ResourceRate[1] = Amount; }
			else if (Name == TEXT("metal")) { Out.ResourceRate[2] = Amount; }
			else if (Name == TEXT("energy")) { Out.ResourceRate[3] = Amount; }
			else if (Name == TEXT("rare")) { Out.ResourceRate[4] = Amount; }
			else { Problems.Add(Key + TEXT(": unknown effect ") + Name); }
		}
	}
}

FCivInventionTable::FCivInventionTable()
{
	using namespace CivInventionData;
	for (const FRow& Row : Rows)
	{
		FCivInventionDef Def;
		Def.Key = Row.Key;
		Def.Name = Row.Name;
		Def.NameDefinite = Row.NameDefinite;
		Def.Field = Row.Field;
		Def.Era = Row.Era;
		Def.Cost = Row.Cost;
		Def.Need = Row.Need;
		Def.bNeedRequired = Row.bNeedRequired;
		Def.Milestone = Row.Milestone;

		if (Find(Def.Key) != INDEX_NONE) { BuildProblems.Add(Def.Key + TEXT(": duplicate key")); }

		TArray<FString> PrereqKeys;
		FString(Row.Prereqs).ParseIntoArray(PrereqKeys, TEXT(" "));
		for (const FString& PrereqKey : PrereqKeys)
		{
			const int32 PrereqIndex = Find(PrereqKey);
			if (PrereqIndex == INDEX_NONE)
			{
				// Prerequisites must come earlier, which also rules out cycles.
				BuildProblems.Add(Def.Key + TEXT(": prerequisite missing or later in table: ") + PrereqKey);
			}
			else
			{
				Def.Prereqs.Add(PrereqIndex);
			}
		}
		ParseMaterials(Row.Materials, Def.Materials, BuildProblems, Def.Key);
		ParseEffects(Row.Effects, Def.Effects, BuildProblems, Def.Key);
		Defs.Add(MoveTemp(Def));
	}
}

const FCivInventionTable& FCivInventionTable::Get()
{
	static const FCivInventionTable Table;
	return Table;
}

int32 FCivInventionTable::Find(const FString& Key) const
{
	for (int32 Index = 0; Index < Defs.Num(); ++Index)
	{
		if (Defs[Index].Key == Key) { return Index; }
	}
	return INDEX_NONE;
}
