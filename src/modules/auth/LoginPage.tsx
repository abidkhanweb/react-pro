import { useEffect } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { FormInput } from "@/components/common/form";
import { Form } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { useAuth } from "./auth.context";
import { loginSchema, type LoginValues } from "./auth.schema";
import { safeReturnPath } from "./auth.permissions";

export default function LoginPage() {
  const { user, signIn } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const from = (location.state as { from?: unknown } | null)?.from;
  const form = useForm<LoginValues>({ resolver: zodResolver(loginSchema), defaultValues: { email: "", password: "" } });
  useEffect(() => { document.title = "Sign in | Commerce Admin"; }, []);
  if (user) return <Navigate to={safeReturnPath(from, user.role)} replace />;
  async function submit(values: LoginValues) {
    form.clearErrors("root");
    try {
      const session = await signIn(values);
      form.reset(); navigate(safeReturnPath(from, session.role), { replace: true });
    } catch (error) {
      form.setValue("password", "");
      form.setError("root.server", { message: error instanceof Error ? error.message : "Could not sign in. Try again." });
    }
  }
  return <main className="flex min-h-dvh items-center justify-center bg-muted/30 p-4">
    <Card className="w-full max-w-md"><CardHeader><h1 className="text-2xl font-bold">Sign in</h1><p className="text-sm text-muted-foreground">Commerce Admin administration workspace</p></CardHeader><CardContent className="space-y-4">
      {import.meta.env.DEV && import.meta.env.VITE_ENABLE_MOCKS === "true" && <p className="rounded-md border p-3 text-sm">Demo only: admin@demo.local, manager@demo.local or viewer@demo.local. Password: DemoOnly!123. Demo sessions and records reset on reload. Do not use real credentials.</p>}
      <Form {...form}><form noValidate onSubmit={form.handleSubmit(submit)}><fieldset disabled={form.formState.isSubmitting} className="space-y-4">
        <FormInput<LoginValues> name="email" label="Email address" type="email" autoComplete="username" required />
        <FormInput<LoginValues> name="password" label="Password" type="password" autoComplete="current-password" required />
        {form.formState.errors.root?.server && <p role="alert" className="text-sm text-destructive">{form.formState.errors.root.server.message}</p>}
        <Button type="submit" className="w-full">{form.formState.isSubmitting ? "Signing in..." : "Sign in"}</Button>
      </fieldset></form></Form>
    </CardContent></Card>
  </main>;
}
