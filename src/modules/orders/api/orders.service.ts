import { apiClient, API_ENDPOINTS } from "@/services/api"
import type { PaginatedResponse } from "@/services/api"
import type { Order, OrderListParams } from "../orders.types"
import { createOrderPayloadSchema, type CreateOrderPayload } from "../schemas/create-order.schema"
import { updateOrderPayloadSchema } from "../schemas/update-order.schema"

export const getOrders = async (params: OrderListParams, signal?: AbortSignal) => {
  const response = await apiClient.get<PaginatedResponse<Order>>(
    API_ENDPOINTS.orders,
    { params: { ...params, status: params.status === "all" ? undefined : params.status }, signal }
  )

  return response.data
}

export const deleteOrder = async (id: string) => {
  await apiClient.delete(`${API_ENDPOINTS.orders}/${encodeURIComponent(id)}`);
};

export async function createOrder(payload: CreateOrderPayload) {
  const response = await apiClient.post<Order>(
    API_ENDPOINTS.orders,
    createOrderPayloadSchema.parse(payload),
  );
  return response.data;
}

export async function getOrder(id: string, signal?: AbortSignal) {
  const response = await apiClient.get<Order>(`${API_ENDPOINTS.orders}/${encodeURIComponent(id)}`, { signal });
  return response.data;
}

export async function updateOrder(id: string, payload: CreateOrderPayload) {
  const response = await apiClient.put<Order>(
    `${API_ENDPOINTS.orders}/${encodeURIComponent(id)}`,
    updateOrderPayloadSchema.parse(payload),
  );
  return response.data;
}

// # How to use above
// # useQuery({
// #   queryKey: ["orders", page, limit],
// #  queryFn: () => getOrders({ page, limit }),
// # });
