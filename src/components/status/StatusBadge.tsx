import { cn } from '@/lib/utils';

const customerColors: Record<string, string> = {
  'חדש': 'bg-blue-50 text-blue-700 border-blue-200',
  'בקליטה': 'bg-indigo-50 text-indigo-700 border-indigo-200',
  'בהשלמת מוצרים': 'bg-purple-50 text-purple-700 border-purple-200',
  'מוכן להמלצה': 'bg-cyan-50 text-cyan-700 border-cyan-200',
  'ממתין לפולו־אפ': 'bg-amber-50 text-amber-700 border-amber-200',
  'מאושר לביצוע': 'bg-emerald-50 text-emerald-700 border-emerald-200',
  'בביצוע': 'bg-teal-50 text-teal-700 border-teal-200',
  'הושלם': 'bg-gray-50 text-gray-500 border-gray-200',
};

const decisionColors: Record<string, string> = {
  'טיוטה': 'bg-gray-50 text-gray-600 border-gray-200',
  'נשלח': 'bg-blue-50 text-blue-700 border-blue-200',
  'נצפה': 'bg-indigo-50 text-indigo-700 border-indigo-200',
  'מאשר': 'bg-emerald-50 text-emerald-700 border-emerald-200',
  'רוצה לחשוב': 'bg-amber-50 text-amber-700 border-amber-200',
  'לא מעוניין': 'bg-red-50 text-red-600 border-red-200',
  'עבר לביצוע': 'bg-cyan-50 text-cyan-700 border-cyan-200',
  'בוצע': 'bg-green-50 text-green-700 border-green-200',
};

const executionColors: Record<string, string> = {
  'ממתין לנתונים': 'bg-orange-50 text-orange-700 border-orange-200',
  'מוכן להפקה': 'bg-blue-50 text-blue-700 border-blue-200',
  'נשלח לחתימה': 'bg-indigo-50 text-indigo-700 border-indigo-200',
  'נחתם': 'bg-violet-50 text-violet-700 border-violet-200',
  'שוגר': 'bg-cyan-50 text-cyan-700 border-cyan-200',
  'חזר ליקוי': 'bg-red-50 text-red-600 border-red-200',
  'הושלם': 'bg-green-50 text-green-700 border-green-200',
};

const categoryColors: Record<string, string> = {
  'כסף': 'bg-amber-50 text-amber-700 border-amber-200',
  'ביטוח': 'bg-sky-50 text-sky-700 border-sky-200',
};

const actionColors: Record<string, string> = {
  'החלפה': 'bg-orange-50 text-orange-700 border-orange-200',
  'שדרוג': 'bg-blue-50 text-blue-700 border-blue-200',
  'הוספה': 'bg-green-50 text-green-700 border-green-200',
  'שמירה': 'bg-gray-50 text-gray-600 border-gray-200',
  'ביטול': 'bg-red-50 text-red-600 border-red-200',
  'איחוד': 'bg-purple-50 text-purple-700 border-purple-200',
  'קביעת פגישה': 'bg-teal-50 text-teal-700 border-teal-200',
};

interface Props {
  type: 'customer' | 'decision' | 'execution' | 'category' | 'action';
  status: string;
  className?: string;
}

export function StatusBadge({ type, status, className }: Props) {
  const map = type === 'customer' ? customerColors
    : type === 'decision' ? decisionColors
    : type === 'execution' ? executionColors
    : type === 'category' ? categoryColors
    : actionColors;
  return (
    <span className={cn('inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border', map[status] || 'bg-gray-50 text-gray-500', className)}>
      {status}
    </span>
  );
}
