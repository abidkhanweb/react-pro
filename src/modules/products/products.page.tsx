import { PageLayout } from "@/components/layout/PageLayout";
import { EmptyState } from "@/components/common/empty-state";

export default function ProductsPage() {
  return (
    <PageLayout title="Products">
      <EmptyState
        title="Product management is planned"
        description="Catalog editing, pricing and inventory will be implemented in the Products milestone."
      />
    </PageLayout>
  );
}
