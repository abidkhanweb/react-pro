import { Suspense, useEffect, useRef } from "react";
import { Link, Outlet, useLocation } from "react-router-dom";
import { Menu, Moon, Package, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { MENU } from "@/utils/constant/routes";
import { AdminNavigation } from "./AdminNavigation";

function Layout() {
  const { pathname } = useLocation();
  const { resolvedTheme, setTheme } = useTheme();
  const mainRef = useRef<HTMLElement>(null);
  const normalizedPath = pathname.replace(/\/+$/, "") || "/";
  const page = MENU.find(({ path }) => path === normalizedPath);
  const title = page?.label ?? "Page not found";
  const isDark = resolvedTheme === "dark";

  useEffect(() => {
    document.title = `${title} | Commerce Admin`;
    mainRef.current?.focus({ preventScroll: true });
  }, [pathname, title]);

  return (
    <div className="min-h-dvh bg-muted/30">
      <a
        href="#main-content"
        className="sr-only z-[60] rounded-md bg-background p-3 text-foreground focus:fixed focus:left-4 focus:top-4 focus:not-sr-only focus:ring-2 focus:ring-ring"
      >
        Skip to main content
      </a>
      <aside aria-label="Admin sidebar" className="fixed inset-y-0 left-0 hidden w-64 flex-col border-r bg-background lg:flex">
        <Link to="/" className="flex h-20 items-center gap-3 border-b px-6 font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring">
          <Package aria-hidden="true" className="h-6 w-6 text-primary" />
          Commerce Admin
        </Link>
        <AdminNavigation />
        <p className="mt-auto border-t p-6 text-xs text-muted-foreground">Administration workspace</p>
      </aside>
      <div className="min-w-0 lg:pl-64">
        <header className="sticky top-0 z-30 flex min-h-20 items-center gap-3 border-b bg-background px-4 sm:px-6">
          <Dialog key={pathname}>
            <DialogTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="shrink-0 lg:hidden"
                aria-label="Open navigation"
              >
                <Menu aria-hidden="true" className="h-5 w-5" />
              </Button>
            </DialogTrigger>
            <DialogContent className="left-0 top-0 flex h-dvh w-72 max-w-[85vw] translate-x-0 translate-y-0 flex-col gap-0 overflow-y-auto rounded-none p-0 sm:rounded-none">
              <DialogHeader className="border-b p-6 text-left">
                <DialogTitle>Commerce Admin</DialogTitle>
                <DialogDescription>Navigate your administration workspace.</DialogDescription>
              </DialogHeader>
              <AdminNavigation mobile />
            </DialogContent>
          </Dialog>
          <div className="min-w-0 flex-1">
            <p className="text-xs text-muted-foreground">Commerce Admin</p>
            <p className="truncate text-sm font-semibold">{title}</p>
          </div>
          <Button
            variant="outline"
            size="icon"
            aria-label={isDark ? "Switch to light theme" : "Switch to dark theme"}
            onClick={() => setTheme(isDark ? "light" : "dark")}
          >
            {isDark
              ? <Sun aria-hidden="true" className="h-4 w-4" />
              : <Moon aria-hidden="true" className="h-4 w-4" />}
          </Button>
        </header>
        <main id="main-content" ref={mainRef} tabIndex={-1} className="mx-auto max-w-screen-2xl py-4 outline-none">
          <Suspense fallback={<p role="status" className="p-6 text-muted-foreground">Loading page...</p>}>
            <Outlet />
          </Suspense>
        </main>
      </div>
    </div>
  );
}

export default Layout;
