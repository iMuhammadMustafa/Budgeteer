import AsyncStorage from "@react-native-async-storage/async-storage";
import { createAsyncStoragePersister } from "@tanstack/query-async-storage-persister";
import { MutationCache, QueryClient } from "@tanstack/react-query";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { PropsWithChildren } from "react";

/**
 * Storage key the AsyncStorage persister writes the offline cache under. The
 * mode-switch cache clear (StorageModeProvider) removes this so a restart can't
 * resurrect the previous backend's data from disk. Matches the default used by
 * `createAsyncStoragePersister` in this @tanstack version.
 */
export const PERSIST_CACHE_KEY = "REACT_QUERY_OFFLINE_CACHE";

const asyncStoragePersister = createAsyncStoragePersister({
  storage: AsyncStorage,
});

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // refetchOnWindowFocus: false,
      // refetchOnReconnect: false,
      // refetchOnMount: false,
      gcTime: 1000 * 60 * 60 * 24, // 24 hours
      staleTime: 1000 * 60 * 5,
      retry: 0,
    },
  },
  mutationCache: new MutationCache({
    onSuccess: data => {
      if (__DEV__) console.log("Mutation successful:", data);
    },
    onError: error => {
      if (__DEV__) console.log("Mutation error:", error);
    },
  }),
});

export default function QueryProvider({ children }: PropsWithChildren) {
  return (
    <PersistQueryClientProvider client={queryClient} persistOptions={{ persister: asyncStoragePersister }}>
      {children}
    </PersistQueryClientProvider>
  );
}
