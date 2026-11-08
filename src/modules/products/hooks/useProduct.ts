import { useState } from "react"
import { useQuery, useMutation, useQueryClient, keepPreviousData } from "@tanstack/react-query"
import { productsKeys } from "@/services/query-keys"
import {
  getProducts,
  deleteProduct as apiDeleteProduct,
} from "../products.service"

export function useProducts(initialPage = 1, initialLimit = 10) {
  const [page, setPage] = useState(initialPage)
  const [limit, setLimit] = useState(initialLimit)

  const qc = useQueryClient()

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: productsKeys.list({ page, limit }),
    queryFn: () => getProducts({ page, limit }),
    placeholderData: keepPreviousData,
  })

  const { mutateAsync: deleteProduct } = useMutation({
    mutationFn: apiDeleteProduct,
    onSuccess: () => {
      return qc.invalidateQueries({ queryKey: productsKeys.all })
    },
  })

  return {
    products: data?.data ?? [],
    total: data?.total ?? 0,
    page,
    limit,
    isLoading,
    isError,
    setPage,
    setLimit,
    refetch,
    deleteProduct,
  }
}
