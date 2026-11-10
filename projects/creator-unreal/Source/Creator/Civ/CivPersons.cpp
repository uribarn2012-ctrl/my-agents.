// Individual lives. Nothing here assigns a destiny: each year a person's traits, standing and the state of
// their people decide what can happen next. Most years nothing does.
#include "CivSimulation.h"
#include "CivNames.h"

using CivText::Fill;

namespace CivLifeData
{
	struct FTemplate { ECivLife Kind; const TCHAR* Male; const TCHAR* Female; };

	// {o} another person, {p} a people, {i} an invention, {t} a title, {c} a cause, {w} an occupation
	static const FTemplate Templates[] =
	{
		{ ECivLife::Born, TEXT("נולד בעם {p}, בבית {o}."), TEXT("נולדה בעם {p}, בבית {o}.") },
		{ ECivLife::FromCrowd, TEXT("עד אז חי בין המוני עם {p} ואיש לא כתב את שמו."), TEXT("עד אז חיה בין המוני עם {p} ואיש לא כתב את שמה.") },
		{ ECivLife::Work, TEXT("התחיל לעבוד כ{w}."), TEXT("התחילה לעבוד כ{w}.") },
		{ ECivLife::Married, TEXT("נשא לאישה את {o}."), TEXT("נישאה ל{o}.") },
		{ ECivLife::MarriedUp, TEXT("נשא לאישה את {o}, בת למעמד גבוה ממנו, ודלתות נפתחו לפניו."), TEXT("נישאה ל{o}, בן למעמד גבוה ממנה, ודלתות נפתחו לפניה.") },
		{ ECivLife::Child, TEXT("נולד לו ילד: {o}."), TEXT("ילדה את {o}.") },
		{ ECivLife::ChildDied, TEXT("קבר את ילדו {o}. אחרי זה לא היה אותו אדם."), TEXT("קברה את ילדה {o}. אחרי זה לא הייתה אותה אישה.") },
		{ ECivLife::Widowed, TEXT("התאלמן: {o} מתה ולא נשא אישה אחרת זמן רב."), TEXT("התאלמנה: {o} מת והיא נשארה לבדה.") },
		{ ECivLife::MovedCity, TEXT("עזב את כפר הולדתו ועבר לעיר {o}."), TEXT("עזבה את כפר הולדתה ועברה לעיר {o}.") },
		{ ECivLife::GoodYear, TEXT("הייתה לו שנה טובה: היבול מילא את המחסן, ובפעם הראשונה לא דאג לחורף."), TEXT("הייתה לה שנה טובה: היבול מילא את המחסן, ובפעם הראשונה לא דאגה לחורף.") },
		{ ECivLife::Feud, TEXT("הסתכסך עם {o} על גבול שדה, והמריבה לא נגמרה עד סוף ימיו."), TEXT("הסתכסכה עם {o} על גבול שדה, והמריבה לא נגמרה עד סוף ימיה.") },
		{ ECivLife::Grandchild, TEXT("נולד לו נכד: {o}."), TEXT("נולד לה נכד: {o}.") },
		{ ECivLife::Illness, TEXT("חלה קשה והחלים לאט."), TEXT("חלתה קשה והחלימה לאט.") },
		{ ECivLife::PlagueSurvived, TEXT("המגפה עברה בביתו והוא נשאר בחיים."), TEXT("המגפה עברה בביתה והיא נשארה בחיים.") },
		{ ECivLife::Hunger, TEXT("בשנות הרעב מכר את מה שהיה לו כדי לאכול."), TEXT("בשנות הרעב מכרה את מה שהיה לה כדי לאכול.") },
		{ ECivLife::Levied, TEXT("גויס למלחמה ועזב את הבית."), TEXT("גויסה למלחמה ועזבה את הבית.") },
		{ ECivLife::Battle, TEXT("עמד בקרב כשאחרים ברחו, ושמו יצא בין החיילים."), TEXT("עמדה בקרב כשאחרים ברחו, ושמה יצא בין החיילים.") },
		{ ECivLife::Knighted, TEXT("על אומץ ליבו הועלה לדרגת {t} בידי {o}."), TEXT("על אומץ ליבה הועלתה לדרגת {t} בידי {o}.") },
		{ ECivLife::Ennobled, TEXT("קיבל אדמה ותואר: {t}."), TEXT("קיבלה אדמה ותואר: {t}.") },
		{ ECivLife::Inherited, TEXT("ירש את התואר {t}."), TEXT("ירשה את התואר {t}.") },
		{ ECivLife::Crowned, TEXT("עלה לשלטון בירושה והפך ל{t}."), TEXT("עלתה לשלטון בירושה והפכה ל{t}.") },
		{ ECivLife::Chosen, TEXT("נבחר להיות {t}, כי לא נשאר יורש ואנשים סמכו עליו."), TEXT("נבחרה להיות {t}, כי לא נשאר יורש ואנשים סמכו עליה.") },
		{ ECivLife::CoupWon, TEXT("הפיל את {o} בקשר שרקם בסתר, ותפס את השלטון כ{t}."), TEXT("הפילה את {o} בקשר שרקמה בסתר, ותפסה את השלטון כ{t}.") },
		{ ECivLife::CoupLost, TEXT("ניסה להפיל את {o}, ונתפס."), TEXT("ניסתה להפיל את {o}, ונתפסה.") },
		{ ECivLife::Deposed, TEXT("הודח מהשלטון ונשאר בלי כלום."), TEXT("הודחה מהשלטון ונשארה בלי כלום.") },
		{ ECivLife::Disgraced, TEXT("נפל מגדולתו ואיבד את תוארו."), TEXT("נפלה מגדולתה ואיבדה את תוארה.") },
		{ ECivLife::Tyrant, TEXT("התחיל לשלוט ביד קשה, ואנשים למדו לפחד ממנו."), TEXT("התחילה לשלוט ביד קשה, ואנשים למדו לפחד ממנה.") },
		{ ECivLife::Law, TEXT("הוציא חוק שהקל על חיי העם."), TEXT("הוציאה חוק שהקל על חיי העם.") },
		{ ECivLife::Awakening, TEXT("אחרי {c} נשבר משהו בתוכו. עזב הכול והתחיל ללכת בין הכפרים ולהטיף."), TEXT("אחרי {c} נשבר משהו בתוכה. עזבה הכול והתחילה ללכת בין הכפרים ולהטיף.") },
		{ ECivLife::Miracle, TEXT("אנשים סיפרו שחולה קם אחרי שנגע בו."), TEXT("אנשים סיפרו שחולה קם אחרי שנגעה בו.") },
		{ ECivLife::Holy, TEXT("עולי רגל החלו להגיע אליו, וקראו לו איש קדוש."), TEXT("עולי רגל החלו להגיע אליה, וקראו לה אישה קדושה.") },
		{ ECivLife::Faith, TEXT("סביב דבריו התגבשה אמונה חדשה בעם {p}."), TEXT("סביב דבריה התגבשה אמונה חדשה בעם {p}.") },
		{ ECivLife::Persecuted, TEXT("השלטון רדף אותו בגלל דרשותיו."), TEXT("השלטון רדף אותה בגלל דרשותיה.") },
		{ ECivLife::Rich, TEXT("הסחורות שלו הגיעו רחוק, והוא נעשה אדם עשיר."), TEXT("הסחורות שלה הגיעו רחוק, והיא נעשתה אישה עשירה.") },
		{ ECivLife::Ruined, TEXT("איבד את כל הונו בבת אחת."), TEXT("איבדה את כל הונה בבת אחת.") },
		{ ECivLife::Healer, TEXT("התחיל לטפל בחולים, בלי שאיש ביקש ממנו."), TEXT("התחילה לטפל בחולים, בלי שאיש ביקש ממנה.") },
		{ ECivLife::Rebel, TEXT("לא יכול היה לשאת עוד, וקם בראש מרד."), TEXT("לא יכלה לשאת עוד, וקמה בראש מרד.") },
		{ ECivLife::RebelWon, TEXT("המרד ניצח, והוא הפך ל{t}."), TEXT("המרד ניצח, והיא הפכה ל{t}.") },
		{ ECivLife::Explorer, TEXT("יצא לדרך אל מעבר למקומות שהכירו."), TEXT("יצאה לדרך אל מעבר למקומות שהכירו.") },
		{ ECivLife::Discovery, TEXT("חזר עם מפות של ארצות שאיש לא ראה."), TEXT("חזרה עם מפות של ארצות שאיש לא ראה.") },
		{ ECivLife::BecameInventor, TEXT("החל לבלות את ימיו בניסויים ובחקירה."), TEXT("החלה לבלות את ימיה בניסויים ובחקירה.") },
		{ ECivLife::Invented, TEXT("השלים את {i}."), TEXT("השלימה את {i}.") },
		{ ECivLife::Inspired, TEXT("התעורר בלילה עם רעיון שלא היה שלו."), TEXT("התעוררה בלילה עם רעיון שלא היה שלה.") },
		{ ECivLife::Blessed, TEXT("הכול הצליח לו באותה שנה, ואיש לא ידע למה."), TEXT("הכול הצליח לה באותה שנה, ואיש לא ידעה למה.") },
		{ ECivLife::Cursed, TEXT("נפלה עליו קללה שאין לה הסבר: בריאותו ושמו התחילו להתפורר."), TEXT("נפלה עליה קללה שאין לה הסבר: בריאותה ושמה התחילו להתפורר.") },
		{ ECivLife::Died, TEXT("מת מ{c}."), TEXT("מתה מ{c}.") },
		{ ECivLife::Venerated, TEXT("אחרי מותו המשיכו להתפלל ליד קברו, ודורות אחר כך עוד נשאו את שמו."), TEXT("אחרי מותה המשיכו להתפלל ליד קברה, ודורות אחר כך עוד נשאו את שמה.") },
	};

