import { createColumnHelper } from "@tanstack/react-table";
import type { Product } from "./products.types";

const columnHelper = createColumnHelper<Product>();

export const productsColumns = [
  columnHelper.accessor("name", {
    header: "Product",
  }),
  columnHelper.accessor("price", {
    header: "Price",
    cell: (info) => `$${info.getValue()}`,
  }),
  columnHelper.accessor("stock", {
    header: "Stock",
  }),
];
