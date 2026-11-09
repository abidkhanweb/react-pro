import { afterAll, afterEach, beforeAll, beforeEach, expect, it } from "vitest";
import { setupServer } from "msw/node";
import { http, HttpResponse } from "msw";
import { apiClient } from "@/services/api";
import { usersHandlers, resetMockUsers } from "@/mocks/users.handlers";
import { createUser, deleteUser, getUser, getUsers, updateUser } from "./users.service";

const server = setupServer(...usersHandlers);
const originalBaseURL = apiClient.defaults.baseURL;
const payload = { name: "Ada", email: "ada@example.com", role: "viewer" as const };

beforeAll(() => {
  server.listen({ onUnhandledRequest: "error" });
  apiClient.defaults.baseURL = "http://localhost/api";
});
beforeEach(() => resetMockUsers());
afterEach(() => server.resetHandlers());
afterAll(() => { server.close(); apiClient.defaults.baseURL = originalBaseURL; });

it("creates, lists, loads, updates and deletes profiles while preserving server-owned fields", async () => {
  const user = await createUser({ ...payload, name: " Ada ", email: " ADA@EXAMPLE.COM " });
  expect(user).toMatchObject(payload);
  expect((await getUsers({ page: 1, limit: 10 })).data).toContainEqual(user);
  expect(await getUser(user.id)).toEqual(user);
  expect(await updateUser(user.id, { ...payload, name: "Ada Lovelace", role: "manager" })).toEqual({ ...user, name: "Ada Lovelace", role: "manager" });
  await deleteUser(user.id);
  expect((await getUsers({ page: 1, limit: 10 })).total).toBe(0);
  await expect(getUser(user.id)).rejects.toMatchObject({ statusCode: 404 });
});

it("filters names, emails and IDs case-insensitively and applies roles before pagination", async () => {
  const base = { ...payload, createdAt: "2026-11-09T10:00:00.000Z" };
  resetMockUsers([
    { ...base, id: "one", email: "one@example.com" },
    { ...base, id: "two", email: "two@example.com" },
    { ...base, id: "three", email: "three@example.com", role: "manager" },
  ]);
  const result = await getUsers({ page: 2, limit: 1, search: " ADA ", role: "viewer" });
  expect(result.total).toBe(2);
  expect(result.data[0].id).toBe("two");
  expect((await getUsers({ page: 1, limit: 10, search: "TWO@EXAMPLE.COM", role: "all" })).data[0].id).toBe("two");
  expect((await getUsers({ page: 1, limit: 10, search: "THREE" })).data[0].role).toBe("manager");
});

it("rejects invalid raw HTTP writes without changing the saved profile", async () => {
  const user = await createUser(payload);
  for (const change of [{ name: " " }, { email: "invalid" }, { role: "owner" }, { id: "changed" }, { createdAt: "changed" }, { password: "secret" }]) {
    await expect(apiClient.put(`/users/${user.id}`, { ...payload, ...change })).rejects.toMatchObject({ statusCode: 422 });
  }
  await expect(apiClient.post("/users", { ...payload, role: "owner" })).rejects.toMatchObject({ statusCode: 422 });
  expect(await getUser(user.id)).toEqual(user);
});

it("rejects invalid filters and handles missing profiles", async () => {
  for (const params of [{ page: 0 }, { limit: 101 }, { role: "owner" }, { search: "x".repeat(101) }]) {
    await expect(apiClient.get("/users", { params })).rejects.toMatchObject({ statusCode: 400 });
  }
  await expect(getUser("missing")).rejects.toMatchObject({ statusCode: 404 });
  await expect(updateUser("missing", payload)).rejects.toMatchObject({ statusCode: 404 });
  await expect(deleteUser("missing")).rejects.toMatchObject({ statusCode: 404 });
});

it("prevents duplicate emails on create and edit but allows retaining your own email", async () => {
  const ada = await createUser(payload);
  const grace = await createUser({ ...payload, email: "grace@example.com" });
  const conflict = { statusCode: 409, errors: { email: ["A user with this email already exists."] } };
  await expect(createUser({ ...payload, email: " ADA@EXAMPLE.COM " })).rejects.toMatchObject(conflict);
  await expect(updateUser(grace.id, payload)).rejects.toMatchObject(conflict);
  expect((await getUser(grace.id)).email).toBe("grace@example.com");
  expect((await updateUser(ada.id, { ...payload, name: "Updated Ada" })).name).toBe("Updated Ada");
});

it("keeps one record when duplicate creates arrive together", async () => {
  const results = await Promise.allSettled([createUser(payload), createUser(payload)]);
  expect(results.filter((result) => result.status === "fulfilled")).toHaveLength(1);
  expect(results.find((result) => result.status === "rejected")).toMatchObject({ reason: { statusCode: 409 } });
  expect((await getUsers({ page: 1, limit: 10 })).total).toBe(1);
});

it("preserves server field errors and rejects malformed responses", async () => {
  server.use(http.post("*/api/users", () => HttpResponse.json({ message: "Rejected.", errors: { email: ["Email blocked."] } }, { status: 422 })));
  await expect(createUser(payload)).rejects.toMatchObject({ statusCode: 422, errors: { email: ["Email blocked."] } });
  server.use(http.get("*/api/users/:id", () => HttpResponse.json({ ...payload, id: "one", createdAt: "invalid" })));
  await expect(getUser("one")).rejects.toThrow();
  server.use(http.get("*/api/users", () => HttpResponse.json({ data: [{ ...payload, id: "one" }], total: 1, page: 1, limit: 10 })));
  await expect(getUsers({ page: 1, limit: 10 })).rejects.toThrow();
});
