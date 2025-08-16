import { PropsWithChildren, useEffect } from "react";
import { MutationCache, QueryClient } from "@tanstack/react-query";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { createAsyncStoragePersister } from "@tanstack/query-async-storage-persister";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Alert } from "react-native";
import { initializeQueryIntegration } from "@/src/services/repositories/utils/QueryIntegrationSetup";

const asyncStoragePersister = createAsyncStoragePersister({
  storage: AsyncStorage,
});

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
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

// Initialize query integration with repository manager
let integrationInitialized = false;

function initializeIntegration() {
  if (!integrationInitialized) {
    try {
      initializeQueryIntegration({
        queryClient,
        enableAutoInvalidation: true,
        enablePrefetching: false, // Disable for now to avoid performance issues
        debugMode: __DEV__, // Enable debug mode in development
      });
      integrationInitialized = true;
      console.log('Query integration initialized in QueryProvider');
    } catch (error) {
      console.error('Failed to initialize query integration:', error);
    }
  }
}

export default function QueryProvider({ children }: PropsWithChildren) {
  useEffect(() => {
    // Initialize integration after component mounts
    initializeIntegration();
  }, []);

  return (
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{ persister: asyncStoragePersister }}
      onSuccess={() => {
        // Initialize integration after successful restore
        initializeIntegration();
        
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
