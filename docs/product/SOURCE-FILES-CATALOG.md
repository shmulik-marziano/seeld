# קטלוג קבצי מקור אמיתיים: מסלקה פנסיונית והר הביטוח

נוצר מסקר קריאה בלבד של מחשב הבעלים (2026-11-17). המסמך כולל מבנה וסטטיסטיקות מצרפיות בלבד: שמות תגיות, כותרות עמודות, קבוצות ערכים מקודדים, ספירות, תבניות שמות קבצים ממוסכות. אין בו אף ערך אישי (שמות, מזהים, טלפונים, מספרי פוליסה, סכומים). מילונים מכונתיים: `src/reports/reference/maslaka-dictionary.json`, `src/reports/reference/harbituach-dictionary.json`. סקריפטי הסקר (ניתנים להרצה חוזרת): `C:/tmp/survey`.

## 1. מה נמצא ובכמה

| סוג | כמות | טווח גודל (בתים) | הערה |
|---|---|---|---|
| XML מסלקה (שורש `Mimshak`) | 2306 | 22,529 - 227,294 (חציון 59,695) | מפוזרים ב-376 תיקיות; עד 20 קבצים בתיקייה; 10 שורשי איחסון (2 בכונן C, 8 בכונן E, בהם גיבויים ועותקים) |
| PDF נלווים של המסלקה (`PDF_TAX_COMPENSATION`, `PDF_TAX_DEPOSITS`, `PDF_SPOUSES_SHARE_SAVINGS`, `PDF_MIN_ACCUMULATE_AMOUNT`) | 4 x 508 | עד 126,328 | ארבעה קבצים לכל הרצה. לא קיימים בפורמט xls. עוד 4 x 64 קובצי txt זעירים (176-2,792 בתים) ו"._" בגודל 4,096 (שאריות macOS) |
| הר הביטוח xlsx שניתן לקריאה | 1876 | 13,790 - 16,723 | 1,662 בשם `HbResults-YYYY-MM-DD_hh-mm-ss-AM|PM.xlsx` (+ וריאנטים `(n)` ו-`_n`), 214 עותקים בשם עברי. גיליון יחיד `תיק ביטוחי`. 995 תיקיות |
| הר הביטוח xlsx שאינו קריא | 79 | 4,096 בדיוק | קבצי AppleDouble (`._...`, magic `00 05 16 07`), לא zip. יש לדלג עליהם לפי קידומת `._` או חתימה |
| הר הביטוח PDF / txt / ts | 78 / 8+52 / 1 | PDF 27,628-409,168 | PDF בתיקיות לקוח (71 תיקיות). txt הם קבצי הערות קטנים |
| דוח מצב טרום טיפול | 18 PDF + 1 txt | 421,777 (PDF, כנראה עותקים זהים) | 19 תיקיות |
| Surense (קבצי עבודה) | 19 xlsx, 4 sql, 2 md, 1 ts, 2 zip | עד 373,320 | אינם ייצוא Surense מקורי של לקוחות; אלה קבצי פיתוח (סכמה/יבוא) ולכן לא נסקרו |

רמות תיקייה: קבצי הר הביטוח ומסלקה יושבים בדרך כלל בתיקיית לקוח ייעודית (client-001 ... client-NNN); תיקיית לקוח אחת מחזיקה לרוב הרצה אחת עד כמה הרצות (ראו סעיף 8). מסלקה: 376 תיקיות, הר הביטוח: 995 תיקיות (עד 43 קבצים בתיקייה, אחת הגדולה מכילה הורדות חוזרות), PDF הר הביטוח: 71 תיקיות.

## 2. קובצי XML של המסלקה

### 2.1 תבניות שמות קבצים (ממוסכות)

| תבנית | דוגמה ממוסכת | הערות |
|---|---|---|
| `<15 ספרות>CONSLT<FAM><21 ספרות>.xml` | `999999999999999CONSLTKGM999999999999999999999.xml` | FAM = אחד מ: KGM, PNN, INP, INM, ING (בפועל גם INK). כ-529 קבצים |
| `<ת.ז. 8-9 ספרות>_<9 ספרות>_<FAM>_<12 ספרות>_<n>.xml` | `999999999_999999999_KGM_999999999999_9.xml` | התבנית הנפוצה (כ-1,770). הספרה האחרונה: מספר סידורי של הבקשה. FAM = KGM, PNN, INP, INM, ING, PNO |
| עותקים עם קידומת/סיומת עברית | `<RLM RLM>...<FAM>... - H.xml` | קידומת סימוני כיוון (U+200F) ו/או סיומת " - עותק" על חלק מהקבצים. יש להתעלם בעת זיהוי משפחה |

חשוב: הביטוי הרגולרי `CONSLT(INK|INP|KGM|PNN)` אינו מזהה את רוב הקבצים (תבנית ה-underscore) ואת המשפחות ING, INM, PNO. זיהוי משפחה אמין נעשה לפי `_([A-Z]{3})_` או `CONSLT([A-Z]{3})`, ועדיף לפי התוכן: `SUG-MUTZAR` בתוך כל `Mutzar`.

### 2.2 משפחות (קוד שלוש אותיות) ותוכנן בפועל

הקוד בשם הקובץ אינו קובע מוצר יחיד. פיצוח לפי `SUG-MUTZAR` שבתוך הקובץ (מספר `Mutzar` לפי משפחה):

| משפחה | קבצים | SUG-MUTZAR (מספר מוצרים) | גודל קובץ |
|---|---|---|---|
| KGM | 713 | 3 (120), 4 (553), 9 (68), 10 (28) | 25302 - 46321 (חציון 209597) |
| PNN | 562 | 2 (571) | 30883 - 92744 (חציון 214468) |
| ING | 484 | 1 (134), 5 (3), 6 (140), 7 (231), 8 (6) | 30566 - 63469 (חציון 227294) |
| INP | 305 | 6 (304), 7 (1) | 22529 - 48358 (חציון 97648) |
| INM | 231 | 7 (231) | 25727 - 58111 (חציון 122785) |
| PNO | 6 | 2 (6) | 36534 - 36534 (חציון 37067) |
| OTHER | 3 | 2 (2), 6 (1) | 40578 - 76662 (חציון 92256) |
| INK | 2 | 8 (2) | 31905 - 31905 (חציון 31905) |

מסקנה: KGM = גמל / השתלמות / גמל להשקעה (3,4,9,10); PNN (ו-PNO) = קרנות פנסיה (2); INP/ING/INM = ביטוח (חיים, מנהלים, ריסק, משכנתא: 1,5,6,7,8). INK (2 קבצים) מכיל SUG-MUTZAR=8. אין חפיפת פוליסות בין משפחות באותה תיקייה (נבדק לפי גיבוב: חפיפה בודדת אחת בלבד), כלומר INK/INP/KGM/PNN הם חלוקה של התיק ולא כפילות.

### 2.3 גרסאות ושדות כותרת

לכל קובץ `Mimshak/KoteretKovetz` עם: `SUG-MIMSHAK`, `MISPAR-GIRSAT-XML`, `KIVUN-MIMSHAK-XML`, `KOD-SVIVAT-AVODA`, `TAARICH-BITZUA` (14 ספרות, `yyyymmddhhmmss`), `MISPAR-HAKOVETZ`, `MEZAHE-HAAVARA`, `KOD-MEZAHE-METAFEL`, `SHEM-METAFEL`, `KOD-SHOLEACH`, `SHEM-SHOLEACH`. תגיות הזיהוי האישיות הללו אינן נרשמות כאן.

| שדה | ערכים (ספירה) | פירוש |
|---|---|---|
| `MISPAR-GIRSAT-XML` | 008=1730, 009=576 | גרסת סכמה: 008 (1,730) ו-009 (576). ההבדלים במבנה בין 008 ל-009 מפורטים ב-`maslaka-dictionary.json` (נוכחות תגית לפי גרסה אינה נשמרת ב-JSON הסופי; ראו `C:/tmp/survey/out/maslaka_agg.json`, המפתח `girsa_paths`) |
| `SUG-MIMSHAK` | 2=1783, 1=523 | סוג מסמך: 1 (523) ו-2 (1,783). הערך 2 קיים בשתי הגרסאות; הערך 1 כמעט רק בגרסה 008 (3 קבצים בלבד ב-009, KGM/PNN) |
| `KIVUN-MIMSHAK-XML` | 4=1645, 3=558, 1=100, 2=2, 5=1 | כיוון מסמך (3 ו-4 נפוצים) |
| `KOD-SVIVAT-AVODA` | 2=2306 | תמיד 2 (ייצור) |

ערבוב גרסאות: SUG-MIMSHAK x MISPAR-GIRSAT לפי משפחה:

`ING/1/008: 82; ING/2/008: 333; ING/2/009: 69; INK/2/009: 2; INM/1/008: 99; INM/2/008: 45; INM/2/009: 87; INP/1/008: 71; INP/2/008: 148; INP/2/009: 86; KGM/1/008: 158; KGM/1/009: 2; KGM/2/008: 399; KGM/2/009: 154; OTHER/2/009: 3; PNN/1/008: 110; PNN/1/009: 1; PNN/2/008: 285; PNN/2/009: 166; PNO/2/009: 6`

### 2.4 מבנה המסמך (כל המשפחות חולקות סכמה אחת)

```
Mimshak
  KoteretKovetz           ; כותרת (סעיף 2.3)
  ReshumatSgira           ; KAMUT-METAFELIM / KAMUT-MUTZARIM / KAMUT-POLISOT / KAMUT-YATZRANIM / KAMUT-YESHUYOT-MAASIK / KAMUT-YESHUYOT-MEFITZ / MISPAR-YESHUYUT-LAKOACH-BAKOVETZ
  YeshutYatzran           ; KOD-MEZAHE-YATZRAN, SHEM-YATZRAN, MEZAHE-LAKOACH-MISLAKA, IshKesherYeshutYatzran*, YeshutMetafel*
    Mutzarim/Mutzar*      ; חוזרת: עד 6 מוצרים בקובץ
      NetuneiMutzar       ; SUG-MUTZAR, STATUS-RESHOMA, KOD-MEZAHE-YATZRAN, KOD-MEZAHE-METAFEL, MISPAR-MISLAKA, MISPAR-SHORA, MISPAR-SHURA-MEKORI, SHEM-KOVETZ-MEKORI, RESERVA-MISLAKA, STATUS-MAANE-TIK-MISLAKA, TOTAL-MUTZARIM-PER-MONTH, TOTAL-ZEHUT-PER-MONTH, YeshutLakoach, YeshutMaasik
      HeshbonotOPolisot/HeshbonOPolisa*   ; חוזרת: פוליסה/חשבון (הליבה, סעיף 3)
      YeshutNimaansofi    ; KOD-NIMAAN, SUG-MEZAHE-NIMAAN, מזהי נהנה
```

`ReshumatSgira` (ספירות סגירה): ההתאמה בפועל חלשה: `KAMUT-MUTZARIM` תואם ספירה בפועל ב-391 קבצים בלבד וסותר ב-1915; `KAMUT-POLISOT` תואם ב-538 וסותר ב-1768. לכן פרסר אסור שיסמוך על ספירות אלו אלא יספור בעצמו.

התפלגות מוצרים (`Mutzar`) לקובץ: OTHER: 1=3; KGM: 1=684, 2=15, 3=8, 4=2, 5=1, 6=3; PNN: 1=554, 2=7, 3=1; INP: 1=305; ING: 1=455, 2=28, 3=1; INM: 1=231; PNO: 1=6; INK: 1=2. התפלגות חשבונות/פוליסות (`HeshbonOPolisa`) למוצר: OTHER: 1=2, 2=1; KGM: 1=672, 2=58, 3=26, 4=8, 5=5; PNN: 1=431, 2=140; INP: 1=275, 2=23, 3=7; ING: 1=500, 2=4, 5=10; INM: 1=231; PNO: 1=6; INK: 1=2. (מפתח=כמות, ערך=מספר מופעים.) מקרה "מספר חשבונות מרובים" (עד 5 חשבונות למוצר) קיים בכל המשפחות, והוא נפוץ ב-PNN (140 מוצרים עם שני חשבונות) ובגמל/השתלמות (עד 5).

לקוחות שונים בקובץ: 1=2298, 2=8 (מפתח=מספר מזהי לקוח שונים בקובץ). 8 קבצים מכילים שני לקוחות (קבצי משפחה/בני זוג) ו-`YeshutLakoach` חוזר בכל `Mutzar`, לא ברמת הקובץ.

