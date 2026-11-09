import { lazy, type ComponentType, type LazyExoticComponent } from "react";
import type { AdminPageKey } from "@/utils/constant/routes";

const LazyComponentsRegistery: Record<AdminPageKey, LazyExoticComponent<ComponentType>> = {
  Dashboard: lazy(() => import("@/components/featured/dashboard/Dashboard")),
  Orders: lazy(() => import("@/modules/orders/orders.page")),
  Products: lazy(() => import("@/modules/products/products.page")),
  Users: lazy(() => import("@/modules/users/users.page")),
  Analytics: lazy(() => import("@/modules/analytics/analytics.page")),
  Settings: lazy(() => import("@/modules/settings/settings.page")),
};

export default LazyComponentsRegistery;
