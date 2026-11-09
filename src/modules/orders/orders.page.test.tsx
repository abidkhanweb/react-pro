// @vitest-environment jsdom
import { afterAll, afterEach, beforeAll, beforeEach, expect, it, vi } from "vitest";
import { cleanup, configure, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { setupServer } from "msw/node";
import { http, HttpResponse } from "msw";
import { apiClient } from "@/services/api";
import { ordersHandlers, resetMockOrders } from "@/mocks/orders.handlers";
import type { Order } from "./orders.types";
import OrdersPage from "./orders.page";

const server = setupServer(...ordersHandlers);
const originalBaseURL = apiClient.defaults.baseURL;
const seed: Order[] = [
  { id: "order-1", customerName: "Ada", status: "pending", totalAmount: 10.25, createdAt: "2026-11-09T09:00:00.000Z" },
  { id: "order-2", customerName: "Grace", status: "completed", totalAmount: 20.5, createdAt: "2026-11-09T10:00:00.000Z" },
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
beforeEach(() => resetMockOrders(seed));
afterEach(() => {
  cleanup();
  client?.clear();
  server.resetHandlers();
});
afterAll(() => {
  server.close();
  apiClient.defaults.baseURL = originalBaseURL;
});

function renderPage() {
  client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<QueryClientProvider client={client}><OrdersPage /></QueryClientProvider>);
}

async function chooseOption(label: string, option: string, scope: Pick<typeof screen, "getByRole"> = screen) {
  fireEvent.keyDown(scope.getByRole("combobox", { name: label }), { key: "Enter", code: "Enter" });
  fireEvent.click(await screen.findByRole("option", { name: option }));
}

async function nextPage() {
  await waitFor(() => expect((screen.getByRole("button", { name: "Next" }) as HTMLButtonElement).disabled).toBe(false));
  fireEvent.click(screen.getByRole("button", { name: "Next" }));
}

it("creates an order, resets the form and refreshes the list", async () => {
  renderPage();
  await screen.findByText("Page 1 of 1 (2 orders)");
  fireEvent.change(screen.getByRole("textbox", { name: "Customer name" }), { target: { value: "New customer" } });
  fireEvent.change(screen.getByRole("spinbutton", { name: "Total amount (INR)" }), { target: { value: "12.50" } });
  fireEvent.click(screen.getByRole("button", { name: "Save order" }));
  await screen.findByText(/saved successfully/);
  await screen.findByText("Page 1 of 1 (3 orders)");
  expect(within(screen.getByRole("table")).getByText("New customer")).toBeTruthy();
  expect((screen.getByRole("textbox", { name: "Customer name" }) as HTMLInputElement).value).toBe("");
});

it("loads the current order details from the API", async () => {
  renderPage();
  fireEvent.click(await screen.findByRole("button", { name: "view order order-1" }));
  const dialog = await screen.findByRole("dialog", { name: "Order details" });
  expect(await within(dialog).findByText("Ada")).toBeTruthy();
  expect(within(dialog).getByText("₹10.25")).toBeTruthy();
  expect(dialog.querySelector("time")?.getAttribute("datetime")).toBe(seed[0].createdAt);
});

it("edits an order using its existing values and refreshes the saved row", async () => {
  renderPage();
  fireEvent.click(await screen.findByRole("button", { name: "edit order order-1" }));
  const dialog = await screen.findByRole("dialog", { name: "Edit order" });
  const name = await within(dialog).findByRole("textbox", { name: "Customer name" });
  expect((name as HTMLInputElement).value).toBe("Ada");
  fireEvent.change(name, { target: { value: "Ada Updated" } });
  await chooseOption("Order status", "Completed", within(dialog));
  fireEvent.click(within(dialog).getByRole("button", { name: "Save changes" }));
  await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
  expect(await screen.findByText("Order updated.")).toBeTruthy();
  const row = screen.getByRole("row", { name: /Ada Updated/ });
  expect(within(row).getByText("completed")).toBeTruthy();
});

it("keeps edit values and server field errors after a failed save", async () => {
  server.use(http.put("*/api/orders/:id", () => HttpResponse.json({
    message: "Save rejected.", errors: { customerName: ["Customer cannot be changed."] },
  }, { status: 422 })));
  renderPage();
  fireEvent.click(await screen.findByRole("button", { name: "edit order order-1" }));
  const dialog = await screen.findByRole("dialog", { name: "Edit order" });
  const name = await within(dialog).findByRole("textbox", { name: "Customer name" });
  fireEvent.change(name, { target: { value: "Keep this value" } });
  fireEvent.click(within(dialog).getByRole("button", { name: "Save changes" }));
  expect(await within(dialog).findByText("Save rejected.")).toBeTruthy();
  expect(within(dialog).getByText("Customer cannot be changed.")).toBeTruthy();
  expect((name as HTMLInputElement).value).toBe("Keep this value");
  expect((within(dialog).getByRole("button", { name: "Save changes" }) as HTMLButtonElement).disabled).toBe(false);
});

it("does not delete on cancellation and keeps failed deletion open", async () => {
  let calls = 0;
  server.use(http.delete("*/api/orders/:id", () => {
    calls += 1;
    return HttpResponse.json({ message: "Deletion blocked." }, { status: 500 });
  }));
  renderPage();
  fireEvent.click(await screen.findByRole("button", { name: "delete order order-1" }));
  let dialog = await screen.findByRole("dialog", { name: "Delete order" });
  fireEvent.click(within(dialog).getByRole("button", { name: "Cancel" }));
  expect(screen.queryByRole("dialog")).toBeNull();
  expect(calls).toBe(0);
  await waitFor(() => expect(document.activeElement).toBe(screen.getByRole("button", { name: "delete order order-1" })));
  fireEvent.click(screen.getByRole("button", { name: "delete order order-1" }));
  dialog = await screen.findByRole("dialog", { name: "Delete order" });
  fireEvent.click(within(dialog).getByRole("button", { name: "Delete order" }));
  expect(await within(dialog).findByText("Deletion blocked.")).toBeTruthy();
  expect(calls).toBe(1);
  expect(screen.getByRole("dialog", { name: "Delete order" })).toBeTruthy();
});

it("returns to the previous page after deleting the only order on the last page", async () => {
  resetMockOrders(Array.from({ length: 11 }, (_, index) => ({ ...seed[0], id: `order-${index + 1}`, customerName: `Customer ${index + 1}` })));
  renderPage();
  await screen.findByText("Page 1 of 2 (11 orders)");
  await nextPage();
  await screen.findByText("Page 2 of 2 (11 orders)");
  fireEvent.click(screen.getByRole("button", { name: "delete order order-11" }));
  const dialog = await screen.findByRole("dialog", { name: "Delete order" });
  fireEvent.click(within(dialog).getByRole("button", { name: "Delete order" }));
  const pending = await within(dialog).findByRole("button", { name: "Deleting..." });
  expect((pending as HTMLButtonElement).disabled).toBe(true);
  fireEvent.click(pending);
  await screen.findByText("Order deleted.");
  await screen.findByText("Page 1 of 1 (10 orders)");
  expect(screen.queryByRole("button", { name: "delete order order-11" })).toBeNull();
  await waitFor(() => expect(document.activeElement?.getAttribute("aria-label")).toBe("Orders results"));
});

it("combines search and status filters and clears them", async () => {
  renderPage();
  await screen.findByText("Page 1 of 1 (2 orders)");
  fireEvent.change(screen.getByRole("searchbox", { name: "Search orders" }), { target: { value: "GRACE" } });
  await chooseOption("Filter by status", "Completed");
  fireEvent.click(screen.getByRole("button", { name: "Apply filters" }));
  await screen.findByText("Page 1 of 1 (1 orders)");
  expect(within(screen.getByRole("table")).queryByText("Ada")).toBeNull();
  fireEvent.click(screen.getByRole("button", { name: "Clear filters" }));
  await screen.findByText("Page 1 of 1 (2 orders)");
  expect((screen.getByRole("searchbox", { name: "Search orders" }) as HTMLInputElement).value).toBe("");
});

it("returns to page one when editing removes an order from the current status filter", async () => {
  resetMockOrders(Array.from({ length: 11 }, (_, index) => ({ ...seed[0], id: `order-${index + 1}` })));
  renderPage();
  await screen.findByText("Page 1 of 2 (11 orders)");
  await chooseOption("Filter by status", "Pending");
  fireEvent.click(screen.getByRole("button", { name: "Apply filters" }));
  await nextPage();
  await screen.findByText("Page 2 of 2 (11 orders)");
  fireEvent.click(screen.getByRole("button", { name: "edit order order-11" }));
  const dialog = await screen.findByRole("dialog", { name: "Edit order" });
  await within(dialog).findByRole("textbox", { name: "Customer name" });
  await chooseOption("Order status", "Completed", within(dialog));
  fireEvent.click(within(dialog).getByRole("button", { name: "Save changes" }));
  await screen.findByText("Order updated.");
  await screen.findByText("Page 1 of 1 (10 orders)");
});

it("reports missing details without opening an empty edit form", async () => {
  server.use(http.get("*/api/orders/:id", () => HttpResponse.json({ message: "Order not found." }, { status: 404 })));
  renderPage();
  fireEvent.click(await screen.findByRole("button", { name: "edit order order-1" }));
  const dialog = await screen.findByRole("dialog", { name: "Edit order" });
  expect(await within(dialog).findByText("Order not found.")).toBeTruthy();
  expect(within(dialog).queryByRole("button", { name: "Save changes" })).toBeNull();
  server.resetHandlers();
  fireEvent.click(within(dialog).getByRole("button", { name: "Retry" }));
  expect(await within(dialog).findByRole("textbox", { name: "Customer name" })).toBeTruthy();
});

it("resets pagination on search and page-size changes", async () => {
  resetMockOrders(Array.from({ length: 11 }, (_, index) => ({ ...seed[0], id: `order-${index + 1}`, customerName: `Customer ${index + 1}` })));
  renderPage();
  await screen.findByText("Page 1 of 2 (11 orders)");
  await nextPage();
  await screen.findByText("Page 2 of 2 (11 orders)");
  await chooseOption("Rows per page", "25");
  await screen.findByText("Page 1 of 1 (11 orders)");
  await chooseOption("Rows per page", "10");
  await screen.findByText("Page 1 of 2 (11 orders)");
  await nextPage();
  await screen.findByText("Page 2 of 2 (11 orders)");
  fireEvent.change(screen.getByRole("searchbox", { name: "Search orders" }), { target: { value: "Customer 11" } });
  fireEvent.click(screen.getByRole("button", { name: "Apply filters" }));
  await screen.findByText("Page 1 of 1 (1 orders)");
});

it("recovers from list errors and shows a clear empty-filter result", async () => {
  server.use(http.get("*/api/orders", () => HttpResponse.json({ message: "Unavailable." }, { status: 503 })));
  renderPage();
  await screen.findByRole("alert");
  server.resetHandlers();
  fireEvent.click(screen.getByRole("button", { name: "Retry" }));
  await screen.findByText("Page 1 of 1 (2 orders)");
  fireEvent.change(screen.getByRole("searchbox", { name: "Search orders" }), { target: { value: "Nobody" } });
  fireEvent.click(screen.getByRole("button", { name: "Apply filters" }));
  expect(await screen.findByText("No orders match these filters.")).toBeTruthy();
});
