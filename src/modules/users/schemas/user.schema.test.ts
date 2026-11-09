import { expect, it } from "vitest";
import { userFormSchema, userPayloadSchema, userResponseSchema } from "./user.schema";

const payload = { name: "Ada", email: "ada@example.com", role: "viewer" };

it("trims names and normalizes email addresses", () => {
  expect(userFormSchema.parse({ ...payload, name: " Ada ", email: " ADA@EXAMPLE.COM " })).toEqual(payload);
});

it("rejects blank names, invalid emails and oversized fields", () => {
  for (const change of [{ name: " " }, { name: "x".repeat(121) }, { email: "invalid" }, { email: "" }, { email: `${"x".repeat(250)}@example.com` }]) {
    expect(userFormSchema.safeParse({ ...payload, ...change }).success).toBe(false);
  }
});

it("accepts only supported roles and forbids server-owned or credential fields", () => {
  for (const role of ["admin", "manager", "viewer"]) expect(userPayloadSchema.safeParse({ ...payload, role }).success).toBe(true);
  expect(userPayloadSchema.safeParse({ ...payload, role: "owner" }).success).toBe(false);
  for (const key of ["id", "createdAt", "password"]) expect(userPayloadSchema.safeParse({ ...payload, [key]: "injected" }).success).toBe(false);
});

it("validates saved IDs and creation timestamps", () => {
  const user = { ...payload, id: "user-1", createdAt: "2026-11-09T10:00:00.000Z" };
  expect(userResponseSchema.parse(user)).toEqual(user);
  expect(userResponseSchema.safeParse({ ...user, id: "" }).success).toBe(false);
  expect(userResponseSchema.safeParse({ ...user, createdAt: "yesterday" }).success).toBe(false);
});
