export const usersKeys = {
  all: ["users"] as const,
  list: (params: Record<string, unknown>) =>
    ["users", "list", params] as const,
  detail: (id: string) => ["users", "detail", id] as const,
};
