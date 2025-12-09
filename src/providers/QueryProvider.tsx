import { StorageMode } from "@/src/types/StorageMode";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { createAsyncStoragePersister } from "@tanstack/query-async-storage-persister";
import { MutationCache, QueryClient } from "@tanstack/react-query";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { createContext, PropsWithChildren, useContext, useMemo } from "react";
import { useStorageMode } from "./StorageModeProvider";

const QueryClientContext = createContext<QueryClient | null>(null);

export function useQueryClient() {
  const context = useContext(QueryClientContext);
  console.log("useQueryClient context:", context);
  if (!context) {
    throw new Error("useQueryClient must be used within a QueryProvider");
  }
  return context;
}

const asyncStoragePersister = createAsyncStoragePersister({
  storage: AsyncStorage,
});

export default function QueryProvider({ children }: PropsWithChildren) {
  const { storageMode } = useStorageMode();

  const queryClient = useMemo(() => {
    const isNoCache = storageMode === StorageMode.Local || storageMode === StorageMode.Demo;
    console.log("QueryClient isNoCache:", isNoCache);
    return new QueryClient({
      defaultOptions: {
        queries: {
          refetchOnWindowFocus: isNoCache,
          refetchOnReconnect: isNoCache,
          refetchOnMount: isNoCache,
          gcTime: isNoCache ? Infinity : 1000 * 60 * 60 * 24,
          staleTime: isNoCache ? Infinity : 1000 * 60 * 5,
          retry: false,
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
  }, [storageMode]);

  return (
    <QueryClientContext.Provider value={queryClient}>
      <PersistQueryClientProvider client={queryClient} persistOptions={{ persister: asyncStoragePersister }}>
        {children}
      </PersistQueryClientProvider>
    </QueryClientContext.Provider>
  );
}
