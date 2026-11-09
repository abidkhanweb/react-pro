import { Link } from "react-router-dom";
import { AreaChartComponent, ChartContainer, PieChartComponent, SkeletonChartComponent } from "@/components/common/charts";
import { EmptyChart } from "@/components/common/charts/components/EmptyChart";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatINR } from "@/utils/format";
import { useDashboard } from "../hooks/useDashboard";

export function DashboardOverview() {
  const { stats, isLoading, isFetching, isError, refetch } = useDashboard();
  if (isLoading) return <div role="status" aria-label="Loading dashboard"><SkeletonChartComponent /></div>;
  if (!stats) return <div role="alert">Could not load dashboard. <Button onClick={() => void refetch()}>Retry</Button></div>;

  const metrics = [
    { label: "Completed-order revenue", value: formatINR(stats.totals.revenue), description: "All time; excludes pending and cancelled orders" },
    { label: "Total orders", value: stats.totals.orders, description: "All statuses, all time" },
    { label: "Products", value: stats.totals.products, description: "Catalog records, not stock units" },
    { label: "User profiles", value: stats.totals.users, description: "Profile records, not customer accounts" },
  ];
  const statuses = Object.entries(stats.ordersByStatus).map(([label, value]) => ({ label, value }));
  return (
    <div className="space-y-6" aria-busy={isFetching}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">Snapshot: <time dateTime={stats.generatedAt}>{new Date(stats.generatedAt).toLocaleString("en-IN")}</time></p>
        <Button variant="outline" disabled={isFetching} onClick={() => void refetch()}>{isFetching ? "Refreshing dashboard..." : "Refresh dashboard"}</Button>
      </div>
      {isError && <p role="alert" className="text-destructive">Dashboard refresh failed. Showing the previous snapshot. Try Refresh dashboard again.</p>}
      <section aria-label="Dashboard KPIs" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map(({ label, value, description }) => (
          <Card key={label}><CardHeader><h2 className="text-sm font-medium text-muted-foreground">{label}</h2></CardHeader>
            <CardContent><p className="break-words text-2xl font-bold">{value}</p><p className="mt-2 text-xs text-muted-foreground">{description}</p></CardContent>
          </Card>
        ))}
      </section>
      <div className="grid min-w-0 gap-6 xl:grid-cols-2">
        <section aria-label="Revenue chart" className="min-w-0">
          <ChartContainer title="Revenue — last 7 days (UTC)">
            {stats.revenueByDay.some((day) => day.value > 0)
              ? <AreaChartComponent data={stats.revenueByDay.map((day) => ({ label: day.date.slice(5), value: day.value }))} name="Revenue (INR)" valueFormatter={formatINR} />
              : <EmptyChart message="No completed-order revenue in the last 7 days." />}
          </ChartContainer>
          <p className="mt-2 text-xs text-muted-foreground">Completed orders grouped by their creation date, not payment or completion date. No tax, refund or profit accounting.</p>
          <details className="mt-3 rounded-md border p-3 text-sm"><summary className="cursor-pointer">View daily revenue data</summary>
            <Table aria-label="Daily revenue data"><TableHeader><TableRow><TableHead scope="col">Date (UTC)</TableHead><TableHead scope="col">Revenue (INR)</TableHead></TableRow></TableHeader>
              <TableBody>{stats.revenueByDay.map((day) => <TableRow key={day.date}><TableCell>{day.date}</TableCell><TableCell>{formatINR(day.value)}</TableCell></TableRow>)}</TableBody>
            </Table>
          </details>
        </section>
        <section aria-label="Order status summary" className="min-w-0">
          <ChartContainer title="Orders by status — all time">
            {stats.totals.orders ? <PieChartComponent data={statuses} /> : <EmptyChart message="No orders yet." />}
          </ChartContainer>
          <dl className="mt-3 grid grid-cols-3 gap-3 rounded-md border p-3 text-sm">
            {statuses.map(({ label, value }) => <div key={label}><dt className="capitalize">{label}</dt><dd className="font-semibold">{value}</dd></div>)}
          </dl>
        </section>
      </div>
      <div className="grid min-w-0 gap-6 xl:grid-cols-2">
        <Card className="min-w-0"><CardHeader><h2 className="font-semibold">Recent orders</h2><p className="text-sm text-muted-foreground">Latest five by creation date, across all statuses.</p></CardHeader>
          <CardContent>
            {!stats.recentOrders.length ? <p>No recent orders.</p> : (
              <Table aria-label="Recent orders"><TableHeader><TableRow>
                <TableHead scope="col">Order / customer</TableHead><TableHead scope="col">Status</TableHead><TableHead scope="col">Amount</TableHead><TableHead scope="col">Created</TableHead>
              </TableRow></TableHeader><TableBody>
                {stats.recentOrders.map((order) => <TableRow key={order.id}>
                  <TableCell><span className="block break-all font-medium">{order.id}</span>{order.customerName}</TableCell>
                  <TableCell className="capitalize">{order.status}</TableCell><TableCell className="whitespace-nowrap">{formatINR(order.totalAmount)}</TableCell>
                  <TableCell><time dateTime={order.createdAt}>{new Date(order.createdAt).toLocaleDateString("en-IN")}</time></TableCell>
                </TableRow>)}
              </TableBody></Table>
            )}
            <Link className="mt-4 inline-block rounded text-sm underline focus-visible:ring-2 focus-visible:ring-ring" to="/orders">Manage orders</Link>
          </CardContent>
        </Card>
        <Card className="min-w-0"><CardHeader><h2 className="font-semibold">Low-stock products</h2><p className="text-sm text-muted-foreground">{stats.totals.lowStock} products with 5 or fewer units, including out of stock. Showing up to five, lowest stock first.</p></CardHeader>
          <CardContent>
            {!stats.lowStockProducts.length ? <p>No low-stock products.</p> : (
              <Table aria-label="Low-stock products"><TableHeader><TableRow><TableHead scope="col">Product</TableHead><TableHead scope="col">Category</TableHead><TableHead scope="col">Stock</TableHead></TableRow></TableHeader>
                <TableBody>{stats.lowStockProducts.map((product) => <TableRow key={product.id}>
                  <TableCell>{product.name}</TableCell><TableCell>{product.category}</TableCell><TableCell>{product.stock === 0 ? "Out of stock" : `${product.stock} left`}</TableCell>
                </TableRow>)}</TableBody>
              </Table>
            )}
            <Link className="mt-4 inline-block rounded text-sm underline focus-visible:ring-2 focus-visible:ring-ring" to="/products">Manage products</Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
