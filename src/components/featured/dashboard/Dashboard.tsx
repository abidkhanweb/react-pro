import { PageLayout } from "@/components/layout/PageLayout";
import { OrderForm } from "@/modules/orders/components";

function Dashboard() {
  return (
    <PageLayout title="Form system preview">
      <div className="max-w-xl">
        <OrderForm />
      </div>
    </PageLayout>
  );
}

export default Dashboard;
