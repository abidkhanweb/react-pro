export type Product = {
  id: string;
  name: string;
  price: number;
  stock: number;
  category: string;
};

export type ProductFilters = {
  search: string;
  category: string;
  availability: "all" | "in-stock" | "out-of-stock";
};

export type ProductListParams = Partial<ProductFilters> & { page: number; limit: number };
