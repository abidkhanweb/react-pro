import React from "react";
import { Card } from "@/components/ui/card";
import { OctagonAlert, Plus, Trash, Settings } from "lucide-react";
import { type EmptyStateProps as Props } from "./empty-state.types"
export function EmptyState({
  title = "No data available",
  description = "Nothing to show here yet.",
  action,
}: Props) {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center">
      <Card className="bg-transparent shadow-none border-none">
        <div className="flex flex-col items-center space-y-4">
          {/* Replace IconEmpty with any icon you prefer */}
          <OctagonAlert className="h-12 w-12 text-gray-400 dark:text-gray-600" />

          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            {title}
          </h3>

          <p className="text-sm text-gray-500 dark:text-gray-400">
            {description}
          </p>

          {action && <div className="mt-4">{action}</div>}
        </div>
      </Card>
    </div>
  );
}
