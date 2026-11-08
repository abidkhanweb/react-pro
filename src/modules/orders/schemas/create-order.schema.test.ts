import { describe, expect, it } from "vitest";
import { createOrderSchema } from "./create-order.schema";

describe("createOrderSchema", () => {
  it("validates and normalizes the customer name", () => {
    expect(
      createOrderSchema.safeParse({ customerName: "   ", status: "pending" })
        .success,
    ).toBe(false);

    expect(
      createOrderSchema.safeParse({
        customerName: "a".repeat(101),
        status: "pending",
      }).success,
    ).toBe(false);

    expect(
      createOrderSchema.parse({
        customerName: "  Ada Lovelace  ",
        status: "pending",
      }),
    ).toEqual({
      customerName: "Ada Lovelace",
      status: "pending",
    });
  });

  it("accepts supported statuses and rejects unsupported or missing ones", () => {
    for (const status of ["pending", "completed", "cancelled"]) {
      expect(
        createOrderSchema.safeParse({ customerName: "Ada", status }).success,
      ).toBe(true);
    }

    for (const status of ["unknown", "", undefined]) {
      expect(
        createOrderSchema.safeParse({ customerName: "Ada", status }).success,
      ).toBe(false);
    }
  });
});