	static const FTemplate& TemplateOf(ECivLife Kind)
	{
		for (const FTemplate& T : Templates) { if (T.Kind == Kind) { return T; } }
		return Templates[0];
	}

	static const TCHAR* OccupationWord(ECivOccupation Occupation, bool bFemale)
	{
		switch (Occupation)
		{
		case ECivOccupation::Farmer: return bFemale ? TEXT("איכרה") : TEXT("איכר");
		case ECivOccupation::Artisan: return bFemale ? TEXT("בעלת מלאכה") : TEXT("בעל מלאכה");
		case ECivOccupation::Soldier: return bFemale ? TEXT("חיילת") : TEXT("חייל");
		case ECivOccupation::Merchant: return bFemale ? TEXT("סוחרת") : TEXT("סוחר");
		case ECivOccupation::Priest: return bFemale ? TEXT("מטיפה") : TEXT("מטיף");
		case ECivOccupation::Healer: return bFemale ? TEXT("מרפאה") : TEXT("מרפא");
		case ECivOccupation::Inventor: return bFemale ? TEXT("ממציאה") : TEXT("ממציא");
		case ECivOccupation::Rebel: return bFemale ? TEXT("מורדת") : TEXT("מורד");
		case ECivOccupation::Explorer: return bFemale ? TEXT("נוסעת") : TEXT("נוסע");
		default: return bFemale ? TEXT("פשוטת עם") : TEXT("פשוט עם");
		}
	}

	static FString RankWord(ECivRank Rank, int32 Era, bool bFemale)
	{
		switch (Rank)
		{
		case ECivRank::Knight:
			if (Era <= 1) { return bFemale ? TEXT("לוחמת ותיקה") : TEXT("לוחם ותיק"); }
			if (Era <= 5) { return bFemale ? TEXT("אבירה") : TEXT("אביר"); }
			return bFemale ? TEXT("קצינה בכירה") : TEXT("קצין בכיר");
		case ECivRank::Lord:
			if (Era <= 1) { return bFemale ? TEXT("זקנת שבט") : TEXT("זקן שבט"); }
			if (Era <= 5) { return bFemale ? TEXT("אצילה") : TEXT("אציל"); }
			return bFemale ? TEXT("שרה") : TEXT("שר");
		case ECivRank::Ruler:
			if (Era <= 1) { return bFemale ? TEXT("ראשת שבט") : TEXT("ראש שבט"); }
			if (Era <= 4) { return bFemale ? TEXT("מלכה") : TEXT("מלך"); }
			return bFemale ? TEXT("נשיאה") : TEXT("נשיא");
		default:
			return bFemale ? TEXT("פשוטת עם") : TEXT("פשוט עם");
		}
	}

	/** How open society is to climbing, by era. */
	static double Mobility(int32 Era)
	{
		if (Era <= 1) { return 0.7; }
		if (Era <= 4) { return 0.3; }
		if (Era <= 6) { return 0.7; }
		return 1.0;
	}

	/** Early societies mostly barred women from arms and thrones; the bar lowers with time. */
	static double GenderBar(const FCivPerson& Me, int32 Era)
	{
		if (!Me.bFemale || Era >= 5) { return 1.0; }
		return 0.25;
	}

	static double Trait(FCivRandom& Rng, double FromParents, bool bHasParents)
	{
		const double Fresh = Rng.Unit();
		return bHasParents ? FMath::Clamp(0.5 * FromParents + 0.5 * Fresh, 0.0, 1.0) : Fresh;
	}
}

using namespace CivLifeData;

// ---------------------------------------------------------------------------
// Birth and the pool of named people
// ---------------------------------------------------------------------------

void FCivSimulation::Log(FCivPerson& Me, ECivLife Kind, int32 Other, int32 Param)
{
	FCivLifeEvent E;
	E.Year = Year;
	E.Kind = Kind;
	E.Other = Other;
	E.Param = Param;
	Me.Log.Add(E);
}

