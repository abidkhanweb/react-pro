import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { analyticsKeys } from "@/services/query-keys"
import { getAnalytics } from "../analytics.service"

export function useAnalytics() {
  const [range, setRange] = useState({ from: "", to: "" })

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: analyticsKeys.revenue(range),
    queryFn: () => getAnalytics(range),
    enabled: !!(range.from && range.to),
  });

  return {
    analyticsData: data ?? null,
    isLoading,
    isError,
    range,
    setRange,
    refetch,
  }
}
