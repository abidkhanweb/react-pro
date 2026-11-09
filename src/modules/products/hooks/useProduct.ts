import { useState } from "react";
import { skipToken, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { productsKeys } from "@/services/query-keys";
import { createProduct, deleteProduct, getProduct, getProducts, updateProduct } from "../api";
import type { ProductFilters } from "../products.types";
import type { ProductPayload } from "../schemas/product.schema";

export function useProducts(initialPage = 1, initialLimit = 10) {
  const [params, setParams] = useState({
    page: initialPage, limit: initialLimit, search: "", category: "",
    availability: "all" as ProductFilters["availability"],
  });
  const client = useQueryClient();
  const query = useQuery({
    queryKey: productsKeys.list(params),
    queryFn: ({ signal }) => getProducts(params, signal),
  });
  const deletion = useMutation({
    mutationFn: deleteProduct,
    onSuccess: async () => {
      const lastPage = Math.max(1, Math.ceil(((query.data?.total ?? 1) - 1) / params.limit));
      setParams((current) => ({ ...current, page: Math.min(current.page, lastPage) }));
      await client.invalidateQueries({ queryKey: productsKeys.all });
    },
  });

  return {
    ...params,
    products: query.data?.data ?? [], total: query.data?.total ?? 0,
    isLoading: query.isPending, isFetching: query.isFetching, isError: query.isError,
    refetch: query.refetch, deletion,
    setPage: (page: number) => setParams((current) => ({ ...current, page })),
    setLimit: (limit: number) => setParams((current) => ({ ...current, page: 1, limit })),
    applyFilters: (filters: ProductFilters) => setParams((current) => ({ ...current, ...filters, page: 1 })),
  };
}

export function useProduct(id?: string) {
  return useQuery({
    queryKey: productsKeys.detail(id ?? ""),
    queryFn: id ? ({ signal }) => getProduct(id, signal) : skipToken,
  });
}

export function useSaveProduct() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id?: string; payload: ProductPayload }) =>
      id ? updateProduct(id, payload) : createProduct(payload),
    onSuccess: () => client.invalidateQueries({ queryKey: productsKeys.all }),
  });
}
