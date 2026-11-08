export const usersKeys = {
  all: ["users"] as const,
  list: (params: { page: number; limit: number }) =>
    ["users", "list", params] as const,
};
