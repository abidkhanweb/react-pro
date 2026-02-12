export const ordersKeys = {
  all: ["orders"] as const,

  lists: () => [...ordersKeys.all, "list"] as const,
  list: (params: Record<string, unknown>) =>
    [...ordersKeys.lists(), params] as const,

  details: () => [...ordersKeys.all, "detail"] as const,
  detail: (id: string) => [...ordersKeys.details(), id] as const,
}

//# How to use keys
//# useQuery({
//#   queryKey: ordersKeys.list({ page, limit, status }),
//#   queryFn: fetchOrders,
//# });

//# To remove stale data and fetch new
//# queryClient.invalidateQueries({
//#   queryKey: ordersKeys.all,
//# });
