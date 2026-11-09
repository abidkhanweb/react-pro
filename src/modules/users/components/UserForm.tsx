import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { FormInput, FormSelect } from "@/components/common/form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form } from "@/components/ui/form";
import { ApiError } from "@/services/api";
import { useSaveUser } from "../hooks/useUsers";
import { userFormSchema, type UserFormValues } from "../schemas/user.schema";
import { USER_ROLES, type User } from "../users.types";

type Props = {
  user?: User;
  onSaved?: () => void;
  onCancel?: () => void;
  onSavingChange?: (saving: boolean) => void;
};

export function UserForm({ user, onSaved, onCancel, onSavingChange }: Props) {
  const save = useSaveUser();
  const [savedId, setSavedId] = useState<string | null>(null);
  const form = useForm<UserFormValues>({
    resolver: zodResolver(userFormSchema),
    defaultValues: { name: user?.name ?? "", email: user?.email ?? "", role: user?.role ?? "viewer" },
  });

  async function submit(values: UserFormValues) {
    setSavedId(null);
    form.clearErrors("root");
    onSavingChange?.(true);
    try {
      const saved = await save.mutateAsync({ id: user?.id, payload: values });
      if (!user) form.reset();
      setSavedId(saved.id);
      onSaved?.();
    } catch (error) {
      if (error instanceof ApiError && error.errors) {
        for (const name of ["name", "email", "role"] as const) {
          const message = error.errors[name]?.[0];
          if (message) form.setError(name, { type: "server", message });
        }
      }
      form.setError("root.server", {
        message: error instanceof Error ? error.message : "Could not save the user. Try again.",
      });
    } finally {
      onSavingChange?.(false);
    }
  }

  return (
    <Card className={user ? "border-0 shadow-none" : undefined}>
      {!user && <CardHeader><CardTitle>Create user</CardTitle></CardHeader>}
      <CardContent className={user ? "p-0" : undefined}>
        <Form {...form}>
          <form noValidate onSubmit={form.handleSubmit(submit)}>
            <fieldset disabled={form.formState.isSubmitting} className="space-y-4">
              <FormInput<UserFormValues> name="name" label="Full name" placeholder="Enter full name" required />
              <FormInput<UserFormValues> name="email" label="Email address" type="email" placeholder="name@example.com" required />
              <FormSelect<UserFormValues> name="role" label="User role" required
                options={USER_ROLES.map((role) => ({ label: role[0].toUpperCase() + role.slice(1), value: role }))} />
              {form.formState.errors.root?.server && (
                <p role="alert" className="text-sm text-destructive">{form.formState.errors.root.server.message}</p>
              )}
              {savedId && <p role="status" className="text-sm">User {savedId} saved successfully.</p>}
              <div className="flex gap-2">
                <Button type="submit">{form.formState.isSubmitting ? "Saving user..." : user ? "Save changes" : "Save user"}</Button>
                {onCancel && <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>}
              </div>
            </fieldset>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