int32 FCivSimulation::CreatePerson(FCivRandom& Random, int32 PeopleIndex, int32 Father, int32 Mother, int32 AgeYears)
{
	FCivPeople& P = Peoples[PeopleIndex];
	const int32 Index = Persons.AddDefaulted();
	FCivPerson& Me = Persons[Index];
	const bool bFather = Father != INDEX_NONE;
	const bool bMother = Mother != INDEX_NONE;
	const bool bParents = bFather && bMother;
	const FCivPerson* Dad = bFather ? &Persons[Father] : nullptr;
	const FCivPerson* Mum = bMother ? &Persons[Mother] : nullptr;

	Me.Id = Index;
	Me.bFemale = Random.Chance(0.5);
	Me.FirstName = CivText::FirstName(Random, Me.bFemale);
	const FString ParentName = Dad ? Dad->FirstName : CivText::FirstName(Random, false);
	Me.Name = CivText::FixFinalForms(Me.FirstName + (Me.bFemale ? TEXT(" בת ") : TEXT(" בן ")) + ParentName);
	Me.House = Dad ? Dad->House : (Mum ? Mum->House : CivText::PeopleName(Random));
	Me.People = PeopleIndex;
	Me.BornYear = Year - AgeYears;
	Me.Father = Father;
	Me.Mother = Mother;

	Me.Curiosity = Trait(Random, bParents ? 0.5 * (Dad->Curiosity + Mum->Curiosity) : 0.0, bParents);
	Me.Boldness = Trait(Random, bParents ? 0.5 * (Dad->Boldness + Mum->Boldness) : 0.0, bParents);
	Me.Patience = Trait(Random, bParents ? 0.5 * (Dad->Patience + Mum->Patience) : 0.0, bParents);
	Me.Compassion = Trait(Random, bParents ? 0.5 * (Dad->Compassion + Mum->Compassion) : 0.0, bParents);
	Me.Ambition = Trait(Random, bParents ? 0.5 * (Dad->Ambition + Mum->Ambition) : 0.0, bParents);
	Me.Piety = Trait(Random, bParents ? 0.5 * (Dad->Piety + Mum->Piety) : 0.0, bParents);
	Me.Cruelty = Trait(Random, bParents ? 0.5 * (Dad->Cruelty + Mum->Cruelty) : 0.0, bParents);
	Me.Cunning = Trait(Random, bParents ? 0.5 * (Dad->Cunning + Mum->Cunning) : 0.0, bParents);
	Me.Charisma = Trait(Random, bParents ? 0.5 * (Dad->Charisma + Mum->Charisma) : 0.0, bParents);
	Me.Brilliance = FMath::Exp(Random.Normal() * 0.45);
	Me.Passion = static_cast<ECivField>(Random.RangeInt(0, CivFieldCount - 1));
	Me.Health = Random.Range(0.75, 1.0);

	// Standing is inherited, a step at a time: the child of a lord starts as gentry, not as a lord.
	const ECivRank ParentRank = FMath::Max(Dad ? Dad->Rank : ECivRank::Commoner, Mum ? Mum->Rank : ECivRank::Commoner);
	Me.Rank = ParentRank >= ECivRank::Lord || (ParentRank == ECivRank::Knight && Random.Chance(0.4)) ? ECivRank::Knight : ECivRank::Commoner;
	if (ParentRank >= ECivRank::Lord) { Me.bHeir = true; }
	Me.OriginRank = Me.Rank;
	Me.Wealth = (Dad ? Dad->Wealth : 0.05) * 0.4 + 0.02;

	const double Span = ExpectedLifespan(P) * Random.Range(0.8, 1.6);
	Me.PlannedDeathYear = Me.BornYear + FMath::Max(AgeYears + 2, FMath::RoundToInt32(Span));
	// Childhood was dangerous before medicine.
	const double ChildDeath = 0.32 / FMath::Max(1.0, P.HealthMult);
	if (AgeYears == 0 && Random.Chance(ChildDeath))
	{
		Me.PlannedDeathYear = Me.BornYear + Random.RangeInt(1, 12);
		Me.bChildDeath = true;
	}

	P.LivingPersons.Add(Index);
	++Stats.PersonsCreated;

	FCivLifeEvent BornEvent;
	BornEvent.Year = Me.BornYear;
	BornEvent.Kind = ECivLife::Born;
	BornEvent.Param = PeopleIndex;
	Me.Log.Add(BornEvent);
	return Index;
}

void FCivSimulation::SeedPersonPool()
{
	for (int32 Index = 0; Index < Peoples.Num(); ++Index)
	{
		const int32 Target = Settings.NamedPersonsPerPeople;
		for (int32 N = 0; N < Target; ++N)
		{
			const int32 NewId = CreatePerson(Rng, Index, INDEX_NONE, INDEX_NONE, Rng.RangeInt(0, 45));
			// Every people starts with a few families already above the rest.
			if (Year - Persons[NewId].BornYear >= 16 && N < 8)
			{
				FCivPerson& Born = Persons[NewId];
				Born.Rank = N < 4 ? ECivRank::Lord : ECivRank::Knight;
				Born.OriginRank = Born.Rank;
				Born.Occupation = N < 4 ? ECivOccupation::Lord : ECivOccupation::Soldier;
				Born.Reputation = Rng.Range(0.2, 0.6);
				Born.Arms = Rng.Range(0.2, 0.6);
			}
		}
	}
}

FCivPerson& FCivSimulation::BirthInventor(int32 PeopleIndex, int32 AgeYears)
{
	// An inventor is someone already living whose curiosity found an opening. Only if nobody fits does a new face appear.
	FCivPeople& P = Peoples[PeopleIndex];
	int32 Found = INDEX_NONE;
	double Best = 0.0;
	for (int32 Id : P.LivingPersons)
	{
		const FCivPerson& C = Persons[Id];
		const int32 Age = Year - C.BornYear;
		if (C.bInventor || C.Rank >= ECivRank::Lord || C.bChildDeath || C.Occupation == ECivOccupation::Priest || Age < 18 || Age > 45) { continue; }
		const double Score = C.Curiosity + C.Patience * 0.5 + Rng.Range(0.0, 0.3);
		if (Score > Best) { Best = Score; Found = Id; }
	}
	if (Found == INDEX_NONE) { Found = CreatePerson(Rng, PeopleIndex, INDEX_NONE, INDEX_NONE, FMath::Max(AgeYears, 16)); }

	FCivPerson& Me = Persons[Found];
	Me.bInventor = true;
	if (Year - Me.BornYear >= 14) { Me.Occupation = ECivOccupation::Inventor; }
	Me.Curiosity = FMath::Max(Me.Curiosity, Rng.Range(0.5, 1.0));
	Peoples[PeopleIndex].LivingInventors.Add(Found);
	++Stats.InventorsBorn;
	Log(Me, ECivLife::BecameInventor);
	return Me;
}

void FCivSimulation::KillPerson(FCivPerson& G, const TCHAR* Cause)
{
	if (!G.IsAlive()) { return; }
	G.DeathYear = Year;
	G.DeathCause = Cause;
	G.Project = INDEX_NONE;
	FCivPeople& P = Peoples[G.People];
	P.LivingPersons.Remove(G.Id);
	P.LivingInventors.Remove(G.Id);
	if (Year - G.BornYear < 15) { ++Stats.DiedYoung; }
	Log(G, ECivLife::Died);

	if (G.Spouse != INDEX_NONE && Persons[G.Spouse].IsAlive())
	{
		Log(Persons[G.Spouse], ECivLife::Widowed, G.Id);
		Persons[G.Spouse].Spouse = INDEX_NONE;
	}
	for (int32 ParentId : { G.Father, G.Mother })
	{
		if (ParentId != INDEX_NONE && Persons[ParentId].IsAlive() && Year - G.BornYear < 40) { Log(Persons[ParentId], ECivLife::ChildDied, G.Id); }
	}

	// A title passes to a grown child.
	if (G.Rank == ECivRank::Lord)
	{
		for (int32 Id : P.LivingPersons)
		{
			FCivPerson& Child = Persons[Id];
			if ((Child.Father == G.Id || Child.Mother == G.Id) && Year - Child.BornYear >= 16 && Child.Rank < ECivRank::Lord)
			{
				Child.Rank = ECivRank::Lord;
				if (!Child.bInventor) { Child.Occupation = ECivOccupation::Lord; }
				Log(Child, ECivLife::Inherited);
				break;
			}
		}
	}

	if (G.bHoly && G.Reputation > 0.6)
	{
		G.bVenerated = true;
		++Stats.Saints;
		P.Faith = FMath::Min(1.0, P.Faith + 0.1);
		Log(G, ECivLife::Venerated);
		Write(ECivEntryKind::Inventor, 3, G.People, Fill(G.bFemale ? TEXT("{0} מעם {1} מתה, אך קברה נעשה מקום עלייה לרגל.") : TEXT("{0} מעם {1} מת, אך קברו נעשה מקום עלייה לרגל."), { G.Name, P.Name }));
	}
	else if (G.InventionCount >= 2)
	{
		Write(ECivEntryKind::Inventor, 2, G.People, Fill(
			G.bFemale ? TEXT("{0} {1} מעם {2} מתה ב{3} בגיל {4}, אחרי {5} המצאות.") : TEXT("{0} {1} מעם {2} מת ב{3} בגיל {4}, אחרי {5} המצאות."),
			{ G.Name, G.PersonalityWord(), P.Name, FString(Cause), FString::FromInt(Year - G.BornYear), FString::FromInt(G.InventionCount) }));
	}
}

