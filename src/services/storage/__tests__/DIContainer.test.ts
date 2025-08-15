// Tests for the dependency injection container

import { StorageMode } from "../types";

// Mock React Native Platform
jest.mock("react-native", () => ({
  Platform: {
    OS: "web",
  },
}));

// Import DIContainer - using real implementation with global mock override from testSetup
import { DIContainer } from "../DIContainer";

// Debug the import immediately
console.log("=== DEBUG DIContainer Import ===");
console.log("DIContainer:", DIContainer);
console.log("Type of DIContainer:", typeof DIContainer);
console.log("DIContainer.getInstance:", DIContainer?.getInstance);
console.log("Type of getInstance:", typeof DIContainer?.getInstance);
console.log("=== END DEBUG ===");

describe("DIContainer", () => {
  let container: DIContainer;

  // Debug the import
  it("should import DIContainer successfully", () => {
    expect(DIContainer).toBeDefined();
    expect(typeof DIContainer).toBe("function");
    expect(typeof DIContainer.getInstance).toBe("function");
  });

  beforeEach(() => {
    container = DIContainer.getInstance();
    container.clearProviders();
  });

  afterEach(() => {
    container.clearProviders();
  });

  it("should be a singleton", () => {
    const container1 = DIContainer.getInstance();
    const container2 = DIContainer.getInstance();
    expect(container1).toBe(container2);
  });

  it("should set and get storage mode", () => {
    container.setMode("demo");
    expect(container.getMode()).toBe("demo");

    container.setMode("cloud");
    expect(container.getMode()).toBe("cloud");
  });

  it("should clear providers when mode changes", () => {
    // Get a provider to populate the cache
    container.setMode("demo");
    const provider1 = container.getProvider("accounts");

    // Change mode should clear cache
    container.setMode("cloud");
    const provider2 = container.getProvider("accounts");

    // Providers should be different instances
    expect(provider1).not.toBe(provider2);
  });

  it("should return same provider instance for same entity type and mode", () => {
    container.setMode("demo");
    const provider1 = container.getProvider("accounts");
    const provider2 = container.getProvider("accounts");

    expect(provider1).toBe(provider2);
  });

  it("should return different providers for different entity types", () => {
    container.setMode("demo");
    const accountProvider = container.getProvider("accounts");
    const transactionProvider = container.getProvider("transactions");

    expect(accountProvider).not.toBe(transactionProvider);
  });
});
