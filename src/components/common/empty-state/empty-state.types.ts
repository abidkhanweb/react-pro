export type EmptyStateProps = {
  title?: string;
  description?: string;
  action?: React.ReactNode;
};


//# How to use it

//# import { EmptyState } from "@/components/empty-state";
//# import { Button } from "@/components/ui/button";

//# <DataTable columns={columns} data={data} />

//# {data.length === 0 && (
//#   <EmptyState
//#     title="No orders found"
//#     description="Try adjusting your filters or add a new order."
//#     action={
//#       <Button onClick={() => openCreateOrderModal()}>
//#         Add Order
//#       </Button>
//#     }
//#   />
//# )}