import { zodResolver } from "@hookform/resolvers/zod";
import { createOrderSchema, type CreateOrderFormValues } from "../schemas";
import { useForm } from "react-hook-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { FormInput, FormSelect } from "@/components/common/form";

export function OrderForm() {
  const form = useForm<CreateOrderFormValues>({
    resolver: zodResolver(createOrderSchema),
    defaultValues: {
      customerName: "",
      status: "pending",
    },
  });

  const handleSubmit = (values: CreateOrderFormValues) => {
    console.log("Validated order values:", values);
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

            <Button type="submit">Save order</Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
