import type { Table } from "@tanstack/react-table";

type Props<T> = {
  table: Table<T>;
};

export function TablePagination<T>({ table }: Props<T>) {
  return (
    <div className="flex items-center gap-2">
      <button
        onClick={() => table.setPageIndex(0)}
        disabled={!table.getCanPreviousPage()}
      >
        {"<<"}
      </button>
      <button
        onClick={() => table.previousPage()}
        disabled={!table.getCanPreviousPage()}
      >
        {"<"}
      </button>
      <button
        onClick={() => table.nextPage()}
        disabled={!table.getCanNextPage()}
      >
        {">"}
      </button>
      <button
        onClick={() => table.setPageIndex(table.getPageCount() - 1)}
        disabled={!table.getCanNextPage()}
      >
        {">>"}
      </button>
      <span>
        Page <strong>{table.getState().pagination.pageIndex + 1}</strong>
      </span>
    </div>
  );
}
