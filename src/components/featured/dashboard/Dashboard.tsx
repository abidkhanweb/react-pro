import { PageLayout } from "@/components/layout/PageLayout";
import { OrderForm, OrdersTable } from "@/modules/orders/components";

function Dashboard() {
  return (
    <PageLayout title="Form system preview">
      {import.meta.env.DEV && import.meta.env.VITE_ENABLE_MOCKS === "true" && (
        <p role="status" className="rounded-md border border-amber-300 bg-amber-50 p-3 text-sm text-amber-950">
          Demo mode: orders are simulated and are lost when the page reloads.
          This preview is not connected to a persistent backend.
        </p>
      )}
      <div className="max-w-xl">
        <OrderForm />
      </div>
      <section aria-label="Orders" className="space-y-4 overflow-x-auto">
        <h2 className="text-xl font-semibold">Orders</h2>
        <OrdersTable />
      </section>
    </PageLayout>
  );
}

export default Dashboard;
