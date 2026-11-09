import { delay, http, HttpResponse } from "msw";
import { z } from "zod";
import { userPayloadSchema } from "@/modules/users/schemas/user.schema";
import type { User } from "@/modules/users/users.types";

// shortcut: profiles are temporary demo records; account security and durable storage require the real backend.
const users: User[] = [];

export const getMockUserCount = () => users.length;

export function resetMockUsers(seed: User[] = []) {
  users.splice(0, users.length, ...seed.map((user) => ({ ...user })));
}

const duplicateEmail = () => HttpResponse.json({
  message: "Email already in use.", errors: { email: ["A user with this email already exists."] },
}, { status: 409 });

export const usersHandlers = [
  http.get("*/api/users", ({ request }) => {
    const url = new URL(request.url);
    const result = z.object({
      page: z.coerce.number().int().min(1), limit: z.coerce.number().int().min(1).max(100),
      search: z.string().trim().max(100), role: userPayloadSchema.shape.role.optional(),
    }).safeParse({
      page: url.searchParams.get("page") ?? "1", limit: url.searchParams.get("limit") ?? "10",
      search: url.searchParams.get("search") ?? "", role: url.searchParams.get("role") ?? undefined,
    });
    if (!result.success) return HttpResponse.json({ message: "Invalid user filters or pagination." }, { status: 400 });
    const { page, limit, search, role } = result.data;
    const term = search.toLowerCase();
    const filtered = users.filter((user) => (!role || user.role === role) &&
      (!term || user.name.toLowerCase().includes(term) || user.email.toLowerCase().includes(term) || user.id.toLowerCase().includes(term)));
    return HttpResponse.json({ data: filtered.slice((page - 1) * limit, page * limit), total: filtered.length, page, limit });
  }),
  http.get("*/api/users/:id", ({ params }) => {
    const user = users.find((item) => item.id === params.id);
    return user ? HttpResponse.json(user) : HttpResponse.json({ message: "User not found." }, { status: 404 });
  }),
  http.post("*/api/users", async ({ request }) => {
    const body: unknown = await request.json().catch(() => undefined);
    if (body === undefined) return HttpResponse.json({ message: "Invalid JSON." }, { status: 400 });
    const result = userPayloadSchema.safeParse(body);
    if (!result.success) return HttpResponse.json({ message: "Check the user fields.", errors: result.error.flatten().fieldErrors }, { status: 422 });
    await delay(200);
    if (users.some((user) => user.email.toLowerCase() === result.data.email)) return duplicateEmail();
    const user: User = { ...result.data, id: crypto.randomUUID(), createdAt: new Date().toISOString() };
    users.unshift(user);
    return HttpResponse.json(user, { status: 201 });
  }),
  http.put("*/api/users/:id", async ({ request, params }) => {
    const body: unknown = await request.json().catch(() => undefined);
    if (body === undefined) return HttpResponse.json({ message: "Invalid JSON." }, { status: 400 });
    const result = userPayloadSchema.safeParse(body);
    if (!result.success) return HttpResponse.json({ message: "Check the user fields.", errors: result.error.flatten().fieldErrors }, { status: 422 });
    await delay(150);
    const index = users.findIndex((user) => user.id === params.id);
    if (index === -1) return HttpResponse.json({ message: "User not found." }, { status: 404 });
    if (users.some((user) => user.id !== params.id && user.email.toLowerCase() === result.data.email)) return duplicateEmail();
    const user = { ...users[index], ...result.data };
    users[index] = user;
    return HttpResponse.json(user);
  }),
  http.delete("*/api/users/:id", async ({ params }) => {
    await delay(150);
    const index = users.findIndex((user) => user.id === params.id);
    if (index === -1) return HttpResponse.json({ message: "User not found." }, { status: 404 });
    users.splice(index, 1);
    return new HttpResponse(null, { status: 204 });
  }),
];
