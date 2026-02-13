import React from "react";

type PageLayoutProps = {
  title?: string;
  children: React.ReactNode;
};

export function PageLayout({ title, children }: PageLayoutProps) {
  return (
    <div className="flex flex-col w-full max-w-full px-6 py-4 space-y-4">
      {title && (
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          {title}
        </h1>
      )}

      {/* Content area */}
      <div className="flex flex-col space-y-4">{children}</div>
    </div>
  );
}


// How to use PageLayout
//# import { PageLayout } from "@/components/layout/PageLayout";
//# import { OrdersTable } from "@/modules/orders";

//# export function OrdersPage() {
//#   return (
//#     <PageLayout title="Orders">
//#       <OrdersTable />
//#       {/* Pagination etc. */}
//#     </PageLayout>
//#   );
//# }
