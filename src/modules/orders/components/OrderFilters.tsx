import { useId, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { OrderFilters as Filters } from "../orders.types";

export function OrderFilters({ onApply }: { onApply: (filters: Filters) => void }) {
  const id = useId();
  const [draft, setDraft] = useState<Filters>({ search: "", status: "all" });
  return (
    <form aria-label="Order filters" className="flex flex-wrap items-end gap-3" onSubmit={(event) => {
      event.preventDefault();
      onApply({ ...draft, search: draft.search.trim() });
    }}>
      <div className="min-w-40 flex-1 space-y-2">
        <Label htmlFor={`${id}-search`}>Search orders</Label>
        <Input id={`${id}-search`} type="search" placeholder="Customer name or order ID" maxLength={100}
          value={draft.search} onChange={(event) => setDraft({ ...draft, search: event.target.value })} />
      </div>
      <div className="w-40 space-y-2">
        <Label htmlFor={`${id}-status`}>Filter by status</Label>
        <Select value={draft.status} onValueChange={(status) => setDraft({ ...draft, status: status as Filters["status"] })}>
          <SelectTrigger id={`${id}-status`}><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <Button type="submit">Apply filters</Button>
      <Button type="button" variant="outline" onClick={() => {
        const cleared: Filters = { search: "", status: "all" };
        setDraft(cleared);
        onApply(cleared);
      }}>Clear filters</Button>
    </form>
  );
}
