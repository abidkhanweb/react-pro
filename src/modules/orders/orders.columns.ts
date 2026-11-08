import { createColumnHelper, type ColumnDef } from "@tanstack/react-table";
import type { Order } from "./orders.types";

// Use a broad value type to avoid accessor value-type incompatibilities
// createColumnHelper only expects the row data type as a generic
const columnHelper = createColumnHelper<Order>();

export const ordersColumns : ColumnDef<Order, any>[] = [
  columnHelper.accessor("id", {
    header: "Order ID",
  }),
  columnHelper.accessor("customerName", {
    header: "Customer",
  }),
  columnHelper.accessor("status", {
    header: "Status",
  }),
  columnHelper.accessor("totalAmount", {
    header: "Amount",
    cell: (info) => `$${info.getValue()}`, // formatted value
  }),
] ;

//# How to use in component
//# import { DataTable } from "@/components/table";
//# import { ordersColumns } from "./orders.columns";

//# const columns = useMemo(() => ordersColumns, []);

//# <DataTable columns={ordersColumns} data={ordersData} />;