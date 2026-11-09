import { useQuery } from "@tanstack/react-query"
import { dashboardKeys } from "@/services/query-keys"
import { getDashboardStats } from "../dashboard.service"

export function useDashboard() {
  const { data, isPending, isFetching, isError, refetch } = useQuery({
    queryKey: dashboardKeys.stats(),
    queryFn: ({ signal }) => getDashboardStats(signal),
  })

  return {
    stats: data ?? null,
    isLoading: isPending,
    isFetching,
    isError,
    refetch,
  }
}
