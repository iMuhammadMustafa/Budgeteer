import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";

import { useAuth } from "@/src/providers/AuthProvider";
import { useStorageMode } from "@/src/providers/StorageModeProvider";
import supabase from "@/src/providers/Supabase";
import { StorageMode } from "@/src/types/StorageMode";
import { DEFAULT_CURRENCY, formatMoney } from "@/src/utils/currency";
import { storage } from "@/src/utils/storageUtils";

const LOCAL_KEY = "app:primaryCurrency";

const queryKey = (storageMode: StorageMode | null, userId: string | undefined) =>
  ["primaryCurrency", storageMode ?? "none", userId ?? "anon"] as const;

async function readLocal(): Promise<string | null> {
  try {
    return await storage.getItem(LOCAL_KEY);
  } catch {
    return null;
  }
}

async function writeLocal(code: string): Promise<void> {
  try {
    await storage.setItem(LOCAL_KEY, code);
  } catch {
    // non-fatal
  }
}

export function usePrimaryCurrency() {
  const { storageMode } = useStorageMode();
  const { user } = useAuth();
  const userId = user?.id;
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: queryKey(storageMode, userId),
    queryFn: async () => {
      const cached = await readLocal();

      if (storageMode === StorageMode.Cloud && userId) {
        try {
          const { data: profile, error } = await supabase
            .from("profiles")
            .select("currency")
            .eq("id", userId)
            .maybeSingle();
          if (!error) {
            const profileCurrency = profile?.currency;
            // If signup cached a non-default choice and the profile is still
            // at the schema default, push the cached choice up so the user
            // doesn't lose their pick on first login.
            if (cached && cached !== DEFAULT_CURRENCY && (!profileCurrency || profileCurrency === DEFAULT_CURRENCY)) {
              await supabase.from("profiles").update({ currency: cached }).eq("id", userId);
              return cached;
            }
            if (profileCurrency) {
              if (cached !== profileCurrency) await writeLocal(profileCurrency);
              return profileCurrency;
            }
          }
        } catch (err) {
          console.warn("[PrimaryCurrency] cloud fetch failed, falling back to cache", err);
        }
      }

      return cached || DEFAULT_CURRENCY;
    },
    staleTime: 5 * 60 * 1000,
  });

  const setMutation = useMutation({
    mutationFn: async (code: string) => {
      await writeLocal(code);
      if (storageMode === StorageMode.Cloud && userId) {
        const { error } = await supabase.from("profiles").update({ currency: code }).eq("id", userId);
        if (error) throw error;
      }
      return code;
    },
    onSuccess: code => {
      queryClient.setQueryData(queryKey(storageMode, userId), code);
    },
  });

  const setPrimaryCurrency = useCallback((code: string) => setMutation.mutateAsync(code), [setMutation]);

  const formatCurrency = useCallback(
    (amount: number | null = 0, signed: boolean = true): string => {
      return formatMoney(amount, data ?? DEFAULT_CURRENCY, { signed });
    },
    [data],
  );

  return {
    primaryCurrency: data ?? DEFAULT_CURRENCY,
    isLoading,
    setPrimaryCurrency,
    isSaving: setMutation.isPending,
    formatCurrency,
  };
}
