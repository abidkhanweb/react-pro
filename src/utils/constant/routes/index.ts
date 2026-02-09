export interface MenuNode {
  label: string
  path: string
  component?: any
  children?: MenuNode[]
}

export const MENU: MenuNode[] = [
  {
    label: "Dashboard",
    path: "/",
    children: [
      {
        label: "Dashboard",
        path: "",
        component: "Dashboard",
      },
    ],
  },
  {
    label: "Orchestrator",
    path: "/orchestrator",
    children: [
      {
        label: "Server Management",
        path: "server-management",
        component: "ServerManagement",
      },
      {
        label: "Users & Authentication",
        path: "users",
        component: "Users",
      },
      {
        label: "Backup",
        path: "backup",
        component: "Backup",
      },
      {
        label: "Setup",
        path: "setup",
        component: "Setup",
      }
    ]
  }
]
