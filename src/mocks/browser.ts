import { setupWorker } from "msw/browser";
import { ordersHandlers } from "./orders.handlers";
import { productsHandlers } from "./products.handlers";

export const worker = setupWorker(...ordersHandlers, ...productsHandlers);
