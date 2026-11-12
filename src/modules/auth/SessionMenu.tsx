import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useAuth } from "./auth.context";

export function SessionMenu() {
  const { user, signOut } = useAuth();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  return <div className="flex flex-wrap items-center gap-2">
    <span className="hidden text-right text-xs sm:block">{user?.name}<span className="block capitalize text-muted-foreground">{user?.role}</span></span>
    <Button variant="outline" disabled={pending} onClick={async () => {
      setPending(true); setError("");
      try { await signOut(); }
      catch { setError("Could not sign out. Try again."); }
      finally { setPending(false); }
    }}>{pending ? "Signing out..." : "Sign out"}</Button>
    {error && <p role="alert" className="max-w-44 text-xs text-destructive">{error}</p>}
  </div>;
}
