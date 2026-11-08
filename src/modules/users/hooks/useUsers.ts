import { useState } from "react"
import { useQuery, useMutation, useQueryClient, keepPreviousData } from "@tanstack/react-query"
import { usersKeys } from "@/services/query-keys"
import { getUsers, deleteUser as apiDeleteUser } from "../users.service"

export function useUsers(initialPage = 1, initialLimit = 10) {
  const [page, setPage] = useState(initialPage)
  const [limit, setLimit] = useState(initialLimit)

  const qc = useQueryClient()

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: usersKeys.list({ page, limit }),
    queryFn: () => getUsers({ page, limit }),
    placeholderData: keepPreviousData,
  })

  const { mutateAsync: deleteUser } = useMutation({
    mutationFn: apiDeleteUser,
    onSuccess: () => {
      return qc.invalidateQueries({ queryKey: usersKeys.all })
    },
  })

  return {
    users: data?.data ?? [],
    total: data?.total ?? 0,
    page,
    limit,
    isLoading,
    isError,
    setPage,
    setLimit,
    refetch,
    deleteUser,
  }
}