### 2.5 יצרנים (KOD-MEZAHE-YATZRAN / SHEM-YATZRAN)

שם היצרן הוא ציבורי. מזהה היצרן הוא מספר חברה (ח.פ.); אותו מזהה מופיע בשמות משפטיים שונים (למשל "בע״מ" לעומת "בע״מ - קרנות" או שם קרן נפרד), ולכן המפתח הנכון הוא המזהה ולא השם. סה"כ 30 צירופי מזהה+שם:

| מזהה יצרן | שם | קבצים |
|---|---|---|
| 520042540 | מנורה מבטחים חברה לביטוח בעמ | 315 |
| 520023185 | הפניקס חברה לביטוח בע"מ | 269 |
| 520004078 | הראל חברה לביטוח בע"מ | 258 |
| 512244146 | כלל פנסיה וגמל בע"מ | 219 |
| 513026484 | הפניקס פנסיה וגמל בע"מ | 217 |
| 512267592 | הראל פנסיה וגמל בע"מ | 209 |
| 512245812 | מנורה מבטחים פנסיה וגמל בע"מ | 111 |
| 514956465 | מור גמל ופנסיה | 103 |
| 511880460 | אנליסט קופות גמל בע"מ | 103 |
| 520024647 | כלל חברה לביטוח בע"מ | 95 |
| 513173393 | אלטשולר שחם גמל ופנסיה בע"מ | 81 |
| 512245812 | מנורה מבטחים פנסיה וגמל בעמ | 73 |
| 512237744 | מגדל מקפת קרנות פנסיה וקופות גמל בע"מ | 62 |
| 513910703 | איי. די. איי. חברה לביטוח בעמ | 59 |
| 513611509 | ילין לפידות ניהול קופות גמל בע"מ | 51 |
| 512065202 | מיטב גמל ופנסיה בע"מ | 30 |
| 520004896 | מגדל חברה לבטוח בע"מ | 15 |
| 520031824 | החברה המנהלת רום קרן ההשתלמות לעובדי הרשויות המקומ | 6 |
| 520019688 | מבטחים מוסד לביטוח סוציאלי של העובדים | 5 |
| 520030677 | איילון חברה לביטוח | 5 |
| 520042177 | הכשרה חברה לביטוח | 4 |
| 512711409 | גל - ניהול קופות גמל לעובדי הוראה בע"מ | 4 |
| 515761625 | ליברה חברה לביטוח | 2 |
| 513173393 | אלטשולר שחם פנסיה מקיפה | 2 |
| 520027251 | קרן השתלמות למורים וגננות - חברה מנהלת בע"מ | 2 |
| 512065202 | מיטב דש גמל ופנסיה בע"מ | 2 |
| 512304882 | איי.אי.ג'י ישראל בע"מ | 1 |
| 511033060 | קרן החיסכון לצבא הקבע | 1 |
| 570007476 | קרן למטרה אחרת חקלאים א.ש בעמ בניהול מיוחד | 1 |
| 570007476 | קרן ביטוח ופנסיה לפועלים חקלאים ובלתי מקצועיים | 1 |

## 3. הפוליסה/חשבון (`HeshbonOPolisa`): מילון תגיות

הערה: בכל הקבצים השלד של התגיות מופיע תמיד, גם כשאין נתון: הערך ריק (`<TAG/>` או `<TAG></TAG>`). לכן "קיים" פירושו כמעט תמיד "מסוג המוצר הזה" ויש לבדוק ערך לא ריק. אחוזי נוכחות מפורטים לכל תגית בקובץ ה-JSON (`tags[path].pct_files_by_family`, `empty_value_pct`).

### 3.1 קבוצות

פורמט: `TAG(אחוז קבצים שבהם קיימת)`, כוכבית = תגית שחוזרת (repeating) כילד של אותו הורה לפחות בקובץ אחד. נתיב ההורה מקוצר (`H/...` = `HeshbonOPolisa/`).

**H/(ישיר)**: ASMACHTA-MEKORIT(100), AVTACHT-TESOA(98), AZMADA-LEALVAHA(100), KAYAM-KISUY-HIZONI(100), KIDOD-ACHID(100), KISUY-ISHY-KVOZATI(100), KOLEL-ZAKAUT-AGACH(100), MADAD-BASIS(100), MEVUTACH(100), MISPAR-GIMLAOT(100), MISPAR-POLISA-O-HESHBON(100), MPR-MEFITZ-BE-YATZRAN(100), NetuneiSheerim(26), PENSIA-VATIKA-O-HADASHA(100), SHEM-TOCHNIT(100), SHIOR-AGACH-MEUADOT(100), STATUS-POLISA-O-CHESHBON(100), SUG-KEREN-PENSIA(100), SUG-POLISA(100), SUG-TOCHNIT-O-CHESHBON(100), TAARICH-ACHRON-MOTAV-MUVET(100), TAARICH-CIUM-AVTACHT-TESOA(100), TAARICH-HITZTARFUT-MUTZAR(100), TAARICH-HITZTARFUT-RISHON(100), TAARICH-IDKUN-STATUS(100), TAARICH-NECHONUT(100), TAARICH-TCHILA-RISK-ZMANI(100), TIKUN-190(100), TOM-TOKEF-RISK-ZMANI(100)

**H/Halvaa**: MISDAR-SIDURI-SHEL-HAHALVAA(100), RAMAT-HALVAA(100), RIBIT(100), SCHUM-HALVAA(100), SCHUM-HECHZER-TKUFATI(100), SUG-HATZNMADA(100), SUG-HECHZER(100), SUG-RIBIT(100), TAARICH-KABALAT-HALVAA(100), TAARICH-SIYUM-HALVAA(100), TADIRUT-HECHZER-HALVAA(100), TKUFAT-HALVAA(100), YESH-HALVAA-BAMUTZAR(100), YITRAT-HALVAA(100)

**H/Kisuim/ZihuiKisui**: MISPAR-KISUI-BE-YATZRAN(100), MISPAR-POLISA-O-HESHBON-NEGDI(100), SHEM-KISUI-YATZRAN(100), SUG-KISUI-ETZEL-YATZRAN(100)

**H/Kisuim/ZihuiKisui/KisuiBKerenPensia**: AHUZ-PENSIYA-TZVURA(82), ALUT-KISUI-NECHUT(82), ALUT-KISUI-PNS-SHRM-NECHE(82), ALUT-KISUY-SHEERIM(82), GIL-PRISHA-LEPENSIYAT-ZIKNA(82), HATAVA-BITUCHIT(82), KITZBAT-SHEERIM-LEALMAN-O-ALMANA(82), KITZBAT-SHEERIM-LEHORE-NITMACH(82), KITZBAT-SHEERIM-LEYATOM(82), MENAT-PENSIA-TZVURA(82), MISPAR-HODSHEI-HAVERUT-BEKEREN-HAPENSIYA(82), MISPAR-HODSHEI-HAVERUT-MITZ-BEKEREN-HAPENSIYA(82), NECHUT-MITPATAHAT(82), SACH-PENSIAT-NECHUT(82), SACHAR-KOVEA-LE-NECHUT-VE-SHEERIM(82), SHEUR-KISUY-NECHUT(82), SHIUR-KISUY-ALMAN-O-ALMANA(82), SHIUR-KISUY-HORE-NITMACH(82), SHIUR-KISUY-YATOM(82), SUG-VITOR-SHAERIM(82), TAARICH-CIUM-VITOR-SEERIM(82), TAARICH-ERECH-LANENTUNIM(82), TAARICH-MASKORET-NECHUT-VE-SHEERIM(82), TAARICH-TCHILAT-HAVERUT(82), TAARICH-VITOR-SHEERIM(82), VITUR-KISUY-BITUCHI(82)

**H/Kisuim/ZihuiKisui/Miktsoa-Isuk-Tachviv**: KOD-MIKTZOA(99), TACHVIVIM-O-ISUKIM(99), TCHUM-ISUK-CHADASH(99)

**H/Kisuim/ZihuiKisui/Mutav**: ACHUZ-MUTAV(100), HAGDARAT-MUTAV(100), KOD-ZIHUY-MUTAV(100), MAHUT-MUTAV(100), MISPAR-ZIHUY-MUTAV(100), SHEM-MISHPACHA-MUTAV(100), SHEM-PRATI-MUTAV(100), SUG-ZIHUY-MUTAV(100), SUG-ZIKA(100), TAARICH-LEIDA-MUTAV(100)

**H/Kisuim/ZihuiKisui/PirteiKisuiBeMutzar**: ACHUZ-HAGDALAT-GAG-HATAM-O-K-A(53), ACHUZ-ME-SCM-BTH-YESODI(53), ACHUZ-MESACHAR(53), BITUL-KIZUZ-MEMSHALTI(53), DMEI-BITUAH-LETASHLUM-BAPOAL(53), ERECH-HANACHA-BEKISUI(53), HACHRAGA(53), HANACHA(53), HANACHA-MEDUREGET(53), HATNAYA-LAHANACHA-DMEI-BITUAH(53), IND-CHITUM(53), KITZBA-ZMUDA-LAMADAD(53), KOD-ISHUN(53), KOD-MIUTZAR-LAKISUY(53), KOD-NISPACH-KISUY(53), KOLEL-PRENZISA(53), KOLEL-SIUD(53), MESHALEM-HAKISUY(53), MOED-SIUM-TKUFAT-HANACHA(53), NACHUT-MITPATAHAT(53), OFEN-TASHLUM-SCHUM-BITUACH(53), SCHUM-BITUACH(53), SCHUM-BITUH-KAVOA-MISHTANE(53), SCHUM-SHEUR(53), SHEUR-BITUH-KAVOA-MISHTANE(53), SHIUR-HANACHA-BEKISUI(53), SUG-HACHRAGA(53), SUG-HANACHA-KISUY(53), SUG-ISUK(53), SUG-KISUY-BITOCHI(53), SUG-MEVUTACH(53), TAARICH-CHITUM(53), TAARICH-HAFSAKAT-TASHLUM(53), TAARICH-IDKUN-HABA-SHEL-DMEI-HABITUAH(53), TAARICH-TCHILAT-KISUY(53), TAARICH-TOM-KISUY(53), TADIRUT-SHINUY-DMEI-HABITUAH-BESHANIM(53), TIKRAT-GAG-HATAM-LE-O-K-A(53), TKUFAT-ACHSHARA(53), TKUFAT-HAMTANA-CHODASHIM(53), TNAEI-HANACHA(53)

**H/Kisuim/ZihuiKisui/PirteiMevutach**: MISPAR-ZIHUY-LAKOACH(100), SUG-TEUDA(100)

**H/Kisuim/ZihuiKisui/PirteiTosafot**: KOD-SUG-TOSEFET(100), PROMIL-TOSEFET(100), SHEUR-TOSEFET(100), TAARICH-TOM-TOSEFET(100), TOSEFET-TAARIF(100)

**H/Kisuim/ZihuiKisui/SchumeiBituahYesodi**: ACHUZ-HAKTZAA-LE-CHISACHON(52), IND-SCHUM-BITUAH-KOLEL-CHISACHON(52), KOD-MUTZAR-LEFI-KIDUD-ACHID-LAYESODI(52), MISPAR-MASKOROT(52), SCHUM-BITUACH-LEMASLUL(52), SCHUM-BITUAH-LEMAVET(51), SUG-HATZMADA-DMEI-BITUAH(52), SUG-HATZMADA-SCHUM-BITUAH(52), SUG-MASLUL-LEBITUAH(52), TIKRAT-GAG-HATAM-LEMIKRE-MAVET(52)

**H/Kisuim/ZihuiKisui/hanachmedureget**: SCHUM-HANACHA(21), SHEUR-HANACHA(21), TCHILAT-TKUFA(21), TOM-TKUFA(21)

**H/Kisuim/ZihuiKisui/hitpatchutpremia**: PREMIA-ZFOYA(39), TCHILAT-TKUFA(39), TOM-TKUFA(39)

**H/Kisuim/ZihuiKisui/hitpatchutschusheurmbituh**: SCHUM-BITUH-ZFOY(16), SHEUR-BITUH-ZFOY(16), TCHILAT-TKUFA(16), TOM-TKUFA(16)

