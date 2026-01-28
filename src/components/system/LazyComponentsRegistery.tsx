
import { lazy } from "react";

type ComponentKey = string;
type LazyComponentMap = Record<
  ComponentKey,
  React.LazyExoticComponent<React.ComponentType<any>>
>

const LazyComponentsRegistery: LazyComponentMap = {
  Dashboard: lazy(() => import("@/components/featured/dashboard/Dashboard")),
//   Users: lazy(() => import("./pages/Users")),
//   Backup: lazy(() => import("./pages/Backup")),
//   Setup: lazy(() => import("./pages/Setup")),
}

export default LazyComponentsRegistery 



