import { useMemo, useRef, useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/common/table";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { TableSkeleton } from "@/components/ui/table-skeleton";
import { ordersColumns } from "../orders.columns";
import { useOrders } from "../hooks";
import { useOrder } from "../hooks/useOrder";
import type { Order } from "../orders.types";
import { OrderFilters } from "./OrderFilters";
import { OrderDetails } from "./OrderDetails";
import { OrderForm } from "./OrderForm";
import { DeleteOrderDialog } from "./DeleteOrderDialog";

export function OrdersTable() {
  const list = useOrders();
  const [selected, setSelected] = useState<{ order: Order; mode: "view" | "edit" | "delete" } | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const listFocusRef = useRef<HTMLDivElement>(null);
  const actionRef = useRef<HTMLButtonElement | null>(null);
  const detail = useOrder(selected && selected.mode !== "delete" ? selected.order.id : undefined);
  const pageCount = Math.max(1, Math.ceil(list.total / list.limit));
  const busy = list.isFetching || list.deletion.isPending || saving;
  const resetDeletion = list.deletion.reset;

  // Stable cells preserve the action button that receives focus when a dialog closes.
  const columns = useMemo<ColumnDef<Order>[]>(() => [...ordersColumns, {
    id: "actions", header: "Actions",
    cell: ({ row }) => (
      <div className="flex gap-1">
        {(["view", "edit", "delete"] as const).map((mode) => (
          <Button key={mode} size="sm" variant={mode === "delete" ? "destructive" : "outline"}
            aria-label={`${mode} order ${row.original.id}`} disabled={busy}
            onClick={(event) => {
              actionRef.current = event.currentTarget;
              resetDeletion();
              setMessage("");
              setSelected({ order: row.original, mode });
            }}>{mode === "view" ? "View" : mode === "edit" ? "Edit" : "Delete"}</Button>
        ))}
      </div>
    ),
  }], [busy, resetDeletion]);

  function returnFocus() {
    const target = actionRef.current;
    if (target?.isConnected && !target.disabled) target.focus();
    else listFocusRef.current?.focus();
  }

  async function confirmDelete() {
    if (!selected || list.deletion.isPending) return;
    try {
      await list.deletion.mutateAsync(selected.order.id);
      setSelected(null);
      setMessage("Order deleted.");
    } catch {
      // The mutation error stays visible in the open confirmation dialog.
    }
  }

  return (
    <div ref={listFocusRef} tabIndex={-1} aria-label="Orders results" className="space-y-4 outline-none">
      <OrderFilters onApply={list.applyFilters} />
      {message && <p role="status">{message}</p>}
      {list.isError ? (
        <div role="alert">Could not load orders. <Button onClick={() => void list.refetch()}>Retry</Button></div>
      ) : list.isLoading ? <div role="status" aria-label="Loading orders"><TableSkeleton /></div> : (
        <>
          {list.isFetching && <p role="status">Refreshing orders...</p>}
          {list.orders.length ? <DataTable columns={columns} data={list.orders} /> : (
            <p>{list.search || list.status !== "all" ? "No orders match these filters." : "No orders yet. Create your first order."}</p>
          )}
          <nav aria-label="Orders pagination" className="flex flex-wrap items-center gap-3">
            <Button variant="outline" disabled={busy || list.page <= 1} onClick={() => list.setPage(list.page - 1)}>Previous</Button>
            <span>Page {list.page} of {pageCount} ({list.total} orders)</span>
            <Button variant="outline" disabled={busy || list.page >= pageCount} onClick={() => list.setPage(list.page + 1)}>Next</Button>
            <Label htmlFor="orders-page-size">Rows per page</Label>
            <Select value={String(list.limit)} onValueChange={(value) => list.setLimit(Number(value))} disabled={busy}>
              <SelectTrigger id="orders-page-size" className="w-20"><SelectValue /></SelectTrigger>
              <SelectContent>{[10, 25, 50].map((size) => <SelectItem key={size} value={String(size)}>{size}</SelectItem>)}</SelectContent>
            </Select>
          </nav>
        </>
      )}

      {selected?.mode === "delete" && (
        <DeleteOrderDialog order={selected.order} pending={list.deletion.isPending}
          error={list.deletion.error?.message} onClose={() => setSelected(null)} onConfirm={() => void confirmDelete()}
          onReturnFocus={returnFocus} />
      )}
      {selected && selected.mode !== "delete" && (
        <Dialog open onOpenChange={(open) => { if (!open && !saving) setSelected(null); }}>
          <DialogContent className="max-h-[90dvh] overflow-y-auto"
            onCloseAutoFocus={(event) => { event.preventDefault(); returnFocus(); }}
            onEscapeKeyDown={(event) => { if (saving) event.preventDefault(); }}>
            <DialogHeader>
              <DialogTitle>{selected.mode === "edit" ? "Edit order" : "Order details"}</DialogTitle>
              <DialogDescription>{selected.mode === "edit" ? "Update the editable fields and save your changes." : "Review the latest saved information for this order."}</DialogDescription>
            </DialogHeader>
            {detail.isPending ? <p role="status">Loading order...</p> : detail.isError ? (
              <div role="alert">{detail.error.message} <Button onClick={() => void detail.refetch()}>Retry</Button></div>
            ) : selected.mode === "view" ? <OrderDetails order={detail.data} /> : (
              <OrderForm key={detail.data.id} order={detail.data} onSavingChange={setSaving}
                onCancel={() => setSelected(null)} onSaved={() => {
                  list.setPage(1);
                  setSelected(null);
                  setMessage("Order updated.");
                }} />
            )}
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
