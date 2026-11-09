import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { PageLayout } from "@/components/layout/PageLayout";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { MENU } from "@/utils/constant/routes";
import { DashboardOverview } from "@/modules/dashboard/components/DashboardOverview";

function Dashboard() {
  return (
    <PageLayout title="Dashboard">
      <p className="max-w-2xl text-muted-foreground">Your store overview: orders, catalog stock and user profiles.</p>
      {import.meta.env.DEV && import.meta.env.VITE_ENABLE_MOCKS === "true" && (
        <p role="status" className="rounded-md border border-amber-300 bg-amber-50 p-3 text-sm text-amber-950 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-100">Demo mode: metrics come from your temporary Orders, Products and Users records. Records reset on reload.</p>
      )}
      <DashboardOverview />
      <h2 className="text-lg font-semibold">Quick navigation</h2>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {MENU.filter(({ path }) => path !== "/").map(({ label, path, description, icon: Icon }) => (
          <Card key={path}>
            <CardHeader className="flex-row items-center justify-between space-y-0">
              <Icon aria-hidden="true" className="h-6 w-6 text-primary" />
              <span className="rounded-full bg-muted px-3 py-1 text-xs text-muted-foreground">{path === "/analytics" ? "View reports" : ["/orders", "/products", "/users"].includes(path) ? "Manage records" : "Planned"}</span>
            </CardHeader>
            <CardContent className="space-y-3">
              <h2 className="font-semibold">{label}</h2>
              <p className="text-sm text-muted-foreground">{description}</p>
              <Link to={path} className="inline-flex items-center gap-2 rounded text-sm font-medium underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">Open {label.toLowerCase()} <ArrowRight aria-hidden="true" className="h-4 w-4" /></Link>
            </CardContent>
          </Card>
        ))}
      </div>
    </PageLayout>
  );
}

export default Dashboard;