**H/KtovetLemishloach**: ERETZ(97), MIKUD(97), MISPAR-BAIT(97), MISPAR-DIRA(97), MISPAR-KNISA(97), SEMEL-YESHUV(97), SHEM-RECHOV(97), SHEM-YISHUV(97), TA-DOAR(97)

**H/MaslulBituach**: MASLUL-BITUACH-BAKEREN-PENSIA(71), SHEM-MASLUL-HABITUAH(71)

**H/NetuneiAmitOmevutach**: KOD-ZIHUY-LAKOACH(100), MISPAR-ZIHUY(100)

**H/NetuneiSheerim/Sheer**: KOD-ZIHUI-SHEERIM(74), MIN(74), MISPAR-ZIHUY-SHEERIM(74), SHEM-MISHPACHA-SHEERIM(74), SHEM-MISHPAHA-KODEM(74), SHEM-PRATI-SHEERIM(74), SUG-ZIKA(74), TAARICH-LEIDA(74)

**H/PerutMeyupeKoach**: HARSHAA-LEBITZUAE-PEULA(100), KAYAM-MEYUPE-KOACH(100), MEYOPE-ZIHUY(100), MISPAR-ZIHUY(100), SHEM-MEYUPE-KOACH(100), SUG-ZIHUY(100), TAARICH-MINUY-SOCHEN(100), TAARICH-TOM-TOKEF-YEPUI-KOACH(25)

**H/PerutMitryot**: ALUT-KISUI(76), HAIM-NECHTAM-TOFES-HITZTARFUT(76), KAYAM-KISUY-BITUCHI-COLECTIVI-LEAMITIM(76), KOD-SUG-MUTZAR-BITUACH(76), MESHALEM-DMEI-HABITUAH(76), SCHUM-BITUACH(76), SHEM-MEVATACHAT(76), TAARICH-TCHILAT-HABITUACH(76), TAARICH-TOM-TKUFAT-HABITUAH(76), TADIRUT-HATSHLUM(76)

**H/PerutShiabudIkul**: HUTAL-IKUL(100), HUTAL-SHIABUD(100)

**H/PirteiTaktziv**: BlockItrot(3), PirteiHafkadaAchrona(14)

**H/PirteiTaktziv/BlockItrot/Yitrot**: TAARICH-ERECH-TZVIROT(61)

**H/PirteiTaktziv/BlockItrot/Yitrot/NesilutTag**: MOED-NEZILUT-TAGMULIM(46), YITRAT-KASPEY-TAGMULIM(46)

**H/PirteiTaktziv/BlockItrot/Yitrot/PerutYitraLeTkufa**: KOD-TECHULAT-SHICHVA(61), REKIV-ITRA-LETKUFA(61), SACH-ITRA-LESHICHVA-BESHACH(61), SUG-ITRA-LETKUFA(61), TIKRAT-HAFKADA-MUTEVET(61)

**H/PirteiTaktziv/BlockItrot/Yitrot/PerutYitrot**: KOD-SUG-HAFRASHA(61), KOD-SUG-ITRA(61), TOTAL-CHISACHON-MTZBR(61), TOTAL-ERKEI-PIDION(61)

**H/PirteiTaktziv/BlockItrot/Yitrot/YitrotShonot**: ERECH-PIDION-MARKIV-PITZUIM-LEMAS-NOCHECHI(61), ERECH-PIDION-PITZUIM-LEHON-MAAVIDIM-KODMIM(61), ERECH-PIDION-PITZUIM-LEKITZBA-MAAVIDIM-KODMIM(61), ERECH-PIDION-PITZUIM-MAASIK-NOCHECHI(61), ERECH-PIDION-PITZUIM-MAAVIDIM-KODMIM-RETZEF-ZEHUYUT(61), KAYAM-RETZEF-PITZUIM-KITZBA(61), KAYAM-RETZEF-ZECHUYOT-PITZUIM(61), TZVIRAT-PITZUIM-31-12-1999-LEKITZBA(61), TZVIRAT-PITZUIM-MAAVIDIM-KODMIM-BERETZEF-KITZBA(61), TZVIRAT-PITZUIM-MAAVIDIM-KODMIM-BERETZEF-ZECHUYOT(61), TZVIRAT-PITZUIM-PTURIM-MAAVIDIM-KODMIM(61), YITRAT-PITZUIM-LELO-HITCHASHBENOT(61)

**H/PirteiTaktziv/ChovotPigurim/ChovPigur**: KAYAM-CHOV-O-PIGUR(100), KSAFIM-LO-MESHUYACHIM-MAASIK(100), MISPAR-CHODSHEI-PIGUR(100), SUG-HOV(100), TAARICH-TECHILAT-PIGUR(100), TAARICH-TECHILAT-PIGUR-NOCHECHI(100), TOTAL-CHOVOT-O-PIGURIM(100)

**H/PirteiTaktziv/HafkadotShnatiyot**: TOTAL-HAFKADOT-MAAVID-TAGMULIM-SHANA-NOCHECHIT(94), TOTAL-HAFKADOT-OVED-TAGMULIM-SHANA-NOCHECHIT(94), TOTAL-HAFKADOT-PITZUIM-SHANA-NOCHECHIT(94)

**H/PirteiTaktziv/MeshichaNiud**: ILAT-HAAVARA(29), KNAS-MESHICHA-NIUD(29), KOD-MEZAHE-KOPA-MEKABELET(29), KOD-SUG-PEULA(29), MOED-KOVEA(29), RACHIV-NIMSHACH-NUYAD(29), SCHOOM-MESHICHA-NIUD(29), SHEM-KOPA-MEKABELET(29), TAARICH-BIZOA(29), TAARICH-ERECH(29)

**H/PirteiTaktziv/NetuneiGvia**: ACHUZ-TAT-SHNATIYOT(100), CHODESH-YECHUS(100), KOD-EMTZAEI-TASHLUM(100), MISPAR-ZIHUY-MESHALEM(100), OFEN-HATZMADAT-GVIA(100), SHEM-MESHALEM(100), SUG-TEUDA-MESHALEM(100), TADIRUT-TASHLUM(100), YOM-GVIYA-BECHODESH(100)

**H/PirteiTaktziv/PerutHafkadotMetchilatShana**: CHODESH-SACHAR(42), KOD-MEZAHE-KOPA-MAAVIRA(42), KOD-SUG-HAFKADA(42), MOED-KOVEA-NIUD(42), SACHAR-BERAMAT-HAFKADA(42), SCHUM-HAFKADA-SHESHULAM(42), SHEM-KOPA-MAAVIRA(42), SUG-HAFRASHA(42), SUG-MAFKID(42), TAARICH-ERECH-HAFKADA(42), ZMAN-PERAON(42)

**H/PirteiTaktziv/PerutHafrashotLePolisa**: ACHUZ-HAFRASHA(100), SCHUM-HAFRASHA(100), SUG-HAFRASHA(100), SUG-HAMAFKID(100), TAARICH-MADAD(100)

**H/PirteiTaktziv/PerutHotzaot/HotzaotBafoalLehodeshDivoach**: DEMI-AAVARAT-MASLOL(100), DMEI-NIUL-MENAEL-TIKIM(100), HOTZOT-NIHUL-ASHKAOT(100), MEMOTZA-SHEUR-DMEI-NIHUL-HAFKADA(100), MEMOTZA-TOTAL-DMEI-NIHUL-HAFKADA(100), OFEN-GEVIAT-DMEI-BITUACH(100), SACH-DMEI-BITUAH-SHENIGBOO(100), SACH-DMEI-NIHUL-ACHERIM(100), SHEUR-DMEI-NIHUL-HAFKADA(100), SHEUR-DMEI-NIHUL-TZVIRA(100), TOTAL-DMEI-NIHUL-HAFKADA(100), TOTAL-DMEI-NIHUL-POLISA-O-HESHBON(100), TOTAL-DMEI-NIHUL-TZVIRA(100)

**H/PirteiTaktziv/PerutHotzaot/MivneDmeiNihul/PerutMivneDmeiNihul**: ACHOZ-HATAVA(100), DMEI-NIHUL-ACHERIM(100), DMEI-NIHUL-ACHIDIM(100), GOVA-DMEI-NIHUL-NIKBA-AL-PI-HOTZAOT-BAPOAL(100), KAYEMET-HATAVA(100), KENAS-MESHICHAT-KESAFIM(100), KOD-MASLUL-DMEI-NIHUL(100), KOD-MASLUL-HASHKAA-BAAL-DMEI-NIHUL-YECHUDIIM(100), MEAFYENEI-MASLUL-DMEI-NIHUL(100), OFEN-HAFRASHA(100), SACH-DMEI-NIHUL-MASLUL(100), SCHUM-MAX-DNHL-HAFKADA(100), SHEUR-DMEI-NIHUL(100), SUG-HATAVA(100), SUG-HOTZAA(100), TAARICH-IDKUN-SHEUR-DNHL(100), TAARICH-SIUM-HATAVA(100)

**H/PirteiTaktziv/PerutMasluleiHashkaa**: ACHUZ-HAFKADA-LEHASHKAA(61), DMEI-NIHUL-ACHERIM(61), KOD-MASLUL-HASHKAA(61), KOD-SUG-HAFRASHA(61), KOD-SUG-MASLUL(61), SCHUM-TZVIRA-BAMASLUL(61), SHEM-MASLUL-HASHKAA(61), SHEUR-DMEI-NIHUL-HAFKADA(61), SHEUR-DMEI-NIHUL-HAFKADA-MIVNE(61), SHEUR-DMEI-NIHUL-HISACHON(61), SHEUR-DMEI-NIHUL-HISACHON-MIVNE(61), SHIUR-ALUT-SHNATIT-ZPUIA-LMSLUL-HASHKAH(16), TSUA-NETO(61)

**H/PirteiTaktziv/PerutYitrotLesofShanaKodemet**: ERECH-MESOLAK-SOF-SHANA(75), ERECH-PIDYON-SOF-SHANA(75), YISKON-YITRAT-KESAFIM(75), YITRAT-SOF-SHANA(75)

**H/PirteiTaktziv/PirteiHaasaka**: KOD-CHISHUV-SACHAR-POLISA-O-HESHBON(83), KOD-OFEN-HATZMADA(83), SACHAR-POLISA(83), SEIF-14(83), TAARICH-MASKORET(83), TAARICH-TCHILAT-TASHLUM(83), ZAKAUT-LELO-TNAI(83)

**H/PirteiTaktziv/PirteiHafkadaAchrona/PerutPirteiHafkadaAchrona**: HAFKADA-LEHISCHON-A(70), HAFKADA-LEHISCHON-B(70), SUG-HAFKADA(70), TAARICH-ERECH-HAFKADA(70), TAARICH-HAFKADA-ACHARON(70), TOTAL-HAFKADA(70), TOTAL-HAFKADA-ACHRONA(70)

**H/PirteiTaktziv/PirteiHafkadaAchrona/PerutPirteiHafkadaAchrona/PerutHafkadaAchrona**: CHODESH-SACHAR(43), KOD-SUG-HAFKADA(43), SACHAR-BERAMAT-HAFKADA(43), SCHUM-HAFKADA-SHESHULAM(43), SUG-HAFRASHA(43), SUG-MAFKID(43)

**H/PirteiTaktziv/PirteiOved**: MISPAR-BAAL-POLISA-SHEEINO-MEVUTAH(100), MPR-MAASIK-BE-YATZRAN(100), SHEM-BAAL-POLISA-SHEEINO-MEVUTAH(100), STATUS-MAASIK(100), SUG-BAAL-HAPOLISA-SHE-EINO-HAMEVUTACH(100), SUG-TOCHNIT-O-CHESHBON(100)

**H/PirteyTvia**: ACHUZ-MEUSHAR-O-K-A-SHICHRUR(100), ACHUZ-NECHUT(100), KOD-STATUS-TVIAA(100), MISPAR-KISUI-BE-YATZRAN(100), MISPAR-TVIA-BE-YATZRAN(100), OFEN-TASHLUM(100), SCHUM-TVIA-MEUSHAR(100), SHEM-KISUI-BE-YATZRAN(100), SUG-HATVIAA(100), TAARICH-STATUS-TVIA(100), TAARICH-TECHILAT-TASHLUM(100), YESH-TVIA(100)

