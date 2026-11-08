import { apiClient, API_ENDPOINTS } from "@/services/api"
import type { PaginatedResponse } from "@/services/api"
import type { Order } from "../orders.types"
import { createOrderPayloadSchema, type CreateOrderPayload } from "../schemas/create-order.schema"

export const getOrders = async (params: { page: number, limit: number }) => {
  const response = await apiClient.get<PaginatedResponse<Order>>(
    API_ENDPOINTS.orders,
    { params }
  )

  return response.data
}

export const deleteOrder = async (id: string) => {
  const response = await apiClient.delete(`${API_ENDPOINTS.orders}/${id}`);
  return response.data;
};

export async function createOrder(payload: CreateOrderPayload) {
  const response = await apiClient.post<Order>(
    API_ENDPOINTS.orders,
    createOrderPayloadSchema.parse(payload),
  );
  return response.data;
}

// # How to use above
// # useQuery({
// #   queryKey: ["orders", page, limit],
// #  queryFn: () => getOrders({ page, limit }),
// # });
