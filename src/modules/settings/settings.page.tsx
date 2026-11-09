import { PageLayout } from "@/components/layout/PageLayout";
import { EmptyState } from "@/components/common/empty-state";

export default function SettingsPage() {
  return (
    <PageLayout title="Settings">
      <EmptyState
        title="Store settings are planned"
        description="Store preferences and profile settings will be implemented in the Settings milestone."
      />
    </PageLayout>
  );
}
