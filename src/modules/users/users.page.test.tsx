// @vitest-environment jsdom
import { afterAll, afterEach, beforeAll, beforeEach, expect, it, vi } from "vitest";
import { cleanup, configure, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { setupServer } from "msw/node";
import { http, HttpResponse } from "msw";
import { apiClient } from "@/services/api";
import { usersHandlers, resetMockUsers } from "@/mocks/users.handlers";
import type { User } from "./users.types";
import UsersPage from "./users.page";

const server = setupServer(...usersHandlers);
const originalBaseURL = apiClient.defaults.baseURL;
const seed: User[] = [
  { id: "user-1", name: "Ada", email: "ada@example.com", role: "viewer", createdAt: "2026-11-09T10:00:00.000Z" },
  { id: "user-2", name: "Grace", email: "grace@example.com", role: "manager", createdAt: "2026-11-08T10:00:00.000Z" },
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
beforeEach(() => resetMockUsers(seed));
afterEach(() => { cleanup(); client?.clear(); server.resetHandlers(); });
afterAll(() => { server.close(); apiClient.defaults.baseURL = originalBaseURL; });

function renderPage() {
  client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<QueryClientProvider client={client}><UsersPage /></QueryClientProvider>);
}

async function chooseOption(label: string, option: string, scope: Pick<typeof screen, "getByRole"> = screen) {
  fireEvent.keyDown(scope.getByRole("combobox", { name: label }), { key: "Enter", code: "Enter" });
  fireEvent.click(await screen.findByRole("option", { name: option }));
}

async function nextPage() {
  await waitFor(() => expect((screen.getByRole("button", { name: "Next" }) as HTMLButtonElement).disabled).toBe(false));
  fireEvent.click(screen.getByRole("button", { name: "Next" }));
}

function seedPages() {
  resetMockUsers(Array.from({ length: 11 }, (_, index) => ({ ...seed[0], id: `user-${index + 1}`, email: `user${index + 1}@example.com` })));
}

it("creates a normalized profile with viewer default, protects pending submission and resets the form", async () => {
  renderPage();
  await screen.findByText("Page 1 of 1 (2 users)");
  fireEvent.change(screen.getByRole("textbox", { name: "Full name" }), { target: { value: " New user " } });
  fireEvent.change(screen.getByRole("textbox", { name: "Email address" }), { target: { value: " NEW@EXAMPLE.COM " } });
  fireEvent.click(screen.getByRole("button", { name: "Save user" }));
  const pending = await screen.findByRole("button", { name: "Saving user..." });
  expect((pending.closest("fieldset") as HTMLFieldSetElement).disabled).toBe(true);
  await screen.findByText(/saved successfully/);
  await screen.findByText("Page 1 of 1 (3 users)");
  const row = screen.getByRole("row", { name: /New user/ });
  expect(within(row).getByText("new@example.com")).toBeTruthy();
  expect(within(row).getByText("VIEWER")).toBeTruthy();
  expect((screen.getByRole("textbox", { name: "Full name" }) as HTMLInputElement).value).toBe("");
});

it("validates required names and email addresses without sending a request", async () => {
  resetMockUsers();
  renderPage();
  await screen.findByText("No users yet. Create your first user record.");
  fireEvent.click(screen.getByRole("button", { name: "Save user" }));
  expect(await screen.findByText("Name is required.")).toBeTruthy();
  expect(screen.getByText("Enter a valid email address.")).toBeTruthy();
});

it("loads saved details and restores focus when closed", async () => {
  renderPage();
  fireEvent.click(await screen.findByRole("button", { name: "view user user-1" }));
  const dialog = await screen.findByRole("dialog", { name: "User details" });
  expect(await within(dialog).findByText("ada@example.com")).toBeTruthy();
  expect(within(dialog).getByText("viewer")).toBeTruthy();
  expect(dialog.querySelector("time")?.getAttribute("datetime")).toBe(seed[0].createdAt);
  fireEvent.click(within(dialog).getByRole("button", { name: "Close" }));
  await waitFor(() => expect(document.activeElement).toBe(screen.getByRole("button", { name: "view user user-1" })));
});

it("prefills and saves name, email and role edits", async () => {
  renderPage();
  fireEvent.click(await screen.findByRole("button", { name: "edit user user-1" }));
  const dialog = await screen.findByRole("dialog", { name: "Edit user" });
  const name = await within(dialog).findByRole("textbox", { name: "Full name" });
  expect((name as HTMLInputElement).value).toBe("Ada");
  fireEvent.change(name, { target: { value: "Ada Lovelace" } });
  fireEvent.change(within(dialog).getByRole("textbox", { name: "Email address" }), { target: { value: "ada.new@example.com" } });
  await chooseOption("User role", "Admin", within(dialog));
  fireEvent.click(within(dialog).getByRole("button", { name: "Save changes" }));
  await screen.findByText("User updated.");
  const row = screen.getByRole("row", { name: /Ada Lovelace/ });
  expect(within(row).getByText("ada.new@example.com")).toBeTruthy();
  expect(within(row).getByText("ADMIN")).toBeTruthy();
});

it("preserves edits and shows the duplicate-email field error", async () => {
  renderPage();
  fireEvent.click(await screen.findByRole("button", { name: "edit user user-1" }));
  const dialog = await screen.findByRole("dialog", { name: "Edit user" });
  const email = await within(dialog).findByRole("textbox", { name: "Email address" });
  fireEvent.change(email, { target: { value: "GRACE@EXAMPLE.COM" } });
  fireEvent.click(within(dialog).getByRole("button", { name: "Save changes" }));
  expect(await within(dialog).findByText("A user with this email already exists.")).toBeTruthy();
  expect(within(dialog).getByText("Email already in use.")).toBeTruthy();
  expect((email as HTMLInputElement).value).toBe("GRACE@EXAMPLE.COM");
});

it("cancels deletion without a request and keeps failed deletion open", async () => {
  let calls = 0;
  server.use(http.delete("*/api/users/:id", () => {
    calls += 1;
    return HttpResponse.json({ message: "Deletion blocked." }, { status: 500 });
  }));
  renderPage();
  fireEvent.click(await screen.findByRole("button", { name: "delete user user-1" }));
  let dialog = await screen.findByRole("dialog", { name: "Delete user" });
  fireEvent.click(within(dialog).getByRole("button", { name: "Cancel" }));
  expect(calls).toBe(0);
  await waitFor(() => expect(document.activeElement).toBe(screen.getByRole("button", { name: "delete user user-1" })));
  fireEvent.click(screen.getByRole("button", { name: "delete user user-1" }));
  dialog = await screen.findByRole("dialog", { name: "Delete user" });
  fireEvent.click(within(dialog).getByRole("button", { name: "Delete user" }));
  expect(await within(dialog).findByText("Deletion blocked.")).toBeTruthy();
  expect(calls).toBe(1);
});

it("recovers the last page after deletion and protects the pending confirmation", async () => {
  seedPages();
  renderPage();
  await screen.findByText("Page 1 of 2 (11 users)");
  await nextPage();
  await screen.findByText("Page 2 of 2 (11 users)");
  fireEvent.click(screen.getByRole("button", { name: "delete user user-11" }));
  const dialog = await screen.findByRole("dialog", { name: "Delete user" });
  fireEvent.click(within(dialog).getByRole("button", { name: "Delete user" }));
  const pending = await within(dialog).findByRole("button", { name: "Deleting..." });
  expect((pending as HTMLButtonElement).disabled).toBe(true);
  fireEvent.click(pending);
  fireEvent.keyDown(document, { key: "Escape", code: "Escape" });
  expect(screen.getByRole("dialog")).toBeTruthy();
  await screen.findByText("User deleted.");
  await screen.findByText("Page 1 of 1 (10 users)");
  await waitFor(() => expect(document.activeElement?.getAttribute("aria-label")).toBe("Users results"));
});

it("combines email search and role filtering and clears them", async () => {
  renderPage();
  await screen.findByText("Page 1 of 1 (2 users)");
  fireEvent.change(screen.getByRole("searchbox", { name: "Search users" }), { target: { value: "GRACE@EXAMPLE.COM" } });
  await chooseOption("Filter by role", "Manager");
  fireEvent.click(screen.getByRole("button", { name: "Apply filters" }));
  await screen.findByText("Page 1 of 1 (1 users)");
  expect(within(screen.getByRole("table")).queryByText("Ada")).toBeNull();
  fireEvent.click(screen.getByRole("button", { name: "Clear filters" }));
  await screen.findByText("Page 1 of 1 (2 users)");
  expect((screen.getByRole("searchbox", { name: "Search users" }) as HTMLInputElement).value).toBe("");
});

it("resets pagination after an edit removes the last profile from a role filter", async () => {
  seedPages();
  renderPage();
  await screen.findByText("Page 1 of 2 (11 users)");
  await chooseOption("Filter by role", "Viewer");
  fireEvent.click(screen.getByRole("button", { name: "Apply filters" }));
  await nextPage();
  await screen.findByText("Page 2 of 2 (11 users)");
  fireEvent.click(screen.getByRole("button", { name: "edit user user-11" }));
  const dialog = await screen.findByRole("dialog", { name: "Edit user" });
  await within(dialog).findByRole("textbox", { name: "Full name" });
  await chooseOption("User role", "Manager", within(dialog));
  fireEvent.click(within(dialog).getByRole("button", { name: "Save changes" }));
  await screen.findByText("User updated.");
  await screen.findByText("Page 1 of 1 (10 users)");
});

it("resets the page when changing page size or searching by ID", async () => {
  seedPages();
  renderPage();
  await screen.findByText("Page 1 of 2 (11 users)");
  await nextPage();
  await screen.findByText("Page 2 of 2 (11 users)");
  await chooseOption("Rows per page", "25");
  await screen.findByText("Page 1 of 1 (11 users)");
  await chooseOption("Rows per page", "10");
  await screen.findByText("Page 1 of 2 (11 users)");
  await nextPage();
  await screen.findByText("Page 2 of 2 (11 users)");
  fireEvent.change(screen.getByRole("searchbox", { name: "Search users" }), { target: { value: "user-11" } });
  fireEvent.click(screen.getByRole("button", { name: "Apply filters" }));
  await screen.findByText("Page 1 of 1 (1 users)");
});

it("retries failed lists and shows empty search results", async () => {
  server.use(http.get("*/api/users", () => HttpResponse.json({ message: "Unavailable." }, { status: 503 })));
  renderPage();
  await screen.findByRole("alert");
  server.resetHandlers();
  fireEvent.click(screen.getByRole("button", { name: "Retry" }));
  await screen.findByText("Page 1 of 1 (2 users)");
  fireEvent.change(screen.getByRole("searchbox", { name: "Search users" }), { target: { value: "missing" } });
  fireEvent.click(screen.getByRole("button", { name: "Apply filters" }));
  expect(await screen.findByText("No users match these filters.")).toBeTruthy();
});

it("does not allow editing a missing profile and can retry detail loading", async () => {
  server.use(http.get("*/api/users/:id", () => HttpResponse.json({ message: "Not found." }, { status: 404 })));
  renderPage();
  fireEvent.click(await screen.findByRole("button", { name: "edit user user-1" }));
  const dialog = await screen.findByRole("dialog", { name: "Edit user" });
  expect(await within(dialog).findByText("Could not load user details.")).toBeTruthy();
  expect(within(dialog).queryByRole("button", { name: "Save changes" })).toBeNull();
  server.resetHandlers();
  fireEvent.click(within(dialog).getByRole("button", { name: "Retry" }));
  expect(await within(dialog).findByRole("textbox", { name: "Full name" })).toBeTruthy();
});
