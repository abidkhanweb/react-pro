import { useMemo, useRef, useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/common/table";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TableSkeleton } from "@/components/ui/table-skeleton";
import { formatINR } from "@/utils/format";
import { useProduct, useProducts } from "../hooks/useProduct";
import { productsColumns } from "../products.columns";
import type { Product } from "../products.types";
import { ProductFilters } from "./ProductFilters";
import { ProductForm } from "./ProductForm";

export function ProductsTable() {
  const list = useProducts();
  const [selected, setSelected] = useState<{ product: Product; mode: "view" | "edit" | "delete" } | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const resultsRef = useRef<HTMLDivElement>(null);
  const actionRef = useRef<HTMLButtonElement | null>(null);
  const detail = useProduct(selected && selected.mode !== "delete" ? selected.product.id : undefined);
  const writing = saving || list.deletion.isPending;
  const busy = writing || list.isFetching;
  const pageCount = Math.max(1, Math.ceil(list.total / list.limit));
  const resetDeletion = list.deletion.reset;

  // Stable cells keep the originating action available for focus restoration.
  const columns = useMemo<ColumnDef<Product>[]>(() => [...productsColumns, {
    id: "actions", header: "Actions",
    cell: ({ row }) => (
      <div className="flex gap-1">
        {(["view", "edit", "delete"] as const).map((mode) => (
          <Button key={mode} size="sm" variant={mode === "delete" ? "destructive" : "outline"} disabled={busy}
            aria-label={`${mode} product ${row.original.id}`} onClick={(event) => {
              actionRef.current = event.currentTarget;
              resetDeletion();
              setMessage("");
              setSelected({ product: row.original, mode });
            }}>{mode === "view" ? "View" : mode === "edit" ? "Edit" : "Delete"}</Button>
        ))}
      </div>
    ),
  }], [busy, resetDeletion]);

  function returnFocus() {
    const target = actionRef.current;
    if (target?.isConnected && !target.disabled) target.focus();
    else resultsRef.current?.focus();
  }

  async function confirmDelete() {
    if (!selected || list.deletion.isPending) return;
    try {
      await list.deletion.mutateAsync(selected.product.id);
      setSelected(null);
      setMessage("Product deleted.");
    } catch {
      // The mutation error remains visible in the confirmation dialog.
    }
  }

  return (
    <div ref={resultsRef} tabIndex={-1} aria-label="Products results" className="space-y-4 outline-none">
      <ProductFilters onApply={list.applyFilters} />
      {message && <p role="status">{message}</p>}
      {list.isError ? (
        <div role="alert">Could not load products. <Button onClick={() => void list.refetch()}>Retry</Button></div>
      ) : list.isLoading ? <div role="status" aria-label="Loading products"><TableSkeleton /></div> : (
        <>
          {list.isFetching && <p role="status">Refreshing products...</p>}
          {list.products.length ? <DataTable columns={columns} data={list.products} /> : (
            <p>{list.search || list.category || list.availability !== "all" ? "No products match these filters." : "No products yet. Create your first product."}</p>
          )}
          <nav aria-label="Products pagination" className="flex flex-wrap items-center gap-3">
            <Button variant="outline" disabled={busy || list.page <= 1} onClick={() => list.setPage(list.page - 1)}>Previous</Button>
            <span>Page {list.page} of {pageCount} ({list.total} products)</span>
            <Button variant="outline" disabled={busy || list.page >= pageCount} onClick={() => list.setPage(list.page + 1)}>Next</Button>
            <Label htmlFor="products-page-size">Rows per page</Label>
            <Select value={String(list.limit)} onValueChange={(value) => list.setLimit(Number(value))} disabled={busy}>
              <SelectTrigger id="products-page-size" className="w-20"><SelectValue /></SelectTrigger>
              <SelectContent>{[10, 25, 50].map((size) => <SelectItem key={size} value={String(size)}>{size}</SelectItem>)}</SelectContent>
            </Select>
          </nav>
        </>
      )}

      {selected && (
        <Dialog open onOpenChange={(open) => { if (!open && !writing) setSelected(null); }}>
          <DialogContent className="max-h-[90dvh] overflow-y-auto"
            onCloseAutoFocus={(event) => { event.preventDefault(); returnFocus(); }}
            onEscapeKeyDown={(event) => { if (writing) event.preventDefault(); }}>
            <DialogHeader>
              <DialogTitle>{selected.mode === "delete" ? "Delete product" : selected.mode === "edit" ? "Edit product" : "Product details"}</DialogTitle>
              <DialogDescription>
                {selected.mode === "delete"
                  ? `Delete ${selected.product.name} (${selected.product.id})? This cannot be undone.`
                  : selected.mode === "edit" ? "Update product information and save your changes." : "Review the latest saved product information."}
              </DialogDescription>
            </DialogHeader>
            {selected.mode === "delete" ? (
              <>
                {list.deletion.error && <p role="alert" className="text-sm text-destructive">{list.deletion.error.message}</p>}
                <DialogFooter>
                  <Button variant="outline" disabled={writing} onClick={() => setSelected(null)}>Cancel</Button>
                  <Button variant="destructive" disabled={writing} onClick={() => void confirmDelete()}>{writing ? "Deleting..." : "Delete product"}</Button>
                </DialogFooter>
              </>
            ) : detail.isPending ? <p role="status">Loading product...</p> : detail.isError ? (
              <div role="alert">Could not load product details. <Button onClick={() => void detail.refetch()}>Retry</Button></div>
            ) : selected.mode === "view" ? (
              <dl className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-4 gap-y-3 text-sm">
                <dt>ID</dt><dd className="break-all">{detail.data.id}</dd>
                <dt>Name</dt><dd>{detail.data.name}</dd>
                <dt>Category</dt><dd>{detail.data.category}</dd>
                <dt>Price</dt><dd>{formatINR(detail.data.price)}</dd>
                <dt>Stock</dt><dd>{detail.data.stock}</dd>
                <dt>Availability</dt><dd>{detail.data.stock > 0 ? "In stock" : "Out of stock"}</dd>
              </dl>
            ) : (
              <ProductForm key={detail.data.id} product={detail.data} onSavingChange={setSaving}
                onCancel={() => setSelected(null)} onSaved={() => {
                  list.setPage(1);
                  setSelected(null);
                  setMessage("Product updated.");
                }} />
            )}
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
