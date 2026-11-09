import type { ColumnDef } from "@tanstack/react-table";
import type { User } from "./users.types";

export const usersColumns: ColumnDef<User>[] = [
  { accessorKey: "name", header: "Name" },
  { accessorKey: "email", header: "Email" },
  { accessorKey: "role", header: "Role", cell: ({ row }) => row.original.role.toUpperCase() },
  { accessorKey: "createdAt", header: "Joined on", cell: ({ row }) => new Date(row.original.createdAt).toLocaleDateString("en-IN") },
];
