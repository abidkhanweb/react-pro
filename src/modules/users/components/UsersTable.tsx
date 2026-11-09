import { useMemo, useRef, useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/common/table";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TableSkeleton } from "@/components/ui/table-skeleton";
import { useUser, useUsers } from "../hooks/useUsers";
import { usersColumns } from "../users.columns";
import type { User } from "../users.types";
import { UserFilters } from "./UserFilters";
import { UserForm } from "./UserForm";

export function UsersTable() {
  const list = useUsers();
  const [selected, setSelected] = useState<{ user: User; mode: "view" | "edit" | "delete" } | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const resultsRef = useRef<HTMLDivElement>(null);
  const actionRef = useRef<HTMLButtonElement | null>(null);
  const detail = useUser(selected && selected.mode !== "delete" ? selected.user.id : undefined);
  const writing = saving || list.deletion.isPending;
  const busy = writing || list.isFetching;
  const pageCount = Math.max(1, Math.ceil(list.total / list.limit));
  const resetDeletion = list.deletion.reset;

  // Stable cells preserve the action button used for dialog focus restoration.
  const columns = useMemo<ColumnDef<User>[]>(() => [...usersColumns, {
    id: "actions", header: "Actions",
    cell: ({ row }) => (
      <div className="flex gap-1">
        {(["view", "edit", "delete"] as const).map((mode) => (
          <Button key={mode} size="sm" variant={mode === "delete" ? "destructive" : "outline"} disabled={busy}
            aria-label={`${mode} user ${row.original.id}`} onClick={(event) => {
              actionRef.current = event.currentTarget;
              resetDeletion();
              setMessage("");
              setSelected({ user: row.original, mode });
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
      await list.deletion.mutateAsync(selected.user.id);
      setSelected(null);
      setMessage("User deleted.");
    } catch {
      // The mutation error remains visible in the confirmation dialog.
    }
  }

  return (
    <div ref={resultsRef} tabIndex={-1} aria-label="Users results" className="space-y-4 outline-none">
      <UserFilters onApply={list.applyFilters} />
      {message && <p role="status">{message}</p>}
      {list.isError ? (
        <div role="alert">Could not load users. <Button onClick={() => void list.refetch()}>Retry</Button></div>
      ) : list.isLoading ? <div role="status" aria-label="Loading users"><TableSkeleton /></div> : (
        <>
          {list.isFetching && <p role="status">Refreshing users...</p>}
          {list.users.length ? <DataTable columns={columns} data={list.users} /> : (
            <p>{list.search || list.role !== "all" ? "No users match these filters." : "No users yet. Create your first user record."}</p>
          )}
          <nav aria-label="Users pagination" className="flex flex-wrap items-center gap-3">
            <Button variant="outline" disabled={busy || list.page <= 1} onClick={() => list.setPage(list.page - 1)}>Previous</Button>
            <span>Page {list.page} of {pageCount} ({list.total} users)</span>
            <Button variant="outline" disabled={busy || list.page >= pageCount} onClick={() => list.setPage(list.page + 1)}>Next</Button>
            <Label htmlFor="users-page-size">Rows per page</Label>
            <Select value={String(list.limit)} onValueChange={(value) => list.setLimit(Number(value))} disabled={busy}>
              <SelectTrigger id="users-page-size" className="w-20"><SelectValue /></SelectTrigger>
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
              <DialogTitle>{selected.mode === "delete" ? "Delete user" : selected.mode === "edit" ? "Edit user" : "User details"}</DialogTitle>
              <DialogDescription>
                {selected.mode === "delete"
                  ? `Delete the user record for ${selected.user.name} (${selected.user.email})? This cannot be undone.`
                  : selected.mode === "edit" ? "Update the user profile and role label." : "Review the latest saved user profile."}
              </DialogDescription>
            </DialogHeader>
            {selected.mode === "delete" ? (
              <>
                {list.deletion.error && <p role="alert" className="text-sm text-destructive">{list.deletion.error.message}</p>}
                <DialogFooter>
                  <Button variant="outline" disabled={writing} onClick={() => setSelected(null)}>Cancel</Button>
                  <Button variant="destructive" disabled={writing} onClick={() => void confirmDelete()}>{writing ? "Deleting..." : "Delete user"}</Button>
                </DialogFooter>
              </>
            ) : detail.isPending ? <p role="status">Loading user...</p> : detail.isError ? (
              <div role="alert">Could not load user details. <Button onClick={() => void detail.refetch()}>Retry</Button></div>
            ) : selected.mode === "view" ? (
              <dl className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-4 gap-y-3 text-sm">
                <dt>ID</dt><dd className="break-all">{detail.data.id}</dd>
                <dt>Name</dt><dd>{detail.data.name}</dd>
                <dt>Email</dt><dd className="break-all">{detail.data.email}</dd>
                <dt>Role</dt><dd className="capitalize">{detail.data.role}</dd>
                <dt>Joined</dt><dd><time dateTime={detail.data.createdAt}>{new Date(detail.data.createdAt).toLocaleString("en-IN")}</time></dd>
              </dl>
            ) : (
              <UserForm key={detail.data.id} user={detail.data} onSavingChange={setSaving}
                onCancel={() => setSelected(null)} onSaved={() => {
                  list.setPage(1);
                  setSelected(null);
                  setMessage("User updated.");
                }} />
            )}
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