**H/Tsua**: ACHUZ-TSUA-BRUTO-CHS-2(65), ACHUZ-TSUA-MUVTAHT(18), REVACH-HEFSED-BENIKOI-HOZAHOT(65), SHEUR-TSUA-BRUTO-CHS-1(65), SHEUR-TSUA-MOVTACHAT-MEYOADOT(65), SHEUR-TSUA-NETO(65), SIMAN-REVACH-HEFSED(65)

**H/YitraLefiGilPrisha**: GIL-PRISHA(60), Kupot(0), MEKADEM-HAVTACHAT-TSUA(60), MEKADEM-HAVTACHAT-TSUATKUFA(60), MEKADEM-HAVTACHST-TOCHELET(60), MEKADEM-HAVTACHST-TOCHELETPRISHA(60), MEKADEM-MOVTACH-LEPRISHA(60), SHEM-MASLOL(60), SHEUR-PNS-ZIKNA-TZFUYA(60), TKUFAT-HAGBALA-BESHANIM(60), TOCHELET-MASHPIA-KITZBA(60), TOTAL-CHISACHON-MITZTABER-TZAFUY(60), TSUA-MASHPIA-KITZBA(60), TZVIRAT-CHISACHON-CHAZUYA-LELO-PREMIYOT(60)

**H/YitraLefiGilPrisha/Kupot/Kupa**: ACHUZ-TSUA-BATACHAZIT(60), KITZVAT-HODSHIT-TZFUYA(60), SCHUM-KITZVAT-ZIKNA(60), SUG-KUPA(60), TOTAL-ITRA-TZFUYA-MECHUSHAV-LEHON-IM-PREMIOT(60), TOTAL-SCHUM-MITZVTABER-TZFUY-LEGIL-PRISHA-MECHUSHAV-HAMEYOAD-LEKITZBA-LELO-PREMIYOT(60), TOTAL-SCHUM-MTZBR-TZAFUY-LEGIL-PRISHA-MECHUSHAV-LEKITZBA-IM-PREMIYOT(60), TZVIRAT-CHISACHON-TZFUYA-LEHON-LELO-PREMIYOT(60)

### 3.2 קבוצות חוזרות (repeating groups)

| נתיב | קבצים עם חזרה | מקסימום אחים |
|---|---|---|

## 4. טבלאות קודים (enum) שנצפו

משמעות הקודים נקבעה במסקנה מתוך שמות התוכניות והתנהגות המבנה, ואינה מפרט רשמי. כל שורה מסומנת "מוסק". יש לאמת מול מפרט הממשק האחיד של רשות שוק ההון לפני שימוש בטקסט כלפי לקוחות.

### 4.1 SUG-MUTZAR (מוסק)

| קוד | משמעות (מוסק) | Mutzar | פוליסות/חשבונות | דוגמאות שמות תוכנית (ציבורי) |
|---|---|---|---|---|
| 1 | ביטוח מנהלים / ביטוח חיים עם חיסכון וקצבה | 134 | 137 | פרופיל הדור החדש עוז משלמת לקצבה; מנהלים ושכירים; מעורב מסולק; הראל MORE  תגמולים לעצמאיים |
| 2 | קרן פנסיה | 579 | 719 | הפניקס פנסיה מקיפה; הראל פנסיה; כלל פנסיה; מנורה מבטחים פנסיה |
| 3 | קופת גמל (תגמולים ופיצויים) | 120 | 189 | כלל תמר; מנורה מבטחים תגמולים ופיצויים; מיטב גמל; הפניקס גמל |
| 4 | קרן השתלמות | 553 | 638 | מור השתלמות; ילין לפידות השתלמות; כלל השתלמות; אנליסט השתלמות |
| 5 | ביטוח מנהלים (נדיר) | 3 | 3 | מיטב; מנהלים ושכירים; סטטוס |
| 6 | ביטוח חיים: ריסק, פיצוי ושחרור, מגן | 445 | 484 | מגן 1 זוגי אקסטרה; ריסק יסודי בפרמיה משתנה; ריסק 1; פיצוי ושחרור בפרמיה משתנה |
| 7 | ביטוח חיים למשכנתא / פרעון הלוואה | 463 | 503 | ריסק משכנתא; ביטוח משכנתאות; ריסק משכנתא בפרמיה משתנה; ביטוח חיים למשכנתא |
| 8 | ריסק קולקטיבי / נכות מוחלטת ותמידית (נדיר) | 8 | 8 | ריסק קולקטיבי; ריסק; נכות מוחלטת ותמידית |
| 9 | קופת גמל להשקעה | 68 | 68 | אנליסט גמל להשקעה; מנורה מבטחים גמל להשקעה; מור גמל להשקעה; אלטשולר שחם חיסכון פלוס |
| 10 | גמל להשקעה: חיסכון ארוך טווח לילד | 28 | 28 | קופת גמל להשקעה - חסכון ארוך טווח לילד; מיטב חסכון לילד; אקסלנס חסכון לכל ילד |

### 4.2 צירופי סוג (SUG-MUTZAR, SUG-POLISA, SUG-TOCHNIT-O-CHESHBON, SUG-KEREN-PENSIA)

| SUG-MUTZAR | SUG-POLISA | SUG-TOCHNIT-O-CHESHBON | SUG-KEREN-PENSIA | פוליסות | משפחות |
|---|---|---|---|---|---|
| 2 | (ריק) | 1 | 2 | 516 | OTHER=2, PNN=509, PNO=5 |
| 6 | 4 | 5 | (ריק) | 481 | OTHER=2, INP=341, ING=138 |
| 7 | 4 | 5 | (ריק) | 435 | ING=271, INM=163, INP=1 |
| 4 | (ריק) | 1 | (ריק) | 345 | KGM=345 |
| 4 | (ריק) | 2 | (ריק) | 252 | KGM=252 |
| 2 | (ריק) | 2 | 2 | 152 | PNN=152 |
| 3 | (ריק) | 1 | (ריק) | 148 | KGM=148 |
| 9 | (ריק) | 2 | (ריק) | 68 | KGM=68 |
| 7 | 1 | 5 | (ריק) | 68 | INM=68 |
| 1 | 3 | 5 | (ריק) | 53 | ING=53 |
| 2 | (ריק) | 1 | 3 | 47 | PNN=47 |
| 1 | 3 | 1 | (ריק) | 44 | ING=44 |
| 4 | 1 | 1 | (ריק) | 39 | KGM=39 |
| 3 | (ריק) | 2 | (ריק) | 24 | KGM=24 |
| 10 | (ריק) | 1 | (ריק) | 22 | KGM=22 |
| 1 | 1 | 5 | (ריק) | 22 | ING=22 |
| 3 | 1 | 1 | (ריק) | 13 | KGM=13 |
| 1 | 3 | 2 | (ריק) | 9 | ING=9 |
| 8 | 4 | 5 | (ריק) | 6 | ING=6 |
| 10 | (ריק) | 2 | (ריק) | 5 | KGM=5 |
| 1 | 4 | 2 | (ריק) | 5 | ING=5 |
| 3 | 1 | 2 | (ריק) | 4 | KGM=4 |
| 1 | 2 | 1 | (ריק) | 4 | ING=4 |
| 2 | (ריק) | 2 | 3 | 3 | PNN=3 |
| 4 | 1 | 2 | (ריק) | 2 | KGM=2 |
| 6 | 4 | 2 | (ריק) | 2 | ING=2 |
| 5 | 3 | 1 | (ריק) | 2 | ING=2 |
| 8 | 4 | 4 | (ריק) | 2 | INK=2 |
| 5 | 2 | 2 | (ריק) | 1 | ING=1 |
| 10 | 1 | 2 | (ריק) | 1 | KGM=1 |
| 2 | (ריק) | 1 | 1 | 1 | PNO=1 |
| 6 | 3 | 2 | (ריק) | 1 | ING=1 |

פענוח חלקי: `SUG-KEREN-PENSIA` 2 = מקיפה (668), 3 = כללית/משלימה (50), 1 = נדיר (1) [מוסק מהשמות]. `SUG-POLISA` ריק תמיד בקרנות פנסיה, ולעיתים בגמל/השתלמות (שם מופיע 1 בחלק מהחשבונות); בביטוח מופיעים 1-4. `SUG-TOCHNIT-O-CHESHBON`: בפנסיה/גמל/השתלמות הערכים 1 ו-2 מפרידים בין שני סוגי רשומות (ביטוח מוסק: 4 או 5 מופיע רק בביטוח). משמעות מדויקת טרם אומתה.

### 4.3 STATUS-POLISA-O-CHESHBON ו-STATUS-RESHOMA

`STATUS-POLISA-O-CHESHBON`: 1=1899, 2=847, 3=10, 10=6, 6=4, 8=4, 4=3, 9=2, 7=2. נקבע: 1 = פעיל, 2 = לא פעיל (מוסק). הערכים 3,4,6,7,8,9,10 נפוצים מעט (עד 10 מופעים כל אחד; 10 מופיע רק בריסק קולקטיבי). אינם מופו בפרסר הנוכחי ויש לדווח אותם כ"לא ממופה" ולא להתעלם. `STATUS-RESHOMA` (ברמת המוצר): תמיד 1. הפוליסה שאינה פעילה (2) נפוצה בגמל (82%), בהשתלמות (47%), בפנסיה (42%).

### 4.4 שאר השדות המקודדים (ערך: ספירת מופעים)

