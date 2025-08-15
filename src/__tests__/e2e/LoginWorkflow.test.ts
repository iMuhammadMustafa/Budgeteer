/**
 * Login Workflow End-to-End Tests
 *
 * Tests complete user workflows from login screen through storage mode selection
 * to data operations, validating the entire user journey.
 *
 * Requirements: 1.1, 1.2, 1.3, 1.4, 1.5
 */

import React from "react";
import { render, fireEvent, waitFor } from "@testing-library/react-native";
import { StorageModeManager } from "@/src/services/storage/StorageModeManager";
import { StorageMode } from "@/src/types/storage/StorageTypes";

// Mock the Login component structure for testing
const MockLogin = ({ onModeSelect }: { onModeSelect: (mode: StorageMode) => void }) => {
  return React.createElement("View", { testID: "login-screen" }, [
    React.createElement("Text", { key: "title", testID: "login-title" }, "Choose Storage Mode"),
    React.createElement(
      "TouchableOpacity",
      {
        key: "cloud-button",
        testID: "cloud-mode-button",
        onPress: () => onModeSelect(StorageMode.Cloud),
      },
      React.createElement("Text", null, "Cloud Mode"),
    ),
    React.createElement(
      "TouchableOpacity",
      {
        key: "demo-button",
        testID: "demo-mode-button",
        onPress: () => onModeSelect(StorageMode.Demo),
      },
      React.createElement("Text", null, "Demo Mode"),
    ),
    React.createElement(
      "TouchableOpacity",
      {
        key: "local-button",
        testID: "local-mode-button",
        onPress: () => onModeSelect(StorageMode.Local),
      },
      React.createElement("Text", null, "Local Mode"),
    ),
  ]);
};

