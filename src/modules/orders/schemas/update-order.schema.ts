import { createOrderPayloadSchema, createOrderSchema } from "./create-order.schema";

// Editing replaces the editable fields; IDs and creation dates cannot be changed.
export const updateOrderSchema = createOrderSchema;
export const updateOrderPayloadSchema = createOrderPayloadSchema.strict();
