// @vitest-environment jsdom
import { afterAll, afterEach, beforeAll, beforeEach, expect, it, vi } from "vitest";
import { cleanup, configure, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { setupServer } from "msw/node";
import { http, HttpResponse } from "msw";
import { apiClient } from "@/services/api";
import { productsHandlers, resetMockProducts } from "@/mocks/products.handlers";
import type { Product } from "./products.types";
import ProductsPage from "./products.page";

const server = setupServer(...productsHandlers);
const originalBaseURL = apiClient.defaults.baseURL;
const seed: Product[] = [
  { id: "product-1", name: "Keyboard", category: "Electronics", price: 25.5, stock: 5 },
  { id: "product-2", name: "Desk", category: "Home", price: 100, stock: 0 },
];
let client: QueryClient;

beforeAll(() => {
  configure({ asyncUtilTimeout: 5000 });
  server.listen({ onUnhandledRequest: "error" });
  apiClient.defaults.baseURL = "http://localhost:3000/api";
  Object.defineProperty(HTMLElement.prototype, "scrollIntoView", { configurable: true, value: vi.fn() });
  Object.defineProperty(HTMLElement.prototype, "hasPointerCapture", { configurable: true, value: () => false });
  Object.defineProperty(HTMLElement.prototype, "setPointerCapture", { configurable: true, value: vi.fn() });
  Object.defineProperty(HTMLElement.prototype, "releasePointerCapture", { configurable: true, value: vi.fn() });
});
beforeEach(() => resetMockProducts(seed));
afterEach(() => { cleanup(); client?.clear(); server.resetHandlers(); });
afterAll(() => { server.close(); apiClient.defaults.baseURL = originalBaseURL; });

function renderPage() {
  client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<QueryClientProvider client={client}><ProductsPage /></QueryClientProvider>);
}

async function chooseOption(label: string, option: string) {
  fireEvent.keyDown(screen.getByRole("combobox", { name: label }), { key: "Enter", code: "Enter" });
  fireEvent.click(await screen.findByRole("option", { name: option }));
}

async function nextPage() {
  await waitFor(() => expect((screen.getByRole("button", { name: "Next" }) as HTMLButtonElement).disabled).toBe(false));
  fireEvent.click(screen.getByRole("button", { name: "Next" }));
}

it("creates a zero-stock product, resets the form and refreshes the list", async () => {
  renderPage();
  await screen.findByText("Page 1 of 1 (2 products)");
  fireEvent.change(screen.getByRole("textbox", { name: "Product name" }), { target: { value: "New product" } });
  fireEvent.change(screen.getByRole("textbox", { name: "Category" }), { target: { value: "Home" } });
  fireEvent.change(screen.getByRole("spinbutton", { name: "Price (INR)" }), { target: { value: "10.50" } });
  fireEvent.click(screen.getByRole("button", { name: "Save product" }));
  const pending = await screen.findByRole("button", { name: "Saving product..." });
  expect((pending.closest("fieldset") as HTMLFieldSetElement).disabled).toBe(true);
  await screen.findByText(/saved successfully/);
  await screen.findByText("Page 1 of 1 (3 products)");
  expect(within(screen.getByRole("row", { name: /New product/ })).getByText("Out of stock")).toBeTruthy();
  expect((screen.getByRole("textbox", { name: "Product name" }) as HTMLInputElement).value).toBe("");
});

it("shows validation errors without submitting incomplete product information", async () => {
  resetMockProducts();
  renderPage();
  await screen.findByText("No products yet. Create your first product.");
  fireEvent.click(screen.getByRole("button", { name: "Save product" }));
  expect(await screen.findByText("Product name is required.")).toBeTruthy();
  expect(screen.getByText("Category is required.")).toBeTruthy();
});

it("loads saved product details with INR price and stock", async () => {
  renderPage();
  fireEvent.click(await screen.findByRole("button", { name: "view product product-1" }));
  const dialog = await screen.findByRole("dialog", { name: "Product details" });
  expect(await within(dialog).findByText("Keyboard")).toBeTruthy();
  expect(within(dialog).getByText("₹25.50")).toBeTruthy();
  expect(within(dialog).getByText("Electronics")).toBeTruthy();
  fireEvent.click(within(dialog).getByRole("button", { name: "Close" }));
  await waitFor(() => expect(document.activeElement).toBe(screen.getByRole("button", { name: "view product product-1" })));
});

