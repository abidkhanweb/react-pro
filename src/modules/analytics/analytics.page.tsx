import { PageLayout } from "@/components/layout/PageLayout";
import { EmptyState } from "@/components/common/empty-state";

export default function AnalyticsPage() {
  return (
    <PageLayout title="Analytics">
      <EmptyState
        title="Analytics is planned"
        description="Sales trends, date filters and reporting will be implemented in the Analytics milestone."
      />
    </PageLayout>
  );
}
