import { delay, http, HttpResponse } from "msw";
import { z } from "zod";
import { productPayloadSchema } from "@/modules/products/schemas/product.schema";
import type { Product } from "@/modules/products/products.types";

// shortcut: demo products live in memory; persistent catalog storage belongs to the backend milestone.
const products: Product[] = [];

export const getMockProducts = () => products.map((product) => ({ ...product }));

export function resetMockProducts(seed: Product[] = []) {
  products.splice(0, products.length, ...seed.map((product) => ({ ...product })));
}

export const productsHandlers = [
  http.get("*/api/products", ({ request }) => {
    const url = new URL(request.url);
    const result = z.object({
      page: z.coerce.number().int().min(1), limit: z.coerce.number().int().min(1).max(100),
      search: z.string().trim().max(100), category: z.string().trim().max(80),
      availability: z.enum(["in-stock", "out-of-stock"]).optional(),
    }).safeParse({
      page: url.searchParams.get("page") ?? "1", limit: url.searchParams.get("limit") ?? "10",
      search: url.searchParams.get("search") ?? "", category: url.searchParams.get("category") ?? "",
      availability: url.searchParams.get("availability") ?? undefined,
    });
    if (!result.success) return HttpResponse.json({ message: "Invalid product filters or pagination." }, { status: 400 });
    const { page, limit, search, category, availability } = result.data;
    const term = search.toLowerCase();
    const filtered = products.filter((product) =>
      (!term || product.name.toLowerCase().includes(term) || product.id.toLowerCase().includes(term)) &&
      (!category || product.category.toLowerCase() === category.toLowerCase()) &&
      (!availability || (availability === "in-stock" ? product.stock > 0 : product.stock === 0)),
    );
    return HttpResponse.json({ data: filtered.slice((page - 1) * limit, page * limit), total: filtered.length, page, limit });
  }),
  http.get("*/api/products/:id", ({ params }) => {
    const product = products.find((item) => item.id === params.id);
    return product ? HttpResponse.json(product) : HttpResponse.json({ message: "Product not found." }, { status: 404 });
  }),
  http.post("*/api/products", async ({ request }) => {
    const body: unknown = await request.json().catch(() => undefined);
    if (body === undefined) return HttpResponse.json({ message: "Invalid JSON." }, { status: 400 });
    const result = productPayloadSchema.safeParse(body);
    if (!result.success) return HttpResponse.json({ message: "Check the product fields.", errors: result.error.flatten().fieldErrors }, { status: 422 });
    await delay(200);
    const product: Product = { ...result.data, id: crypto.randomUUID() };
    products.unshift(product);
    return HttpResponse.json(product, { status: 201 });
  }),
  http.put("*/api/products/:id", async ({ request, params }) => {
    const body: unknown = await request.json().catch(() => undefined);
    if (body === undefined) return HttpResponse.json({ message: "Invalid JSON." }, { status: 400 });
    const result = productPayloadSchema.safeParse(body);
    if (!result.success) return HttpResponse.json({ message: "Check the product fields.", errors: result.error.flatten().fieldErrors }, { status: 422 });
    await delay(150);
    const index = products.findIndex((product) => product.id === params.id);
    if (index === -1) return HttpResponse.json({ message: "Product not found." }, { status: 404 });
    const product = { ...products[index], ...result.data };
    products[index] = product;
    return HttpResponse.json(product);
  }),
  http.delete("*/api/products/:id", async ({ params }) => {
    await delay(150);
    const index = products.findIndex((product) => product.id === params.id);
    if (index === -1) return HttpResponse.json({ message: "Product not found." }, { status: 404 });
    products.splice(index, 1);
    return new HttpResponse(null, { status: 204 });
  }),
];
