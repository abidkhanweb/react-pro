import { PageLayout } from "@/components/layout/PageLayout";
import { AnalyticsReportView } from "./components/AnalyticsReportView";

export default function AnalyticsPage() {
  return (
    <PageLayout title="Analytics">
      <p className="text-muted-foreground">Explore orders created within a UTC date range. Revenue includes only their current completed-order value, not payments, profit or refunds.</p>
      {import.meta.env.DEV && import.meta.env.VITE_ENABLE_MOCKS === "true" && (
        <p role="status" className="rounded-md border border-amber-300 bg-amber-50 p-3 text-sm text-amber-950 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-100">Demo mode: reports use temporary Orders records and reset on reload.</p>
      )}
      <AnalyticsReportView />
    </PageLayout>
  );
}
