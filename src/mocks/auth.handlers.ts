import { delay, http, HttpResponse } from "msw";
import { loginSchema, profileSchema, type SessionUser } from "@/modules/auth/auth.schema";
import { canAccessPage } from "@/modules/auth/auth.permissions";

// shortcut: single in-memory demo session resets on reload; real sessions and credentials belong on the backend.
let session: SessionUser | null = null;
let sessionVersion = 0;
const profileNames = new Map<string, string>();
export function resetMockAuth(user: SessionUser | null = null) {
  session = user ? { ...user } : null; sessionVersion += 1; profileNames.clear();
}
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
    const id = `demo-${role}`;
    session = { id, name: profileNames.get(id) ?? `Demo ${role}`, email: result.data.email, role }; sessionVersion += 1;
    return HttpResponse.json({ user: session });
  }),
  http.post("*/api/auth/logout", async () => { await delay(100); session = null; sessionVersion += 1; return new HttpResponse(null, { status: 204 }); }),
  http.put("*/api/auth/profile", async ({ request }) => {
    if (!session) return HttpResponse.json({ message: "Sign in required." }, { status: 401 });
    if (session.role !== "admin") return HttpResponse.json({ message: "Only administrators can change Settings." }, { status: 403 });
    const version = sessionVersion;
    const result = profileSchema.safeParse(await request.json().catch(() => undefined));
    if (!result.success) return HttpResponse.json({ message: "Check your display name.", errors: result.error.flatten().fieldErrors }, { status: 422 });
    await delay(150);
    if (!session || version !== sessionVersion) return HttpResponse.json({ message: "Session changed. Sign in again." }, { status: 401 });
    session = { ...session, name: result.data.name };
    profileNames.set(session.id, session.name);
    return HttpResponse.json({ user: session });
  }),
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
