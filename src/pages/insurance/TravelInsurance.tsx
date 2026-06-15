import InsurancePageTemplate from '@/components/InsurancePageTemplate';
import { Plane, Heart, Briefcase } from 'lucide-react';
import travelLogos from '@/assets/travel-insurance-logos.jpeg';

const TravelInsurance = () => {
  const quickPurchaseBanner = (
    <section className="py-10 sm:py-16">
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        <div className="rounded-2xl bg-[#1a1a4b] p-8 sm:p-12 text-center space-y-6">
          <h2 className="text-2xl sm:text-3xl font-bold text-white">רכשו ביטוח נסיעות לחו״ל עכשיו</h2>
          <p className="text-white/70 text-base sm:text-lg">רכישה מהירה ומאובטחת דרך הראל ביטוח — הסוכן שלכם ב-SEELD</p>
          <div className="relative inline-block">
            <img
              src={travelLogos}
              alt="הראל ביטוח נסיעות לחו״ל - PassportCard"
              className="max-w-xs md:max-w-sm mx-auto rounded-xl shadow-lg border border-white/10"
            />
            <div className="absolute inset-0 flex">
              <a
                href="https://digital.harel-group.co.il/travel-policy?guid=bee1d408-c6a7-410e-b4ee-ac690224bdd3&an=025318"
                target="_blank"
                rel="noopener noreferrer"
                className="w-1/2 h-full cursor-pointer rounded-l-xl hover:bg-white/5 transition-colors"
                title="רכישת ביטוח הראל"
              />
              <a
                href="https://buy.passportcard.co.il/?AffiliateId=fOYE25Ik9VYSMk30irogAg%3D%3D"
                target="_blank"
                rel="noopener noreferrer"
                className="w-1/2 h-full cursor-pointer rounded-r-xl hover:bg-white/5 transition-colors"
                title="רכישת ביטוח PassportCard"
              />
            </div>
          </div>
          <p className="text-white/50 text-sm">לחצו על הלוגו לרכישה מיידית</p>
        </div>
      </div>
    </section>
  );

  return (
    <InsurancePageTemplate
      heroIcon={Plane}
      heroIconColor="#3b3f99"
      heroCategory="ביטוח נסיעות"
      heroTitle="ביטוח נסיעות לחו״ל"
      heroDescription="טסים בראש שקט לכל מקום בעולם — כיסוי רפואי, אובדן מזוודות, ביטול טיסה ועוד."
      heroCTAText="רכשו ביטוח עכשיו"
      breadcrumbLabel="ביטוח נסיעות"
      keyPoints={[
        {
          title: "כיסוי רפואי",
          description: "טיפול רפואי ואשפוז בכל מקום בעולם, פינוי רפואי וטיפולי שיניים חירום.",
          icon: Heart,
        },
        {
          title: "מזוודות וכבודה",
          description: "פיצוי במקרה של אובדן מזוודות, עיכוב כבודה או נזק לציוד אישי.",
          icon: Briefcase,
        },
        {
          title: "ביטול נסיעה",
          description: "החזר הוצאות במקרה של ביטול טיסה, קיצור נסיעה או איחור בטיסה.",
          icon: Plane,
        },
      ]}
      extraContentAfterKeyPoints={quickPurchaseBanner}
      articles={[
        {
          title: "למה זה חשוב?",
          paragraphs: [
            "נסיעה לחו״ל ללא ביטוח היא הימור מסוכן. טיפול רפואי בחו״ל עולה עשרות ואף מאות אלפי שקלים — אשפוז של כמה ימים בארה״ב יכול להגיע לסכומים אסטרונומיים. גם אירועים כמו ביטול טיסה, אובדן מזוודות או גניבת דרכון יכולים להפוך חופשה לסיוט כלכלי.",
            "ביטוח נסיעות מעניק לכם שקט נפשי מוחלט: כיסוי רפואי מלא, פינוי רפואי, סיוע בשפה שלכם, החזר הוצאות בגין ביטולים, ופיצוי על אובדן כבודה. בעלות של כמה עשרות שקלים ליום, אתם קונים ביטחון שלא יסולא בפז.",
          ],
        },
        {
          title: "מתי כדאי לרכוש?",
          paragraphs: [
            "כדאי לרכוש ביטוח נסיעות מיד עם הזמנת הטיסה או חבילת הנופש. כך תהנו גם מכיסוי לביטול הנסיעה מסיבות רפואיות או אחרות. ככל שתרכשו מוקדם יותר, כך הכיסוי שלכם רחב יותר ואתם מוגנים מרגע הרכישה.",
            "חשוב במיוחד לדאוג לביטוח כשנוסעים ליעדים עם עלויות רפואיות גבוהות כמו ארה״ב או אירופה, כשנוסעים עם ילדים, כשמתכננים פעילויות ספורט אתגרי, או כשיש מצב רפואי קיים שדורש הצהרת בריאות מוקדמת.",
          ],
        },
        {
          title: "מה חשוב לדעת?",
          paragraphs: [
            "בבחירת ביטוח נסיעות, שימו לב לסכום הכיסוי הרפואי (מומלץ לפחות מיליון דולר ליעדים יקרים), חריגי הפוליסה, כיסוי ספורט אתגרי, כיסוי מצבים רפואיים קודמים, ומוקד חירום 24/7 בעברית. יש הבדלים גדולים בין פוליסות שנראות דומות.",
            "ב-SEELD אנחנו משווים עבורכם בין כל חברות הביטוח המובילות ומוצאים את הפוליסה המתאימה ביותר ליעד, למשך הנסיעה ולצרכים הספציפיים שלכם.",
          ],
        },
      ]}
      faqItems={[
        {
          q: "האם ביטוח נסיעות מכסה גם קורונה?",
          a: "רוב הפוליסות העדכניות כוללות כיסוי לקורונה ומחלות מדבקות אחרות, כולל אשפוז, בידוד וביטול נסיעה. חשוב לוודא שהכיסוי מפורט בתנאי הפוליסה.",
        },
        {
          q: "מה קורה אם אני צריך פינוי רפואי?",
          a: "ביטוח נסיעות מקיף כולל כיסוי לפינוי רפואי לישראל או למדינה קרובה עם בית חולים מתאים. זהו אחד הרכיבים היקרים ביותר שהביטוח מכסה ויכול להגיע למאות אלפי דולרים.",
        },
        {
          q: "האם כרטיס אשראי מספק ביטוח נסיעות?",
          a: "חלק מכרטיסי האשראי מציעים ביטוח נסיעות בסיסי, אך הכיסוי בדרך כלל מוגבל מאוד — סכומים נמוכים, חריגים רבים, ותהליך תביעות מסובך. מומלץ תמיד לרכוש ביטוח ייעודי.",
        },
      ]}
      insuranceType="travel"
      enrollmentTitle="רכישת ביטוח נסיעות"
      enrollmentDescription="מלאו את פרטי הנסיעה ונחזור אליכם עם הצעה"
    />
  );
};

export default TravelInsurance;