| תגית | ערכים |
|---|---|
| `H/AVTACHT-TESOA` | `2`:1410 |
| `H/AZMADA-LEALVAHA` | `2`:906 |
| `H/Halvaa/RAMAT-HALVAA` | `1`:163, `2`:64 |
| `H/Halvaa/SUG-HATZNMADA` | `1`:13, `2`:2 |
| `H/Halvaa/SUG-HECHZER` | `1`:4 |
| `H/Halvaa/SUG-RIBIT` | `1`:6, `2`:4 |
| `H/Halvaa/TADIRUT-HECHZER-HALVAA` | `1`:6 |
| `H/Halvaa/TKUFAT-HALVAA` | `60`:7, `0`:4, `84`:3, `79`:2, `83`:1, `71`:1 |
| `H/Halvaa/YESH-HALVAA-BAMUTZAR` | `2`:2763, `1`:15 |
| `H/KAYAM-KISUY-HIZONI` | `2`:1636 |
| `H/KOLEL-ZAKAUT-AGACH` | `2`:1010, `4`:674, `1`:485 |
| `H/K/KisuiBKerenPensia/NECHUT-MITPATAHAT` | `2`:1950, `1`:2 |
| `H/K/KisuiBKerenPensia/SUG-VITOR-SHAERIM` | `0`:2024, `1`:1 |
| `H/K/Mutav/HAGDARAT-MUTAV` | `2`:1873, `1`:1451 |
| `H/K/Mutav/MAHUT-MUTAV` | `2`:2946, `1`:199 |
| `H/K/Mutav/SUG-ZIKA` | `9`:1930, `8`:941, `2`:413, `1`:16, `3`:12, `6`:1, `7`:1 |
| `H/K/PirteiKisuiBeMutzar/BITUL-KIZUZ-MEMSHALTI` | `1`:171, `2`:168 |
| `H/K/PirteiKisuiBeMutzar/HACHRAGA` | `2`:2661, `3`:366, `1`:228, `0`:6 |
| `H/K/PirteiKisuiBeMutzar/HANACHA` | `1`:1630, `2`:1364, `3`:261 |
| `H/K/PirteiKisuiBeMutzar/HANACHA-MEDUREGET` | `2`:1992, `1`:800 |
| `H/K/PirteiKisuiBeMutzar/HATNAYA-LAHANACHA-DMEI-BITUAH` | `2`:2093, `3`:690, `1`:472 |
| `H/K/PirteiKisuiBeMutzar/IND-CHITUM` | `1`:2458, `3`:631, `2`:166, `0`:6 |
| `H/K/PirteiKisuiBeMutzar/KITZBA-ZMUDA-LAMADAD` | `1`:367, `5`:7 |
| `H/K/PirteiKisuiBeMutzar/KOD-ISHUN` | `2`:2136, `1`:718, `3`:401, `0`:6 |
| `H/K/PirteiKisuiBeMutzar/KOLEL-PRENZISA` | `1`:338, `2`:36 |
| `H/K/PirteiKisuiBeMutzar/KOLEL-SIUD` | `2`:728, `1`:51 |
| `H/K/PirteiKisuiBeMutzar/MESHALEM-HAKISUY` | `2`:2131, `6`:906, `1`:216, `0`:6, `3`:2 |
| `H/K/PirteiKisuiBeMutzar/NACHUT-MITPATAHAT` | `3`:295, `1`:44 |
| `H/K/PirteiKisuiBeMutzar/SUG-HACHRAGA` | `3`:226, `1`:206 |
| `H/K/PirteiKisuiBeMutzar/SUG-HANACHA-KISUY` | `2`:1214, `5`:1 |
| `H/K/PirteiKisuiBeMutzar/SUG-ISUK` | `2`:482, `3`:87, `1`:2 |
| `H/K/PirteiKisuiBeMutzar/SUG-KISUY-BITOCHI` | `1`:2349, `10`:404, `5`:337, `6`:89, `8`:35, `2`:26, `4`:12, `9`:8, `3`:1 |
| `H/K/PirteiKisuiBeMutzar/SUG-MEVUTACH` | `1`:2084, `2`:960, `5`:211 |
| `H/K/PirteiKisuiBeMutzar/TADIRUT-SHINUY-DMEI-HABITUAH-BESHANIM` | `1`:2557, `0`:482, `5`:1 |
| `H/K/PirteiKisuiBeMutzar/TKUFAT-ACHSHARA` | `0`:1915, `2`:256, `36`:6 |
| `H/K/PirteiKisuiBeMutzar/TKUFAT-HAMTANA-CHODASHIM` | `0`:1273, `3`:404, `1`:22 |
| `H/K/PirteiKisuiBeMutzar/TNAEI-HANACHA` | `4`:1834, `2`:755, `1`:642, `5`:22, `0`:6, `3`:2 |
| `H/K/PirteiMevutach/SUG-TEUDA` | `1`:4656 |
| `H/K/PirteiTosafot/KOD-SUG-TOSEFET` | `3`:91, `1`:81 |
| `H/K/SUG-KISUI-ETZEL-YATZRAN` | `2`:1773, `1`:1314 |
| `H/K/SchumeiBituahYesodi/SUG-HATZMADA-DMEI-BITUAH` | `2`:733, `6`:221, `1`:205, `4`:97, `0`:24 |
| `H/K/SchumeiBituahYesodi/SUG-MASLUL-LEBITUAH` | `0`:659, `1`:257, `4`:6 |
| `H/MEVUTACH` | `1`:419, `2`:293, `3`:1 |
| `H/NetuneiSheerim/Sheer/MIN` | `1`:309, `2`:128, `3`:21 |
| `H/NetuneiSheerim/Sheer/SUG-ZIKA` | `3`:325, `1`:133 |
| `H/PENSIA-VATIKA-O-HADASHA` | `2`:713, `1`:6 |
| `H/PerutMeyupeKoach/HARSHAA-LEBITZUAE-PEULA` | `1`:1897, `2`:54 |
| `H/PerutMeyupeKoach/KAYAM-MEYUPE-KOACH` | `1`:1951, `2`:848 |
| `H/PerutMitryot/HAIM-NECHTAM-TOFES-HITZTARFUT` | `2`:7, `3`:1 |
| `H/PerutMitryot/KAYAM-KISUY-BITUCHI-COLECTIVI-LEAMITIM` | `2`:2212, `1`:17 |
| `H/PerutMitryot/KOD-SUG-MUTZAR-BITUACH` | `1`:8, `3`:5, `5`:2, `2`:2, `4`:1 |
| `H/PerutMitryot/MESHALEM-DMEI-HABITUAH` | `2`:17, `3`:1 |
| `H/PerutMitryot/TADIRUT-HATSHLUM` | `1`:13, `2`:4, `4`:1 |
| `H/PerutShiabudIkul/HUTAL-IKUL` | `2`:2668, `3`:100, `1`:9 |
| `H/PerutShiabudIkul/HUTAL-SHIABUD` | `2`:2307, `1`:470 |
| `H/PT/BlockItrot/Yitrot/PerutYitraLeTkufa/KOD-TECHULAT-SHICHVA` | `2`:2842, `13`:1437, `9`:790, `7`:470, `14`:90, `3`:54, `4`:24, `1`:15, `8`:12, `10`:10, `5`:7, `6`:3 |
| `H/PT/BlockItrot/Yitrot/PerutYitraLeTkufa/SUG-ITRA-LETKUFA` | `2`:3683, `1`:1754, `3`:317 |
| `H/PT/BlockItrot/Yitrot/PerutYitrot/KOD-SUG-HAFRASHA` | `2`:1560, `3`:1465, `1`:1072, `8`:638, `9`:382, `4`:139, `12`:28 |
| `H/PT/BlockItrot/Yitrot/PerutYitrot/KOD-SUG-ITRA` | `2`:3721, `1`:1250, `3`:313 |
| `H/PT/BlockItrot/Yitrot/YitrotShonot/KAYAM-RETZEF-PITZUIM-KITZBA` | `2`:1492, `3`:827, `1`:66 |
| `H/PT/BlockItrot/Yitrot/YitrotShonot/KAYAM-RETZEF-ZECHUYOT-PITZUIM` | `2`:1563, `3`:822 |
| `H/PT/ChovotPigurim/ChovPigur/KAYAM-CHOV-O-PIGUR` | `2`:3241, `1`:139 |
| `H/PT/ChovotPigurim/ChovPigur/SUG-HOV` | `3`:53, `5`:50, `4`:47 |
| `H/PT/MeshichaNiud/ILAT-HAAVARA` | `6`:23 |
| `H/PT/MeshichaNiud/KOD-SUG-PEULA` | `1`:52, `2`:23, `3`:1 |
| `H/PT/MeshichaNiud/RACHIV-NIMSHACH-NUYAD` | `1`:50, `2`:11, `3`:9, `12`:5, `4`:1 |
| `H/PT/NetuneiGvia/KOD-EMTZAEI-TASHLUM` | `1`:1814, `3`:646, `6`:329, `2`:313, `5`:267, `4`:11 |
| `H/PT/NetuneiGvia/OFEN-HATZMADAT-GVIA` | `1`:1627, `2`:691, `6`:634, `9`:387, `10`:39, `3`:1, `8`:1 |
| `H/PT/NetuneiGvia/SUG-TEUDA-MESHALEM` | `1`:1422, `3`:1371, `7`:496, `2`:46, `8`:28, `6`:15, `4`:2 |
| `H/PT/NetuneiGvia/TADIRUT-TASHLUM` | `4`:3165, `5`:206, `1`:7, `3`:2 |
| `H/PT/PerutHafkadotMetchilatShana/KOD-SUG-HAFKADA` | `2`:14918, `1`:7111, `3`:1627, `5`:673 |
| `H/PT/PerutHafkadotMetchilatShana/SUG-HAFRASHA` | `2`:6907, `1`:5487, `3`:5255, `8`:2246, `9`:1834, `5`:732, `10`:661, `4`:622, `12`:570, `6`:12, `7`:3 |
| `H/PT/PerutHafkadotMetchilatShana/SUG-MAFKID` | `2`:14030, `1`:8326, `6`:869, `3`:534, `4`:285, `5`:285 |
| `H/PT/PerutHafrashotLePolisa/SUG-HAFRASHA` | `2`:1616, `3`:1301, `1`:1126, `11`:754, `8`:533, `10`:317, `4`:282, `9`:197, `12`:29, `6`:7, `5`:2 |
| `H/PT/PerutHafrashotLePolisa/SUG-HAMAFKID` | `2`:3341, `1`:2609, `3`:185, `4`:28, `5`:1 |
| `H/PT/PerutHotzaot/HotzaotBafoalLehodeshDivoach/OFEN-GEVIAT-DMEI-BITUACH` | `1`:1733, `2`:399 |
| `H/PT/PerutHotzaot/MivneDmeiNihul/PerutMivneDmeiNihul/KAYEMET-HATAVA` | `1`:4695, `2`:1523 |
| `H/PT/PerutHotzaot/MivneDmeiNihul/PerutMivneDmeiNihul/OFEN-HAFRASHA` | `0`:3473, `2`:772, `8`:719, `1`:714, `3`:644, `9`:411, `4`:234, `12`:22, `10`:21 |
| `H/PT/PerutHotzaot/MivneDmeiNihul/PerutMivneDmeiNihul/SUG-HATAVA` | `2`:2372, `1`:1425, `6`:1008, `5`:389 |
| `H/PT/PerutHotzaot/MivneDmeiNihul/PerutMivneDmeiNihul/SUG-HOTZAA` | `1`:3723, `2`:2330, `0`:957 |
| `H/PT/PerutMasluleiHashkaa/KOD-SUG-HAFRASHA` | `2`:1687, `3`:1618, `1`:1214, `8`:653, `9`:398, `4`:137, `12`:50, `10`:22, `0`:6 |
| `H/PT/PerutMasluleiHashkaa/KOD-SUG-MASLUL` | `1`:4036, `2`:1743, `0`:6 |
| `H/PT/PirteiHaasaka/KOD-OFEN-HATZMADA` | `1`:1663, `4`:17 |
| `H/PT/PirteiHaasaka/SEIF-14` | `2`:1223, `3`:399, `1`:280 |
| `H/PT/PirteiHaasaka/ZAKAUT-LELO-TNAI` | `2`:1538, `3`:338, `1`:20 |
| `H/PT/PirteiHafkadaAchrona/PerutPirteiHafkadaAchrona/PerutHafkadaAchrona/KOD-SUG-HAFKADA` | `2`:2134, `1`:800, `5`:61, `3`:41 |
| `H/PT/PirteiHafkadaAchrona/PerutPirteiHafkadaAchrona/PerutHafkadaAchrona/SUG-HAFRASHA` | `2`:1015, `3`:800, `1`:619, `8`:229, `9`:174, `5`:61, `4`:56, `10`:55, `12`:26, `6`:1 |
| `H/PT/PirteiHafkadaAchrona/PerutPirteiHafkadaAchrona/PerutHafkadaAchrona/SUG-MAFKID` | `1`:1349, `2`:1202, `3`:459, `4`:24, `5`:2 |
| `H/PT/PirteiHafkadaAchrona/PerutPirteiHafkadaAchrona/SUG-HAFKADA` | `1`:1921, `3`:199, `2`:10 |
| `H/PT/PirteiOved/STATUS-MAASIK` | `1`:1268, `2`:803 |
| `H/PT/PirteiOved/SUG-BAAL-HAPOLISA-SHE-EINO-HAMEVUTACH` | `3`:322, `1`:55, `7`:2 |
| `H/PT/PirteiOved/SUG-TOCHNIT-O-CHESHBON` | `1`:1828, `4`:1061, `2`:491 |
| `H/PirteyTvia/KOD-STATUS-TVIAA` | `6`:2 |
| `H/PirteyTvia/OFEN-TASHLUM` | `4`:2 |
| `H/PirteyTvia/SUG-HATVIAA` | `5`:2 |
| `H/PirteyTvia/YESH-TVIA` | `2`:2777 |
| `H/SUG-KEREN-PENSIA` | `2`:668, `3`:50, `1`:1 |
| `H/SUG-POLISA` | `4`:931, `1`:149, `3`:109, `2`:5 |
| `H/SUG-TOCHNIT-O-CHESHBON` | `1`:1181, `5`:1065, `2`:529, `4`:2 |
| `H/TIKUN-190` | `2`:2631, `1`:140, `0`:6 |
| `H/Tsua/SIMAN-REVACH-HEFSED` | `1`:1023, `2`:18 |
| `H/YitraLefiGilPrisha/Kupot/Kupa/SUG-KUPA` | `1`:873, `3`:762, `2`:315 |
| `M/NetuneiMutzar/STATUS-RESHOMA` | `1`:2401 |
| `M/NetuneiMutzar/YeshutLakoach/MATZAV-MISHPACHTI` | `2`:1400, `5`:608, `1`:364, `3`:18, `4`:6, `0`:5 |
| `M/NetuneiMutzar/YeshutLakoach/MIN` | `1`:1683, `2`:717, `3`:1 |
| `M/NetuneiMutzar/YeshutLakoach/PTIRA` | `2`:2401 |
| `M/YeshutNimaansofi/KOD-NIMAAN` | `2`:581, `3`:559, `4`:94 |
| `M/YeshutNimaansofi/SUG-MEZAHE-NIMAAN` | `1`:1140, `3`:94 |
| `Mimshak/KoteretKovetz/KOD-SVIVAT-AVODA` | `2`:2306 |

