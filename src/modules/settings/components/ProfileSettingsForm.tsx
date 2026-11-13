import { useCallback, useState } from "react";
import { useBeforeUnload } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { FormInput } from "@/components/common/form";
import { Form } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { ApiError } from "@/services/api";
import { profileSchema, type ProfileValues, type SessionUser } from "@/modules/auth/auth.schema";
import { useSaveProfile } from "../hooks/useSettings";

export function ProfileSettingsForm({ user }: { user: SessionUser }) {
  const save = useSaveProfile();
  const [saved, setSaved] = useState(false);
  const form = useForm<ProfileValues>({ resolver: zodResolver(profileSchema), defaultValues: { name: user.name } });
  const { isDirty, isSubmitting } = form.formState;
  useBeforeUnload(useCallback((event) => {
    if (isDirty) { event.preventDefault(); event.returnValue = ""; }
  }, [isDirty]));
  async function submit(values: ProfileValues) {
    setSaved(false); form.clearErrors("root");
    try { const result = await save.mutateAsync(values); form.reset({ name: result.name }); setSaved(true); }
    catch (error) {
      if (error instanceof ApiError && error.errors?.name?.[0]) form.setError("name", { type: "server", message: error.errors.name[0] });
      form.setError("root.server", { message: error instanceof Error ? error.message : "Could not save your profile. Try again." });
    }
  }
  return <div className="space-y-4">
    <dl className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-3 gap-y-2 text-sm"><dt>Login email</dt><dd className="break-all">{user.email}</dd><dt>Role</dt><dd className="capitalize">{user.role}</dd></dl>
    <p className="text-xs text-muted-foreground">Email, role and password cannot be changed here. This is your signed-in identity, not a Users CRUD record.</p>
    <Form {...form}><form aria-label="Profile settings form" noValidate onSubmit={form.handleSubmit(submit)}>
      <fieldset disabled={isSubmitting} className="space-y-4">
        <FormInput<ProfileValues> name="name" label="Display name" autoComplete="name" required />
        {form.formState.errors.root?.server && <p role="alert" className="text-sm text-destructive">{form.formState.errors.root.server.message}</p>}
        {isDirty && <p role="status" className="text-sm text-muted-foreground">Unsaved profile changes.</p>}
        {saved && !isDirty && <p role="status">Profile saved.</p>}
        <div className="flex flex-wrap gap-2">
          <Button type="submit" disabled={!isDirty}>{isSubmitting ? "Saving profile..." : "Save profile"}</Button>
          <Button type="button" variant="outline" disabled={!isDirty} onClick={() => { form.reset({ name: user.name }); setSaved(false); save.reset(); }}>Reset profile changes</Button>
        </div>
      </fieldset>
    </form></Form>
  </div>;
}
