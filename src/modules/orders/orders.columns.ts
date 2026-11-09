import type { ColumnDef } from "@tanstack/react-table";
import type { Order } from "./orders.types";
import { formatOrderAmount } from "./orders.format";

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
    cell: ({ row }) => formatOrderAmount(row.original.totalAmount),
  },
];

//# How to use in component
//# import { DataTable } from "@/components/table";
//# import { ordersColumns } from "./orders.columns";

//# const columns = useMemo(() => ordersColumns, []);

//# <DataTable columns={ordersColumns} data={ordersData} />;
