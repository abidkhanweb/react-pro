import { PageLayout } from "@/components/layout/PageLayout";
import { ProductForm } from "./components/ProductForm";
import { ProductsTable } from "./components/ProductsTable";

export default function ProductsPage() {
  return (
    <PageLayout title="Products">
      <p className="text-muted-foreground">Manage product names, prices, categories and available stock.</p>
      {import.meta.env.DEV && import.meta.env.VITE_ENABLE_MOCKS === "true" && (
        <p role="status" className="rounded-md border border-amber-300 bg-amber-50 p-3 text-sm text-amber-950 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-100">
          Demo mode: products are simulated and are lost when the page reloads. This is not a persistent catalog.
        </p>
      )}
      <div className="grid items-start gap-6 xl:grid-cols-[minmax(18rem,24rem)_minmax(0,1fr)]">
        <ProductForm />
        <section aria-label="Product list" className="min-w-0 space-y-4 overflow-x-auto rounded-xl border bg-card p-6 text-card-foreground shadow">
          <h2 className="text-lg font-semibold">Product list</h2>
          <ProductsTable />
        </section>
      </div>
    </PageLayout>
  );
}
