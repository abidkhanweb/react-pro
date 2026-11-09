import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { FormInput } from "@/components/common/form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form } from "@/components/ui/form";
import { ApiError } from "@/services/api";
import { useSaveProduct } from "../hooks/useProduct";
import { productFormSchema, type ProductFormValues } from "../schemas/product.schema";
import type { Product } from "../products.types";

type Props = {
  product?: Product;
  onSaved?: () => void;
  onCancel?: () => void;
  onSavingChange?: (saving: boolean) => void;
};

export function ProductForm({ product, onSaved, onCancel, onSavingChange }: Props) {
  const save = useSaveProduct();
  const [savedId, setSavedId] = useState<string | null>(null);
  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productFormSchema),
    defaultValues: {
      name: product?.name ?? "", category: product?.category ?? "",
      price: product ? product.price.toFixed(2) : "", stock: product ? String(product.stock) : "0",
    },
  });

  async function submit(values: ProductFormValues) {
    setSavedId(null);
    form.clearErrors("root");
    onSavingChange?.(true);
    try {
      const saved = await save.mutateAsync({
        id: product?.id,
        payload: { ...values, price: Number(values.price), stock: Number(values.stock) },
      });
      if (!product) form.reset();
      setSavedId(saved.id);
      onSaved?.();
    } catch (error) {
      if (error instanceof ApiError && error.errors) {
        for (const name of ["name", "category", "price", "stock"] as const) {
          const message = error.errors[name]?.[0];
          if (message) form.setError(name, { type: "server", message });
        }
      }
      form.setError("root.server", {
        message: error instanceof Error ? error.message : "Could not save the product. Try again.",
      });
    } finally {
      onSavingChange?.(false);
    }
  }

  return (
    <Card className={product ? "border-0 shadow-none" : undefined}>
      {!product && <CardHeader><CardTitle>Create product</CardTitle></CardHeader>}
      <CardContent className={product ? "p-0" : undefined}>
        <Form {...form}>
          <form noValidate onSubmit={form.handleSubmit(submit)}>
            <fieldset disabled={form.formState.isSubmitting} className="space-y-4">
              <FormInput<ProductFormValues> name="name" label="Product name" placeholder="Enter product name" required />
              <FormInput<ProductFormValues> name="category" label="Category" placeholder="For example, Electronics"
                description="Use the same category name for products that belong together." required />
              <FormInput<ProductFormValues> name="price" label="Price (INR)" type="number" min={0.01} step="0.01" required />
              <FormInput<ProductFormValues> name="stock" label="Stock quantity" type="number" min={0} step="1"
                description="Zero means out of stock. Only whole units are accepted." required />
              {form.formState.errors.root?.server && (
                <p role="alert" className="text-sm text-destructive">{form.formState.errors.root.server.message}</p>
              )}
              {savedId && <p role="status" className="text-sm">Product {savedId} saved successfully.</p>}
              <div className="flex gap-2">
                <Button type="submit">{form.formState.isSubmitting ? "Saving product..." : product ? "Save changes" : "Save product"}</Button>
                {onCancel && <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>}
              </div>
            </fieldset>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
