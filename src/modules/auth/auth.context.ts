import { createContext, useContext } from "react";
import type { LoginValues, ProfileValues, SessionUser } from "./auth.schema";

type AuthContextValue = {
  user: SessionUser | null;
  status: "loading" | "ready" | "error";
  signIn: (values: LoginValues) => Promise<SessionUser>;
  signOut: () => Promise<void>;
  retrySession: () => void;
  saveProfile: (values: ProfileValues) => Promise<SessionUser>;
};
export const AuthContext = createContext<AuthContextValue | null>(null);
export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error("useAuth requires AuthProvider.");
  return value;
}
