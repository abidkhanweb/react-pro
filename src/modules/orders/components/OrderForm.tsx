import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { FormInput, FormSelect } from "@/components/common/form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { ApiError } from "@/services/api";
import { createOrderSchema, updateOrderSchema, type CreateOrderFormValues } from "../schemas";
import { useCreateOrder } from "../hooks/useCreateOrder";
import { useUpdateOrder } from "../hooks/useOrder";
import type { Order } from "../orders.types";

type Props = {
  order?: Order;
  onSaved?: () => void;
  onCancel?: () => void;
  onSavingChange?: (saving: boolean) => void;
};

export function OrderForm({ order, onSaved, onCancel, onSavingChange }: Props) {
  const creation = useCreateOrder();
  const update = useUpdateOrder();
  const [savedOrderId, setSavedOrderId] = useState<string | null>(null);
  const form = useForm<CreateOrderFormValues>({
    resolver: zodResolver(order ? updateOrderSchema : createOrderSchema),
    defaultValues: {
      customerName: order?.customerName ?? "",
      status: order?.status ?? "pending",
      totalAmount: order ? order.totalAmount.toFixed(2) : "",
    },
  });

  const handleSubmit = async (values: CreateOrderFormValues) => {
    setSavedOrderId(null);
    form.clearErrors("root");
    onSavingChange?.(true);
    try {
      const payload = { ...values, totalAmount: Number(values.totalAmount) };
      const saved = order
        ? await update.mutateAsync({ id: order.id, payload })
        : await creation.mutateAsync(payload);
      if (!order) form.reset();
      setSavedOrderId(saved.id);
      onSaved?.();
    } catch (error) {
      if (error instanceof ApiError && error.errors) {
        for (const name of ["customerName", "status", "totalAmount"] as const) {
          const message = error.errors[name]?.[0];
          if (message) form.setError(name, { type: "server", message });
        }
      }
      form.setError("root.server", {
        message: error instanceof Error ? error.message : "Could not save the order. Try again.",
      });
    } finally {
      onSavingChange?.(false);
    }
  };

  return (
    <Card className={order ? "border-0 shadow-none" : undefined}>
      {!order && <CardHeader><CardTitle>Create order</CardTitle></CardHeader>}
      <CardContent className={order ? "p-0" : undefined}>
        <Form {...form}>
          <form noValidate onSubmit={form.handleSubmit(handleSubmit)}>
            <fieldset disabled={form.formState.isSubmitting} className="space-y-4">
              <FormInput<CreateOrderFormValues>
                name="customerName"
                label="Customer name"
                placeholder="Enter customer name"
                description="Enter the name associated with this order."
                required
              />
              <FormSelect<CreateOrderFormValues>
                name="status"
                label="Order status"
                options={[
                  { label: "Pending", value: "pending" },
                  { label: "Completed", value: "completed" },
                  { label: "Cancelled", value: "cancelled" },
                ]}
                required
              />
              <FormInput<CreateOrderFormValues>
                name="totalAmount"
                label="Total amount (INR)"
                type="number"
                min={0.01}
                step="0.01"
                description="Enter the order total with up to two decimal places."
                required
              />
              {form.formState.errors.root?.server && (
                <p role="alert" className="text-sm text-destructive">{form.formState.errors.root.server.message}</p>
              )}
              {savedOrderId && <p role="status" className="text-sm">Order {savedOrderId} saved successfully.</p>}
              <div className="flex gap-2">
                <Button type="submit">{form.formState.isSubmitting ? "Saving order..." : order ? "Save changes" : "Save order"}</Button>
                {onCancel && <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>}
              </div>
            </fieldset>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
