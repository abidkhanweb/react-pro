// src/components/page-header/PageHeader.tsx

import React from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/utils/cn"; // utility to combine class names
import { Plus } from "lucide-react"; // example icon

type Props = {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
};

export function PageHeader({ title, subtitle, actions }: Props) {
  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
      <div className="flex flex-col">
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
          {title}
        </h2>
        {subtitle && (
          <p className="text-sm text-gray-500 dark:text-gray-400">{subtitle}</p>
        )}
      </div>

      <div className="flex items-center gap-2">{actions}</div>
    </div>
  );
}

//# How to use PageHeader
//# import { PageHeader } from "@/components/page-header";
//# import { Button } from "@/components/ui/button";

//# export function OrdersPage() {
//#   return (
//#     <PageLayout title="Orders">
//#       <PageHeader
//#         title="Orders"
//#         actions={
//#           <Button variant="default">
//#             <Plus className="mr-2 h-4 w-4" />
//#             New Order
//#           </Button>
//#         }
//#       />

//       {/* ... your table goes here ... */}
//     </PageLayout>
//   );
// }
