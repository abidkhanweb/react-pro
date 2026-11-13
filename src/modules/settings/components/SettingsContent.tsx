import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/modules/auth/auth.context";
import { useStoreSettings } from "../hooks/useSettings";
import { StoreSettingsForm } from "./StoreSettingsForm";
import { ProfileSettingsForm } from "./ProfileSettingsForm";

export function SettingsContent() {
  const store = useStoreSettings();
  const { user } = useAuth();
  return <div className="grid items-start gap-6 xl:grid-cols-2">
    <Card className="min-w-0"><CardHeader><h2 className="text-lg font-semibold">Store settings</h2><p className="text-sm text-muted-foreground">Store identity and support contact only. This does not configure checkout or email delivery.</p></CardHeader><CardContent className="space-y-4">
      <p className="rounded-md bg-muted p-3 text-sm">Currency: INR. Reporting dates: UTC. These remain fixed across the admin application.</p>
      {store.data ? <>
        {store.isFetching && <p role="status">Refreshing store settings...</p>}
        {store.isError && <p role="alert" className="text-sm text-destructive">Could not refresh store settings. Your edits are preserved. <Button variant="outline" onClick={() => void store.refetch()}>Retry store settings</Button></p>}
        <StoreSettingsForm settings={store.data} />
      </> : store.isPending ? <p role="status">Loading store settings...</p> : <div role="alert">Could not load store settings. <Button onClick={() => void store.refetch()}>Retry store settings</Button></div>}
    </CardContent></Card>
    <Card className="min-w-0"><CardHeader><h2 className="text-lg font-semibold">My profile</h2><p className="text-sm text-muted-foreground">Update the display name shown in your administration header.</p></CardHeader><CardContent>{user && <ProfileSettingsForm user={user} />}</CardContent></Card>
  </div>;
}
