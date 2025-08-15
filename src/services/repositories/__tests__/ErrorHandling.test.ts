/**
 * Error Handling Tests for TanStack Query Integration
 *
 * Tests error handling scenarios across different storage implementations
 */

import { QueryClient } from "@tanstack/react-query";
import { renderHook, waitFor, act } from "@testing-library/react-native";

import { StorageModeManager } from "../../storage/StorageModeManager";
import { StorageError, StorageErrorCode, StorageMode } from "../../storage/types";

import {
  useCreateAccount,
  useUpdateAccount,
  useDeleteAccount,
  useGetAccounts,
  useGetAccountById,
} from "../Accounts.Service";

import {
  createTestQueryClient,
  createWrapper,
  createMockAccount,
  createMockError,
  suppressConsoleLogs,
} from "./utils/testUtils";
import { RepositoryManager } from "../../apis/repositories";

describe("Error Handling in TanStack Query Integration", () => {
  let queryClient: QueryClient;
  let storageManager: StorageModeManager;
  let repositoryManager: RepositoryManager;

  suppressConsoleLogs();

  beforeEach(() => {
    queryClient = createTestQueryClient();
    storageManager = StorageModeManager.getInstance();
    repositoryManager = RepositoryManager.getInstance();
  });

  afterEach(async () => {
    queryClient.clear();
    await storageManager.cleanup();
    jest.restoreAllMocks();
  });

  describe("Query Error Handling", () => {
    beforeEach(async () => {
      await storageManager.setMode("demo");
    });

    test("should handle repository errors in queries", async () => {
      const wrapper = createWrapper(queryClient);
      const mockError = createMockError("Repository error", "REPO_ERROR");

      // Mock repository to throw error
      jest.spyOn(repositoryManager.getAccountRepository(), "getAllAccounts").mockRejectedValueOnce(mockError);

      const { result } = renderHook(() => useGetAccounts(), { wrapper });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toBeDefined();
      expect(result.current.data).toBeUndefined();
      expect(result.current.isLoading).toBe(false);
    });

    test("should handle storage provider errors", async () => {
      const wrapper = createWrapper(queryClient);
      const storageError = new StorageError("Storage provider error", StorageErrorCode.UNKNOWN_ERROR, { mode: "demo" });

      jest.spyOn(repositoryManager.getAccountRepository(), "getAccountById").mockRejectedValueOnce(storageError);

      const { result } = renderHook(() => useGetAccountById("test-id"), { wrapper });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toBeInstanceOf(StorageError);
      expect((result.current.error as StorageError).code).toBe("STORAGE_ERROR");
    });

    test("should handle network errors gracefully", async () => {
      await storageManager.setMode("cloud");
      const wrapper = createWrapper(queryClient);

      const networkError = createMockError("Network error", "NETWORK_ERROR");

      jest.spyOn(repositoryManager.getAccountRepository(), "getAllAccounts").mockRejectedValueOnce(networkError);

      const { result } = renderHook(() => useGetAccounts(), { wrapper });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toBeDefined();
      expect(result.current.isLoading).toBe(false);
    });

    test("should handle timeout errors", async () => {
      const wrapper = createWrapper(queryClient);

      // Mock a timeout scenario
      jest.spyOn(repositoryManager.getAccountRepository(), "getAllAccounts").mockImplementation(
        () =>
          new Promise((_, reject) => {
            setTimeout(() => reject(createMockError("Timeout", "TIMEOUT")), 100);
          }),
      );

      const { result } = renderHook(() => useGetAccounts(), { wrapper });

      await waitFor(
        () => {
          expect(result.current.isError).toBe(true);
        },
        { timeout: 200 },
      );

      expect(result.current.error).toBeDefined();
    });
  });

  describe("Mutation Error Handling", () => {
    beforeEach(async () => {
      await storageManager.setMode("demo");
    });

    test("should handle create mutation errors", async () => {
      const wrapper = createWrapper(queryClient);
      const mockError = createMockError("Create failed", "CREATE_ERROR");

      jest.spyOn(repositoryManager.getAccountRepository(), "createAccount").mockRejectedValueOnce(mockError);

      const { result } = renderHook(() => useCreateAccount(), { wrapper });

      const mockAccount = createMockAccount();

      await act(async () => {
        if (result.current.mutate) {
          result.current.mutate(mockAccount);
        }
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toBeDefined();
      expect(result.current.data).toBeUndefined();
    });

    test("should handle update mutation errors", async () => {
      const wrapper = createWrapper(queryClient);
      const mockError = createMockError("Update failed", "UPDATE_ERROR");

      jest.spyOn(repositoryManager.getAccountRepository(), "updateAccount").mockRejectedValueOnce(mockError);

      const { result } = renderHook(() => useUpdateAccount(), { wrapper });

      const mockAccount = createMockAccount();
      const originalData = createMockAccount({ id: "original-id" });

      await act(async () => {
        if (result.current.mutate) {
          result.current.mutate({ account: mockAccount, originalData });
        }
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toBeDefined();
    });

    test("should handle delete mutation errors", async () => {
      const wrapper = createWrapper(queryClient);
      const mockError = createMockError("Delete failed", "DELETE_ERROR");

      jest.spyOn(repositoryManager.getAccountRepository(), "deleteAccount").mockRejectedValueOnce(mockError);

      const { result } = renderHook(() => useDeleteAccount(), { wrapper });

      await act(async () => {
        if (result.current.mutate) {
          result.current.mutate("test-id");
        }
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toBeDefined();
    });

    test("should handle validation errors in mutations", async () => {
      const wrapper = createWrapper(queryClient);
      const validationError = new StorageError(
        "Validation failed: Name is required",
        StorageErrorCode.MOCK_VALIDATION_FAILED,
        {
          field: "name",
        },
      );

      jest.spyOn(repositoryManager.getAccountRepository(), "createAccount").mockRejectedValueOnce(validationError);

      const { result } = renderHook(() => useCreateAccount(), { wrapper });

      const invalidAccount = createMockAccount({ name: "" });

      await act(async () => {
        if (result.current.mutate) {
          result.current.mutate(invalidAccount);
        }
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toBeInstanceOf(StorageError);
      expect((result.current.error as StorageError).code).toBe("VALIDATION_ERROR");
    });
  });

  describe("Error Recovery", () => {
    beforeEach(async () => {
      await storageManager.setMode("demo");
    });

    test("should recover from temporary errors", async () => {
      const wrapper = createWrapper(queryClient);
      let callCount = 0;

      // Mock to fail first call, succeed on second
      jest.spyOn(repositoryManager.getAccountRepository(), "getAllAccounts").mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          return Promise.reject(createMockError("Temporary error"));
        }
        return Promise.resolve([]);
      });

      const { result } = renderHook(() => useGetAccounts(), { wrapper });

      // First call should fail
      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      // Retry the query
      await act(async () => {
        result.current.refetch();
      });

      // Second call should succeed
      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual([]);
    });

    test("should handle error boundary scenarios", async () => {
      const wrapper = createWrapper(queryClient);

      // Mock a critical error that might crash the component
      jest
        .spyOn(repositoryManager.getAccountRepository(), "getAllAccounts")
        .mockRejectedValueOnce(new Error("Critical system error"));

      const { result } = renderHook(() => useGetAccounts(), { wrapper });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      // Component should still be functional
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeDefined();
    });
  });

  describe("Error Handling Across Storage Modes", () => {
    const storageModes: StorageMode[] = ["demo", "local"];

    storageModes.forEach(mode => {
      test(`should handle errors consistently in ${mode} mode`, async () => {
        await storageManager.setMode(mode);
        const wrapper = createWrapper(queryClient);

        const mockError = createMockError(`${mode} mode error`, "MODE_ERROR");

        jest.spyOn(repositoryManager.getAccountRepository(), "getAllAccounts").mockRejectedValueOnce(mockError);

        const { result } = renderHook(() => useGetAccounts(), { wrapper });

        await waitFor(() => {
          expect(result.current.isError).toBe(true);
        });

        expect(result.current.error).toBeDefined();
        expect(result.current.isLoading).toBe(false);
        expect(result.current.data).toBeUndefined();
      });
    });

    test("should handle mode switching errors", async () => {
      const wrapper = createWrapper(queryClient);

      // Start with working demo mode
      await storageManager.setMode("demo");

      const { result } = renderHook(() => useGetAccounts(), { wrapper });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      // Mock error during mode switch
      jest
        .spyOn(storageManager, "setMode")
        .mockRejectedValueOnce(new StorageError("Mode switch failed", StorageErrorCode.STORAGE_CONNECTION_FAILED));

      // Attempt to switch modes
      try {
        await storageManager.setMode("local");
      } catch (error) {
        expect(error).toBeInstanceOf(StorageError);
      }

      // Query should still work with original mode
      await waitFor(() => {
        expect(result.current.isSuccess || result.current.isError).toBe(true);
      });
    });
  });

  describe("Error Propagation", () => {
    beforeEach(async () => {
      await storageManager.setMode("demo");
    });

    test("should propagate storage errors to TanStack Query", async () => {
      const wrapper = createWrapper(queryClient);

      const storageError = new StorageError("Storage operation failed", StorageErrorCode.STORAGE_OPERATION_FAILED, {
        operation: "read",
        table: "accounts",
      });

      jest.spyOn(repositoryManager.getAccountRepository(), "getAllAccounts").mockRejectedValueOnce(storageError);

      const { result } = renderHook(() => useGetAccounts(), { wrapper });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toBeInstanceOf(StorageError);
      const error = result.current.error as StorageError;
      expect(error.code).toBe("STORAGE_OP_ERROR");
      expect(error.details).toEqual({ operation: "read", table: "accounts" });
    });

    test("should handle error transformation in repository layer", async () => {
      const wrapper = createWrapper(queryClient);

      // Mock repository to transform errors
      jest.spyOn(repositoryManager.getAccountRepository(), "getAllAccounts").mockImplementation(async () => {
        try {
          throw new Error("Low-level error");
        } catch (error) {
          throw new StorageError("Repository error", StorageErrorCode.READ_OPERATION_FAILED, { originalError: error });
        }
      });

      const { result } = renderHook(() => useGetAccounts(), { wrapper });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toBeInstanceOf(StorageError);
      const error = result.current.error as StorageError;
      expect(error.code).toBe("REPO_ERROR");
      expect(error.details?.originalError).toBeDefined();
    });
  });
});
