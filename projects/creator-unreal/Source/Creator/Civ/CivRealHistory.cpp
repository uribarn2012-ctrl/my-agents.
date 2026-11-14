#include "CivRealHistory.h"
#include "CivSimulation.h"

namespace CivRealHistory
{
	const TArray<FRegion>& Regions()
	{
		static const TArray<FRegion> Data =
		{
			{ TEXT("mesopotamia"), TEXT("ארם נהריים"), 32.0, 45.0 },
			{ TEXT("egypt"), TEXT("מצרים"), 27.0, 31.0 },
			{ TEXT("indus"), TEXT("עמק האינדוס"), 28.0, 69.0 },
			{ TEXT("china"), TEXT("מישור הנהר הצהוב"), 35.0, 113.0 },
			{ TEXT("aegean"), TEXT("הים האגאי"), 37.5, 24.0 },
			{ TEXT("levant"), TEXT("כנען וסוריה"), 33.0, 36.0 },
			{ TEXT("italy"), TEXT("איטליה"), 42.0, 12.5 },
			{ TEXT("north_africa"), TEXT("צפון אפריקה"), 36.8, 10.3 },
			{ TEXT("ganges"), TEXT("עמק הגנגס"), 25.6, 85.1 },
			{ TEXT("mexico"), TEXT("עמק מקסיקו"), 19.7, -98.8 },
		};
		return Data;
	}

	const TArray<FCity>& Cities()
	{
		static const TArray<FCity> Data =
		{
			{ TEXT("אורוך"), TEXT("mesopotamia"), 31.32, 45.64, -3200, MAX_int32, TEXT("Uruk IV archaic tablets and Eanna precinct, late 4th millennium BCE") },
			{ TEXT("ממפיס"), TEXT("egypt"), 29.84, 31.25, -3000, 650, TEXT("Early Dynastic capital of Egypt; Saqqara elite tombs from the 1st Dynasty. Abandoned after Fustat was founded, c. 7th century CE") },
			{ TEXT("מארי"), TEXT("mesopotamia"), 34.55, 40.89, -2900, -1759, TEXT("French excavations; founded c. 2900 BCE; destroyed by Hammurabi (middle chronology, approximate)") },
			{ TEXT("אור"), TEXT("mesopotamia"), 30.96, 46.10, -2600, -500, TEXT("Royal Cemetery of Ur (Woolley); largely abandoned c. 500 BCE (approximate)") },
			{ TEXT("הראפה"), TEXT("indus"), 30.63, 72.86, -2500, -1300, TEXT("Mature Harappan phase c. 2600-1900 BCE; city decline, end date approximate") },
			{ TEXT("מוהנג'ו דארו"), TEXT("indus"), 27.33, 68.14, -2500, -1800, TEXT("Mature Harappan city; largely abandoned by c. 1900-1800 BCE (approximate)") },
			{ TEXT("תבאי"), TEXT("egypt"), 25.72, 32.61, -2000, -30, TEXT("Royal centre of the 11th Dynasty, c. 2050 BCE onward. Only scattered villages by the Roman conquest (Strabo)") },
			{ TEXT("קנוסוס"), TEXT("aegean"), 35.30, 25.16, -1900, 700, TEXT("First palace of Knossos, Middle Minoan, c. 1900 BCE. Faded away in late antiquity, c. 7th century CE") },
			{ TEXT("בבל"), TEXT("mesopotamia"), 32.54, 44.42, -1800, 100, TEXT("Capital of Hammurabi, 18th century BCE. Largely deserted by the early centuries CE") },
			{ TEXT("ירושלים"), TEXT("levant"), 31.78, 35.22, -1350, MAX_int32, TEXT("Named as a city-state in the Amarna letters, 14th century BCE") },
			{ TEXT("אניאנג"), TEXT("china"), 36.12, 114.31, -1250, -1046, TEXT("Yinxu, late Shang capital with oracle bones; fell with the Shang, c. 1046 BCE") },
			{ TEXT("קרתגו"), TEXT("north_africa"), 36.85, 10.32, -800, -146, TEXT("Phoenician foundation; archaeology from the late 9th century BCE. Destroyed by Rome in 146 BCE (the later Roman city is not modelled)") },
			{ TEXT("אתונה"), TEXT("aegean"), 37.98, 23.73, -800, MAX_int32, TEXT("Polis by the 8th century BCE; earlier Mycenaean citadel not counted as a city here") },
			{ TEXT("לואויאנג"), TEXT("china"), 34.62, 112.45, -770, MAX_int32, TEXT("Capital of the Eastern Zhou from 770 BCE") },
			{ TEXT("רומא"), TEXT("italy"), 41.89, 12.49, -600, MAX_int32, TEXT("Forum paved and urban by c. 600 BCE; the traditional 753 BCE date is not used") },
			{ TEXT("אלכסנדריה"), TEXT("egypt"), 31.20, 29.92, -331, MAX_int32, TEXT("Founded by Alexander in 331 BCE, ancient historians") },
			{ TEXT("פטליפוטרה"), TEXT("ganges"), 25.61, 85.14, -300, MAX_int32, TEXT("Mauryan capital described by Megasthenes, c. 300 BCE") },
			{ TEXT("אנטיוכיה"), TEXT("levant"), 36.20, 36.16, -300, MAX_int32, TEXT("Founded by Seleucus I in 300 BCE") },
			{ TEXT("צ'אנגאן"), TEXT("china"), 34.27, 108.90, -202, MAX_int32, TEXT("Capital of the Western Han from 202 BCE") },
			{ TEXT("טאוטיהואקאן"), TEXT("mexico"), 19.69, -98.84, 100, 650, TEXT("Pyramid of the Sun and city grid by c. 100-200 CE. Centre burned c. 550 CE, largely abandoned by c. 650") },
		};
		return Data;
	}

