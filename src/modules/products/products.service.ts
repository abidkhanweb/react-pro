import { apiClient, API_ENDPOINTS, type PaginatedResponse } from "@/services/api";
import type { Product } from "./products.types";

export async function getProducts(params: { page: number; limit: number }) {
  const response = await apiClient.get<PaginatedResponse<Product>>(
    API_ENDPOINTS.products,
    { params },
  );
  return response.data;
}

export async function deleteProduct(id: string) {
  await apiClient.delete(`${API_ENDPOINTS.products}/${encodeURIComponent(id)}`);
}
