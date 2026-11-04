import {
  LayoutDashboard,
  Users,
  ShoppingBag,
  Package,
  Tags,
  Megaphone,
  TicketPercent,
  Settings,
  PanelsTopLeft,
  Images,
  BarChart3,
  UserRound,
  CalendarDays,
  Eye,
} from "lucide-react";

const map = {
  overview: LayoutDashboard,
  visitors: Eye,
  users: UserRound,
  "orders-chart": BarChart3,
  calendar: CalendarDays,
  customers: Users,
  orders: ShoppingBag,
  products: Package,
  categories: Tags,
  campaigns: Megaphone,
  coupons: TicketPercent,
  settings: Settings,
  home: PanelsTopLeft,
  gallery: Images,
} as const;

export function CcIcon({ name, className }: { name: string; className?: string }) {
  const Icon = map[name as keyof typeof map] || LayoutDashboard;
  return <Icon className={className || "h-4 w-4"} strokeWidth={1.75} />;
}
