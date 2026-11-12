import { setupWorker } from "msw/browser";
import { ordersHandlers } from "./orders.handlers";
import { productsHandlers } from "./products.handlers";
import { usersHandlers } from "./users.handlers";
import { dashboardHandlers } from "./dashboard.handlers";
import { analyticsHandlers } from "./analytics.handlers";
import { authGuard, authHandlers } from "./auth.handlers";

export const worker = setupWorker(...authHandlers, authGuard, ...ordersHandlers, ...productsHandlers, ...usersHandlers, ...dashboardHandlers, ...analyticsHandlers);
