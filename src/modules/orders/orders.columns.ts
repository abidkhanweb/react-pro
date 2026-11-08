import type { ColumnDef } from "@tanstack/react-table";
import type { Order } from "./orders.types";

export const ordersColumns: ColumnDef<Order>[] = [
  {
    accessorKey: "id",
    header: "Order ID",
  },
  {
    accessorKey: "customerName",
    header: "Customer",
  },
  {
    accessorKey: "status",
    header: "Status",
  },
  {
    accessorKey: "totalAmount",
    header: "Amount",
    cell: ({ row }) => new Intl.NumberFormat("en-IN", {
      style: "currency", currency: "INR",
    }).format(row.original.totalAmount),
  },
];

//# How to use in component
//# import { DataTable } from "@/components/table";
//# import { ordersColumns } from "./orders.columns";

//# const columns = useMemo(() => ordersColumns, []);

//# <DataTable columns={ordersColumns} data={ordersData} />;
