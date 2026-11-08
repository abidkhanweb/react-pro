import { describe, expect, it } from "vitest";
import { createOrderSchema, createOrderPayloadSchema } from "./create-order.schema";

const validOrder = { customerName: "Ada", status: "pending", totalAmount: "10.25" };

describe("createOrderSchema", () => {
  it("validates and normalizes the customer name", () => {
    expect(
      createOrderSchema.safeParse({ ...validOrder, customerName: "   " })
        .success,
    ).toBe(false);

    expect(
      createOrderSchema.safeParse({
        ...validOrder,
        customerName: "a".repeat(101),
        status: "pending",
      }).success,
    ).toBe(false);

    expect(
      createOrderSchema.parse({
        ...validOrder,
        customerName: "  Ada Lovelace  ",
        status: "pending",
      }),
    ).toEqual({
      customerName: "Ada Lovelace",
      status: "pending",
      totalAmount: "10.25",
    });
  });

  it("accepts supported statuses and rejects unsupported or missing ones", () => {
    for (const status of ["pending", "completed", "cancelled"]) {
      expect(
        createOrderSchema.safeParse({ ...validOrder, status }).success,
      ).toBe(true);
    }

    for (const status of ["unknown", "", undefined]) {
      expect(
        createOrderSchema.safeParse({ ...validOrder, status }).success,
      ).toBe(false);
    }
  });

  it("rejects empty, non-positive, oversized and imprecise amounts", () => {
    for (const totalAmount of ["", " ", "0", "-1", "NaN", "Infinity", "1.001", "1e3", "1000000000"]) {
      expect(createOrderSchema.safeParse({ ...validOrder, totalAmount }).success).toBe(false);
    }
    for (const totalAmount of ["0.01", "1", "10.25", "999999999.99"]) {
      expect(createOrderSchema.safeParse({ ...validOrder, totalAmount }).success).toBe(true);
    }
  });

  it("validates the numeric API payload independently of the form", () => {
    expect(createOrderPayloadSchema.parse({ ...validOrder, totalAmount: 10.25 }).totalAmount).toBe(10.25);
    for (const totalAmount of ["10.25", 0, -1, 1.001, NaN, Infinity]) {
      expect(createOrderPayloadSchema.safeParse({ ...validOrder, totalAmount }).success).toBe(false);
    }
  });
});
