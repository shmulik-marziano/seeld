/*
  DoodleIcon — replaces generic Lucide icons with hand-drawn doodle illustrations.
  Usage: <DoodleIcon name="shield" size={48} />
  Falls back to a colored circle with first letter if no matching doodle exists.
*/

import doodleCalculator from "@/assets/doodle-calculator.png";
import doodleCharts from "@/assets/doodle-charts.png";
import doodleFamily from "@/assets/doodle-family.png";
import doodleGrowth from "@/assets/doodle-growth.png";
import doodleHandshake from "@/assets/doodle-handshake.png";
import doodleKey from "@/assets/doodle-key.png";
import doodleLightbulb from "@/assets/doodle-lightbulb.png";
import doodlePension from "@/assets/doodle-pension.png";
import doodleSavings from "@/assets/doodle-savings.png";
import doodleShield from "@/assets/doodle-shield.png";
import doodleTarget from "@/assets/doodle-target.png";
import doodleUmbrella from "@/assets/doodle-umbrella.png";

const DOODLE_MAP: Record<string, string> = {
  calculator: doodleCalculator,
  charts: doodleCharts,
  family: doodleFamily,
  growth: doodleGrowth,
  handshake: doodleHandshake,
  key: doodleKey,
  lightbulb: doodleLightbulb,
  pension: doodlePension,
  savings: doodleSavings,
  shield: doodleShield,
  target: doodleTarget,
  umbrella: doodleUmbrella,
};

// Map Lucide icon names → doodle names for easy migration
const LUCIDE_TO_DOODLE: Record<string, string> = {
  // Insurance
  Shield: "shield",
  Heart: "family",
  HeartPulse: "family",
  Home: "umbrella",
  Car: "shield",
  Plane: "target",
  Stethoscope: "shield",
  Activity: "shield",
  UserCheck: "family",
  AlertTriangle: "shield",
  Umbrella: "umbrella",
  Globe: "target",
  // Savings / Pension
  PiggyBank: "savings",
  Landmark: "pension",
  TrendingUp: "growth",
  HandCoins: "savings",
  Baby: "family",
  GraduationCap: "lightbulb",
  Building2: "handshake",
  CalendarCheck: "target",
  Wallet: "savings",
  Target: "target",
  Coins: "savings",
  // Calculators
  Calculator: "calculator",
  BarChart3: "charts",
  LineChart: "charts",
  PieChart: "charts",
  // General
  Handshake: "handshake",
  Users: "handshake",
  Award: "shield",
  Scale: "charts",
  Lightbulb: "lightbulb",
  Briefcase: "handshake",
  Key: "key",
  PhoneCall: "handshake",
  Clock: "target",
  FileText: "calculator",
  Banknote: "savings",
  Gift: "savings",
  HeartHandshake: "handshake",
};

interface DoodleIconProps {
  /** Doodle name (e.g. "shield") OR Lucide icon name (e.g. "Shield") */
  name: string;
  size?: number;
  className?: string;
}

export default function DoodleIcon({ name, size = 48, className = "" }: DoodleIconProps) {
  // Try direct doodle name first, then Lucide mapping
  const doodleName = DOODLE_MAP[name] ? name : LUCIDE_TO_DOODLE[name] || name;
  const src = DOODLE_MAP[doodleName];

  if (!src) {
    // Fallback: colored circle (should not happen if mapping is complete)
    return (
      <div
        className={`rounded-full bg-[#d6157e]/20 flex items-center justify-center ${className}`}
        style={{ width: size, height: size }}
      >
        <span className="text-[#1a1a4b] font-bold text-xs">{name[0]}</span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={doodleName}
      width={size}
      height={size}
      className={`object-contain ${className}`}
      loading="lazy"
    />
  );
}