	const TArray<FDisaster>& Disasters()
	{
		static const TArray<FDisaster> Data =
		{
			{ TEXT("המגפה הגדולה של אתונה פגעה בעיר בזמן המלחמה."), -430, ECivEvent::Plague, 0.7, 37.98, 23.73, 0.15, TEXT("Thucydides, History, Book 2") },
			{ TEXT("הר וזוב התפרץ וקבר את פומפיי והרקולנאום."), 79, ECivEvent::Volcano, 0.6, 40.82, 14.43, 0.15, TEXT("Pliny the Younger, letters to Tacitus; excavations") },
			{ TEXT("המגפה האנטונינית התפשטה בכל רחבי האימפריה הרומית."), 165, ECivEvent::Plague, 0.7, 41.89, 12.49, 0.6, TEXT("Galen; Roman sources") },
			{ TEXT("רעידת אדמה הרסה את אנטיוכיה."), 526, ECivEvent::Earthquake, 0.8, 36.20, 36.16, 0.12, TEXT("John Malalas; Procopius") },
			{ TEXT("מגפת יוסטיניאנוס פרצה ברחבי הים התיכון."), 541, ECivEvent::Plague, 0.9, 31.20, 29.92, 0.9, TEXT("Procopius; ancient DNA of Yersinia pestis") },
			{ TEXT("המוות השחור סחף את אירופה והמזרח התיכון."), 1347, ECivEvent::Plague, 1.0, 41.0, 29.0, 1.0, TEXT("Contemporary chronicles; ancient DNA of Yersinia pestis") },
			{ TEXT("רעידת האדמה של שאאנשי, מהקטלניות בתולדות העולם, הרסה ערים רבות."), 1556, ECivEvent::Earthquake, 1.0, 34.5, 109.7, 0.12, TEXT("Ming dynasty records") },
			{ TEXT("רעידת אדמה וגל ענק הרסו את ליסבון."), 1755, ECivEvent::Earthquake, 0.8, 38.72, -9.14, 0.15, TEXT("Contemporary records") },
			{ TEXT("התפרצות לאקי באיסלנד הרעילה את האוויר ופגעה ביבולים."), 1783, ECivEvent::Volcano, 0.7, 64.07, -18.23, 0.5, TEXT("Icelandic and European records") },
			{ TEXT("הר טמבורה התפרץ, והשנה שאחריו נקראה השנה בלי קיץ."), 1815, ECivEvent::Volcano, 1.0, -8.25, 118.0, 1.0, TEXT("Raffles and colonial records; 1816 weather records") },
			{ TEXT("קרקטואה התפרץ וגלי ים ענקיים שטפו את החופים."), 1883, ECivEvent::Volcano, 0.8, -6.10, 105.42, 0.5, TEXT("Royal Society report, 1888") },
			{ TEXT("הנהר הצהוב עלה על גדותיו בשיטפון ענק."), 1887, ECivEvent::Flood, 0.9, 34.8, 113.7, 0.2, TEXT("Contemporary records") },
			{ TEXT("מגפת השפעת הגדולה הקיפה את העולם."), 1918, ECivEvent::Plague, 0.9, 20.0, 0.0, 3.2, TEXT("Public health records; worldwide, so no single origin point is used") },
			{ TEXT("רעידת האדמה הגדולה של קאנטו הרסה את טוקיו ויוקוהמה."), 1923, ECivEvent::Earthquake, 0.8, 35.3, 139.5, 0.12, TEXT("Japanese seismological records") },
			{ TEXT("צונאמי בים ההודי שטף חופים בכמה ארצות."), 2004, ECivEvent::Flood, 0.9, 3.3, 95.9, 0.5, TEXT("USGS and UN records") },
		};
		return Data;
	}