// ---------------------------------------------------------------------------
// Each year of a life
// ---------------------------------------------------------------------------

void FCivSimulation::TickPersons()
{
	for (int32 Index = 0; Index < Peoples.Num(); ++Index)
	{
		if (!Peoples[Index].bAlive) { continue; }

		FCivPeople& P = Peoples[Index];
		FCivYearContext Context;
		Context.PeopleIndex = Index;
		Context.Era = P.Era;
		for (const FCivWar& War : Wars) { if (War.A == Index || War.B == Index) { Context.bAtWar = true; break; } }
		Context.bPlague = P.NeedPressure[static_cast<int32>(ECivNeed::Plague)] > 0.7;
		Context.bFamine = P.NeedPressure[static_cast<int32>(ECivNeed::Famine)] > 0.7;
		Context.bDisaster = P.NeedPressure[static_cast<int32>(ECivNeed::Disaster)] > 0.7;
		Context.bRulerIsTyrant = Persons.IsValidIndex(P.Ruler) && Persons[P.Ruler].IsAlive() && Persons[P.Ruler].bTyrant;

		// Creating people can move the list in memory, so births wait until the end of the year.
		PendingBirths.Reset();
		const TArray<int32> Everyone = P.LivingPersons;
		for (int32 Id : Everyone)
		{
			if (Persons[Id].IsAlive()) { LifeYear(Id, Context); }
		}
		for (const TPair<int32, int32>& Parents : PendingBirths)
		{
			const int32 ChildId = CreatePerson(Rng, Index, Parents.Key, Parents.Value, 0);
			Log(Persons[Parents.Key], ECivLife::Child, ChildId);
			Log(Persons[Parents.Value], ECivLife::Child, ChildId);
			Persons[Parents.Key].ChildCount += 1;
			Persons[Parents.Value].ChildCount += 1;
			for (int32 ParentId : { Parents.Key, Parents.Value })
			{
				for (int32 Grand : { Persons[ParentId].Father, Persons[ParentId].Mother })
				{
					if (Persons.IsValidIndex(Grand) && Persons[Grand].IsAlive()) { Log(Persons[Grand], ECivLife::Grandchild, ChildId); }
				}
			}
		}

		// When attrition thins the named circle, someone from the crowd steps into view.
		while (Peoples[Index].LivingPersons.Num() < Settings.NamedPersonsPerPeople / 2)
		{
			const int32 NewId = CreatePerson(Rng, Index, INDEX_NONE, INDEX_NONE, Rng.RangeInt(14, 40));
			Log(Persons[NewId], ECivLife::FromCrowd, INDEX_NONE, Index);
		}

		UpdateRuler(Index, Context);
	}
}

void FCivSimulation::UpdateRuler(int32 PeopleIndex, const FCivYearContext& Context)
{
	FCivPeople& P = Peoples[PeopleIndex];
	const bool bVacant = !Persons.IsValidIndex(P.Ruler) || !Persons[P.Ruler].IsAlive();
	if (bVacant)
	{
		int32 Successor = INDEX_NONE;
		ECivLife How = ECivLife::Chosen;
		if (Persons.IsValidIndex(P.Ruler))
		{
			// A living adult child comes first.
			for (int32 Id : P.LivingPersons)
			{
				const FCivPerson& C = Persons[Id];
				if ((C.Father == P.Ruler || C.Mother == P.Ruler) && Year - C.BornYear >= 16) { Successor = Id; How = ECivLife::Crowned; break; }
			}
		}
		if (Successor == INDEX_NONE)
		{
			double Best = -1.0;
			for (int32 Id : P.LivingPersons)
			{
				const FCivPerson& C = Persons[Id];
				if (Year - C.BornYear < 25) { continue; }
				// The great families settle it among themselves; a commoner is chosen only if none are left.
				const double Score = static_cast<int32>(C.Rank) * 3.0 + C.Reputation * 2.0 + C.Charisma + Rng.Range(0.0, 0.5);
				if (Score > Best) { Best = Score; Successor = Id; }
			}
		}
		if (Successor != INDEX_NONE)
		{
			SetRuler(PeopleIndex, Successor, How, INDEX_NONE);
		}
	}

	if (Persons.IsValidIndex(P.Ruler) && Persons[P.Ruler].IsAlive())
	{
		const FCivPerson& R = Persons[P.Ruler];
		P.RulerAggression = 0.5 + R.Cruelty * 0.75 + R.Ambition * 0.75;
	}
	else
	{
		P.RulerAggression = 1.0;
	}
	P.LawBonus = FMath::Max(0.0, P.LawBonus * 0.999);
}

void FCivSimulation::SetRuler(int32 PeopleIndex, int32 Id, ECivLife How, int32 Fallen)
{
	FCivPeople& P = Peoples[PeopleIndex];
	FCivPerson& Me = Persons[Id];
	const ECivRank Before = Me.OriginRank;
	const bool WasCommonerOrKnight = Me.Rank <= ECivRank::Lord;
	Me.Rank = ECivRank::Ruler;
	Me.Occupation = Me.bInventor ? ECivOccupation::Inventor : ECivOccupation::Lord;
	P.Ruler = Id;

	const FString Title = RankWord(ECivRank::Ruler, P.Era, Me.bFemale);
	FCivLifeEvent E;
	E.Year = Year; E.Kind = How; E.Other = Fallen; E.Param = PeopleIndex;
	Me.Log.Add(E);

	if (How != ECivLife::Crowned && Before == ECivRank::Commoner && WasCommonerOrKnight) { ++Stats.RulersFromCommon; }

	const TCHAR* Text = nullptr;
	if (How == ECivLife::Crowned) { Text = Me.bFemale ? TEXT("{0} עלתה לשלטון בעם {1} בירושה, כ{2}.") : TEXT("{0} עלה לשלטון בעם {1} בירושה, כ{2}."); }
	else if (How == ECivLife::CoupWon) { Text = Me.bFemale ? TEXT("{0} תפסה את השלטון בעם {1} בהפיכה והפכה ל{2}.") : TEXT("{0} תפס את השלטון בעם {1} בהפיכה והפך ל{2}."); }
	else if (How == ECivLife::RebelWon) { Text = Me.bFemale ? TEXT("המרד של {0} ניצח בעם {1}, והיא הפכה ל{2}.") : TEXT("המרד של {0} ניצח בעם {1}, והוא הפך ל{2}."); }
	else { Text = Me.bFemale ? TEXT("{0} נבחרה בעם {1} להיות {2}.") : TEXT("{0} נבחר בעם {1} להיות {2}."); }
	Write(ECivEntryKind::People, (Before <= ECivRank::Commoner && How != ECivLife::Crowned) ? 3 : 2, PeopleIndex, Fill(Text, { Me.Name, P.Name, Title }));
}