it("prefills and saves product name, category, price and stock changes", async () => {
  renderPage();
  fireEvent.click(await screen.findByRole("button", { name: "edit product product-1" }));
  const dialog = await screen.findByRole("dialog", { name: "Edit product" });
  const name = await within(dialog).findByRole("textbox", { name: "Product name" });
  expect((name as HTMLInputElement).value).toBe("Keyboard");
  fireEvent.change(name, { target: { value: "Updated keyboard" } });
  fireEvent.change(within(dialog).getByRole("textbox", { name: "Category" }), { target: { value: "Gadgets" } });
  fireEvent.change(within(dialog).getByRole("spinbutton", { name: "Price (INR)" }), { target: { value: "35.75" } });
  fireEvent.change(within(dialog).getByRole("spinbutton", { name: "Stock quantity" }), { target: { value: "0" } });
  fireEvent.click(within(dialog).getByRole("button", { name: "Save changes" }));
  await screen.findByText("Product updated.");
  const row = screen.getByRole("row", { name: /Updated keyboard/ });
  expect(within(row).getByText("Gadgets")).toBeTruthy();
  expect(within(row).getByText("₹35.75")).toBeTruthy();
  expect(within(row).getByText("Out of stock")).toBeTruthy();
});

it("preserves edit input and field errors after a failed save", async () => {
  server.use(http.put("*/api/products/:id", () => HttpResponse.json({ message: "Save rejected.", errors: { stock: ["Stock is locked."] } }, { status: 422 })));
  renderPage();
  fireEvent.click(await screen.findByRole("button", { name: "edit product product-1" }));
  const dialog = await screen.findByRole("dialog", { name: "Edit product" });
  const stock = await within(dialog).findByRole("spinbutton", { name: "Stock quantity" });
  fireEvent.change(stock, { target: { value: "999" } });
  fireEvent.click(within(dialog).getByRole("button", { name: "Save changes" }));
  expect(await within(dialog).findByText("Save rejected.")).toBeTruthy();
  expect(within(dialog).getByText("Stock is locked.")).toBeTruthy();
  expect((stock as HTMLInputElement).value).toBe("999");
});

it("cancels deletion without a request and keeps a failed deletion open", async () => {
  let calls = 0;
  server.use(http.delete("*/api/products/:id", () => {
    calls += 1;
    return HttpResponse.json({ message: "Deletion blocked." }, { status: 500 });
  }));
  renderPage();
  fireEvent.click(await screen.findByRole("button", { name: "delete product product-1" }));
  let dialog = await screen.findByRole("dialog", { name: "Delete product" });
  fireEvent.click(within(dialog).getByRole("button", { name: "Cancel" }));
  expect(calls).toBe(0);
  await waitFor(() => expect(document.activeElement).toBe(screen.getByRole("button", { name: "delete product product-1" })));
  fireEvent.click(screen.getByRole("button", { name: "delete product product-1" }));
  dialog = await screen.findByRole("dialog", { name: "Delete product" });
  fireEvent.click(within(dialog).getByRole("button", { name: "Delete product" }));
  expect(await within(dialog).findByText("Deletion blocked.")).toBeTruthy();
  expect(calls).toBe(1);
});

it("recovers the page after deleting its last product and blocks repeated confirmation", async () => {
  resetMockProducts(Array.from({ length: 11 }, (_, index) => ({ ...seed[0], id: `product-${index + 1}` })));
  renderPage();
  await screen.findByText("Page 1 of 2 (11 products)");
  await nextPage();
  await screen.findByText("Page 2 of 2 (11 products)");
  fireEvent.click(screen.getByRole("button", { name: "delete product product-11" }));
  const dialog = await screen.findByRole("dialog", { name: "Delete product" });
  fireEvent.click(within(dialog).getByRole("button", { name: "Delete product" }));
  const pending = await within(dialog).findByRole("button", { name: "Deleting..." });
  expect((pending as HTMLButtonElement).disabled).toBe(true);
  fireEvent.click(pending);
  fireEvent.keyDown(document, { key: "Escape", code: "Escape" });
  expect(screen.getByRole("dialog")).toBeTruthy();
  await screen.findByText("Product deleted.");
  await screen.findByText("Page 1 of 1 (10 products)");
  await waitFor(() => expect(document.activeElement?.getAttribute("aria-label")).toBe("Products results"));
});

