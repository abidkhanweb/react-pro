import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { advanceAuthSession } from "@/services/api/api-client";
import { AuthContext } from "./auth.context";
import { getSession, login, logout } from "./auth.service";
import type { LoginValues, SessionUser } from "./auth.schema";

export function AuthProvider({ children }: { children: ReactNode }) {
  const client = useQueryClient();
  const [user, setUser] = useState<SessionUser | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const request = useRef<AbortController | null>(null);
  const revision = useRef({ version: 0 });
  const clearPrivateData = useCallback(() => {
    advanceAuthSession(); void client.cancelQueries(); client.clear();
  }, [client]);
  const restoreSession = useCallback(() => {
    request.current?.abort();
    const controller = new AbortController(); request.current = controller;
    const version = ++revision.current.version;
    void getSession(controller.signal).then((session) => {
      if (controller.signal.aborted || version !== revision.current.version) return;
      clearPrivateData(); setUser(session); setStatus("ready");
    }).catch(() => {
      if (!controller.signal.aborted && version === revision.current.version) setStatus("error");
    });
  }, [clearPrivateData, revision]);
  useEffect(() => {
    const lifecycle = revision.current;
    const expire = () => {
      ++lifecycle.version; request.current?.abort();
      clearPrivateData(); setUser(null); setStatus("ready");
    };
    window.addEventListener("auth:expired", expire); restoreSession();
    return () => { window.removeEventListener("auth:expired", expire); request.current?.abort(); ++lifecycle.version; };
  }, [restoreSession, clearPrivateData, revision]);
  async function signIn(values: LoginValues) {
    const version = ++revision.current.version;
    const session = await login(values);
    if (version !== revision.current.version) throw new Error("Session changed. Please sign in again.");
    clearPrivateData(); setUser(session); setStatus("ready");
    return session;
  }
  async function signOut() {
    const version = ++revision.current.version;
    await logout();
    if (version !== revision.current.version) return;
    clearPrivateData(); setUser(null); setStatus("ready");
  }
  return <AuthContext.Provider value={{ user, status, signIn, signOut, retrySession: () => {
    setStatus("loading"); restoreSession();
  } }}>{children}</AuthContext.Provider>;
}
