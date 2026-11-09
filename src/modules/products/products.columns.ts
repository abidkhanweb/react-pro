import type { ColumnDef } from "@tanstack/react-table";
import { formatINR } from "@/utils/format";
import type { Product } from "./products.types";

export const productsColumns: ColumnDef<Product>[] = [
  { accessorKey: "name", header: "Product" },
  { accessorKey: "category", header: "Category" },
  { accessorKey: "price", header: "Price", cell: ({ row }) => formatINR(row.original.price) },
  { accessorKey: "stock", header: "Stock" },
  { id: "availability", header: "Availability", cell: ({ row }) => row.original.stock > 0 ? "In stock" : "Out of stock" },
];
