import { skipToken, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ordersKeys } from "@/services/query-keys";
import { getOrder, updateOrder } from "../api";
import type { CreateOrderPayload } from "../schemas/create-order.schema";

export function useOrder(id?: string) {
  return useQuery({
    queryKey: ordersKeys.detail(id ?? ""),
    queryFn: id ? ({ signal }) => getOrder(id, signal) : skipToken,
  });
}

export function useUpdateOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: CreateOrderPayload }) => updateOrder(id, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ordersKeys.all }),
  });
}