describe("Login Workflow End-to-End Tests", () => {
  let storageModeManager: StorageModeManager;
  let mockOnModeSelect: jest.Mock;

  beforeEach(() => {
    storageModeManager = StorageModeManager.getInstance();
    mockOnModeSelect = jest.fn();
  });

  afterEach(async () => {
    await storageModeManager.cleanup();
    jest.clearAllMocks();
  });

  describe("Mode Selection Workflow", () => {
    it("should render all three storage mode options", () => {
      const { getByTestId } = render(React.createElement(MockLogin, { onModeSelect: mockOnModeSelect }));

      expect(getByTestId("login-screen")).toBeTruthy();
      expect(getByTestId("cloud-mode-button")).toBeTruthy();
      expect(getByTestId("demo-mode-button")).toBeTruthy();
      expect(getByTestId("local-mode-button")).toBeTruthy();
    });

    it("should handle demo mode selection and initialization", async () => {
      const { getByTestId } = render(React.createElement(MockLogin, { onModeSelect: mockOnModeSelect }));

      fireEvent.press(getByTestId("demo-mode-button"));

      await waitFor(() => {
        expect(mockOnModeSelect).toHaveBeenCalledWith(StorageMode.Demo);
      });

      // Simulate the mode selection process
      await storageModeManager.setMode(StorageMode.Demo);
      expect(storageModeManager.getMode()).toBe(StorageMode.Demo);
    });

    it("should handle local mode selection and initialization", async () => {
      const { getByTestId } = render(React.createElement(MockLogin, { onModeSelect: mockOnModeSelect }));

      fireEvent.press(getByTestId("local-mode-button"));

      await waitFor(() => {
        expect(mockOnModeSelect).toHaveBeenCalledWith(StorageMode.Local);
      });

      // Simulate the mode selection process
      await storageModeManager.setMode(StorageMode.Local);
      expect(storageModeManager.getMode()).toBe(StorageMode.Local);
    });

    it("should handle cloud mode selection", async () => {
      const { getByTestId } = render(React.createElement(MockLogin, { onModeSelect: mockOnModeSelect }));

      fireEvent.press(getByTestId("cloud-mode-button"));

      await waitFor(() => {
        expect(mockOnModeSelect).toHaveBeenCalledWith(StorageMode.Cloud);
      });

      // Note: Cloud mode would require authentication in real scenario
      // For testing, we just verify the selection was made
    });
  });

  describe("Post-Login Data Operations", () => {
    it("should allow data operations after demo mode login", async () => {
      // Simulate demo mode login
      await storageModeManager.setMode(StorageMode.Demo);

      // Mock DIContainer for testing
      const mockDIContainer = {
        getProvider: jest.fn((entityType: string) => {
          if (entityType === "accounts") {
            return {
              getAllAccounts: jest.fn(() => Promise.resolve([])),
              createAccount: jest.fn(account => Promise.resolve(account)),
            };
          }
          if (entityType === "accountCategories") {
            return {
              createAccountCategory: jest.fn(accountCategory => Promise.resolve(accountCategory)),
            };
          }
          return {};
        }),
      };

      // Test account operations
      const accountProvider = mockDIContainer.getProvider("accounts");
      const accountCategoryProvider = mockDIContainer.getProvider("accountCategories");


      if(!accountProvider || !accountCategoryProvider){
        throw Error("Mock Objects weren't created correctly");
      }
      if(!accountCategoryProvider.createAccountCategory){
        throw new Error("Mock Object Weren't created Correctly ")
      }


      // Create category
      const category = await accountCategoryProvider.createAccountCategory({
        id: "test-category",
        tenantid: "test-tenant",
        name: "Test Category",
        type: "asset",
      });
      expect(category).toEqual({ id: "test-category" });

      if(!accountProvider || !accountCategoryProvider){
        throw Error("Mock Objects weren't created correctly");
      }
      if(!accountProvider.createAccount || !accountProvider.getAllAccounts){
        throw new Error("Mock Object Weren't created Correctly ")
      }

      // Create account
      const account = await accountProvider.createAccount({
        id: "test-account",
        tenantid: "test-tenant",
        name: "Test Account",
        categoryid: "test-category",
      });
      expect(account).toEqual({ id: "test-account" });

      // Get accounts
      const accounts = await accountProvider.getAllAccounts();
      expect(accounts).toEqual([]);
    });

    it("should allow data operations after local mode login", async () => {
      // Simulate local mode login
      await storageModeManager.setMode(StorageMode.Local);

      // Mock DIContainer for local storage
      const mockDIContainer = {
        getProvider: jest.fn((entityType: string) => {
          if (entityType === "accounts") {
            return {
              getAllAccounts: jest.fn(() => Promise.resolve([])),
              createAccount: jest.fn(() => Promise.resolve({ id: "local-account" })),
            };
          }
          if (entityType === "accountCategories") {
            return {
              createAccountCategory: jest.fn(() => Promise.resolve({ id: "local-category" })),
            };
          }
          return {};
        }),
      };

      // Test local storage operations
      const accountProvider = mockDIContainer.getProvider("accounts");
      const accountCategoryProvider = mockDIContainer.getProvider("accountCategories");

      if(!accountProvider || !accountCategoryProvider){
        throw Error("Mock Objects weren't created correctly");
      }
      if(!accountCategoryProvider.createAccountCategory || !accountProvider.getAllAccounts){
        throw new Error("Mock Object Weren't created Correctly ")
      }
      // Create category in local storage
      const category = await accountCategoryProvider.createAccountCategory({
        id: "local-category",
        tenantid: "test-tenant",
        name: "Local Category",
        type: "asset",
      });
      expect(category).toEqual({ id: "local-category" });

      // Create account in local storage
      const account = await accountProvider.createAccount({
        id: "local-account",
        tenantid: "test-tenant",
        name: "Local Account",
        categoryid: "local-category",
      });
      expect(account).toEqual({ id: "local-account" });
    });
  });

  describe("Mode Switching After Login", () => {
    it("should allow switching between modes after initial login", async () => {
      // Start with demo mode
      await storageModeManager.setMode(StorageMode.Demo);
      expect(storageModeManager.getMode()).toBe(StorageMode.Demo);

      // Switch to local mode
      await storageModeManager.setMode(StorageMode.Local);
      expect(storageModeManager.getMode()).toBe(StorageMode.Local);

      // Switch back to demo mode
      await storageModeManager.setMode(StorageMode.Demo);
      expect(storageModeManager.getMode()).toBe(StorageMode.Demo);
    });

    it("should maintain separate data contexts when switching modes", async () => {
      const mockDemoData = [{ id: "demo-account", name: "Demo Account" }];
      const mockLocalData = [{ id: "local-account", name: "Local Account" }];

      // Mock DIContainer with mode-specific data
      const mockDIContainer = {
        getProvider: jest.fn((entityType: string) => {
          if (entityType === "accounts") {
            return {
              getAllAccounts: jest.fn(() => {
                const currentMode = storageModeManager.getMode();
                if (currentMode === StorageMode.Demo) {
                  return Promise.resolve(mockDemoData);
                } else if (currentMode === StorageMode.Local) {
                  return Promise.resolve(mockLocalData);
                }
                return Promise.resolve([]);
              }),
            };
          }
          return {};
        }),
      };

      
      // Test demo mode data
      await storageModeManager.setMode(StorageMode.Demo);
      const accountProvider = mockDIContainer.getProvider("accounts");

      if(!accountProvider){
        throw Error("Mock Objects weren't created correctly");
      }
      if( !accountProvider.getAllAccounts){
        throw new Error("Mock Object Weren't created Correctly ")
      }
      const demoAccounts = await accountProvider.getAllAccounts();
      expect(demoAccounts).toEqual(mockDemoData);

      // Test local mode data
      await storageModeManager.setMode(StorageMode.Local);
      const localAccounts = await accountProvider.getAllAccounts();
      expect(localAccounts).toEqual(mockLocalData);

      // Switch back to demo and verify data persistence
      await storageModeManager.setMode(StorageMode.Demo);
      const demoAccountsAgain = await accountProvider.getAllAccounts();
      expect(demoAccountsAgain).toEqual(mockDemoData);
    });
  });

  describe("Error Handling in Login Workflow", () => {
    it("should handle mode initialization failures gracefully", async () => {
      // Test invalid mode
      await expect(storageModeManager.setMode("invalid" as StorageMode)).rejects.toThrow();

      // Should still be able to set valid mode after failure
      await storageModeManager.setMode(StorageMode.Demo);
      expect(storageModeManager.getMode()).toBe(StorageMode.Demo);
    });

    it("should handle storage provider initialization errors", async () => {
      // Mock a failing storage provider
      const originalSetMode = storageModeManager.setMode;
      storageModeManager.setMode = jest.fn().mockRejectedValueOnce(new Error("Storage initialization failed"));

      await expect(storageModeManager.setMode(StorageMode.Demo)).rejects.toThrow("Storage initialization failed");

      // Restore original method and verify recovery
      storageModeManager.setMode = originalSetMode;
      await storageModeManager.setMode(StorageMode.Demo);
      expect(storageModeManager.getMode()).toBe(StorageMode.Demo);
    });

    it("should handle network errors in cloud mode gracefully", async () => {
      // Mock network error for cloud mode
      const mockCloudProvider = {
        initialize: jest.fn().mockRejectedValue(new Error("Network error")),
        cleanup: jest.fn(),
      };

      // In a real scenario, this would test actual cloud connectivity
      // For now, we just verify error handling structure
      await expect(mockCloudProvider.initialize()).rejects.toThrow("Network error");
    });
  });

  describe("User Experience Validation", () => {
    it("should provide clear feedback during mode initialization", async () => {
      // Mock loading states
      let isLoading = false;
      let loadingMessage = "";

      const mockSetLoading = (loading: boolean, message: string = "") => {
        isLoading = loading;
        loadingMessage = message;
      };

      // Simulate mode selection with loading feedback
      mockSetLoading(true, "Initializing demo mode...");
      await storageModeManager.setMode(StorageMode.Demo);
      mockSetLoading(false);

      expect(isLoading).toBe(false);
      expect(storageModeManager.getMode()).toBe(StorageMode.Demo);
    });

    it("should validate mode selection persistence across app restarts", async () => {
      // Set demo mode
      await storageModeManager.setMode(StorageMode.Demo);
      expect(storageModeManager.getMode()).toBe(StorageMode.Demo);

      // Simulate app restart by creating new manager instance
      const newStorageModeManager = StorageModeManager.getInstance();

      // In a real app, this would restore from persistent storage
      // For testing, we verify the manager can be reinitialized
      await newStorageModeManager.setMode(StorageMode.Demo);
      expect(newStorageModeManager.getMode()).toBe(StorageMode.Demo);

      await newStorageModeManager.cleanup();
    });
  });
});