	const TArray<FLeftOut>& LeftOut()
	{
		static const TArray<FLeftOut> Data =
		{
			{ TEXT("יריחו"), TEXT("יישוב עתיק מאוד עם חומה, אך אין הסכמה שהיה עיר במובן של אורוך או ממפיס.") },
			{ TEXT("צ'טל הויוק"), TEXT("יישוב גדול מתקופת האבן החדשה, אך רוב החוקרים אינם רואים בו עיר.") },
			{ TEXT("ייסוד רומא בשנת 753 לפנה\"ס"), TEXT("תאריך מסורתי ואגדי; במקומו נעשה שימוש בתאריך הארכאולוגי, בערך 600 לפנה\"ס.") },
			{ TEXT("טרויה ומלחמת טרויה"), TEXT("התאריך ומה שקרה בפועל שנויים במחלוקת.") },
			{ TEXT("התפרצות תרה (סנטוריני)"), TEXT("ההתפרצות ודאית, אבל התאריך שנוי במחלוקת: בערך 1600 לפנה\"ס לפי פחמן 14, מאוחר יותר לפי ממצאים מצריים.") },
			{ TEXT("אכד, בירת סרגון"), TEXT("קיומה ודאי, אבל מקומה עדיין לא נמצא.") },
			{ TEXT("בירת שושלת שיה בסין"), TEXT("לא ברור אם האתר ארליטואו הוא בירת השושלת, ויש הטוענים שהשושלת אגדית.") },
			{ TEXT("המבול הגדול"), TEXT("סיפור מסורתי, אין לו תאריך או ראיה היסטורית.") },
			{ TEXT("מקום פריצת שפעת 1918"), TEXT("לא ידוע בוודאות אם התחילה בארצות הברית, בצרפת, בבריטניה או בסין, ולכן המגפה מופיעה כמגפה עולמית בלי נקודת מוצא.") },
			{ TEXT("תאריכים מוקדמים במסופוטמיה ובסין"), TEXT("שנים כמו נפילת מארי או סוף שושלת שאנג תלויות בשיטת התיארוך; המשחק משתמש בכרונולוגיה התיכונה ובשנת 1046 לפנה\"ס.") },
			{ TEXT("מספרי ההרוגים של מגפות עתיקות"), TEXT("ההערכות רחוקות מאוד זו מזו, ולכן המשחק משתמש רק בעוצמה יחסית ולא במספרים.") },
		};
		return Data;
	}

	int32 EarliestCityYear()
	{
		int32 Earliest = MAX_int32;
		for (const FCity& City : Cities()) { Earliest = FMath::Min(Earliest, City.FoundedYear); }
		return Earliest;
	}

	int32 LatestCityYear()
	{
		int32 Latest = MIN_int32;
		for (const FCity& City : Cities()) { Latest = FMath::Max(Latest, City.FoundedYear); }
		return Latest;
	}
}
