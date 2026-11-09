import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ordersKeys } from "@/services/query-keys";
import { getOrders, deleteOrder } from "../api";
import type { OrderFilters } from "../orders.types";

export function useOrders(initialPage = 1, initialLimit = 10) {
  const [params, setParams] = useState({
    page: initialPage,
    limit: initialLimit,
    search: "",
    status: "all" as OrderFilters["status"],
  });
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: ordersKeys.list(params),
    queryFn: ({ signal }) => getOrders(params, signal),
  });
  const deletion = useMutation({
    mutationFn: deleteOrder,
    onSuccess: async () => {
      const lastPage = Math.max(1, Math.ceil(((query.data?.total ?? 1) - 1) / params.limit));
      setParams((current) => ({ ...current, page: Math.min(current.page, lastPage) }));
      await queryClient.invalidateQueries({ queryKey: ordersKeys.all });
    },
  });

  return {
    ...params,
    orders: query.data?.data ?? [],
    total: query.data?.total ?? 0,
    isLoading: query.isPending,
    isFetching: query.isFetching,
    isError: query.isError,
    refetch: query.refetch,
    setPage: (page: number) => setParams((current) => ({ ...current, page })),
    setLimit: (limit: number) => setParams((current) => ({ ...current, page: 1, limit })),
    applyFilters: (filters: OrderFilters) => setParams((current) => ({ ...current, ...filters, page: 1 })),
    deletion,
  };
}
