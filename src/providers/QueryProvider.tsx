import { PropsWithChildren, useEffect } from "react";
import { MutationCache, QueryClient } from "@tanstack/react-query";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { createAsyncStoragePersister } from "@tanstack/query-async-storage-persister";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Alert } from "react-native";
import { useStorageMode } from "./StorageModeProvider";

const asyncStoragePersister = createAsyncStoragePersister({
  storage: AsyncStorage,
});

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: true,
      refetchOnReconnect: false,
      // refetchOnMount: false,
      gcTime: 1000 * 60 * 60 * 24, // 24 hours
      staleTime: 2000,
      retry: 0,
    },
  },
  mutationCache: new MutationCache({
    onSuccess: data => {
      // console.log(data);
    },
    onError: error => {
      Alert.alert(error.message);
    },
  }),
});

export default function QueryProvider({ children }: PropsWithChildren) {
  const { storageMode } = useStorageMode();

  useEffect(() => {
    queryClient.invalidateQueries();
  }, [storageMode]);

  return (
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{ persister: asyncStoragePersister }}
      onSuccess={() => {
        // resume mutations after initial restore from localStorage was successful
        queryClient.resumePausedMutations().then(() => {
          queryClient.invalidateQueries();
        });
      }}
    >
      {children}
    </PersistQueryClientProvider>
  );
}
