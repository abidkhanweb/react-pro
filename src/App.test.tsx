// @vitest-environment jsdom
import { afterEach, beforeAll, beforeEach, expect, it, vi } from "vitest";
import { cleanup, configure, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import App from "./App";
import { MENU } from "@/utils/constant/routes";

vi.mock("@/modules/orders/components/OrdersTable", () => ({
  OrdersTable: () => <p>Order list is isolated from network requests in shell tests.</p>,
}));

vi.mock("@/modules/products/components/ProductsTable", () => ({
  ProductsTable: () => <p>Product list is isolated from network requests in shell tests.</p>,
}));

vi.mock("@/modules/users/components/UsersTable", () => ({
  UsersTable: () => <p>User list is isolated from network requests in shell tests.</p>,
}));

beforeAll(() => {
  configure({ asyncUtilTimeout: 5000 });
  // Node exposes its own storage API; components should use the jsdom browser storage in these tests.
  const { jsdom } = globalThis as typeof globalThis & {
    jsdom: { window: { localStorage: Storage } };
  };
  vi.stubGlobal("localStorage", jsdom.window.localStorage);
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: vi.fn().mockImplementation((media: string) => ({
      media, matches: false, onchange: null,
      addListener: vi.fn(), removeListener: vi.fn(),
      addEventListener: vi.fn(), removeEventListener: vi.fn(), dispatchEvent: vi.fn(),
    })),
  });
});

beforeEach(() => {
  localStorage.clear();
  document.documentElement.removeAttribute("class");
});
afterEach(cleanup);

function renderApp(path = "/") {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <MemoryRouter initialEntries={[path]}>
      <QueryClientProvider client={client}>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
          <App />
        </ThemeProvider>
      </QueryClientProvider>
    </MemoryRouter>,
  );
}

it.each(MENU)("opens $label directly and marks only its navigation link active", async ({ path, label }) => {
  renderApp(path);
  await screen.findByRole("heading", { level: 1, name: label });
  const navigation = screen.getByRole("navigation", { name: "Main navigation" });
  expect(within(navigation).getByRole("link", { name: label }).getAttribute("aria-current")).toBe("page");
  expect(navigation.querySelectorAll('[aria-current="page"]')).toHaveLength(1);
  expect(document.title).toBe(`${label} | Commerce Admin`);
});

it("navigates to Orders and moves focus to the main content", async () => {
  renderApp();
  await screen.findByRole("heading", { level: 1, name: "Dashboard" });
  fireEvent.click(within(screen.getByRole("navigation", { name: "Main navigation" })).getByRole("link", { name: "Orders" }));
  await screen.findByRole("heading", { level: 1, name: "Orders" });
  expect(screen.getByRole("textbox", { name: "Customer name" })).toBeTruthy();
  expect(document.activeElement).toBe(screen.getByRole("main"));
  expect(screen.getByRole("link", { name: "Skip to main content" }).getAttribute("href")).toBe("#main-content");
});

it("shows unknown addresses inside the shell and can return to Dashboard", async () => {
  renderApp("/missing/page");
  await screen.findByRole("heading", { name: "Page not found" });
  expect(screen.getByRole("navigation", { name: "Main navigation" })).toBeTruthy();
  fireEvent.click(screen.getByRole("link", { name: "Return to dashboard" }));
  await screen.findByRole("heading", { level: 1, name: "Dashboard" });
});

it("normalizes trailing slashes in the header context", async () => {
  renderApp("/orders/");
  await screen.findByRole("heading", { level: 1, name: "Orders" });
  expect(document.title).toBe("Orders | Commerce Admin");
});

it("does not label an unknown nested address as a valid Orders page", async () => {
  renderApp("/orders/missing");
  await screen.findByRole("heading", { name: "Page not found" });
  expect(document.title).toBe("Page not found | Commerce Admin");
  expect(screen.getByRole("navigation", { name: "Main navigation" }).querySelector('[aria-current="page"]')).toBeNull();
});

it("closes mobile navigation after selecting a page", async () => {
  renderApp();
  await screen.findByRole("heading", { level: 1, name: "Dashboard" });
  fireEvent.click(screen.getByRole("button", { name: "Open navigation" }));
  const dialog = await screen.findByRole("dialog", { name: "Commerce Admin" });
  fireEvent.click(within(dialog).getByRole("link", { name: "Products" }));
  await screen.findByRole("heading", { level: 1, name: "Products" });
  expect(screen.queryByRole("dialog")).toBeNull();
});

it("dismisses mobile navigation with Escape and restores focus", async () => {
  renderApp();
  await screen.findByRole("heading", { level: 1, name: "Dashboard" });
  const trigger = screen.getByRole("button", { name: "Open navigation" });
  fireEvent.click(trigger);
  await screen.findByRole("dialog");
  fireEvent.keyDown(document, { key: "Escape", code: "Escape" });
  await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
  await waitFor(() => expect(document.activeElement).toBe(trigger));
});

it("switches between dark and light themes and persists the selection", async () => {
  renderApp();
  fireEvent.click(await screen.findByRole("button", { name: "Switch to dark theme" }));
  await waitFor(() => expect(document.documentElement.classList.contains("dark")).toBe(true));
  expect(localStorage.getItem("theme")).toBe("dark");
  fireEvent.click(screen.getByRole("button", { name: "Switch to light theme" }));
  await waitFor(() => expect(document.documentElement.classList.contains("light")).toBe(true));
  expect(localStorage.getItem("theme")).toBe("light");
});
