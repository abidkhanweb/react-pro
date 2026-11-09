import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { analyticsKeys } from "@/services/query-keys";
import { getAnalytics } from "../analytics.service";
import { analyticsRangeSchema, getDefaultAnalyticsRange, type AnalyticsRange } from "../schemas/analytics.schema";

export function useAnalytics() {
  const [range, setRange] = useState(getDefaultAnalyticsRange);
  const query = useQuery({
    queryKey: analyticsKeys.revenue(range),
    queryFn: ({ signal }) => getAnalytics(range, signal),
  });
  return {
    report: query.data, isLoading: query.isPending, isFetching: query.isFetching,
    isError: query.isError, refetch: query.refetch, range,
    applyRange: (next: AnalyticsRange) => setRange(analyticsRangeSchema.parse(next)),
  };
}
