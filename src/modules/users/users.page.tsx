import { PageLayout } from "@/components/layout/PageLayout";
import { UserForm } from "./components/UserForm";
import { UsersTable } from "./components/UsersTable";

export default function UsersPage() {
  return (
    <PageLayout title="Users">
      <p className="text-muted-foreground">Create and manage user profile records and role labels.</p>
      {import.meta.env.DEV && import.meta.env.VITE_ENABLE_MOCKS === "true" && (
        <p role="status" className="rounded-md border border-amber-300 bg-amber-50 p-3 text-sm text-amber-950 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-100">
          Demo mode: users are temporary records, not login accounts. Role changes do not grant real access, and records disappear on reload.
        </p>
      )}
      <div className="grid items-start gap-6 xl:grid-cols-[minmax(18rem,24rem)_minmax(0,1fr)]">
        <UserForm />
        <section aria-label="User list" className="min-w-0 space-y-4 overflow-x-auto rounded-xl border bg-card p-6 text-card-foreground shadow">
          <h2 className="text-lg font-semibold">User list</h2>
          <UsersTable />
        </section>
      </div>
    </PageLayout>
  );
}
