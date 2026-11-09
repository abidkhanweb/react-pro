import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import type { Order } from "../orders.types";

type Props = {
  order: Order;
  pending: boolean;
  error?: string;
  onClose: () => void;
  onConfirm: () => void;
  onReturnFocus: () => void;
};

export function DeleteOrderDialog({ order, pending, error, onClose, onConfirm, onReturnFocus }: Props) {
  return (
    <Dialog open onOpenChange={(open) => { if (!open && !pending) onClose(); }}>
      <DialogContent
        onCloseAutoFocus={(event) => { event.preventDefault(); onReturnFocus(); }}
        onEscapeKeyDown={(event) => { if (pending) event.preventDefault(); }}>
        <DialogHeader>
          <DialogTitle>Delete order</DialogTitle>
          <DialogDescription>Delete order {order.id} for {order.customerName}? This cannot be undone.</DialogDescription>
        </DialogHeader>
        {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
        <DialogFooter>
          <Button variant="outline" disabled={pending} onClick={onClose}>Cancel</Button>
          <Button variant="destructive" disabled={pending} onClick={onConfirm}>{pending ? "Deleting..." : "Delete order"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
