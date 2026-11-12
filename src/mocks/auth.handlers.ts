import { delay, http, HttpResponse } from "msw";
import { loginSchema, type SessionUser } from "@/modules/auth/auth.schema";
import { canAccessPage } from "@/modules/auth/auth.permissions";

// shortcut: single in-memory demo session resets on reload; real sessions and credentials belong on the backend.
let session: SessionUser | null = null;
export function resetMockAuth(user: SessionUser | null = null) { session = user ? { ...user } : null; }
export const authHandlers = [
  http.get("*/api/auth/session", () => session
    ? HttpResponse.json({ user: session }) : HttpResponse.json({ message: "Sign in required." }, { status: 401 })),
  http.post("*/api/auth/login", async ({ request }) => {
    const body: unknown = await request.json().catch(() => undefined);
    const result = loginSchema.safeParse(body);
    if (!result.success) return HttpResponse.json({ message: "Check your sign-in details." }, { status: 422 });
    await delay(150);
    const role = (["admin", "manager", "viewer"] as const).find((role) => result.data.email === `${role}@demo.local`);
    if (!role || result.data.password !== "DemoOnly!123") return HttpResponse.json({ message: "Invalid email or password." }, { status: 401 });
    session = { id: `demo-${role}`, name: `Demo ${role}`, email: result.data.email, role };
    return HttpResponse.json({ user: session });
  }),
  http.post("*/api/auth/logout", async () => { await delay(100); session = null; return new HttpResponse(null, { status: 204 }); }),
];

export const authGuard = http.all("*/api/*", ({ request }) => {
  const path = new URL(request.url).pathname.replace(/^\/api/, "");
  if (path.startsWith("/auth/")) return undefined;
  if (!session) return HttpResponse.json({ message: "Your session has expired. Sign in again." }, { status: 401 });
  const modulePath = `/${path.split("/")[1]}`;
  const page = modulePath === "/dashboard" ? "/" : modulePath;
  if (!canAccessPage(session.role, page) || (["/dashboard", "/analytics"].includes(modulePath) && request.method !== "GET")) {
    return HttpResponse.json({ message: "You do not have permission for this operation." }, { status: 403 });
  }
  return undefined;
});
