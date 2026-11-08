export type User = {
  id: string;
  name: string;
  email: string;
  role: "admin" | "manager" | "viewer";
  createdAt: string;
};
