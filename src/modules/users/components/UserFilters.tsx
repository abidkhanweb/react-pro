import { useId, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { USER_ROLES, type UserFilters as Filters } from "../users.types";

export function UserFilters({ onApply }: { onApply: (filters: Filters) => void }) {
  const id = useId();
  const [draft, setDraft] = useState<Filters>({ search: "", role: "all" });
  return (
    <form aria-label="User filters" className="flex flex-wrap items-end gap-3" onSubmit={(event) => {
      event.preventDefault();
      onApply({ ...draft, search: draft.search.trim() });
    }}>
      <div className="min-w-40 flex-1 space-y-2">
        <Label htmlFor={`${id}-search`}>Search users</Label>
        <Input id={`${id}-search`} type="search" placeholder="Name, email or user ID" maxLength={100}
          value={draft.search} onChange={(event) => setDraft({ ...draft, search: event.target.value })} />
      </div>
      <div className="w-40 space-y-2">
        <Label htmlFor={`${id}-role`}>Filter by role</Label>
        <Select value={draft.role} onValueChange={(role) => setDraft({ ...draft, role: role as Filters["role"] })}>
          <SelectTrigger id={`${id}-role`}><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All roles</SelectItem>
            {USER_ROLES.map((role) => <SelectItem key={role} value={role}>{role[0].toUpperCase() + role.slice(1)}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <Button type="submit">Apply filters</Button>
      <Button type="button" variant="outline" onClick={() => {
        const cleared: Filters = { search: "", role: "all" };
        setDraft(cleared);
        onApply(cleared);
      }}>Clear filters</Button>
    </form>
  );
}
