import { apiClient, API_ENDPOINTS } from "@/services/api";
import type { ProductListParams } from "../products.types";
import { productListResponseSchema, productPayloadSchema, productResponseSchema, type ProductPayload } from "../schemas/product.schema";

export async function getProducts(params: ProductListParams, signal?: AbortSignal) {
  const response = await apiClient.get<unknown>(
    API_ENDPOINTS.products,
    { params: { ...params, availability: params.availability === "all" ? undefined : params.availability }, signal },
  );
  return productListResponseSchema.parse(response.data);
}

export async function getProduct(id: string, signal?: AbortSignal) {
  const response = await apiClient.get<unknown>(`${API_ENDPOINTS.products}/${encodeURIComponent(id)}`, { signal });
  return productResponseSchema.parse(response.data);
}

export async function createProduct(payload: ProductPayload) {
  const response = await apiClient.post<unknown>(API_ENDPOINTS.products, productPayloadSchema.parse(payload));
  return productResponseSchema.parse(response.data);
}

export async function updateProduct(id: string, payload: ProductPayload) {
  const response = await apiClient.put<unknown>(`${API_ENDPOINTS.products}/${encodeURIComponent(id)}`, productPayloadSchema.parse(payload));
  return productResponseSchema.parse(response.data);
}

export async function deleteProduct(id: string) {
  await apiClient.delete(`${API_ENDPOINTS.products}/${encodeURIComponent(id)}`);
}
