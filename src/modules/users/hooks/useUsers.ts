import { useState } from "react";
import { skipToken, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { usersKeys } from "@/services/query-keys";
import { createUser, deleteUser, getUser, getUsers, updateUser } from "../api";
import type { UserFilters } from "../users.types";
import type { UserPayload } from "../schemas/user.schema";

export function useUsers(initialPage = 1, initialLimit = 10) {
  const [params, setParams] = useState({
    page: initialPage, limit: initialLimit, search: "", role: "all" as UserFilters["role"],
  });
  const client = useQueryClient();
  const query = useQuery({
    queryKey: usersKeys.list(params),
    queryFn: ({ signal }) => getUsers(params, signal),
  });
  const deletion = useMutation({
    mutationFn: deleteUser,
    onSuccess: async () => {
      const lastPage = Math.max(1, Math.ceil(((query.data?.total ?? 1) - 1) / params.limit));
      setParams((current) => ({ ...current, page: Math.min(current.page, lastPage) }));
      await client.invalidateQueries({ queryKey: usersKeys.all });
    },
  });

  return {
    ...params, users: query.data?.data ?? [], total: query.data?.total ?? 0,
    isLoading: query.isPending, isFetching: query.isFetching, isError: query.isError,
    refetch: query.refetch, deletion,
    setPage: (page: number) => setParams((current) => ({ ...current, page })),
    setLimit: (limit: number) => setParams((current) => ({ ...current, page: 1, limit })),
    applyFilters: (filters: UserFilters) => setParams((current) => ({ ...current, ...filters, page: 1 })),
  };
}

export function useUser(id?: string) {
  return useQuery({
    queryKey: usersKeys.detail(id ?? ""),
    queryFn: id ? ({ signal }) => getUser(id, signal) : skipToken,
  });
}

export function useSaveUser() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id?: string; payload: UserPayload }) =>
      id ? updateUser(id, payload) : createUser(payload),
    onSuccess: () => client.invalidateQueries({ queryKey: usersKeys.all }),
  });
}
