import { useQuery } from "@tanstack/react-query"
import { dashboardKeys } from "@/services/query-keys"
import { getDashboardStats } from "../dashboard.service"

export function useDashboard() {
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: dashboardKeys.stats(),
    queryFn: getDashboardStats,
  })

  return {
    stats: data ?? null,
    isLoading,
    isError,
    refetch,
  }
}
