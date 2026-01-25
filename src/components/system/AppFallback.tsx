import { Skeleton } from "@/components/ui/skeleton";

export function AppFallback() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="w-[360px] space-y-4">
        <Skeleton className="h-6 w-2/3" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
        <Skeleton className="h-10 w-full" />
      </div>
    </div>
  );
}
