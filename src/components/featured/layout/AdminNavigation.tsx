import { NavLink } from "react-router-dom";
import { DialogClose } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { MENU } from "@/utils/constant/routes";
import { useAuth } from "@/modules/auth/auth.context";
import { canAccessPage } from "@/modules/auth/auth.permissions";

export function AdminNavigation({ mobile = false }: { mobile?: boolean }) {
  const { user } = useAuth();
  return (
    <nav aria-label={mobile ? "Mobile navigation" : "Main navigation"} className="space-y-1 p-3">
      {MENU.filter(({ path }) => user && canAccessPage(user.role, path)).map(({ path, label, icon: Icon }) => {
        const link = (
          <NavLink
            to={path}
            end
            className={({ isActive }) => cn(
              "flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              isActive ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
            )}
          >
            <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
            {label}
          </NavLink>
        );
        return mobile ? <DialogClose key={path} asChild>{link}</DialogClose> : <div key={path}>{link}</div>;
      })}
    </nav>
  );
}