void FCivSimulation::LifeYear(int32 Id, const FCivYearContext& C)
{
	FCivPerson& Me = Persons[Id];
	FCivPeople& P = Peoples[C.PeopleIndex];
	const int32 Age = Year - Me.BornYear;
	const double Mob = Mobility(C.Era);
	const double Bar = GenderBar(Me, C.Era);

	// Body: age and sickness.
	if (Age >= 40) { Me.Health -= Rng.Range(0.002, 0.012); }
	else { Me.Health = FMath::Min(1.0, Me.Health + 0.01); }
	if (Year >= Me.PlannedDeathYear || Me.Health <= 0.0)
	{
		const TCHAR* Cause = Me.bChildDeath ? TEXT("מחלת ילדות") : (Age >= 50 ? TEXT("זקנה") : TEXT("מחלה"));
		KillPerson(Me, Cause);
		return;
	}
	if (Age < 14) { return; }

	// The first real choice in life: what to do. Mostly it is what the parents did.
	if (Me.Occupation == ECivOccupation::None)
	{
		ECivOccupation Choice = ECivOccupation::Farmer;
		const ECivOccupation Parent = Persons.IsValidIndex(Me.Father) ? Persons[Me.Father].Occupation : ECivOccupation::Farmer;
		if (Me.Rank >= ECivRank::Knight) { Choice = ECivOccupation::Soldier; }
		else if (Parent == ECivOccupation::Merchant || Parent == ECivOccupation::Artisan) { Choice = Rng.Chance(0.7) ? Parent : ECivOccupation::Farmer; }
		else if (C.Era >= 1 && Rng.Chance(0.15)) { Choice = ECivOccupation::Artisan; }
		else if (C.Era >= 2 && Me.Cunning > 0.8 && Rng.Chance(0.25)) { Choice = ECivOccupation::Merchant; }
		else if (Me.Boldness > 0.75 && Rng.Chance(0.25 * Bar)) { Choice = ECivOccupation::Soldier; }
		Me.Occupation = Choice;
		FCivLifeEvent E; E.Year = Year; E.Kind = ECivLife::Work; E.Param = static_cast<int32>(Choice);
		Me.Log.Add(E);
	}

	// Family: most lives are made of this.
	if (Me.Spouse == INDEX_NONE && Age >= 16 && Age <= 40 && !Me.bHoly && Rng.Chance(0.09))
	{
		int32 Match = INDEX_NONE;
		double Best = 0.0;
		for (int32 Other : P.LivingPersons)
		{
			const FCivPerson& O = Persons[Other];
			const int32 OtherAge = Year - O.BornYear;
			if (O.bFemale == Me.bFemale || O.Spouse != INDEX_NONE || OtherAge < 16 || OtherAge > 40 || O.bHoly || O.Id == Id) { continue; }
			if (O.Father != INDEX_NONE && (O.Father == Me.Father || O.Mother == Me.Mother)) { continue; }
			const int32 RankGap = FMath::Abs(static_cast<int32>(O.Rank) - static_cast<int32>(Me.Rank));
			const double Score = Rng.Range(0.0, 1.0) - RankGap * 0.7 - FMath::Abs(OtherAge - Age) * 0.03 + Me.Charisma * 0.2;
			if (Score > Best) { Best = Score; Match = Other; }
		}
		if (Match != INDEX_NONE)
		{
			FCivPerson& O = Persons[Match];
			Me.Spouse = Match;
			O.Spouse = Id;
			const bool bUp = static_cast<int32>(O.Rank) > static_cast<int32>(Me.Rank) && O.Rank >= ECivRank::Knight;
			const bool bDown = static_cast<int32>(Me.Rank) > static_cast<int32>(O.Rank) && Me.Rank >= ECivRank::Knight;
			Log(Me, bUp ? ECivLife::MarriedUp : ECivLife::Married, Match);
			Log(O, bDown ? ECivLife::MarriedUp : ECivLife::Married, Id);
			if (bUp) { Me.Reputation = FMath::Min(1.0, Me.Reputation + 0.1); Me.Rank = FMath::Max(Me.Rank, ECivRank::Knight); }
			if (bDown) { O.Reputation = FMath::Min(1.0, O.Reputation + 0.1); O.Rank = FMath::Max(O.Rank, ECivRank::Knight); }
		}
	}
	// The small things that fill most years.
	if (Age >= 18 && Me.Rank == ECivRank::Commoner)
	{
		if (!Me.bMoved && P.Cities.Num() > 0 && Rng.Chance(0.006))
		{
			Me.bMoved = true;
			FCivLifeEvent Moved; Moved.Year = Year; Moved.Kind = ECivLife::MovedCity;
			Moved.OtherName = P.Cities[Rng.RangeInt(0, P.Cities.Num() - 1)].Name;
			Me.Log.Add(Moved);
		}
		if (P.ClimateFactor > 1.1 && Rng.Chance(0.05)) { Me.Wealth = FMath::Min(1.0, Me.Wealth + 0.1); Log(Me, ECivLife::GoodYear); }
		if (Me.Rival == INDEX_NONE && Rng.Chance(0.004 * (0.5 + Me.Cruelty + Me.Ambition)))
		{
			const int32 Other = P.LivingPersons[Rng.RangeInt(0, P.LivingPersons.Num() - 1)];
			if (Other != Id && Other != Me.Spouse && Year - Persons[Other].BornYear >= 18)
			{
				Me.Rival = Other;
				Log(Me, ECivLife::Feud, Other);
			}
		}
	}

	if (Me.bFemale && Me.Spouse != INDEX_NONE && Age <= 42 && Me.ChildCount < 7 && Persons[Me.Spouse].IsAlive() && Me.Log.Last().Kind != ECivLife::Married && Me.Log.Last().Kind != ECivLife::MarriedUp && Rng.Chance(0.14))
	{
		// Only some children enter the named circle; the rest stay in the statistics.
		const int32 Cap = Settings.NamedPersonsPerPeople;
		const bool bNamed = P.LivingPersons.Num() < Cap || (Me.Rank >= ECivRank::Lord && P.LivingPersons.Num() < Cap + Cap / 2);
		if (bNamed) { PendingBirths.Add(TPair<int32, int32>(Me.Spouse, Id)); }
		else { Me.ChildCount += 1; }
	}

	// What the world does to a person.
	if (C.bPlague && Rng.Chance(0.12))
	{
		Log(Me, ECivLife::PlagueSurvived);
		if (Me.Occupation == ECivOccupation::Farmer && Me.Piety > 0.7 && Rng.Chance(0.3))
		{
			Me.Occupation = ECivOccupation::Priest;
			Me.AwakeningCause = ECivNeed::Plague;
			Log(Me, ECivLife::Awakening, INDEX_NONE, static_cast<int32>(ECivNeed::Plague));
			++Stats.Preachers;
		}
		else if ((Me.Occupation == ECivOccupation::Farmer || Me.Occupation == ECivOccupation::Artisan) && Me.Compassion > 0.8 && Rng.Chance(0.4))
		{
			Me.Occupation = ECivOccupation::Healer;
			Log(Me, ECivLife::Healer);
			++Stats.Healers;
		}
	}
	if (C.bFamine && Me.Rank <= ECivRank::Commoner && Rng.Chance(0.08))
	{
		Log(Me, ECivLife::Hunger);
		Me.Wealth *= 0.5;
		Me.Health -= 0.08;
		if (Me.Occupation == ECivOccupation::Farmer && Me.Piety > 0.75 && Rng.Chance(0.1))
		{
			Me.Occupation = ECivOccupation::Priest;
			Me.AwakeningCause = ECivNeed::Famine;
			Log(Me, ECivLife::Awakening, INDEX_NONE, static_cast<int32>(ECivNeed::Famine));
			++Stats.Preachers;
		}
	}
	if (Age > 18 && Rng.Chance(0.012))
	{
		Me.Health -= 0.25;
		Log(Me, ECivLife::Illness);
		// A broken body turns some to faith, too.
		if (Me.Piety > 0.8 && Me.Occupation == ECivOccupation::Farmer && Rng.Chance(0.1))
		{
			Me.Occupation = ECivOccupation::Priest;
			Me.AwakeningCause = ECivNeed::None;
			Log(Me, ECivLife::Awakening, INDEX_NONE, static_cast<int32>(ECivNeed::None));
			++Stats.Preachers;
		}
	}

	// War pulls people out of their lives.
	if (C.bAtWar && Age >= 16 && Age <= 40 && (Me.Occupation == ECivOccupation::Farmer || Me.Occupation == ECivOccupation::Artisan) && Rng.Chance(0.03 * (0.5 + Me.Boldness) * Bar))
	{
		Me.Occupation = ECivOccupation::Soldier;
		Log(Me, ECivLife::Levied);
	}

	// Each path has its own chances and dangers.
	switch (Me.Occupation)
	{
	case ECivOccupation::Farmer:
	case ECivOccupation::Artisan:
		if (C.Era >= 2 && Me.Cunning > 0.65 && Me.Ambition > 0.5 && Rng.Chance(0.006))
		{
			Me.Occupation = ECivOccupation::Merchant;
			FCivLifeEvent E; E.Year = Year; E.Kind = ECivLife::Work; E.Param = static_cast<int32>(ECivOccupation::Merchant);
			Me.Log.Add(E);
		}
		else if (Me.Ambition > 0.7 && Me.Boldness > 0.6 && Age >= 25 && Age < 50 && (C.bFamine || C.bRulerIsTyrant) && Rng.Chance(0.012))
		{
			Me.Occupation = ECivOccupation::Rebel;
			Me.RebelStart = Year;
			Log(Me, ECivLife::Rebel);
			++Stats.Rebels;
		}
		else if (C.Era >= 1 && Me.Boldness > 0.7 && Me.Curiosity > 0.6 && Age < 40 && Rng.Chance(0.003))
		{
			Me.Occupation = ECivOccupation::Explorer;
			Log(Me, ECivLife::Explorer);
			++Stats.Explorers;
		}
		break;

	case ECivOccupation::Soldier:
		Me.Arms = FMath::Min(1.0, Me.Arms + Rng.Range(0.0, 0.03));
		if (C.bAtWar || Rng.Chance(0.04))   // wars, and the raids and border fights between them
		{
			if (Rng.Chance(0.05 * (1.2 - Me.Arms)))
			{
				KillPerson(Me, TEXT("פצעי מלחמה"));
				return;
			}
			if (Rng.Chance(0.06 * (Me.Arms + Me.Boldness)))
			{
				Me.Reputation = FMath::Min(1.0, Me.Reputation + Rng.Range(0.08, 0.2));
				Log(Me, ECivLife::Battle);
			}
			if (Me.Rank < ECivRank::Knight && Me.Arms > 0.35 && Me.Reputation > 0.25 && Rng.Chance(0.12 * Mob * Bar))
			{
				Me.Rank = ECivRank::Knight;
				if (Persons.IsValidIndex(P.Ruler) && Persons[P.Ruler].IsAlive()) { Me.Patron = P.Ruler; }
				Log(Me, ECivLife::Knighted, Me.Patron, static_cast<int32>(ECivRank::Knight));
				if (Me.OriginRank <= ECivRank::Commoner) { ++Stats.Knighted; }
			}
			else if (Me.Rank == ECivRank::Knight && Me.Reputation > 0.5 && Rng.Chance(0.05 * Mob * Bar))
			{
				Me.Rank = ECivRank::Lord;
				Me.Occupation = ECivOccupation::Lord;
				Log(Me, ECivLife::Ennobled, INDEX_NONE, static_cast<int32>(ECivRank::Lord));
				if (Me.OriginRank <= ECivRank::Commoner) { ++Stats.Ennobled; }
				Write(ECivEntryKind::People, 2, C.PeopleIndex, Fill(Me.bFemale ? TEXT("{0}, שהתחילה כחיילת פשוטה בעם {1}, קיבלה אדמה ותואר.") : TEXT("{0}, שהתחיל כחייל פשוט בעם {1}, קיבל אדמה ותואר."), { Me.Name, P.Name }));
			}
		}
		else if (Age > 45 && Rng.Chance(0.1))
		{
			Me.Occupation = ECivOccupation::Farmer;   // goes home
		}
		break;

	case ECivOccupation::Lord:
	{
		if (Me.Rank == ECivRank::Ruler)
		{
			if (Me.Cruelty > 0.75 && !Me.bTyrant && Age > 25 && Rng.Chance(0.08))
			{
				Me.bTyrant = true;
				Log(Me, ECivLife::Tyrant);
				++Stats.Tyrants;
				Write(ECivEntryKind::People, 2, C.PeopleIndex, Fill(Me.bFemale ? TEXT("{0}, השליטה של עם {1}, החלה לשלוט בפחד.") : TEXT("{0}, השליט של עם {1}, החל לשלוט בפחד."), { Me.Name, P.Name }));
			}
			if (Me.Compassion > 0.55 && Me.Patience > 0.4 && Rng.Chance(0.03))
			{
				P.LawBonus = FMath::Min(0.4, P.LawBonus + 0.05);
				Log(Me, ECivLife::Law);
			}
			break;
		}

		// A lord may reach for the throne, and it may cost everything.
		const bool bOpen = !Persons.IsValidIndex(P.Ruler) || !Persons[P.Ruler].IsAlive() ? false
			: (Persons[P.Ruler].bTyrant || Persons[P.Ruler].Reputation < 0.3 || Year - Persons[P.Ruler].BornYear > 65 || C.bAtWar);
		if (bOpen && Me.Ambition > 0.72 && Me.Cunning > 0.45 && Age > 25 && Age < 60 && Rng.Chance(0.02))
		{
			const int32 Fallen = P.Ruler;
			FCivPerson& R = Persons[Fallen];
			const double Attack = Me.Cunning + Me.Charisma + Me.Reputation + Me.Arms * 0.5;
			const double Defence = R.Cunning + R.Reputation + (R.bTyrant ? -0.2 : 0.3);
			const double Odds = FMath::Clamp(Attack / (Attack + Defence * 1.5) * Bar * 1.2, 0.05, 0.75);
			++Stats.CoupsTried;
			if (Rng.Chance(Odds))
			{
				++Stats.CoupsWon;
				Log(R, ECivLife::Deposed, Id);
				R.Rank = ECivRank::Commoner;
				R.Occupation = ECivOccupation::Farmer;
				R.Reputation *= 0.5;
				R.bTyrant = false;
				++Stats.Deposed;
				SetRuler(C.PeopleIndex, Id, ECivLife::CoupWon, Fallen);
			}
			else
			{
				Log(Me, ECivLife::CoupLost, Fallen);
				if (Rng.Chance(0.7))
				{
					KillPerson(Me, TEXT("הוצאה להורג"));
					return;
				}
				Me.Rank = ECivRank::Commoner;
				Me.Occupation = ECivOccupation::Farmer;
				Log(Me, ECivLife::Disgraced);
			}
		}
		break;
	}

	case ECivOccupation::Merchant:
		Me.Wealth = FMath::Min(1.0, Me.Wealth + Rng.Range(-0.01, 0.05) * (0.5 + Me.Cunning));
		if (Me.Wealth > 0.6 && !Me.bRich && Rng.Chance(0.1))
		{
			Me.bRich = true;
			Me.Reputation = FMath::Min(1.0, Me.Reputation + 0.15);
			Log(Me, ECivLife::Rich);
			++Stats.RichMerchants;
		}
		if ((C.bAtWar || C.bDisaster) && Me.Wealth > 0.2 && Rng.Chance(0.03))
		{
			Me.Wealth = 0.03;
			Me.bRich = false;
			Log(Me, ECivLife::Ruined);
			++Stats.Ruined;
		}
		break;

	case ECivOccupation::Priest:
		Me.Faith = FMath::Min(1.0, Me.Faith + Rng.Range(0.0, 0.05));
		Me.Reputation = FMath::Min(1.0, Me.Reputation + Rng.Range(-0.005, 0.03) * (0.5 + Me.Charisma));
		if (Me.Faith > 0.4 && Rng.Chance(0.02)) { Log(Me, ECivLife::Miracle); Me.Reputation = FMath::Min(1.0, Me.Reputation + 0.12); }
		if (!Me.bHoly && Me.Reputation > 0.6 && Me.Faith > 0.5 && Rng.Chance(0.15))
		{
			Me.bHoly = true;
			Log(Me, ECivLife::Holy);
			Write(ECivEntryKind::People, 3, C.PeopleIndex, Fill(Me.bFemale ? TEXT("בעם {1} קמה אישה קדושה: {0}. עולי רגל צעדו אליה ימים שלמים.") : TEXT("בעם {1} קם איש קדוש: {0}. עולי רגל צעדו אליו ימים שלמים."), { Me.Name, P.Name }));
		}
		if (Me.bHoly && P.Faith < 0.4 && Rng.Chance(0.04))
		{
			P.Faith = FMath::Min(1.0, P.Faith + 0.2);
			Log(Me, ECivLife::Faith, INDEX_NONE, C.PeopleIndex);
		}
		if (C.bRulerIsTyrant && Me.Reputation > 0.4 && Rng.Chance(0.05))
		{
			Log(Me, ECivLife::Persecuted);
			if (Rng.Chance(0.4))
			{
				Me.Reputation = FMath::Min(1.0, Me.Reputation + 0.25);
				Me.bHoly = Me.bHoly || Me.Reputation > 0.6;
				KillPerson(Me, TEXT("הוצאה להורג בידי השלטון"));
				return;
			}
		}
		break;

	case ECivOccupation::Healer:
		Me.Reputation = FMath::Min(1.0, Me.Reputation + Rng.Range(0.0, 0.015));
		if (C.bPlague && Rng.Chance(0.03))
		{
			KillPerson(Me, TEXT("מגפה שנדבקה בה בעת הטיפול"));
			return;
		}
		break;

	case ECivOccupation::Rebel:
	{
		if (Year - Me.RebelStart > 6)
		{
			Me.Occupation = ECivOccupation::Farmer;
			break;
		}
		if (Rng.Chance(0.12))
		{
			const bool bRulerWeak = Persons.IsValidIndex(P.Ruler) && Persons[P.Ruler].IsAlive() && (Persons[P.Ruler].bTyrant || Persons[P.Ruler].Reputation < 0.3);
			const double Odds = (bRulerWeak ? 0.4 : 0.12) * (0.5 + Me.Charisma) * Bar * (Me.Reputation > 0.1 ? 1.0 : 0.5);
			if (Rng.Chance(Odds))
			{
				const int32 Fallen = P.Ruler;
				if (Persons.IsValidIndex(Fallen) && Persons[Fallen].IsAlive())
				{
					Log(Persons[Fallen], ECivLife::Deposed, Id);
					Persons[Fallen].Rank = ECivRank::Commoner;
					Persons[Fallen].Occupation = ECivOccupation::Farmer;
					Persons[Fallen].bTyrant = false;
					++Stats.Deposed;
				}
				++Stats.RebellionsWon;
				SetRuler(C.PeopleIndex, Id, ECivLife::RebelWon, Fallen);
			}
			else if (Rng.Chance(0.6))
			{
				KillPerson(Me, TEXT("דיכוי המרד"));
				return;
			}
		}
		break;
	}

	case ECivOccupation::Explorer:
		if (Rng.Chance(0.05))
		{
			KillPerson(Me, TEXT("מסע שלא חזר ממנו"));
			return;
		}
		if (Rng.Chance(0.08))
		{
			Me.Reputation = FMath::Min(1.0, Me.Reputation + 0.2);
			Log(Me, ECivLife::Discovery);
			P.ExplorerRange = FMath::Min(1.0, P.ExplorerRange + 0.05);
			Recalculate(P);
			Me.Occupation = ECivOccupation::Farmer;
		}
		break;

	default:
		break;
	}

	// A title can be lost.
	if (Me.Rank == ECivRank::Knight && Me.Occupation != ECivOccupation::Soldier && Me.Reputation < 0.05 && Rng.Chance(0.01))
	{
		Me.Rank = ECivRank::Commoner;
		Log(Me, ECivLife::Disgraced);
	}
	Me.Reputation = FMath::Max(0.0, Me.Reputation - 0.002);
}

