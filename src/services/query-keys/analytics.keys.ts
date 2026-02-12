export const analyticsKeys = {
  all: ["analytics"] as const,

  revenue: (range: { from: string; to: string }) =>
    [...analyticsKeys.all, "revenue", range] as const,

  ordersSummary: (range: { from: string; to: string }) =>
    [...analyticsKeys.all, "orders-summary", range] as const,
}
