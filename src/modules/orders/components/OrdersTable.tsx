import { DataTable } from "@/components/common/table";
import { Button } from "@/components/ui/button";
import { ordersColumns } from "../orders.columns";
import { useOrders } from "../hooks";
import { TableSkeleton } from "@/components/ui/table-skeleton";

export function OrdersTable() {
  const { orders, isLoading, isError, page, limit, total, setPage, refetch } = useOrders();

  if (isLoading) {
    return <TableSkeleton />;
  }

  if (isError) {
    return <div role="alert">Could not load orders. <Button onClick={() => void refetch()}>Retry</Button></div>;
  }

  return (
    <>
      {orders.length ? <DataTable columns={ordersColumns} data={orders} /> : <p>No orders on this page.</p>}

      <nav aria-label="Orders pagination" className="flex items-center gap-3">
        <Button variant="outline" disabled={page <= 1} onClick={() => setPage(page - 1)}>Previous</Button>
        <span>Page {page} of {Math.max(1, Math.ceil(total / limit))}</span>
        <Button variant="outline" disabled={page * limit >= total} onClick={() => setPage(page + 1)}>Next</Button>
      </nav>
    </>
  );
}