// ---------------------------------------------------------------------------
// Looking at one person
// ---------------------------------------------------------------------------

int32 FCivSimulation::PromoteFromCrowd(int32 PeopleIndex)
{
	if (!Peoples.IsValidIndex(PeopleIndex) || !Peoples[PeopleIndex].bAlive) { return INDEX_NONE; }

	// A separate random stream: looking at someone does not disturb the rest of the world's dice.
	FCivRandom Background(Settings.Seed ^ (static_cast<uint64>(Persons.Num()) << 20), 0x50524F4DULL);
	const int32 Id = CreatePerson(Background, PeopleIndex, INDEX_NONE, INDEX_NONE, Background.RangeInt(16, 55));
	FCivPerson& Me = Persons[Id];
	Me.bPromoted = true;
	const int32 Age = Year - Me.BornYear;

	// A plausible past: work at 14, a marriage for most, children for many.
	Me.Occupation = Background.Chance(0.75) ? ECivOccupation::Farmer : ECivOccupation::Artisan;
	FCivLifeEvent Work; Work.Year = Me.BornYear + 14; Work.Kind = ECivLife::Work; Work.Param = static_cast<int32>(Me.Occupation);
	Me.Log.Add(Work);
	if (Age > 22 && Background.Chance(0.7))
	{
		FCivLifeEvent Married; Married.Year = Me.BornYear + Background.RangeInt(18, FMath::Min(30, Age)); Married.Kind = ECivLife::Married;
		Married.OtherName = CivText::FirstName(Background, !Me.bFemale);
		Me.Log.Add(Married);
		Me.ChildCount = Background.RangeInt(0, 4);
	}
	FCivLifeEvent Now; Now.Year = Year; Now.Kind = ECivLife::FromCrowd; Now.Param = PeopleIndex;
	Me.Log.Add(Now);
	return Id;
}

