import type { Role } from "@/lib/auth/roles";
import {
  LayoutDashboard,
  Store,
  Package,
  CalendarRange,
  IndianRupee,
  Users,
  type LucideIcon,
} from "lucide-react";

export interface AdminNavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  roles?: Role[]; // omit for "all admin roles"
}

export const ADMIN_NAV_ITEMS: AdminNavItem[] = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  {
    href: "/admin/stores",
    label: "Stores",
    icon: Store,
    roles: ["developer", "super_admin"],
  },
  { href: "/admin/inventory", label: "Inventory", icon: Package },
  { href: "/admin/bookings", label: "Bookings", icon: CalendarRange },
  {
    href: "/admin/revenue",
    label: "Revenue",
    icon: IndianRupee,
    roles: ["developer", "super_admin", "admin"],
  },
  {
    href: "/admin/team",
    label: "Team",
    icon: Users,
    roles: ["developer", "super_admin", "admin"],
  },
];

export function visibleNavItems(role: Role) {
  return ADMIN_NAV_ITEMS.filter((item) => !item.roles || item.roles.includes(role));
}
