export const ROUTES = {
  ROOT: "/",

  ORDERS: {
    ROOT: "/orders",
    LIST: "/orders",
    DETAILS: "/orders/:orderId",
    CREATE: "/orders/create",
  },

  ANALYTICS: {
    ROOT: "/analytics",
    OVERVIEW: "/analytics/overview",
    REPORTS: "/analytics/reports",
  },
} as const
