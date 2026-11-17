import InsurancePageSd from '@/components/sd/InsurancePageSd';
import { Plane, Heart, Briefcase } from 'lucide-react';
import travelLogos from '@/assets/travel-insurance-logos.jpeg';

const TravelInsurance = () => {
  const quickPurchaseBanner = (
    <section className="py-10 sm:py-16">
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        <div className="rounded-2xl bg-[#203957] p-8 sm:p-12 text-center space-y-6">
          <h2 className="text-2xl sm:text-3xl font-bold text-white">רכשו ביטוח נסיעות לחו״ל עכשיו</h2>
          <p className="text-white/70 text-base sm:text-lg">אפשר לרכוש ישירות דרך הראל או PassportCard, בליווי הצוות שלנו ב-SEELD</p>
          <div className="relative inline-block">
            <img
              src={travelLogos}
              alt="הראל ביטוח נסיעות לחו״ל - PassportCard"
              width={1206}
              height={365}
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
          <p className="text-white/50 text-sm">לחצו על הלוגו כדי לעבור לרכישה</p>
        </div>
      </div>
    </section>
  );

  return (
    <InsurancePageSd
      heroIcon={Plane}
      heroIconColor="#b91c1c"
      heroCategory="ביטוח נסיעות"
      heroTitle="ביטוח נסיעות לחו״ל"
      heroDescription="כיסוי רפואי, אובדן מזוודות, ביטול טיסה ועוד, כדי שתוכלו לחשוב על הטיול ולא על מה יקרה אם משהו ישתבש."
      heroCTAText="רכשו ביטוח עכשיו"
      breadcrumbLabel="ביטוח נסיעות"
      keyPoints={[
        {
          title: "כיסוי רפואי",
          description: "טיפול רפואי ואשפוז בחו״ל, פינוי רפואי וטיפולי חירום, בהתאם לתנאי הפוליסה.",
          icon: Heart,
        },
        {
          title: "מזוודות וכבודה",
          description: "כיסוי לאובדן מזוודות, עיכוב כבודה או נזק לציוד אישי, בהתאם לפוליסה.",
          icon: Briefcase,
        },
        {
          title: "ביטול נסיעה",
          description: "החזר הוצאות במקרים מוגדרים, כמו ביטול או קיצור נסיעה. התנאים נקבעים בפוליסה.",
          icon: Plane,
        },
      ]}
      extraContentAfterKeyPoints={quickPurchaseBanner}
      articles={[
        {
          title: "למה זה חשוב?",
          paragraphs: [
            "טיפול רפואי בחו״ל יכול להיות יקר מאוד, במיוחד ביעדים כמו ארצות הברית, וגם אירועים כמו ביטול טיסה, מזוודה שלא הגיעה או גניבת דרכון עלולים להפוך חופשה להוצאה גדולה ולא צפויה.",
            "ביטוח נסיעות נועד לתת מענה לרגעים כאלה: כיסוי רפואי, פינוי רפואי, סיוע בזמן האירוע, החזר הוצאות בגין ביטולים ופיצוי על אובדן כבודה, בהתאם לתנאי הפוליסה.",
          ],
        },
        {
          title: "מתי כדאי לרכוש?",
          paragraphs: [
            "כדאי לבדוק את הנושא כבר בעת הזמנת הטיסה או חבילת הנופש. כשרוכשים מוקדם, אפשר לקבל כיסוי גם לביטול הנסיעה, בהתאם לתנאי הפוליסה.",
            "זה חשוב במיוחד כשנוסעים ליעדים עם עלויות רפואיות גבוהות, כשנוסעים עם ילדים או עם הורים מבוגרים, כשמתכננים ספורט אתגרי, או כשיש מצב רפואי קיים שצריך להצהיר עליו מראש.",
          ],
        },
        {
          title: "מה חשוב לדעת?",
          paragraphs: [
            "בבחירת ביטוח נסיעות כדאי לבדוק את סכום הכיסוי הרפואי ואת התאמתו ליעד, את חריגי הפוליסה, כיסוי לספורט אתגרי, כיסוי למצבים רפואיים קודמים, ואיך מתקבל סיוע בזמן חירום. יש הבדלים בין פוליסות שנראות דומות.",
            "אנחנו ב-SEELD משווים בין הצעות ומסבירים אותן, כדי שתבחרו פוליסה שמתאימה ליעד, למשך הנסיעה ולמה שאתם מתכננים לעשות שם.",
          ],
        },
      ]}
      faqItems={[
        {
          q: "האם ביטוח נסיעות מכסה גם קורונה?",
          a: "זה תלוי בפוליסה. יש פוליסות שכוללות כיסוי למחלות מדבקות כמו קורונה, ויש שמגבילות אותו. כדאי לבדוק את זה בתנאי הפוליסה לפני הרכישה.",
        },
        {
          q: "מה קורה אם אני צריך פינוי רפואי?",
          a: "פוליסות נסיעות רבות כוללות פינוי רפואי, לישראל או למוסד רפואי מתאים בקרבת מקום. זה אחד הרכיבים היקרים בביטוח, ולכן כדאי לוודא שהוא כלול ולהבין באילו תנאים.",
        },
        {
          q: "האם כרטיס אשראי מספק ביטוח נסיעות?",
          a: "חלק מכרטיסי האשראי כוללים ביטוח נסיעות בסיסי, אבל הוא לרוב מוגבל יותר מפוליסה ייעודית, בסכומים ובחריגים. כדאי לקרוא את התנאים ולבדוק אם הם מתאימים ליעד ולמה שאתם מתכננים.",
        },
      ]}
      insuranceType="travel"
      enrollmentTitle="רכישת ביטוח נסיעות"
      enrollmentDescription="השאירו את פרטי הנסיעה ונחזור אליכם עם הצעה"
    />
  );
};

export default TravelInsurance;
