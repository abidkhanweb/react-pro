import { afterAll, afterEach, beforeAll, beforeEach, expect, it } from "vitest";
import { setupServer } from "msw/node";
import { http, HttpResponse } from "msw";
import { apiClient } from "@/services/api";
import { authGuard, authHandlers, resetMockAuth } from "@/mocks/auth.handlers";
import { ordersHandlers, resetMockOrders } from "@/mocks/orders.handlers";
import { usersHandlers, resetMockUsers } from "@/mocks/users.handlers";
import { getSession, login, logout } from "./auth.service";
import { loginSchema, sessionSchema } from "./auth.schema";
import { canAccessPage, safeReturnPath } from "./auth.permissions";

const server = setupServer(...authHandlers, authGuard, ...ordersHandlers, ...usersHandlers);
const originalBaseURL = apiClient.defaults.baseURL;
const credentials = { email: "admin@demo.local", password: "DemoOnly!123" };
beforeAll(() => { server.listen({ onUnhandledRequest: "error" }); apiClient.defaults.baseURL = "http://localhost/api"; });
beforeEach(() => { resetMockAuth(); resetMockOrders(); resetMockUsers(); });
afterEach(() => server.resetHandlers());
afterAll(() => { server.close(); apiClient.defaults.baseURL = originalBaseURL; });

it("normalizes emails without trimming or exposing passwords and rejects invalid login fields", () => {
  expect(loginSchema.parse({ email: " ADMIN@DEMO.LOCAL ", password: " secret " })).toEqual({ email: "admin@demo.local", password: " secret " });
  for (const change of [{ email: "invalid" }, { password: "" }, { password: "x".repeat(129) }, { role: "admin" }]) expect(loginSchema.safeParse({ ...credentials, ...change }).success).toBe(false);
  expect(sessionSchema.safeParse({ user: { id: "u", name: "User", email: "u@example.com", role: "owner" } }).success).toBe(false);
});

it("restores a signed-in session and ends it with logout; anonymous restore is null", async () => {
  expect(await getSession()).toBeNull();
  const user = await login(credentials);
  expect(user).toMatchObject({ email: credentials.email, role: "admin" });
  expect(user).not.toHaveProperty("password");
  expect(await getSession()).toEqual(user);
  await logout(); expect(await getSession()).toBeNull();
  await logout(); expect(await getSession()).toBeNull();
});

it("rejects bad credentials generically and invalid raw writes without changing identity", async () => {
  await expect(login({ ...credentials, password: "wrong" })).rejects.toMatchObject({ statusCode: 401, message: "Invalid email or password." });
  await expect(login({ ...credentials, email: "unknown@example.com" })).rejects.toMatchObject({ statusCode: 401, message: "Invalid email or password." });
  await expect(apiClient.post("/auth/login", { ...credentials, role: "admin" })).rejects.toMatchObject({ statusCode: 422 });
  expect(await getSession()).toBeNull();
});

it("denies anonymous API requests, not just navigation", async () => {
  await expect(apiClient.get("/orders")).rejects.toMatchObject({ statusCode: 401 });
  await expect(apiClient.post("/users", { name: "Injected" })).rejects.toMatchObject({ statusCode: 401 });
});

it("enforces Manager CRUD scope and Viewer reporting-only scope at the mock API", async () => {
  await login({ ...credentials, email: "manager@demo.local" });
  expect((await apiClient.get("/orders")).data.total).toBe(0);
  await expect(apiClient.get("/users")).rejects.toMatchObject({ statusCode: 403 });
  await expect(apiClient.delete("/users/someone")).rejects.toMatchObject({ statusCode: 403 });
  await login({ ...credentials, email: "viewer@demo.local" });
  await expect(apiClient.get("/orders")).rejects.toMatchObject({ statusCode: 403 });
  await expect(apiClient.post("/products", {})).rejects.toMatchObject({ statusCode: 403 });
  await expect(apiClient.post("/analytics", {})).rejects.toMatchObject({ statusCode: 403 });
  await expect(apiClient.get("/unknown")).rejects.toMatchObject({ statusCode: 403 });
  expect((await getSession())?.role).toBe("viewer");
});

it("keeps demo login identities separate from editable Users profiles", async () => {
  await login(credentials);
  await apiClient.post("/users", { name: "Imposter", email: "new@example.com", role: "admin" });
  await logout();
  await expect(login({ ...credentials, email: "new@example.com" })).rejects.toMatchObject({ statusCode: 401 });
});

it("rejects malformed sessions, propagates restore/network failures and tolerates already-expired logout", async () => {
  server.use(http.get("*/api/auth/session", () => HttpResponse.json({ user: { role: "admin" } })));
  await expect(getSession()).rejects.toThrow();
  server.use(http.get("*/api/auth/session", () => HttpResponse.json({ message: "Unavailable" }, { status: 503 })));
  await expect(getSession()).rejects.toMatchObject({ statusCode: 503 });
  server.use(http.post("*/api/auth/logout", () => HttpResponse.json({ message: "Expired" }, { status: 401 })));
  await expect(logout()).resolves.toBeUndefined();
});

it("allows only known authorized internal return paths, avoiding external redirects and login loops", () => {
  for (const path of ["https://evil.example", "//evil.example", "/\\evil.example", "/login", "/unknown", "/orders\n", null, { path: "/" }]) expect(safeReturnPath(path, "admin")).toBe("/");
  expect(safeReturnPath("/orders?status=pending#results", "manager")).toBe("/orders?status=pending#results");
  expect(safeReturnPath("/users", "manager")).toBe("/");
  expect(safeReturnPath("/orders", "viewer")).toBe("/");
  expect(canAccessPage("viewer", "/analytics/")).toBe(true);
  expect(canAccessPage("admin", "/users/missing")).toBe(false);
});