bool FCivSimulation::GodBlessPerson(int32 Id)
{
	if (!Persons.IsValidIndex(Id) || !Persons[Id].IsAlive()) { return false; }
	FCivPerson& Me = Persons[Id];
	Me.Health = 1.0;
	Me.PlannedDeathYear += 15;
	Me.Faith = FMath::Min(1.0, Me.Faith + 0.4);
	Me.Reputation = FMath::Min(1.0, Me.Reputation + 0.2);
	Me.Wealth = FMath::Min(1.0, Me.Wealth + 0.3);
	Log(Me, ECivLife::Blessed);
	// A blessing can change a whole life: the pious may take it as a calling.
	if (Me.Occupation == ECivOccupation::Farmer && Me.Piety > 0.5)
	{
		Me.Occupation = ECivOccupation::Priest;
		Me.AwakeningCause = ECivNeed::Count;
		Log(Me, ECivLife::Awakening, INDEX_NONE, static_cast<int32>(ECivNeed::Count));
		++Stats.Preachers;
	}
	return true;
}

bool FCivSimulation::GodCursePerson(int32 Id)
{
	if (!Persons.IsValidIndex(Id) || !Persons[Id].IsAlive()) { return false; }
	FCivPerson& Me = Persons[Id];
	Me.Health *= 0.5;
	Me.Reputation *= 0.4;
	Me.Wealth *= 0.3;
	Log(Me, ECivLife::Cursed);
	if (Me.Rank >= ECivRank::Knight && Me.Rank < ECivRank::Ruler && Rng.Chance(0.5))
	{
		Me.Rank = ECivRank::Commoner;
		Me.Occupation = ECivOccupation::Farmer;
		Log(Me, ECivLife::Disgraced);
	}
	return true;
}

