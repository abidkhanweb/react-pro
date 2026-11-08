import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { usersKeys } from "@/services/query-keys"
import { getUsers, deleteUser as apiDeleteUser } from "../users.service"
import type { User } from "../users.types"

export function useUsers(initialPage = 1, initialLimit = 10) {
  const [page, setPage] = useState(initialPage)
  const [limit, setLimit] = useState(initialLimit)

  const qc = useQueryClient()

  const { data, isLoading, isError, refetch } = useQuery(
    usersKeys.list({ page, limit }),
    () => getUsers({ page, limit }),
    { keepPreviousData: true },
  )

  const { mutateAsync: deleteUser } = useMutation(apiDeleteUser, {
    onSuccess: () => {
      qc.invalidateQueries(usersKeys.all)
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
