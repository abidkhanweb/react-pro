import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Order } from "../orders.types";

type Props = {
  order: Order;
};

export function OrderCard({ order }: Props) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{order.id}</CardTitle>
      </CardHeader>

      <CardContent className="space-y-2">
        <p>
          <strong>Customer:</strong> {order.customerName}
        </p>

        <p>
          <strong>Status:</strong> {order.status}
        </p>

        <p>
          <strong>Amount:</strong> ₹{order.totalAmount}
        </p>
      </CardContent>
    </Card>
  );
}
