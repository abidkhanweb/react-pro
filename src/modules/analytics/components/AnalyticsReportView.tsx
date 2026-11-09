import { useState } from "react";
import { AreaChartComponent, ChartContainer, PieChartComponent, SkeletonChartComponent } from "@/components/common/charts";
import { EmptyChart } from "@/components/common/charts/components/EmptyChart";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatINR } from "@/utils/format";
import { useAnalytics } from "../hooks/useAnalytics";
import { downloadAnalyticsCsv } from "../utils/export-analytics";
import { AnalyticsFilters } from "./AnalyticsFilters";

export function AnalyticsReportView() {
  const { report, range, applyRange, isLoading, isFetching, isError, refetch } = useAnalytics();
  const [exportError, setExportError] = useState("");
  const statuses = report ? (["pending", "completed", "cancelled"] as const).map((label) => ({ label, value: report.totals[label] })) : [];
  return (
    <div className="space-y-6">
      <AnalyticsFilters range={range} onApply={(next) => { setExportError(""); applyRange(next); }} />
      {isLoading ? <div role="status" aria-label="Loading analytics"><SkeletonChartComponent /></div> : !report ? (
        <div role="alert">Could not load analytics. <Button onClick={() => void refetch()}>Retry</Button></div>
      ) : (
        <section aria-label="Applied analytics report" aria-busy={isFetching} className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div><h2 className="font-semibold">Report period: {report.range.from} to {report.range.to} (UTC)</h2>
              <p className="text-sm text-muted-foreground">Snapshot: <time dateTime={report.generatedAt}>{new Date(report.generatedAt).toLocaleString("en-IN")}</time></p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" disabled={isFetching} onClick={() => void refetch()}>{isFetching ? "Refreshing analytics..." : "Refresh report"}</Button>
              <Button disabled={isFetching || isError} onClick={() => {
                setExportError("");
                try { downloadAnalyticsCsv(report); }
                catch { setExportError("Could not download CSV. Try exporting again."); }
              }}>Export CSV</Button>
            </div>
          </div>
          {isError && <p role="alert" className="text-destructive">Analytics refresh failed. Showing the previous snapshot for this period; export is disabled until a successful refresh.</p>}
          {exportError && <p role="alert" className="text-destructive">{exportError}</p>}
          <section aria-label="Analytics totals" className="grid gap-4 sm:grid-cols-2">
            <Card><CardHeader><h3 className="text-sm font-medium text-muted-foreground">Completed-order revenue</h3></CardHeader><CardContent><p className="text-2xl font-bold">{formatINR(report.totals.revenue)}</p></CardContent></Card>
            <Card><CardHeader><h3 className="text-sm font-medium text-muted-foreground">Orders in period</h3></CardHeader><CardContent><p className="text-2xl font-bold">{report.totals.orders}</p></CardContent></Card>
          </section>
          {report.totals.orders === 0 && <p role="status">No orders in this date range.</p>}
          <div className="grid min-w-0 gap-6 xl:grid-cols-2">
            <section aria-label="Analytics revenue chart" className="min-w-0"><ChartContainer title="Daily completed-order revenue (INR)">
              {report.totals.revenue > 0 ? <AreaChartComponent data={report.daily.map((day) => ({ label: day.date, value: day.revenue }))} name="Revenue (INR)" valueFormatter={formatINR} /> : <EmptyChart message="No completed-order revenue in this period." />}
            </ChartContainer></section>
            <section aria-label="Analytics order statuses" className="min-w-0"><ChartContainer title="Orders by current status">
              {report.totals.orders > 0 ? <PieChartComponent data={statuses} /> : <EmptyChart message="No order-status data in this period." />}
            </ChartContainer><dl className="mt-3 grid grid-cols-3 gap-3 rounded-md border p-3 text-sm">
              {statuses.map(({ label, value }) => <div key={label}><dt className="capitalize">{label}</dt><dd className="font-semibold">{value}</dd></div>)}
            </dl></section>
          </div>
          <section aria-label="Analytics daily data" className="min-w-0 rounded-xl border bg-card p-4">
            <h3 className="mb-3 font-semibold">Daily report data</h3>
            <div className="max-h-96 overflow-auto rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" tabIndex={0} role="region" aria-label="Scrollable daily report">
              <Table aria-label="Daily analytics report"><TableHeader><TableRow>
                {["Date (UTC)", "Revenue (INR)", "Orders", "Pending", "Completed", "Cancelled"].map((label) => <TableHead key={label} scope="col">{label}</TableHead>)}
              </TableRow></TableHeader><TableBody>
                {report.daily.map((day) => <TableRow key={day.date}><TableCell className="whitespace-nowrap">{day.date}</TableCell><TableCell className="whitespace-nowrap">{formatINR(day.revenue)}</TableCell><TableCell>{day.orders}</TableCell><TableCell>{day.pending}</TableCell><TableCell>{day.completed}</TableCell><TableCell>{day.cancelled}</TableCell></TableRow>)}
              </TableBody></Table>
            </div>
            <p className="mt-3 text-xs text-muted-foreground">CSV contains these daily rows with plain numeric INR amounts, including zero days. It contains no customer names, IDs or email addresses.</p>
          </section>
        </section>
      )}
    </div>
  );
}
