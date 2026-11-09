import { useMutation, useQueryClient } from "@tanstack/react-query";
import { analyticsKeys, dashboardKeys, ordersKeys } from "@/services/query-keys";
import { createOrder } from "../api";

export function useCreateOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createOrder,
    onSuccess: () => Promise.all([
      queryClient.invalidateQueries({ queryKey: ordersKeys.all }),
      queryClient.invalidateQueries({ queryKey: dashboardKeys.stats() }),
      queryClient.invalidateQueries({ queryKey: analyticsKeys.all }),
    ]),
  });
}