### 4.5 שמות תוכניות/קרנות/מסלולים (ערכי טקסט ציבוריים)

**SHEM-TOCHNIT**: 88 ערכים שונים; נפוצים: הפניקס פנסיה מקיפה (273); ריסק משכנתא (215); הראל פנסיה (148); מגן 1 זוגי אקסטרה (126); כלל פנסיה (105); מור השתלמות (105); ילין לפידות השתלמות (102); ריסק יסודי בפרמיה משתנה (100); ביטוח משכנתאות (100); ריסק 1 (97); כלל השתלמות (94); אנליסט השתלמות (81)

**SHEM-MASLUL-HASHKAA**: 109 ערכים שונים; נפוצים: גילאי 50 ומטה (896); מקיפה לבני 50 ומטה (700); 2035 יעד לפרישה (472); כלל פנסיה מניות (460); S&P 500 עוקב מדד (170); 1200 - אנליסט השתלמות מניות (158); מניות (156); כלל פנסיה לבני 50 ומטה (150); לבני 50 ומטה - תלוי גיל (136); כלל פנסיה לבני 50 עד 60 (135); הפניקס לבני 50 ומטה (132); כללי (117)

**SHEM-KISUI-YATZRAN**: 128 ערכים שונים; נפוצים: ריסק משכנתא (982); ריסק משכנתא בפרמיה משתנה (274); ביטוח משכנתאות (246); בסיסי (184); משכנתא הפועלים (184); הראל פנסיה (148); ריסק 1 (143); פיצוי ושחרור בפרמיה משתנה (141); מגן 1 זוגי אקסטרה (126); ריסק- בלמש (106); מור השתלמות (105); ילין לפידות השתלמות (102)

