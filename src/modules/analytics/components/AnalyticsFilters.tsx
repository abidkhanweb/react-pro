import { useId, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { analyticsRangeSchema, getDefaultAnalyticsRange, type AnalyticsRange } from "../schemas/analytics.schema";

export function AnalyticsFilters({ range, onApply }: { range: AnalyticsRange; onApply: (range: AnalyticsRange) => void }) {
  const id = useId();
  const [draft, setDraft] = useState(range);
  const [error, setError] = useState("");
  return (
    <form noValidate aria-label="Analytics date filters" className="space-y-3 rounded-xl border bg-card p-4" onSubmit={(event) => {
      event.preventDefault();
      const result = analyticsRangeSchema.safeParse(draft);
      if (!result.success) { setError(result.error.issues[0].message); return; }
      setError(""); onApply(result.data);
    }}>
      <div className="flex flex-wrap items-end gap-3">
        <div className="space-y-2"><Label htmlFor={`${id}-from`}>Start date (UTC)</Label>
          <Input id={`${id}-from`} type="date" required value={draft.from} aria-invalid={!!error} aria-describedby={`${id}-help${error ? ` ${id}-error` : ""}`}
            onChange={(event) => setDraft({ ...draft, from: event.target.value })} />
        </div>
        <div className="space-y-2"><Label htmlFor={`${id}-to`}>End date (UTC)</Label>
          <Input id={`${id}-to`} type="date" required value={draft.to} aria-invalid={!!error} aria-describedby={`${id}-help${error ? ` ${id}-error` : ""}`}
            onChange={(event) => setDraft({ ...draft, to: event.target.value })} />
        </div>
        <Button type="submit">Apply dates</Button>
        <Button type="button" variant="outline" onClick={() => {
          const defaults = getDefaultAnalyticsRange();
          setDraft(defaults); setError(""); onApply(defaults);
        }}>Clear filters</Button>
      </div>
      <p id={`${id}-help`} className="text-sm text-muted-foreground">Both dates are included. Maximum 366 days. Clear resets to the last 7 UTC calendar dates; changes apply only after Apply dates.</p>
      {error && <p id={`${id}-error`} role="alert" className="text-sm text-destructive">{error}</p>}
    </form>
  );
}
