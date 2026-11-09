export type Order = {
  id: string;
  customerName: string;
  status: "pending" | "completed" | "cancelled";
  totalAmount: number;
  createdAt: string;
};

export type OrderFilters = {
  search: string;
  status: Order["status"] | "all";
};

export type OrderListParams = {
  page: number;
  limit: number;
  search?: string;
  status?: OrderFilters["status"];
};
