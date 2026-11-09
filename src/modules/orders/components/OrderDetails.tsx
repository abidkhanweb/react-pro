import type { Order } from "../orders.types";
import { formatOrderAmount } from "../orders.format";

export function OrderDetails({ order }: { order: Order }) {
  return (
    <dl className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-4 gap-y-3 text-sm">
      <dt className="text-muted-foreground">Order ID</dt><dd className="break-all">{order.id}</dd>
      <dt className="text-muted-foreground">Customer</dt><dd>{order.customerName}</dd>
      <dt className="text-muted-foreground">Status</dt><dd className="capitalize">{order.status}</dd>
      <dt className="text-muted-foreground">Amount</dt><dd>{formatOrderAmount(order.totalAmount)}</dd>
      <dt className="text-muted-foreground">Created</dt>
      <dd><time dateTime={order.createdAt}>{new Date(order.createdAt).toLocaleString("en-IN")}</time></dd>
    </dl>
  );
}
