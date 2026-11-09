export const USER_ROLES = ["admin", "manager", "viewer"] as const;

export type User = {
  id: string;
  name: string;
  email: string;
  role: (typeof USER_ROLES)[number];
  createdAt: string;
};

export type UserFilters = { search: string; role: User["role"] | "all" };
export type UserListParams = Partial<UserFilters> & { page: number; limit: number };
