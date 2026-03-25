import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  HelpCircle, ArrowRight, ChevronDown, Mail, Phone,
  MessageCircle, BookOpen, Shield, Zap, Users, Settings, Target, FileText,
} from 'lucide-react';

type FAQItem = { q: string; a: string; icon: React.ElementType };

const FAQ_SECTIONS: { title: string; color: string; items: FAQItem[] }[] = [
  {
    title: 'תחילת עבודה',
    color: '#5ec6c6',
    items: [
      {
        q: 'איך מוסיפים לקוח חדש?',
        a: 'בדשבורד, לחצו על "לקוחות" ואז על כפתור "לקוח חדש" בפינה הימנית העליונה. מלאו את פרטי הלקוח ולחצו "שמירה". הלקוח יתווסף אוטומטית לרשימת הלקוחות שלכם.',
        icon: Users,
      },
      {
        q: 'איך מעלים קבצי מסלקה?',
        a: 'גשו ל"טעינת קבצים" מהתפריט הראשי. גררו את קבצי ה-XML מהמסלקה לאזור ההעלאה, או לחצו לבחור קבצים. המערכת תעבד את הקבצים אוטומטית ותעדכן את מוצרי הלקוחות.',
        icon: FileText,
      },
      {
        q: 'מה זה PDage?',
        a: 'PDage הוא כלי חכם לניתוח מסמכי PDF של חברות ביטוח. הוא מזהה חוסרים בכיסוי, מציג את הנתונים בצורה ברורה, ומאפשר לכם לייצר המלצות מדויקות ללקוחות.',
        icon: Zap,
      },
    ],
  },
  {
    title: 'ניהול לקוחות',
    color: '#f4a261',
    items: [
      {
        q: 'איך יוצרים המלצה ללקוח?',
        a: 'בכרטיס הלקוח, לחצו על "אני רוצה..." ובחרו "יפויי כוח מרחוק" או "יפויי כוח בפגישה". לחילופין, גשו ל"יצירת המלצה" מהתפריט ובחרו לקוח ממאגר הלקוחות.',
        icon: Shield,
      },
      {
        q: 'מה זה בנק ההמלצות?',
        a: 'בנק ההמלצות מכיל תבניות המלצות מוכנות שתוכלו להשתמש בהן עבור לקוחות. תוכלו ליצור תבניות חדשות ולהתאים אותן לפי סוג הלקוח או סוג הביטוח.',
        icon: BookOpen,
      },
      {
        q: 'איך עוקבים אחרי ביצוע?',
        a: 'בעמוד "ביצוע" תמצאו את כל התהליכים הפתוחים. בעמוד "פולואפ" תוכלו לראות תזכורות ומעקבים. יומן הפעולות מתעד כל פעולה שבוצעה במערכת.',
        icon: Target,
      },
    ],
  },
  {
    title: 'הגדרות וחשבון',
    color: '#6c63ff',
    items: [
      {
        q: 'איך משנים פרטי סוכנות?',
        a: 'גשו ל"הגדרות" מהתפריט הראשי. בלשונית "פרטי הסוכנות" תוכלו לעדכן את שם הסוכנות, לוגו, כתובת, ופרטי התקשרות.',
        icon: Settings,
      },
      {
        q: 'מה עושים עם לידים שמגיעים מהאתר?',
        a: 'לידים שנכנסים דרך האתר מופיעים בעמוד "לידים". שם תוכלו לראות את הפרטים, ליצור קשר, ולהמיר אותם ללקוחות במערכת.',
        icon: Target,
      },
      {
        q: 'איך מייצאים דוח ללקוח?',
        a: 'בכרטיס הלקוח, לחצו על "אני רוצה..." ובחרו "לשלוח דוח ללקוח". המערכת תייצר דוח מסודר עם כל המוצרים והכיסויים של הלקוח.',
        icon: FileText,
      },
    ],
  },
];

