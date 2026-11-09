import { BarChart3, LayoutDashboard, Package, Settings, ShoppingCart, Users } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export type AdminPageKey = "Dashboard" | "Orders" | "Products" | "Users" | "Analytics" | "Settings";

export interface MenuNode {
  label: string;
  path: string;
  component: AdminPageKey;
  description: string;
  icon: LucideIcon;
}

export const MENU: MenuNode[] = [
  { label: "Dashboard", path: "/", component: "Dashboard", description: "Your administration workspace at a glance.", icon: LayoutDashboard },
  { label: "Orders", path: "/orders", component: "Orders", description: "Create orders and review the order list.", icon: ShoppingCart },
  { label: "Products", path: "/products", component: "Products", description: "Manage your catalog, prices and inventory.", icon: Package },
  { label: "Users", path: "/users", component: "Users", description: "Manage customer accounts and staff access.", icon: Users },
  { label: "Analytics", path: "/analytics", component: "Analytics", description: "Explore sales trends and business reports.", icon: BarChart3 },
  { label: "Settings", path: "/settings", component: "Settings", description: "Configure your store and administration preferences.", icon: Settings },
];
