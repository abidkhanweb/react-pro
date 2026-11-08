import { zodResolver } from "@hookform/resolvers/zod";
import { createOrderSchema, type CreateOrderFormValues } from "../schemas";
import { useForm } from "react-hook-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { FormInput, FormSelect } from "@/components/common/form";
import { ApiError } from "@/services/api";
import { useCreateOrder } from "../hooks/useCreateOrder";
import { useState } from "react";

export function OrderForm() {
  const createOrder = useCreateOrder();
  const [savedOrderId, setSavedOrderId] = useState<string | null>(null);
  const form = useForm<CreateOrderFormValues>({
    resolver: zodResolver(createOrderSchema),
    defaultValues: {
      customerName: "",
      status: "pending",
      totalAmount: "",
    },
  });

  const handleSubmit = async (values: CreateOrderFormValues) => {
    setSavedOrderId(null);
    form.clearErrors("root");
    try {
      const order = await createOrder.mutateAsync({
        ...values,
        totalAmount: Number(values.totalAmount),
      });
      form.reset();
      setSavedOrderId(order.id);
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
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Order Form</CardTitle>
      </CardHeader>

      <CardContent>
        <Form {...form}>
          <form
            className="space-y-4"
            noValidate
            onSubmit={form.handleSubmit(handleSubmit)}
          >
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
              description="Choose the current state of the order."
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
              <p role="alert" className="text-sm text-destructive">
                {form.formState.errors.root.server.message}
              </p>
            )}
            {savedOrderId && (
              <p role="status" className="text-sm">
                Order {savedOrderId} saved successfully.
              </p>
            )}
            <Button type="submit">
              {form.formState.isSubmitting ? "Saving order…" : "Save order"}
            </Button>
            </fieldset>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
