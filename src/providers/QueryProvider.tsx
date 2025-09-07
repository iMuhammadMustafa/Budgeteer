import AsyncStorage from "@react-native-async-storage/async-storage";
import { createAsyncStoragePersister } from "@tanstack/query-async-storage-persister";
import { MutationCache, QueryClient } from "@tanstack/react-query";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { PropsWithChildren } from "react";
// import { useStorageMode } from "./StorageModeProvider";

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
      console.log("Mutation successful:", data);
    },
    onError: error => {
      console.log("Mutation error:", error);
    },
  }),
});

export default function QueryProvider({ children }: PropsWithChildren) {
  // const { storageMode } = useStorageMode();

  // useEffect(() => {
  //   console.log(storageMode);
  //   // Clear cache when switching storage modes to prevent stale data
  //   // This ensures fresh data is loaded from the new storage source
  //   queryClient.clear();
  // }, [storageMode]);

  return (
    <PersistQueryClientProvider client={queryClient} persistOptions={{ persister: asyncStoragePersister }}>
      {children}
    </PersistQueryClientProvider>
  );
}
