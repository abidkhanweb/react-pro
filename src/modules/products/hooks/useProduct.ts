import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { productsKeys } from "@/services/query-keys"
import {
  getProducts,
  deleteProduct as apiDeleteProduct,
} from "../products.service"
import type { Product } from "../products.types"

export function useProducts(initialPage = 1, initialLimit = 10) {
  const [page, setPage] = useState(initialPage)
  const [limit, setLimit] = useState(initialLimit)

  const qc = useQueryClient()

  const { data, isLoading, isError, refetch } = useQuery(
    productsKeys.list({ page, limit }),
    () => getProducts({ page, limit }),
    { keepPreviousData: true },
  )

  const { mutateAsync: deleteProduct } = useMutation(apiDeleteProduct, {
    onSuccess: () => {
      qc.invalidateQueries(productsKeys.all)
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
