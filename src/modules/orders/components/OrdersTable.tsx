import { DataTable, TablePagination } from "@/components/common/table";
import { ordersColumns } from "../orders.columns";
import { useOrders } from "../hooks";
import { TableSkeleton } from "@/components/ui/table-skeleton";

export function OrdersTable() {
  const { orders, isLoading } = useOrders();

  if (isLoading) {
    return <TableSkeleton />;
  }

  return (
    <>
      <DataTable columns={ordersColumns} data={orders} />

      <TablePagination table={undefined} />
    </>
  );
}
