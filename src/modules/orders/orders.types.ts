export type Order = {
  id: string;
  customerName: string;
  status: "pending" | "completed" | "cancelled";
  totalAmount: number;
  createdAt: string;
};