function FAQAccordion({ item, isOpen, onToggle }: { item: FAQItem; isOpen: boolean; onToggle: () => void }) {
  const Icon = item.icon;
  return (
    <div className="border border-gray-100 rounded-2xl overflow-hidden bg-white hover:shadow-sm transition-shadow">
      <button onClick={onToggle}
        className="w-full flex items-center gap-3 p-4 text-right transition-colors hover:bg-gray-50/50">
        <div className="w-9 h-9 rounded-full bg-[#0a3d3d]/5 flex items-center justify-center flex-shrink-0">
          <Icon className="w-4 h-4 text-[#0a3d3d]" />
        </div>
        <span className="flex-1 text-sm font-extrabold text-[#0a3d3d]">{item.q}</span>
        <motion.div animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.2 }}>
          <ChevronDown className="w-4 h-4 text-gray-400" />
        </motion.div>
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.25 }}>
            <div className="px-4 pb-4 pr-16">
              <p className="text-sm text-gray-500 leading-relaxed">{item.a}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function HelpPage() {
  const navigate = useNavigate();
  const [openItem, setOpenItem] = useState<string | null>(null);

  const toggle = (key: string) => setOpenItem(prev => prev === key ? null : key);

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto" dir="rtl">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <button onClick={() => navigate('/app/dashboard')}
          className="w-10 h-10 rounded-full bg-[#0a3d3d] flex items-center justify-center hover:bg-[#0a3d3d]/80 transition-colors">
          <ArrowRight className="w-5 h-5 text-white" />
        </button>
        <div className="w-12 h-12 rounded-full bg-[#5ec6c6] flex items-center justify-center shadow-lg">
          <HelpCircle className="h-5 w-5 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-extrabold text-[#0a3d3d]">מרכז עזרה</h1>
          <p className="text-sm text-gray-400">שאלות נפוצות ותמיכה</p>
        </div>
      </div>

      {/* Hero */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl p-6 sm:p-8 mb-8 relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #0a3d3d 0%, #145454 100%)' }}>
        <div className="absolute top-0 left-0 w-40 h-40 rounded-full bg-[#5ec6c6]/10 -translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 right-0 w-32 h-32 rounded-full bg-[#f4a261]/10 translate-x-1/3 translate-y-1/3" />
        <div className="relative">
          <h2 className="text-xl sm:text-2xl font-black text-white mb-2">איך נוכל לעזור?</h2>
          <p className="text-sm text-[#5ec6c6]/80 max-w-lg">
            כאן תמצאו תשובות לשאלות נפוצות על השימוש בפלטפורמת SEELD.
            לא מצאתם תשובה? צרו קשר ונשמח לסייע.
          </p>
        </div>
      </motion.div>

      {/* FAQ Sections */}
      {FAQ_SECTIONS.map((section, si) => (
        <motion.div key={section.title} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: si * 0.1 }} className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: section.color }} />
            <h3 className="text-lg font-extrabold text-[#0a3d3d]">{section.title}</h3>
          </div>
          <div className="space-y-2">
            {section.items.map((item, ii) => {
              const key = `${si}-${ii}`;
              return (
                <FAQAccordion key={key} item={item} isOpen={openItem === key} onToggle={() => toggle(key)} />
              );
            })}
          </div>
        </motion.div>
      ))}

      {/* Contact Section */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
        className="rounded-2xl bg-white border border-gray-100 shadow-sm p-6 sm:p-8">
        <h3 className="text-lg font-extrabold text-[#0a3d3d] mb-5">צריכים עזרה נוספת?</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <a href="mailto:support@seeld.ai"
            className="flex items-center gap-3 p-4 rounded-2xl border border-gray-100 hover:border-[#5ec6c6] hover:shadow-md transition-all group">
            <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center group-hover:bg-[#5ec6c6]/10 transition-colors">
              <Mail className="w-5 h-5 text-blue-500 group-hover:text-[#5ec6c6] transition-colors" />
            </div>
            <div>
              <p className="text-sm font-extrabold text-[#0a3d3d]">מייל</p>
              <p className="text-xs text-gray-400">support@seeld.ai</p>
            </div>
          </a>
          <a href="tel:052-3097444"
            className="flex items-center gap-3 p-4 rounded-2xl border border-gray-100 hover:border-[#5ec6c6] hover:shadow-md transition-all group">
            <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center group-hover:bg-[#5ec6c6]/10 transition-colors">
              <Phone className="w-5 h-5 text-green-500 group-hover:text-[#5ec6c6] transition-colors" />
            </div>
            <div>
              <p className="text-sm font-extrabold text-[#0a3d3d]">טלפון</p>
              <p className="text-xs text-gray-400" dir="ltr">052-309-7444</p>
            </div>
          </a>
          <a href="https://wa.me/972523097444" target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-3 p-4 rounded-2xl border border-gray-100 hover:border-[#5ec6c6] hover:shadow-md transition-all group">
            <div className="w-10 h-10 rounded-full bg-[#25D366]/10 flex items-center justify-center group-hover:bg-[#5ec6c6]/10 transition-colors">
              <MessageCircle className="w-5 h-5 text-[#25D366] group-hover:text-[#5ec6c6] transition-colors" />
            </div>
            <div>
              <p className="text-sm font-extrabold text-[#0a3d3d]">WhatsApp</p>
              <p className="text-xs text-gray-400">הודעה מהירה</p>
            </div>
          </a>
        </div>
      </motion.div>

      {/* Platform Info */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
        className="mt-6 rounded-2xl p-6 text-center border-2 border-dashed"
        style={{ borderColor: '#0a3d3d20', backgroundColor: '#0a3d3d05' }}>
        <p className="text-[10px] font-black tracking-[0.2em] uppercase text-gray-400 mb-1"
          style={{ fontFamily: "'Plus Jakarta Sans',sans-serif" }}>SEELD פלטפורמה</p>
        <p className="text-xs text-gray-400">
          פלטפורמת ניהול סוכנויות ביטוח מתקדמת &middot; גרסה 2.0
        </p>
      </motion.div>
    </div>
  );
}
