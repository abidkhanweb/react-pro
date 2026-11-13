import { PageLayout } from "@/components/layout/PageLayout";
import { SettingsContent } from "./components/SettingsContent";

export default function SettingsPage() {
  return (
    <PageLayout title="Settings">
      <p className="text-muted-foreground">Manage store details and your own administrator display name.</p>
      {import.meta.env.DEV && import.meta.env.VITE_ENABLE_MOCKS === "true" && <p role="status" className="rounded-md border border-amber-300 bg-amber-50 p-3 text-sm text-amber-950 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-100">Demo mode: settings and profile names are temporary and reset on page reload. Do not enter real personal data.</p>}
      <SettingsContent />
    </PageLayout>
  );
}
