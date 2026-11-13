import { useCallback, useEffect, useState } from "react";
import { useBeforeUnload } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { FormInput } from "@/components/common/form";
import { Form } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { ApiError } from "@/services/api";
import { useSaveStoreSettings } from "../hooks/useSettings";
import { storeSettingsSchema, type StoreSettings } from "../schemas/settings.schema";

export function StoreSettingsForm({ settings }: { settings: StoreSettings }) {
  const save = useSaveStoreSettings();
  const [saved, setSaved] = useState(false);
  const form = useForm<StoreSettings>({ resolver: zodResolver(storeSettingsSchema), defaultValues: settings });
  const { isDirty, isSubmitting } = form.formState;
  useEffect(() => {
    // New API snapshots may update clean fields, but never overwrite a draft or pending save.
    if (!form.formState.isDirty && !form.formState.isSubmitting) form.reset(settings);
  }, [settings, form]);
  useBeforeUnload(useCallback((event) => {
    if (isDirty) { event.preventDefault(); event.returnValue = ""; }
  }, [isDirty]));

  async function submit(values: StoreSettings) {
    setSaved(false); form.clearErrors("root");
    try { const result = await save.mutateAsync(values); form.reset(result); setSaved(true); }
    catch (error) {
      if (error instanceof ApiError) for (const field of ["storeName", "supportEmail"] as const) {
        const message = error.errors?.[field]?.[0];
        if (message) form.setError(field, { type: "server", message });
      }
      form.setError("root.server", { message: error instanceof Error ? error.message : "Could not save store settings. Try again." });
    }
  }
  return <Form {...form}><form aria-label="Store settings form" noValidate onSubmit={form.handleSubmit(submit)}>
    <fieldset disabled={isSubmitting} className="space-y-4">
      <FormInput<StoreSettings> name="storeName" label="Store name" autoComplete="organization" required />
      <FormInput<StoreSettings> name="supportEmail" label="Support email" type="email" required />
      {form.formState.errors.root?.server && <p role="alert" className="text-sm text-destructive">{form.formState.errors.root.server.message}</p>}
      {isDirty && <p role="status" className="text-sm text-muted-foreground">Unsaved store changes.</p>}
      {saved && !isDirty && <p role="status">Store settings saved.</p>}
      <div className="flex flex-wrap gap-2">
        <Button type="submit" disabled={!isDirty}>{isSubmitting ? "Saving store..." : "Save store settings"}</Button>
        <Button type="button" variant="outline" disabled={!isDirty} onClick={() => { form.reset(settings); setSaved(false); save.reset(); }}>Reset store changes</Button>
      </div>
    </fieldset>
  </form></Form>;
}
