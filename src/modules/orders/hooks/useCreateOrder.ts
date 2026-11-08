import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ordersKeys } from "@/services/query-keys";
import { createOrder } from "../api";

export function useCreateOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createOrder,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ordersKeys.all }),
  });
}
