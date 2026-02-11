import { apiClient, API_ENDPOINTS } from "@/services/api"
import type { PaginatedResponse } from "@/services/api"

export const getOrders = async (params: { page: number, limit: number }) => {
  const response = await apiClient.get<PaginatedResponse<Order>>(
    API_ENDPOINTS.orders,
    { params }
  )

  return response.data
}

// # How to use above
// # useQuery({
// #   queryKey: ["orders", page, limit],
// #  queryFn: () => getOrders({ page, limit }),
// # });