**SHEM-MASLUL-HABITUAH**: 18 ערכים שונים; נפוצים: בסיסי (184); נכות 75% שארים 100% (למעט גבר המצטרף מגיל 41) (125); מסלול 1 מסלול ביטוח 75% לנכות ו-100% לשאירים (למעט גברים המצטרפים מגיל 41 ומעלה) (92); (מסלול ביטוח 75% -לנכות ו 100% לשאירים (למעט גברים המצטרפים מגיל 41 ומעלה (73); 75% לנכות ו- 100% לשאירים (למעט גברים המצטרפים מגיל 41 ומעלה) (53); פנסיית יסוד (47); לא רלוונטי (28); שאירים מוגדל (22); מסלול ביטוח 75% לנכות ו-100% לשאירים (למעט גברים המצטרפים מגיל 41 ומעלה) ( מסלול ברירת המחדל) (18); פנסיה מקיפה נכות מוגדלת 75% (16); 75% לנכות ו- 100% לשאירים טעמל) גברים המצטרפים מגיל 41 (הלעמו (16); 75% נכ' ו- 100% שא' למעט גברים מצט' מגיל 41 (14)

**SHEM-KOPA-MAAVIRA**: 34 ערכים שונים; נפוצים: מנורה מבטחים פנסיה (355); אלפא מור תגמולים - לבני 50 ומט (84); הפניקס פנסיה (66); מבטחים החדשה (45); מיטב - גמל (44); 071 כלל פנסיה וגמל בעמ מ"ה (38); הראל  פנסיה (214) (24); מיטב מקיפה (24); מגדל לתגמולים ולפיצויים (24); הפניקס פנסיה מקיפה (20); מור מנורה מבטחים לבני עד 50 (16); הפניקס פנסיה משלימה (15)

**SHEM-KOPA-MEKABELET**: 5 ערכים שונים; נפוצים: הפניקס פנסיה מקיפה (15); אלטשולר שחם פנסיה מקיפה (3); הראל השתלמות (2); אינפיניטי ניהול השתלמות וגמל בע"מ (2); הראל גמל להשקעה (1)

**SHEM-MEVATACHAT**: 4 ערכים שונים; נפוצים: כלל חברה לביטוח בעם (10); הפניקס חברה לביטוח בע"מ (4); חבר משרתי הקבע והגמלאים (3); מגדל (1)

**KOD-MIKTZOA**: 65 ערכים שונים; נפוצים: (מנהל/ת (עובד משרד (365); יועץ שיווק       ‏ (287); לא ידוע (189); מעצב/ת אופנה (134); מנהל תחנת רכבת (132); יועץ ארגוני (121); יזם נדל"ן (92); בוחן נהיגה בכל סוגי הרכב (92); כלכלן (92); מנהל/ת דבוע) (דרשמ (53); מורה לנהיגה ברכב 4 גלגלי (51); בעל חנות (50)

## 5. קטלוג סוגי מוצר: איך כל סוג נראה במקור

| SUG-MUTZAR | סוג | פוליסות | KisuiBKerenPensia | PirteiKisuiBeMutzar | SchumeiBituahYesodi | Mutav | Halvaa | Tsua | YitraLefiGilPrisha | BlockItrot | MasluleiHashkaa | PirteiHaasaka | NetuneiSheerim | PerutMitryot | PirteiOved | MaslulBituach | ChovotPigurim |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | ביטוח מנהלים / ביטוח חיים עם חיסכון וקצבה | 137 | 91% | 100% | 100% | 100% | 100% | 100% | 100% | 100% | 100% | 88% | 94% | 23% | 100% | 64% | 100% |
| 2 | קרן פנסיה | 719 | 99% | 28% | 15% | 100% | 100% | 100% | 100% | 100% | 100% | 100% | 65% | 99% | 100% | 99% | 100% |
| 3 | קופת גמל (תגמולים ופיצויים) | 189 | 82% | 0% | 1% | 100% | 100% | 100% | 100% | 100% | 100% | 87% | 77% | 97% | 100% | 78% | 100% |
| 4 | קרן השתלמות | 638 | 96% | 10% | 17% | 100% | 100% | 100% | 100% | 100% | 100% | 92% | 87% | 83% | 100% | 88% | 100% |
| 5 | ביטוח מנהלים (נדיר) | 3 | 67% | 33% | 100% | 100% | 100% | 100% | 100% | 100% | 100% | 100% | 100% | 33% | 100% | 67% | 100% |
| 6 | ביטוח חיים: ריסק, פיצוי ושחרור, מגן | 484 | 59% | 100% | 93% | 100% | 100% | 1% | 0% | 8% | 0% | 61% | 60% | 60% | 100% | 29% | 100% |
| 7 | ביטוח חיים למשכנתא / פרעון הלוואה | 503 | 52% | 100% | 100% | 100% | 100% | 24% | 0% | 11% | 0% | 67% | 68% | 74% | 100% | 53% | 100% |
| 8 | ריסק קולקטיבי / נכות מוחלטת ותמידית (נדיר) | 8 | 62% | 0% | 0% | 100% | 100% | 0% | 0% | 62% | 0% | 88% | 100% | 100% | 100% | 75% | 100% |
| 9 | קופת גמל להשקעה | 68 | 100% | 0% | 3% | 100% | 100% | 100% | 82% | 100% | 100% | 99% | 99% | 97% | 100% | 99% | 100% |
| 10 | גמל להשקעה: חיסכון ארוך טווח לילד | 28 | 82% | 0% | 0% | 100% | 100% | 100% | 0% | 100% | 100% | 79% | 82% | 100% | 100% | 82% | 100% |

הטבלה: אחוז הפוליסות שבהן קבוצת התגיות קיימת (שלד, גם אם ריק). כך ניתן לזהות את "טביעת האצבע" של כל סוג מוצר. בקצרה:

- קרן פנסיה (2): כיסוי מבוטח בקרן (`KisuiBKerenPensia`: שיעורי פנסיית נכות/שאירים, פנסיית זקנה צפויה), `Mutav` (מוטבים), `Tsua`, `YitraLefiGilPrisha`, תקציב מלא (`PirteiTaktziv`) עם הפקדות לפי רכיב (`KOD-SUG-HAFRASHA` 1/2/3/4), דמי ניהול (`MivneDmeiNihul`), `Halvaa` (הלוואה) ונושא פנסיה (`PENSIA-VATIKA-O-HADASHA`: 2 = חדשה, 1 = ותיקה).
- קרן השתלמות (4) וגמל (3): כמו קרן פנסיה אך `KOD-SUG-HAFRASHA` 8/9 (השתלמות: עובד/מעסיק) או 1-4 (גמל), ובלי `KisuiBKerenPensia`.
- גמל להשקעה (9) וגמל לילד (10): הפקדה עצמית (`KOD-SUG-HAFRASHA` 2 או 12 לילד), `YitraLefiGilPrisha` רק ב-9; אין כיסוי ביטוחי.
- ביטוח מנהלים/חיים עם חיסכון (1, 5): כל הקבוצות, כולל כיסוי ביטוחי (`PirteiKisuiBeMutzar`) וחיסכון (`Kupot`, `Halvaa`). `SUG-KUPA` (מוסק): 1 = קצבה (פנסיה/מנהלים), 2 = גמל, 3 = השתלמות.
- ריסק / חיים (6) ומשכנתא (7): כיסוי ביטוחי בלבד: `PirteiKisuiBeMutzar` + `SchumeiBituahYesodi` (סכום ביטוח, `SUG-MASLUL-LEBITUAH`), ללא `Tsua`, `Halvaa`, `YitraLefiGilPrisha`. קיימים `PerutMitryot` (מבטח משנה/קולקטיבי) ו-`ChovotPigurim`.

### 5.1 מבני כיסוי: אחוזים מול סכומים

- אחוזים (בקרן פנסיה): `SHEUR-KISUY-NECHUT`, `SHIUR-KISUY-YATOM`, `SHIUR-KISUY-ALMAN-O-ALMANA`, `SHIUR-KISUY-HORE-NITMACH`, `AHUZ-PENSIYA-TZVURA`, `SHEUR-TSUA-NETO` ועוד.
- סכומי קצבה (בקרן פנסיה): `KITZBAT-SHEERIM-LEYATOM`, `...LEALMAN-O-ALMANA`, `...LEHORE-NITMACH`, `SACH-PENSIAT-NECHUT`, `ALUT-KISUI-*`.
- סכומי ביטוח (בביטוח חיים): `SCHUM-BITUACH`, `SCHUM-BITUAH-LEMAVET`, `SCHUM-BITUACH-LEMASLUL`; פרמיה ב-`PirteiHaasaka/SACHAR-POLISA`.
- שיעור מול סכום בביטוח: `SUG-HATZMADA-SCHUM-BITUAH` ו-`SUG-HATZMADA-DMEI-BITUAH` (הצמדה). ערכי `SUG-HATZMADA-DMEI-BITUAH`: `2`:733, `6`:221, `1`:205, `4`:97, `0`:24.
- שדה מתחלף: ערכים ריקים נפוצים מאוד (לרוב 50-90% מהמופעים), ולעיתים `0.00` נפרד מ-ריק. הפרסר צריך לטפל ב-`0`, `0.00`, ריק כשלושה מצבים.

### 5.2 דמי ניהול

`PerutHotzaot/MivneDmeiNihul/PerutMivneDmeiNihul` (חוזר, עד כמה רכיבים לחשבון): `SUG-HOTZAA` (0/1/2: `1`:3723, `2`:2330, `0`:957), `SHEUR-DMEI-NIHUL`, `SUG-HATAVA` (הטבה: `2`:2372, `1`:1425, `6`:1008, `5`:389), `KAYEMET-HATAVA`, `OFEN-HAFRASHA`, `SACH-DMEI-NIHUL-MASLUL`; ברמת המסלול: `PerutMasluleiHashkaa` עם `SHEUR-DMEI-NIHUL-HAFKADA` ו-`SHEUR-DMEI-NIHUL-HISACHON` (+ גרסאות `-MIVNE`) ו-`SHIUR-ALUT-SHNATIT-ZPUIA-LMSLUL-HASHKAH`; ברמת הדיווח החודשי: `HotzaotBafoalLehodeshDivoach`. שיעור הוצאה מהפקדה (SUG-HOTZAA=2) ושיעור מהצבירה (1) מופיעים לעיתים באותה פוליסה (ערך 0 = ללא).

### 5.3 שכר, מעסיק והפקדות

- מעסיק: `NetuneiMutzar/YeshutMaasik` (`SHEM-MAASIK`, `SUG-MEZAHE-MAASIK`, `MISPAR-MEZAHE-MAASIK`, `MISPAR-TIK-NIKUIIM`, `IshKesherYeshutMaasik`): ערכי הזהות אינם מובאים כאן. `PirteiOved/STATUS-MAASIK`: `1`:1268, `2`:803.
- שכר: `PirteiHaasaka/SACHAR-POLISA` (שכר מבוטח), `KOD-CHISHUV-SACHAR-POLISA-O-HESHBON`, `KOD-OFEN-HATZMADA`, `SEIF-14` (`2`:1223, `3`:399, `1`:280), `ZAKAUT-LELO-TNAI`.
- הפקדות: `PerutHafkadotMetchilatShana/PerutHafkada*` חוזר פר חודש/רכיב (עד ~מאות לפוליסה; 24,329 מופעים בכל הקבצים): `ZMAN-PERAON` (yyyymm), `SUG-MAFKID` (1 עובד, 2 מעסיק, 3,4,5,6 אחרים; מוסק), `SUG-HAFRASHA`, `KOD-SUG-HAFKADA`, `SACHAR-BERAMAT-HAFKADA`. `PirteiHafkadaAchrona` הוא ההפקדה האחרונה.
- גבייה: `NetuneiGvia` (`TADIRUT-TASHLUM`, `OFEN-HATZMADAT-GVIA`, `KOD-EMTZAEI-TASHLUM`).
- הלוואות: `Halvaa` נראית ב-`YESH-HALVAA-BAMUTZAR=1` ב-15 מתוך 2,778 מופעים בלבד; שדות ההלוואה אינם ריקים רק במקרים אלו. `SUG-RIBIT` (1,2), `SUG-HECHZER` (1), `RAMAT-HALVAA` (1,2), `TKUFAT-HALVAA` בחודשים (0-84).
- תביעות: `PirteyTvia`: `YESH-TVIA` תמיד 2 (אין) למעט 2 מקרים: `SUG-HATVIAA`=5, `KOD-STATUS-TVIAA`=6, `OFEN-TASHLUM`=4 (תביעה בודדת).
- פיצויים/זכאויות: `KOLEL-ZAKAUT-AGACH` (1,2,4), `PerutShiabudIkul` (`HUTAL-SHIABUD` 1/2, `HUTAL-IKUL` 1/2/3), `TIKUN-190` (0/1/2), `PerutMeyupeKoach` (יפוי כוח).
- מוטבים: `Mutav` (עד כמה לחשבון) `SUG-ZIKA` `9`:1930, `8`:941, `2`:413, `1`:16, `3`:12, `6`:1, `7`:1; `MAHUT-MUTAV` (1/2); `HAGDARAT-MUTAV` (1/2). שמות המוטבים אישיים ולא נרשמים.
- שאירים (`NetuneiSheerim/Sheer`): `MIN` (1,2,3), `SUG-ZIKA` (1,3).

### 5.4 קרנות, מסלולי השקעה וצבירות

`PirteiTaktziv/PerutMasluleiHashkaa` חוזר פר מסלול השקעה (שם, קוד, `KOD-SUG-MASLUL` 1/2, `TSUA-NETO`, צבירה במסלול). `BlockItrot/Yitrot/PerutYitraLeTkufa` (`KOD-TECHULAT-SHICHVA` 1-14: רכיבי חיסכון/ריבית) ו-`PerutYitrot` (`KOD-SUG-ITRA` 1-3). `MeshichaNiud` (משיכות וניוד): `KOD-SUG-PEULA`, `SHEM-KOPA-MEKABELET`. `YitraLefiGilPrisha/Kupot/Kupa` (`SUG-KUPA` 1/2/3). שדות סכום וצבירה אינם מובאים כערכים.

## 6. סוגי מוצר לפי מונחי ה"מסלקה" שחסרים כנראה במדגם

לא נצפו כלל: ביטוח בריאות, סיעודי, אובדן כושר עבודה, מחלות קשות, תאונות אישיות, רכב ודירה בקבצי המסלקה (אלו יושבים בהר הביטוח, ראו סעיף 9). במסלקה נצפה רק חיסכון ארוך טווח וביטוח חיים (SUG-MUTZAR 1-10). אין סוג מוצר נפרד לקרן פנסיה ותיקה (יש דגל `PENSIA-VATIKA-O-HADASHA`).

## 7. שונות, חריגים ומוזרויות קידוד

| נושא | ממצא |
|---|---|
| הצהרת קידוד ב-XML | קיימת `encoding="UTF-8"` ב-558 קבצים; ב-1,748 קבצים אין הצהרת XML כלל. אין BOM. יש לפרש כ-UTF-8 תמיד. |
| ישויות | `&amp;` בלבד (503 מופעים); אין ישויות מספריות. |
| רווחים מובילים/נגררים | 1,716 ערכים עם רווחי קצה: בתגיות `SHEM-KISUI-YATZRAN`(540), `SHEM-MAASIK`(384), `SHEM-TOCHNIT`(295), `SHEM-MASLUL-HABITUAH`(195), `SHEM-MEYUPE-KOACH`(112), `SHEM-MASLUL-HASHKAA`(86), `SHEM-MESHALEM`(50), `SHEM-METAFEL`(37). יש לבצע trim. |
| סימני כיוון (RLM/LRM) | מופיעים בערכי `KOD-MIKTZOA` (293), `TCHUM-ISUK-CHADASH` (34), `MISPAR-TELEPHONE-KAVI` (210). `KOD-MIKTZOA` גם מרופד ברווחים פנימיים רבים. |
| תגיות ריקות | שלד מלא תמיד; חלק גדול מהשדות ריקים (ראו `empty_value_pct`). ערך `0` שונה מריק. |
| פורמט תאריכים | `TAARICH-BITZUA`: 14 ספרות. תאריכים אחרים: 8 ספרות `yyyymmdd`. תקופות: `yyyymm` (`ZMAN-PERAON`). מספרים: נקודה עשרונית, ללא פסיק אלפים, לעיתים 0 ללא עשרוניים. |
| מספר לקוחות בקובץ | 2,298 קבצים עם לקוח אחד, 8 עם שניים. מזהה הלקוח חוזר ברמת `Mutzar`. |
| מוצר ללא חשבון | לא נצפה (`Mutzar` ללא `HeshbonOPolisa`: 0). |
| פוליסה ללא SUG-POLISA | 1583 (כל הקרנות והגמל: תקין ולא חריג). |
| חוסר זהות לקוח | `mutzar_without_client_id`=0. |
| הרצות חוזרות | 1,057 צירופי (תיקייה, משפחה); ב-579 מהם יותר מהרצה אחת. מתוכם בקבוצת הרצות ב-354 קבוצות קבוצת המוצרים/סטטוס שונה בין ההרצות, ב-225 זהה, וב-457 קבוצות יש שתי הרצות עם אותו `TAARICH-BITZUA` (כלומר עותקי קובץ זהים). פרסר צריך לדעת לבחור "הרצה אחרונה" לפי `TAARICH-BITZUA` ולהתעלם מעותקים. |
| חפיפה בין משפחות | אין (חפיפת מפתחות פוליסה בין משפחות באותה תיקייה: מקרה בודד). |
| שדות ספירת סגירה | `ReshumatSgira` לא אמינים (ראו סעיף 2.4). |
| קבצים עם שם בלי משפחה | 3 קבצים: ללא קוד משפחה בשם הקובץ; יש לזהות לפי תוכן. |

## 8. קבצי PDF נלווים של המסלקה

ארבעה PDF ל"הרצה": `*_PDF_TAX_COMPENSATION.pdf` (פיצויים מס), `*_PDF_TAX_DEPOSITS.pdf` (הפקדות מס), `*_PDF_SPOUSES_SHARE_SAVINGS.pdf` (חלק בן/בת זוג בחיסכון), `*_PDF_MIN_ACCUMULATE_AMOUNT.pdf` (סכום צבירה מינימלי). שמות: `<9 ספרות>_<12 ספרות>_PDF_<סוג>.pdf` (אותו מזהה כמו ה-XML של אותה הרצה), לעיתים עם קידומת `._` (שאריות macOS: להתעלם), קידומת סימוני כיוון, או סיומת " - עותק". 4 סוגים x 508. במחשב אין קבצי xls נלווים. לא נסרקו תוכני ה-PDF (לא נדרש למשימה).

## 9. הר הביטוח

### 9.1 מבנה הקובץ

- גיליון יחיד: `תיק ביטוחי`; 11 עמודות (1,853 קבצים) או 12 (23 קבצים: עמודה נוספת עם כותרת ריקה ובה ערך טקסט קבוע בשורות נבחרות, 161 תאים).
- שורה 1 ריקה. שורה 2: כותרת קבועה (מיזוג תאים B2:E2, רוחב 4 עמודות) בנוסח "התיק הביטוחי, הופק מאתר הר הביטוח של משרד האוצר, בתאריך" ובתא נפרד (עמודה F) תאריך בפורמט `dd/mm/yyyy` כטקסט. שורה 3 ריקה. שורה 4: כותרות. נתונים מתחילים בשורה 5.
- כותרות (בסדר): `תעודת זהות`, `ענף ראשי`, `ענף (משני)`, `סוג מוצר`, `חברה`, `תקופת ביטוח`, `פרטים נוספים`, `פרמיה בש"ח`, `סוג פרמיה`, `מספר פוליסה`, `סיווג תכנית`.
- שורות "תחום": שורה שרק העמודה השנייה בה מלאה, בצורה `תחום - ...`. הערכים שנצפו: `תחום - בריאות ותאונות אישיות` (1520); `תחום - חיים ואבדן כושר עבודה` (1417); `תחום - כללי` (1197). בכל קובץ 0-3 שורות תחום (התפלגות: 0=38, 1=433, 2=514, 3=891). כל שורות הנתונים שאחריה שייכות לתחום האחרון.
- תבניות מסכת תאים מלאים (עמודות 1-11, 1=מלא): `11111101111`: 20757; `11111111111`: 4223; `01000000000`: 4134; `00000011000`: 333; `00000000000`: 66; `00000001000`: 27; `11111001111`: 23.
- שורות המשך: 333 שורות שבהן תעודת הזהות ריקה ו"פרטים נוספים" ו"פרמיה" מלאים (פרמיה מקובצת: סה"כ חודשי/שנתי/גילום).

### 9.2 ערכים מקודדים (ספירת שורות)

**ענף ראשי** (9 ערכים): ביטוח בריאות (11514); ביטוח רכב (5770); ביטוח חיים (4289); ביטוח דירה (1064); ביטוח סיעודי (946); כתב שירות (917); אבדן כושר עבודה (404); ביטוח עסק (99); (empty) (27)

**סוג מוצר** (24 ערכים): פוליסת ביטוח (20572); כתב שירות שירותי דרך וגרירה (664); כתב שירות שמשות (599); כתב שירות רכב חלופי (364); תרופות - בסיס (295); כתב שירות נזקי מים (274); אחר (257); כתב שירות טיפול משפטי - צד שלישי (250); כתב שירות שמשות מורחב (226); כתב שירות שירותי רכב וגרירה מורחב (225); כתב שירות פנסים ומראות (191); השתלות (187); ניתוחים בחו"ל (187); ייעוץ ובדיקות (159); כתב שירות רדיו חלופי (137); כתב שירות רכב חלופי מורחב (עד הבית) (131); כתב שירות איטום וחירום (90); ניתוחים עם פיצוי על פנייה לציבורי/שב"ן (60); תאונות אישיות (57); ניתוחים אחידה (35); (empty) (27); אבדן כושר עבודה (27); כתב שירות חבילת נזקי מים מורחב (כולל איטום וחירום) (13); מחלות קשות (3)

**חברה** (16 ערכים): הראל חברה לביטוח בע"מ (9743); מנורה מבטחים ביטוח בע"מ (4240); מגדל חברה לביטוח בע"מ (2399); כלל חברה לביטוח בע"מ (2196); הפניקס חברה לביטוח בע"מ (2014); איילון חברה לביטוח בע"מ (1276); איי. די. איי. חברה לביטוח בע"מ (1202); איי אי ג'י ישראל חברה לביטוח בע"מ (377); שומרה חברה לביטוח בע"מ (364); ליברה חברה לביטוח בע"מ (319); ווישור חברה לביטוח בע"מ (306); ש. שלמה חברה לביטוח בע"מ (281); הכשרה חברה לביטוח בע"מ (223); התאגיד המנהל של המאגר לביטוח רכב חובה ("הפול") בע"מ (57); (empty) (27); אנקור חברה לביטוח בע"מ (6)

**סוג פרמיה** (4 ערכים): חודשית (17955); שנתית (6933); חד פעמית (115); (empty) (27)

**סיווג תכנית** (4 ערכים): אישי (19351); קבוצתי (4817); קבוצתי קופת חולים (835); (empty) (27)

**ענף (משני)** (52 ערכים): ביטוח חיים למקרה מוות (3538); ביטוח מקיף (3228); רכב חובה (1547); חבילת כיסויים (1512); תאונות אישיות (1165); השתלות (1055); מחלות קשות (1040); תרופות - בסיס (985); ייעוץ ובדיקות (979); סיעודי עד 3 חודשים (902); ביטוח צד ג (840); ניתוחים בחו"ל (827); ביטוח מבנה (773); כתב שירות אבחון מהיר (472); תרופות - הרחבה (401); ניתוחים בחו"ל-אחידה (367); תרופות מחוץ לסל-אחידה (363); שיניים (362); השתלות-אחידה (359); נכויות (352); ניתוחים - אחר (333); תרופות - בסיס + הרחבה (319); טיפולים וטכנולוגיות מתקדמות ואביזרים רפואיים (292); אחר (275); אבדן כושר עבודה שחרור ופיצוי (270); ניתוחים אחידה - משלים שב"ן (262); ביטוח חיים חיסכון טהור (259); ניתוחים אחידה (243); כתב שירות רפואה משלימה (224); ביטוח מבנה ותכולה (212); מקיף ללא גניבה (155); ביטוח חיים משולב בחיסכון (142); אבדן כושר עבודה שחרור (134); מקיף לבית עסק (99); ניתוחים עם השתתפות עצמית (89); כתב שירות ליווי בעת מחלה (80); ביטוח תכולה (79); נספח טיפולים מחליפי ניתוח (76); אבדן כושר עבודה (59); כתב שירות ניהול רפואי אישי (57); אמבולטורי אחר (55); ליווי וטיפולים אגב אירוע רפואי (45); סיעודי - המתנה של 37-60 חודשים (44); מוות מתאונה (38); כתב שירות רפואת ספורט (32); (empty) (27); כתב שירות רופא און ליין (14); ניתוחים עם פיצוי על פנייה לציבורי/שב"ן (14); ניתוחים אחידה משלים שב"ן עם השתתפות עצמית (11); כתב שירות ליווי אשפוז (11); ייעוץ, אבחון רפואי ובדיקות (8); ניתוחים משלים שב"ן (5)

**סיווג תכנית לפי סוג מוצר**: פוליסת ביטוח: אישי=16001, קבוצתי=3736, קבוצתי קופת חולים=835; כתב שירות שירותי דרך וגרירה: אישי=664; כתב שירות שירותי רכב וגרירה מורחב: אישי=225; כתב שירות רכב חלופי: אישי=364; כתב שירות שמשות מורחב: אישי=226; כתב שירות רדיו חלופי: אישי=137 ...

### 9.3 פורמטים וחריגים

- `תקופת ביטוח`: טקסט `dd/mm/yyyy - dd/mm/yyyy` (18,473), `מתחדש` (5,604), `לכל החיים` (903), ריק (50). אין תאריכי אקסל. תאריך סיום רחוק (עד 2071) מתאר פוליסות ארוכות.
- `פרטים נוספים`: תבניות (הספרות מוחלפות ב-#): `גיל הנהג הצעיר ביותר #` (2725); `*פוליסת נהג נקוב` (1498); `סה״כ חודשי` (120); `סה״כ שנתי` (113); `גילום שנתי לחודשי` (39); `גילום משנתי לחודשי` (27); `גילום שנתי וחודשי` (27); `שנתי` (7). בעיקר בביטוח רכב: גיל הנהג הצעיר ביותר, "פוליסת נהג נקוב", ובשורות המשך הערות פרמיה (סה"כ חודשי/שנתי, גילום).
- `פרמיה בש"ח`: מספר (float או int), לרוב `ללא` מטבע; סוג הפרמיה קובע: חודשית: float 15767, int 2188; שנתית: float 5763, int 1170; חד פעמית: float 81, int 34; (ריק): str:text:=(H6+H7+H10)/12 27. בשורת סיכום ידנית (27 שורות, תעודת זהות וענף ריקים) התא מכיל נוסחה כטקסט שמתחילה ב-`=` (נוספה ידנית אחרי הייצוא; יש להתעלם).
- `תעודת זהות`: int (אפסים מובילים אבדו), ובקובצי 2-אנשים תא נפרד עם הטקסט `;` (21 תאים).
- `מספר פוליסה`: int (24,001) או טקסט עם מפרידי מקף ובסוף מקף (`99+-99+-`, 904) או בלי (88). מכיל לעיתים מספרי ארגון משולבים. אין להניח ייחודיות.
- שיוך אנשים: קבצים עם 0 מזהים (38, ריקים), 1 (1,817), 2 (21: בני משפחה). אין אינדיקציה בשורה לאיזה אדם השייכות מלבד עמודת הזהות.
- כפילויות: ב-185 קבצים יש שורות זהות לחלוטין. יש להסיר/לספור פעם אחת.
- רווחי קצה: תאים ב-`ענף (משני)` (76). סימני כיוון בתאי נתונים: לא נצפו; כן בשמות קבצים (קידומת U+200F).
- גודל: 0-60 שורות נתונים לקובץ (0=369, 5=453, 10=368, 15=189, 20=258, 25=96, 30=84, 35=2, 40=57).
- קבצים שאינם קריאים: BadZipFile=79, magic 00051607=79 (79 קבצי AppleDouble).
- שמות קבצים (ממוסכים): `HbResults-9999-99-99_99-99-99-PM.xlsx` (1399); `HbResults-9999-99-99_99-99-99-AM.xlsx` (190); `‏‏H H H H - H.xlsx` (63); `HbResults-9999-99-99_99-99-99-PM (9).xlsx` (55); `H H H H. 99.99xlsx.xlsx` (32); `._H H H H. 99.99xlsx.xlsx` (30); `H H H H.999.99xlsx.xlsx` (27); `‏‏H H H H. 99.99xlsx - H.xlsx` (22).

## 10. מקורות נוספים (סוגים בלבד)

- `דוח מצב טרום טיפול`: 18 PDF בגודל זהה 421,777 בתים (עותקים של אותו מסמך) ו-txt אחד. לא נסקרו תוכנו.
- Surense: לא נמצאו ייצואי לקוחות. 19 xlsx בגודל זהה (תבנית), 4 קבצי sql, 2 md, 1 ts, 2 zip: חומרי פיתוח של צינור הנתונים.
- פוליסות/לוחות סילוקין של חברות הביטוח: לא נמצאו בשמות מזוהים.

## 11. פערים: פרמטרים שמופיעים בדוגמאות הדוח אך לא בקובצי המקור

בדיקה אוטומטית של כל התגיות שמוזכרות בקוד הפרסרים ובמסמך הדוחות (`src/reports/parsers`, `docs/product/REPORTS.md`) מול איחוד כל התגיות במדגם: כל התגיות קיימות בקבצים האמיתיים (אין תגית שהפרסר מניח ואינה קיימת). פערי הסמנטיקה והכיסוי:

1. זיהוי משפחה: `FAMILY_FROM_FILENAME = /CONSLT(INK|INP|KGM|PNN)/` מחמיץ את תבנית ה-underscore (רוב הקבצים) ואת ING, INM, PNO.
2. מיפוי `SUG_MUTZAR`: חסרים 1 (מנהלים), 3 (גמל), 5, 6 (חיים/ריסק), 10 (גמל לילד), והמיפוי של 4 הוא "provident" בעוד המקור הוא קרן השתלמות (הפרסר מתקן זאת בשם התוכנית). משפחות ING/INM/PNO לא מוכרות ולכן 1 ו-6 נופלים ל-"provident" כברירת מחדל.
3. `STATUS_POLISA`: 3,4,6,7,8,9,10 קיימים ולא ממופים.
4. `KOD-SUG-HAFRASHA`: הערכים 4, 8, 9, 10, 12 קיימים (השתלמות עובד/מעסיק, גמל לילד); הפרסר מכיר 1-3 בלבד. `SUG-MAFKID`: 3-6 קיימים (מעבר ל-1,2).
5. אין במקורות: ביטוח בריאות/סיעוד/אכ"ע/רכב/דירה (רק בהר הביטוח), תשואות בפועל לחודש (קיימת רק `TSUA-NETO` ושיעורי תשואה במסלול).
6. אין בהר הביטוח: מזהה ישיר למוצר בסוגי הפנסיה והגמל (הר הביטוח כולל בעיקר ביטוח), ולכן שילוב שני המקורות מבוצע לפי חברה + מספר פוליסה בלבד.

## 12. מטריצת בדיקות לפרסרים (מופשט)

| # | מקרה | מה הפרסר חייב לעשות |
|---|---|---|
| 1 | קובץ ללא הצהרת XML / עם הצהרה UTF-8 | לפענח UTF-8 בשני המקרים |
| 2 | שם קובץ בתבנית CONSLT או underscore, עם קידומת RLM/סיומת עותק, או ללא קוד משפחה | לזהות משפחה לפי תוכן; לא להיכשל |
| 3 | גרסה 008 ו-009 | לקרוא את שתיהן; לא לסמוך על הגרסה לקביעת מבנה |
| 4 | שדות ריקים (שלד מלא) | לפרש ריק כ"אין נתון", שונה מ-0 ומ-0.00 |
| 5 | רווחי קצה וסימני RLM/LRM בערכי טקסט | trim והסרת סימני כיוון |
| 6 | קובץ עם 2 לקוחות | לפצל לפי YeshutLakoach בכל Mutzar; לא להניח לקוח אחד |
| 7 | מוצר עם 2-5 חשבונות (HeshbonOPolisa) | לכלול את כולם; לא רק הראשון |
| 8 | פוליסה לא פעילה (STATUS 2) וערכי סטטוס 3-10 | לא להסתיר; לדווח כ"לא ממופה" כשאין מיפוי |
| 9 | SUG-MUTZAR שלא ממופה / נדיר (5, 8) | לא לקרוס; סיווג "אחר" |
| 10 | מוצר ביטוחי בלי Tsua/Halvaa/YitraLefiGilPrisha | לא לדרוש קבוצות חיסכון |
| 11 | קרן פנסיה ללא SUG-POLISA | לא להניח שדה סוג פוליסה |
| 12 | ReshumatSgira לא תואם ספירה בפועל | להתעלם מהספירות |
| 13 | הרצות חוזרות של אותו לקוח/משפחה, כולל עותקים זהים | לבחור הרצה אחרונה לפי TAARICH-BITZUA; לא לספור פעמיים |
| 14 | אותו יצרן עם מספר שמות לאותו KOD-MEZAHE-YATZRAN | לאחד לפי מזהה |
| 15 | הפקדות רבות (מאות פריטים בפוליסה) | ביצועים; לא לפרוס הכל לטבלה |
| 16 | הלוואה פעילה בפוליסה (נדיר, YESH-HALVAA=1) | לטפל בשדות ההלוואה רק כשיש |
| 17 | הר הביטוח: קובץ "._" או לא zip | לדלג בלי להפיל את הטעינה |
| 18 | הר הביטוח: גיליון בעל שם `תיק ביטוחי`, 11 או 12 עמודות | לזהות לפי שורת הכותרות (שורה 4) ולא לפי אינדקס; להתעלם מעמודה 12 |
| 19 | הר הביטוח: שורות תחום, שורות המשך, שורת נוסחה/סיכום, שורות כפולות, תעודת זהות ";" | לשייך לתחום, לצרף שורות המשך לפוליסה הקודמת, לדלג על נוסחאות ועל ";" |
| 20 | הר הביטוח: פוליסה כטקסט עם מקפים או int בלי אפסים; פרמיה חודשית/שנתית/חד פעמית | לנרמל; לא להשוות ל-XML לפי התאמה מדויקת |
| 21 | הר הביטוח: קובץ ריק (0 נתונים) או 2 אנשים | להחזיר ריק תקין; לפצל לפי ת.ז. |
| 22 | הר הביטוח: תקופת ביטוח "מתחדש"/"לכל החיים"/ריק | לא לפרש כתאריך |
