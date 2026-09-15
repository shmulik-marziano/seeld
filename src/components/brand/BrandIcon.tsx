import type { SVGProps } from "react";
import {
  ArrowLeft, Calculator, CalendarCheck, ChartColumn, Check, ChevronDown, Clock, Download, FileText,
  Folder, HeartPulse, House, Leaf, Menu, MessageSquareText, Route, Search, ShieldCheck,
  SlidersHorizontal, Sunrise, Upload, User, Users, X,
} from "lucide-react";

/**
 * The 24 interface icons of the kit (02-icons): 24 grid, 1.75 stroke, round
 * caps, one meaning each. The kit's SVGs share lucide's grid and construction,
 * so each name maps to the matching lucide glyph and takes `currentColor`.
 *
 * Icon meanings are fixed — do not reuse a glyph for another purpose.
 */
export const BRAND_ICONS = {
  home: House,
  family: Users,
  heart: HeartPulse,
  shield: ShieldCheck,
  leaf: Leaf,
  retirement: Sunrise,
  route: Route,
  document: FileText,
  folder: Folder,
  search: Search,
  message: MessageSquareText,
  calculator: Calculator,
  chart: ChartColumn,
  calendar: CalendarCheck,
  clock: Clock,
  upload: Upload,
  download: Download,
  user: User,
  check: Check,
  close: X,
  "arrow-left": ArrowLeft,
  "chevron-down": ChevronDown,
  menu: Menu,
  settings: SlidersHorizontal,
} as const;

export type BrandIconName = keyof typeof BRAND_ICONS;

interface BrandIconProps extends Omit<SVGProps<SVGSVGElement>, "name" | "ref"> {
  name: BrandIconName;
  /** 20–24 for navigation and actions, 32–40 for a service symbol. */
  size?: number;
  /** Accessible name when the icon stands alone (a button without text). */
  label?: string;
}

export function BrandIcon({ name, size = 24, label, className, ...rest }: BrandIconProps) {
  const Glyph = BRAND_ICONS[name];
  return (
    <Glyph
      size={size}
      strokeWidth={1.75}
      absoluteStrokeWidth={false}
      aria-hidden={label ? undefined : true}
      role={label ? "img" : undefined}
      aria-label={label}
      focusable="false"
      className={className}
      {...rest}
    />
  );
}

export default BrandIcon;
