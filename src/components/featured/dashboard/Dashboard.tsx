import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { PageLayout } from "@/components/layout/PageLayout";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { MENU } from "@/utils/constant/routes";

function Dashboard() {
  return (
    <PageLayout title="Dashboard">
      <p className="max-w-2xl text-muted-foreground">Welcome to your administration workspace. Start with Orders, or explore the modules that will grow with your store.</p>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {MENU.filter(({ path }) => path !== "/").map(({ label, path, description, icon: Icon }) => (
          <Card key={path}>
            <CardHeader className="flex-row items-center justify-between space-y-0">
              <Icon aria-hidden="true" className="h-6 w-6 text-primary" />
              <span className="rounded-full bg-muted px-3 py-1 text-xs text-muted-foreground">{["/orders", "/products", "/users"].includes(path) ? "Manage records" : "Planned"}</span>
            </CardHeader>
            <CardContent className="space-y-3">
              <h2 className="font-semibold">{label}</h2>
              <p className="text-sm text-muted-foreground">{description}</p>
              <Link to={path} className="inline-flex items-center gap-2 rounded text-sm font-medium underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">Open {label.toLowerCase()} <ArrowRight aria-hidden="true" className="h-4 w-4" /></Link>
            </CardContent>
          </Card>
        ))}
      </div>
      <p className="text-sm text-muted-foreground">Sales metrics and reporting will appear here when the reporting module is connected.</p>
    </PageLayout>
  );
}

export default Dashboard;
