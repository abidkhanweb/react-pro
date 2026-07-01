// components/ui/table-skeleton.tsx

import { Skeleton } from "@/components/ui/skeleton";

interface TableSkeletonProps {
  rows?: number;
  columns?: number;
  showHeader?: boolean;
}

export function TableSkeleton({
  rows = 5,
  columns = 5,
  showHeader = true,
}: TableSkeletonProps) {
  return (
    <div className="w-full rounded-md border">
      {showHeader && (
        <div className="flex border-b px-4 py-3">
          {Array.from({ length: columns }).map((_, index) => (
            <div key={index} className="flex-1 first:flex-[1.5] px-2">
              <Skeleton className="h-4 w-24" />
            </div>
          ))}
        </div>
      )}

      <div>
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <div
            key={rowIndex}
            className="flex items-center border-b last:border-0 px-4 py-4"
          >
            {Array.from({ length: columns }).map((_, colIndex) => (
              <div key={colIndex} className="flex-1 first:flex-[1.5] px-2">
                <Skeleton
                  className={
                    colIndex === 0 ? "h-4 w-40" : "h-4 w-full max-w-[100px]"
                  }
                />
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
