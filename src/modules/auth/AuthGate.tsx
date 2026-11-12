import type { ReactNode } from "react";
import { Navigate, Outlet, useLocation, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "./auth.context";
import { canAccessPage } from "./auth.permissions";

export function SessionGate({ children }: { children: ReactNode }) {
  const { status, retrySession } = useAuth();
  if (status === "loading") return <main className="p-6"><p role="status">Checking your session...</p></main>;
  if (status === "error") return <main className="p-6"><div role="alert">Could not verify your session. <Button onClick={retrySession}>Retry session</Button></div></main>;
  return children;
}
export function RequireSession() {
  const { user } = useAuth();
  const location = useLocation();
  return user ? <Outlet /> : <Navigate to="/login" replace state={{ from: location.pathname + location.search + location.hash }} />;
}
export function RequireRole({ path, children }: { path: string; children: ReactNode }) {
  const { user } = useAuth();
  if (!user || !canAccessPage(user.role, path)) return <section className="p-6 space-y-4"><h1 className="text-2xl font-bold">Access denied</h1><p>Your role cannot access this module.</p><Link className="underline" to="/">Return to dashboard</Link></section>;
  return children;
}
