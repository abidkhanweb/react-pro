import { useId, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { ProductFilters as Filters } from "../products.types";

export function ProductFilters({ onApply }: { onApply: (filters: Filters) => void }) {
  const id = useId();
  const [draft, setDraft] = useState<Filters>({ search: "", category: "", availability: "all" });
  return (
    <form aria-label="Product filters" className="flex flex-wrap items-end gap-3" onSubmit={(event) => {
      event.preventDefault();
      onApply({ ...draft, search: draft.search.trim(), category: draft.category.trim() });
    }}>
      <div className="min-w-40 flex-1 space-y-2">
        <Label htmlFor={`${id}-search`}>Search products</Label>
        <Input id={`${id}-search`} type="search" placeholder="Product name or ID" maxLength={100}
          value={draft.search} onChange={(event) => setDraft({ ...draft, search: event.target.value })} />
      </div>
      <div className="w-40 space-y-2">
        <Label htmlFor={`${id}-category`}>Category filter</Label>
        <Input id={`${id}-category`} placeholder="Exact category name" maxLength={80}
          value={draft.category} onChange={(event) => setDraft({ ...draft, category: event.target.value })} />
      </div>
      <div className="w-40 space-y-2">
        <Label htmlFor={`${id}-availability`}>Stock availability</Label>
        <Select value={draft.availability} onValueChange={(availability) => setDraft({ ...draft, availability: availability as Filters["availability"] })}>
          <SelectTrigger id={`${id}-availability`}><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All stock</SelectItem>
            <SelectItem value="in-stock">In stock</SelectItem>
            <SelectItem value="out-of-stock">Out of stock</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <Button type="submit">Apply filters</Button>
      <Button type="button" variant="outline" onClick={() => {
        const cleared: Filters = { search: "", category: "", availability: "all" };
        setDraft(cleared);
        onApply(cleared);
      }}>Clear filters</Button>
    </form>
  );
}
