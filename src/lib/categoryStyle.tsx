import {
  Cpu,
  Briefcase,
  Music2,
  Shirt,
  UtensilsCrossed,
  PawPrint,
  Heart,
  CreditCard,
  Sparkles,
  Globe,
  type LucideIcon,
} from "lucide-react";

interface CategoryStyle {
  icon: LucideIcon;
  gradient: string;
}

const STYLES: Record<string, CategoryStyle> = {
  tech: { icon: Cpu, gradient: "from-slate-500 to-slate-700" },
  business: { icon: Briefcase, gradient: "from-amber-600 to-orange-700" },
  music: { icon: Music2, gradient: "from-fuchsia-600 to-purple-700" },
  fashion: { icon: Shirt, gradient: "from-pink-500 to-rose-600" },
  food: { icon: UtensilsCrossed, gradient: "from-orange-500 to-red-600" },
  pets: { icon: PawPrint, gradient: "from-lime-600 to-emerald-700" },
  women: { icon: Heart, gradient: "from-rose-500 to-pink-600" },
  credit: { icon: CreditCard, gradient: "from-emerald-600 to-teal-700" },
  ai: { icon: Sparkles, gradient: "from-blue-500 to-indigo-700" },
};

export function getCategoryStyle(category?: string): CategoryStyle {
  return (category && STYLES[category]) || { icon: Globe, gradient: "from-blue-500 to-purple-600" };
}
