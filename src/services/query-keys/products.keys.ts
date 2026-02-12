export const productsKeys = {
  all: ["products"] as const,

  lists: () => [...productsKeys.all, "list"] as const,
  list: (params: Record<string, unknown>) =>
    [...productsKeys.lists(), params] as const,

  detail: (id: string) => [...productsKeys.all, "detail", id] as const,
}