bool FCivSimulation::GodInspirePerson(int32 Id)
{
	if (!Persons.IsValidIndex(Id) || !Persons[Id].IsAlive()) { return false; }
	FCivPerson& Me = Persons[Id];
	Me.InspiredUntil = Year + 15;
	Me.Curiosity = FMath::Min(1.0, Me.Curiosity + 0.2);
	Log(Me, ECivLife::Inspired);
	if (!Me.bInventor && Year - Me.BornYear >= 14)
	{
		Me.bInventor = true;
		Me.Occupation = ECivOccupation::Inventor;
		Peoples[Me.People].LivingInventors.Add(Id);
		++Stats.InventorsBorn;
		Log(Me, ECivLife::BecameInventor);
	}
	return true;
}

FString FCivSimulation::BuildLifeStory(int32 Id) const
{
	if (!Persons.IsValidIndex(Id)) { return FString(); }
	const FCivPerson& Me = Persons[Id];
	if (Me.Log.Num() == 0) { return FString(); }   // a forgotten life, long past and unremarkable

	const FCivPeople& P = Peoples[Me.People];
	FString Story = Me.Name;
	Story += TEXT(", מבית ");
	Story += Me.House;
	Story += TEXT(", מעם ");
	Story += P.Name;
	if (Me.Rank >= ECivRank::Knight) { Story += TEXT(" ("); Story += RankWord(Me.Rank, P.Era, Me.bFemale); Story += TEXT(")"); }
	if (Me.bVenerated) { Story += Me.bFemale ? TEXT(", קדושה") : TEXT(", קדוש"); }
	Story += TEXT("\n");

	for (const FCivLifeEvent& E : Me.Log)
	{
		const FTemplate& T = TemplateOf(E.Kind);
		FString Line = Me.bFemale ? T.Female : T.Male;

		FString OtherName = E.OtherName;
		if (Persons.IsValidIndex(E.Other)) { OtherName = Persons[E.Other].Name; }
		if (E.Kind == ECivLife::Born) { OtherName = Me.House; }
		Line.ReplaceInline(TEXT("{o}"), *OtherName);

		const int32 PeopleForLine = (E.Kind == ECivLife::Born || E.Kind == ECivLife::FromCrowd || E.Kind == ECivLife::Faith) ? E.Param : Me.People;
		if (Peoples.IsValidIndex(PeopleForLine)) { Line.ReplaceInline(TEXT("{p}"), *Peoples[PeopleForLine].Name); }

		if (E.Kind == ECivLife::Work) { Line.ReplaceInline(TEXT("{w}"), OccupationWord(static_cast<ECivOccupation>(E.Param), Me.bFemale)); }
		if (E.Kind == ECivLife::Invented && Tree.IsValidIndex(E.Param)) { Line.ReplaceInline(TEXT("{i}"), *Tree[E.Param].NameDefinite); }
		if (Line.Contains(TEXT("{t}")))
		{
			const ECivRank Rank = (E.Kind == ECivLife::Knighted) ? ECivRank::Knight : (E.Kind == ECivLife::Ennobled ? ECivRank::Lord : ECivRank::Ruler);
			Line.ReplaceInline(TEXT("{t}"), *RankWord(Rank, P.Era, Me.bFemale));
		}
		if (E.Kind == ECivLife::Awakening)
		{
			const TCHAR* Cause = TEXT("המחלה הקשה שעברה עליו");
			if (Me.bFemale) { Cause = TEXT("המחלה הקשה שעברה עליה"); }
			if (E.Param == static_cast<int32>(ECivNeed::Plague)) { Cause = TEXT("המגפה"); }
			else if (E.Param == static_cast<int32>(ECivNeed::Famine)) { Cause = TEXT("שנות הרעב"); }
			else if (E.Param == static_cast<int32>(ECivNeed::Count)) { Cause = TEXT("חזון שאין לו הסבר"); }
			Line.ReplaceInline(TEXT("{c}"), Cause);
		}
		if (E.Kind == ECivLife::Knighted && OtherName.IsEmpty()) { Line.ReplaceInline(TEXT("{o}"), Me.bFemale ? TEXT("המפקדים") : TEXT("המפקדים")); }
		if (E.Kind == ECivLife::Died)
		{
			// Some deaths read better as their own sentence than as "died of".
			if (Me.DeathCause == TEXT("הוצאה להורג")) { Line = Me.bFemale ? TEXT("הוצאה להורג.") : TEXT("הוצא להורג."); }
			else if (Me.DeathCause == TEXT("הוצאה להורג בידי השלטון")) { Line = Me.bFemale ? TEXT("הוצאה להורג בידי השלטון.") : TEXT("הוצא להורג בידי השלטון."); }
			else if (Me.DeathCause == TEXT("דיכוי המרד")) { Line = Me.bFemale ? TEXT("נהרגה כשהמרד דוכא.") : TEXT("נהרג כשהמרד דוכא."); }
			else if (Me.DeathCause == TEXT("מסע שלא חזר ממנו")) { Line = Me.bFemale ? TEXT("יצאה למסע ולא חזרה ממנו.") : TEXT("יצא למסע ולא חזר ממנו."); }
			else if (Me.DeathCause == TEXT("מגפה שנדבקה בה בעת הטיפול")) { Line = Me.bFemale ? TEXT("נדבקה במגפה בעת שטיפלה בחולים, ומתה.") : TEXT("נדבק במגפה בעת שטיפל בחולים, ומת."); }
			else if (Me.DeathCause == TEXT("ניסוי שהשתבש")) { Line = Me.bFemale ? TEXT("נהרגה בניסוי שהשתבש.") : TEXT("נהרג בניסוי שהשתבש."); }
			else { Line.ReplaceInline(TEXT("{c}"), *Me.DeathCause); }
		}

		const int32 LineAge = E.Year - Me.BornYear;
		Story += LineAge > 0 ? FString::Printf(TEXT("  בגיל %d: "), LineAge) : FString(TEXT("  "));
		Story += Line;
		Story += TEXT("\n");
	}
	return Story;
}

void FCivSimulation::ForgetOldLives()
{
	// Keep memory bounded: long-dead ordinary lives fade, as they do in reality.
	const int32 Cutoff = Year - 300;
	for (int32 Index = ForgetCursor; Index < Persons.Num(); ++Index)
	{
		FCivPerson& Me = Persons[Index];
		if (Me.IsAlive() || Me.DeathYear > Cutoff) { break; }
		ForgetCursor = Index + 1;
		const bool bRemembered = Me.bVenerated || Me.bHoly || Me.bInventor || Me.bPromoted || Me.Rank >= ECivRank::Knight || Me.Reputation > 0.3;
		if (!bRemembered)
		{
			Me.Log.Empty();
			Me.FirstName.Empty();
			Me.House.Empty();
			Me.DeathCause.Empty();
		}
	}
}
