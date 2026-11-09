import { PageLayout } from "@/components/layout/PageLayout";
import { EmptyState } from "@/components/common/empty-state";

export default function UsersPage() {
  return (
    <PageLayout title="Users">
      <EmptyState
        title="User management is planned"
        description="Customer accounts and staff access management will be implemented in the Users milestone."
      />
    </PageLayout>
  );
}
