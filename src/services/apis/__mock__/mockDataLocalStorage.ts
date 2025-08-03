// Utility to store and reset mock data in localStorage

import {
  accountCategories,
  accounts,
  transactionCategories,
  transactionGroups,
  transactions,
  configurations,
  recurrings,
} from "./mockDataStore";

// Key for localStorage
const MOCK_DATA_KEY = "budgeteer-mock-data";

// Structure to store
const initialMockData = {
  accountCategories,
  accounts,
  transactionCategories,
  transactionGroups,
  transactions,
  configurations,
  recurrings,
};

// Save initial mock data to localStorage if not already present
export function initializeMockDataInLocalStorage() {
  if (typeof window === "undefined") return;
  if (!localStorage.getItem(MOCK_DATA_KEY)) {
    localStorage.setItem(MOCK_DATA_KEY, JSON.stringify(initialMockData));
  }
}

// Reset mock data in localStorage to initial state
export function resetMockDataInLocalStorage() {
  if (typeof window === "undefined") return;
  localStorage.setItem(MOCK_DATA_KEY, JSON.stringify(initialMockData));
}

// Get mock data from localStorage
export function getMockDataFromLocalStorage() {
  if (typeof window === "undefined") return initialMockData;
  const data = localStorage.getItem(MOCK_DATA_KEY);
  return data ? JSON.parse(data) : initialMockData;
}
