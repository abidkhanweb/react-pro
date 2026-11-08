import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Order } from "../orders.types";

type Props = {
  order: Order;
};

export function OrderDetails({ order }: Props) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Order Details</CardTitle>
      </CardHeader>

      <CardContent className="space-y-2">
        <p>ID : {order.id}</p>
        <p>Customer : {order.customerName}</p>
        <p>Status : {order.status}</p>
        <p>Amount : ₹{order.totalAmount}</p>
      </CardContent>
    </Card>
  );
}
