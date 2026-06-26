import { useState } from "react"
import {
  useQuery,
  useMutation,
  useQueryClient,
  keepPreviousData,
} from "@tanstack/react-query";
import { ordersKeys } from "@/services/query-keys"
import { getOrders, deleteOrder as apiDeleteOrder } from "../orders.service"
import type { Order } from "../orders.types"

export function useOrders(initialPage = 1, initialLimit = 10) {
  const [page, setPage] = useState(initialPage)
  const [limit, setLimit] = useState(initialLimit)

  const qc = useQueryClient()

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ordersKeys.list({ page, limit }),
    queryFn: () => getOrders({ page, limit }),
    placeholderData: keepPreviousData,
  });


  const { mutateAsync: deleteOrder } = useMutation({
    mutationFn: apiDeleteOrder,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ordersKeys.all });
    },
  });

  return {
    orders: data?.data ?? [] as Order[],
    total: data?.total ?? 0,
    page,
    limit,
    isLoading,
    isError,
    setPage,
    setLimit,
    refetch,
    deleteOrder,
  }
}

// How to use it
// const { orders, page, setPage } = useOrders()
// <DataTable columns={ordersColumns} data={orders} />