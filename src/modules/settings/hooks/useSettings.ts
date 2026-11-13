import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { settingsKeys } from "@/services/query-keys";
import { useAuth } from "@/modules/auth/auth.context";
import { getStoreSettings, updateStoreSettings } from "../api/settings.service";

export function useStoreSettings() {
  return useQuery({ queryKey: settingsKeys.store(), queryFn: ({ signal }) => getStoreSettings(signal) });
}
export function useSaveStoreSettings() {
  const client = useQueryClient();
  return useMutation({ mutationFn: updateStoreSettings,
    onSuccess: () => client.invalidateQueries({ queryKey: settingsKeys.store() }),
  });
}
export function useSaveProfile() {
  const { saveProfile } = useAuth();
  return useMutation({ mutationFn: saveProfile });
}
