import { expect, it } from "vitest";
import { productFormSchema, productPayloadSchema, productResponseSchema } from "./product.schema";

const form = { name: "  Keyboard  ", category: "  Electronics  ", price: "25.50", stock: "0" };

it("normalizes product text and accepts zero stock", () => {
  expect(productFormSchema.parse(form)).toEqual({ ...form, name: "Keyboard", category: "Electronics" });
});

it("requires bounded names and categories", () => {
  for (const name of ["", " ", "x".repeat(161)]) expect(productFormSchema.safeParse({ ...form, name }).success).toBe(false);
  for (const category of ["", " ", "x".repeat(81)]) expect(productFormSchema.safeParse({ ...form, category }).success).toBe(false);
});

it("rejects invalid prices and non-integer or unsafe stock quantities", () => {
  for (const price of ["", "0", "-1", "1.001", "1e3", "1000000000", "NaN"]) {
    expect(productFormSchema.safeParse({ ...form, price }).success).toBe(false);
  }
  for (const stock of ["", "-1", "1.5", "1e3", "9007199254740992"]) {
    expect(productFormSchema.safeParse({ ...form, stock }).success).toBe(false);
  }
  expect(productFormSchema.safeParse({ ...form, price: "0.01", stock: "25" }).success).toBe(true);
});

it("validates numeric API fields and rejects immutable ID changes", () => {
  const payload = { name: "Keyboard", category: "Electronics", price: 25.5, stock: 0 };
  expect(productPayloadSchema.parse(payload)).toEqual(payload);
  for (const change of [{ price: "25.50" }, { price: -1 }, { price: 1.001 }, { stock: -1 }, { stock: 0.5 }, { id: "changed" }]) {
    expect(productPayloadSchema.safeParse({ ...payload, ...change }).success).toBe(false);
  }
  expect(productResponseSchema.parse({ ...payload, id: "product-1" }).id).toBe("product-1");
});
