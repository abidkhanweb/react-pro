export type TableColumn<T> = {
  accessorKey: keyof T;
  header: string;
};
