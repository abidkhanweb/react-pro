import { setupWorker } from "msw/browser";
import { ordersHandlers } from "./orders.handlers";
import { productsHandlers } from "./products.handlers";
import { usersHandlers } from "./users.handlers";

export const worker = setupWorker(...ordersHandlers, ...productsHandlers, ...usersHandlers);