it("combines search, category and stock filters and clears them", async () => {
  renderPage();
  await screen.findByText("Page 1 of 1 (2 products)");
  fireEvent.change(screen.getByRole("searchbox", { name: "Search products" }), { target: { value: "DESK" } });
  fireEvent.change(screen.getByRole("textbox", { name: "Category filter" }), { target: { value: "home" } });
  await chooseOption("Stock availability", "Out of stock");
  fireEvent.click(screen.getByRole("button", { name: "Apply filters" }));
  await screen.findByText("Page 1 of 1 (1 products)");
  expect(within(screen.getByRole("table")).queryByText("Keyboard")).toBeNull();
  fireEvent.click(screen.getByRole("button", { name: "Clear filters" }));
  await screen.findByText("Page 1 of 1 (2 products)");
  expect((screen.getByRole("searchbox", { name: "Search products" }) as HTMLInputElement).value).toBe("");
});

it("resets pagination after an edit removes the last product from a stock filter", async () => {
  resetMockProducts(Array.from({ length: 11 }, (_, index) => ({ ...seed[0], id: `product-${index + 1}` })));
  renderPage();
  await screen.findByText("Page 1 of 2 (11 products)");
  await chooseOption("Stock availability", "In stock");
  fireEvent.click(screen.getByRole("button", { name: "Apply filters" }));
  await nextPage();
  await screen.findByText("Page 2 of 2 (11 products)");
  fireEvent.click(screen.getByRole("button", { name: "edit product product-11" }));
  const dialog = await screen.findByRole("dialog", { name: "Edit product" });
  const stock = await within(dialog).findByRole("spinbutton", { name: "Stock quantity" });
  fireEvent.change(stock, { target: { value: "0" } });
  fireEvent.click(within(dialog).getByRole("button", { name: "Save changes" }));
  await screen.findByText("Product updated.");
  await screen.findByText("Page 1 of 1 (10 products)");
});

it("resets pagination when changing page size and search", async () => {
  resetMockProducts(Array.from({ length: 11 }, (_, index) => ({ ...seed[0], id: `product-${index + 1}` })));
  renderPage();
  await screen.findByText("Page 1 of 2 (11 products)");
  await nextPage();
  await screen.findByText("Page 2 of 2 (11 products)");
  await chooseOption("Rows per page", "25");
  await screen.findByText("Page 1 of 1 (11 products)");
  await chooseOption("Rows per page", "10");
  await screen.findByText("Page 1 of 2 (11 products)");
  await nextPage();
  await screen.findByText("Page 2 of 2 (11 products)");
  fireEvent.change(screen.getByRole("searchbox", { name: "Search products" }), { target: { value: "product-11" } });
  fireEvent.click(screen.getByRole("button", { name: "Apply filters" }));
  await screen.findByText("Page 1 of 1 (1 products)");
});

it("recovers list errors and shows an empty search result", async () => {
  server.use(http.get("*/api/products", () => HttpResponse.json({ message: "Unavailable." }, { status: 503 })));
  renderPage();
  await screen.findByRole("alert");
  server.resetHandlers();
  fireEvent.click(screen.getByRole("button", { name: "Retry" }));
  await screen.findByText("Page 1 of 1 (2 products)");
  fireEvent.change(screen.getByRole("searchbox", { name: "Search products" }), { target: { value: "Missing" } });
  fireEvent.click(screen.getByRole("button", { name: "Apply filters" }));
  expect(await screen.findByText("No products match these filters.")).toBeTruthy();
});

it("keeps a missing product out of edit mode until details can be retrieved", async () => {
  server.use(http.get("*/api/products/:id", () => HttpResponse.json({ message: "Not found." }, { status: 404 })));
  renderPage();
  fireEvent.click(await screen.findByRole("button", { name: "edit product product-1" }));
  const dialog = await screen.findByRole("dialog", { name: "Edit product" });
  expect(await within(dialog).findByText("Could not load product details.")).toBeTruthy();
  expect(within(dialog).queryByRole("button", { name: "Save changes" })).toBeNull();
  server.resetHandlers();
  fireEvent.click(within(dialog).getByRole("button", { name: "Retry" }));
  expect(await within(dialog).findByRole("textbox", { name: "Product name" })).toBeTruthy();
});
