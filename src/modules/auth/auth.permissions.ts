import type { SessionUser } from "./auth.schema";

export function canAccessPage(role: SessionUser["role"], path: string) {
  const page = path.replace(/\/+$/, "") || "/";
  if (page === "/" || page === "/analytics") return true;
  if (page === "/orders" || page === "/products") return role === "admin" || role === "manager";
  if (page === "/users" || page === "/settings") return role === "admin";
  return false;
}

export function safeReturnPath(value: unknown, role: SessionUser["role"]) {
  if (typeof value !== "string" || !value.startsWith("/") || value.startsWith("//") || value.includes("\\") ||
    [...value].some((character) => character.charCodeAt(0) <= 32 || character.charCodeAt(0) === 127)) return "/";
  return canAccessPage(role, value.split(/[?#]/)[0]) ? value : "/";
}
