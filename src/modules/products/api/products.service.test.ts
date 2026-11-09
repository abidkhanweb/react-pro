import { afterAll, afterEach, beforeAll, beforeEach, expect, it } from "vitest";
import { setupServer } from "msw/node";
import { http, HttpResponse } from "msw";
import { apiClient } from "@/services/api";
import { productsHandlers, resetMockProducts } from "@/mocks/products.handlers";
import { createProduct, deleteProduct, getProduct, getProducts, updateProduct } from "./products.service";

const server = setupServer(...productsHandlers);
const originalBaseURL = apiClient.defaults.baseURL;
const payload = { name: "Keyboard", category: "Electronics", price: 25.5, stock: 5 };

beforeAll(() => {
  server.listen({ onUnhandledRequest: "error" });
  apiClient.defaults.baseURL = "http://localhost/api";
});
beforeEach(() => resetMockProducts());
afterEach(() => server.resetHandlers());
afterAll(() => { server.close(); apiClient.defaults.baseURL = originalBaseURL; });

it("creates, lists, loads, updates and deletes a product through Axios", async () => {
  const product = await createProduct(payload);
  expect(product).toMatchObject(payload);
  expect((await getProducts({ page: 1, limit: 10 })).data).toContainEqual(product);
  expect(await getProduct(product.id)).toEqual(product);
  const updated = await updateProduct(product.id, { ...payload, name: "Updated keyboard", stock: 0 });
  expect(updated).toEqual({ ...product, name: "Updated keyboard", stock: 0 });
  await deleteProduct(product.id);
  expect((await getProducts({ page: 1, limit: 10 })).total).toBe(0);
  await expect(getProduct(product.id)).rejects.toMatchObject({ statusCode: 404 });
});

it("combines case-insensitive search, exact category and availability before pagination", async () => {
  resetMockProducts([
    { ...payload, id: "one", name: "Keyboard One", stock: 0 },
    { ...payload, id: "two", name: "Keyboard Two", stock: 0 },
    { ...payload, id: "three", name: "Keyboard Three", stock: 5 },
    { ...payload, id: "four", name: "Keyboard Four", category: "Home", stock: 0 },
  ]);
  const result = await getProducts({ page: 2, limit: 1, search: " KEYBOARD ", category: " electronics ", availability: "out-of-stock" });
  expect(result.total).toBe(2);
  expect(result.data.map((item) => item.id)).toEqual(["two"]);
  expect((await getProducts({ page: 1, limit: 10, search: "THREE", availability: "all" })).data[0].stock).toBe(5);
});

it("rejects invalid HTTP writes and preserves existing data", async () => {
  const product = await createProduct(payload);
  for (const change of [{ name: "" }, { category: " " }, { price: -1 }, { price: 1.001 }, { stock: -1 }, { stock: 0.5 }, { id: "changed" }]) {
    await expect(apiClient.put(`/products/${product.id}`, { ...payload, ...change })).rejects.toMatchObject({ statusCode: 422 });
  }
  await expect(apiClient.post("/products", { ...payload, stock: -1 })).rejects.toMatchObject({ statusCode: 422 });
  expect(await getProduct(product.id)).toEqual(product);
});

it("rejects invalid filters and returns 404 for missing products", async () => {
  for (const params of [{ page: 0 }, { limit: 101 }, { availability: "invalid" }, { search: "x".repeat(101) }]) {
    await expect(apiClient.get("/products", { params })).rejects.toMatchObject({ statusCode: 400 });
  }
  await expect(getProduct("missing")).rejects.toMatchObject({ statusCode: 404 });
  await expect(updateProduct("missing", payload)).rejects.toMatchObject({ statusCode: 404 });
  await expect(deleteProduct("missing")).rejects.toMatchObject({ statusCode: 404 });
});

it("preserves server field errors for the product form", async () => {
  server.use(http.post("*/api/products", () => HttpResponse.json({
    message: "Product rejected.", errors: { name: ["This name is unavailable."] },
  }, { status: 422 })));
  await expect(createProduct(payload)).rejects.toMatchObject({ statusCode: 422, errors: { name: ["This name is unavailable."] } });
});

it("rejects malformed product responses rather than rendering invalid stock", async () => {
  server.use(http.get("*/api/products/:id", () => HttpResponse.json({ ...payload, id: "one", stock: -1 })));
  await expect(getProduct("one")).rejects.toThrow();
});
