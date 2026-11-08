import { setupWorker } from "msw/browser";
import { ordersHandlers } from "./orders.handlers";

export const worker = setupWorker(...ordersHandlers);
