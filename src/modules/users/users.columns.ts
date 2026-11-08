import { createColumnHelper } from "@tanstack/react-table";
import type { User } from "./users.types";

const columnHelper = createColumnHelper<User>();

export const usersColumns = [
  columnHelper.accessor("id", {
    header: "User ID",
  }),
  columnHelper.accessor("name", {
    header: "Name",
  }),
  columnHelper.accessor("email", {
    header: "Email",
  }),
  columnHelper.accessor("role", {
    header: "Role",
    cell: (info) => info.getValue().toUpperCase(),
  }),
  columnHelper.accessor("createdAt", {
    header: "Joined On",
    cell: ({ getValue }) => new Date(getValue() as string).toLocaleDateString(),
  }),
];
