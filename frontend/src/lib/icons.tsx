import {
  ShoppingBag,
  MessageCircle,
  CheckSquare,
  Film,
  TrendingUp,
  Briefcase,
  Calendar,
  Sparkles,
  Infinity as InfinityIcon,
  Code2,
  type LucideIcon,
} from 'lucide-react';

const iconMap: Record<string, LucideIcon> = {
  'shopping-bag': ShoppingBag,
  'message-circle': MessageCircle,
  'check-square': CheckSquare,
  film: Film,
  'trending-up': TrendingUp,
  briefcase: Briefcase,
  calendar: Calendar,
  sparkles: Sparkles,
  infinity: InfinityIcon,
};

export function resolveIcon(name: string): LucideIcon {
  return iconMap[name] ?? Code2;
}

export const accentClasses: Record<string, { from: string; to: string; text: string; ring: string }> = {
  violet: { from: 'from-violet-500', to: 'to-fuchsia-600', text: 'text-violet-300', ring: 'group-hover:border-violet-500/40' },
  blue: { from: 'from-sky-500', to: 'to-blue-600', text: 'text-sky-300', ring: 'group-hover:border-sky-500/40' },
  green: { from: 'from-emerald-500', to: 'to-green-600', text: 'text-emerald-300', ring: 'group-hover:border-emerald-500/40' },
  orange: { from: 'from-orange-500', to: 'to-amber-600', text: 'text-orange-300', ring: 'group-hover:border-orange-500/40' },
};

export function accent(name: string) {
  return accentClasses[name] ?? accentClasses.violet;
}
