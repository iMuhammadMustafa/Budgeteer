import { Locator, Page } from "@playwright/test";
import { selectors } from "../selectors";

type TransactionFormScope = Page | Locator;

function getTransactionFormScope(scope: TransactionFormScope): Locator {
  return "goto" in scope ? scope.getByRole("list", { name: "Form container" }) : scope;
}

// ============================================
// ACCOUNT CATEGORY FORM
// ============================================

export async function fillCategoryForm(
  page: Page,
  options: {
    name: string;
    type?: "Asset" | "Liability";
    displayOrder?: string;
  },
) {
  const { name, type, displayOrder } = options;

  await page.getByRole("textbox", { name: "Category Name (required)" }).fill(name);

  if (type) {
    await page
      .getByRole("list", { name: "Category Details section" })
      .getByTestId(selectors.forms.dropdownButton)
      .click();
    await page.waitForTimeout(300);
    await page.getByText(type, { exact: true }).last().click();
  }

  if (displayOrder) {
    await page.getByRole("textbox", { name: "Display Order (required)" }).fill(displayOrder);
  }
}

// ============================================
// ACCOUNT FORM
// ============================================

export async function fillAccountForm(
  page: Page,
  options: {
    name: string;
    categoryName?: string;
    balance?: string;
    owner?: string;
    notes?: string;
  },
) {
  const { name, categoryName, balance, owner, notes } = options;

  // Scope form operations to the modal
  const modal = page.locator(selectors.ui.modal);

  await modal.getByRole("textbox", { name: "Account Name (required)" }).fill(name);

  if (categoryName) {
    // Click the dropdown button to open the searchable dropdown
    await modal
      .getByRole("list", { name: /Basic Information/ })
      .getByTestId(selectors.forms.dropdownButton)
      .click();
    await page.waitForTimeout(300);

    // Type the category name into the search field to filter options
    const searchField = page.getByPlaceholder("Search...");
    if (await searchField.isVisible().catch(() => false)) {
      await searchField.fill(categoryName);
      await page.waitForTimeout(300);
    }

    // Prefer deterministic testID option selection when available
    const categoryOptionByTestId = page.getByTestId(selectors.forms.dropdownOption(categoryName)).first();
    if (await categoryOptionByTestId.isVisible().catch(() => false)) {
      await categoryOptionByTestId.click({ force: true });
    } else {
      // Fallback for older dropdown renders
      const categoryOption = page.getByText(categoryName, { exact: true }).last();
      await categoryOption.waitFor({ state: "visible", timeout: 10000 });
      await categoryOption.click({ force: true });
    }
    // Wait for dropdown to close
    await page.waitForTimeout(200);
  }

  if (balance) {
    await modal.getByRole("textbox", { name: "Balance (required)" }).fill(balance);
  }

  if (owner) {
    await modal.getByRole("textbox", { name: "Owner" }).fill(owner);
  }

  if (notes) {
    await modal.getByRole("textbox", { name: "Notes" }).fill(notes);
  }
}

// ============================================
// TRANSACTION GROUP FORM
// ============================================

export async function fillTransactionGroupForm(
  page: Page,
  options: {
    name: string;
    type?: "Income" | "Expense" | "Transfer" | "Adjustment" | "Initial" | "Refund";
    displayOrder?: string;
    description?: string;
  },
) {
  const { name, type, displayOrder, description } = options;

  await page.getByRole("textbox", { name: "Group Name (required)" }).fill(name);

  if (type) {
    await page
      .getByRole("list", { name: "Transaction Group Details section content" })
      .getByTestId(selectors.forms.dropdownButton)
      .click();
    await page.waitForTimeout(300);
    await page.getByText(type, { exact: true }).last().click();
  }

  if (displayOrder) {
    await page.getByRole("textbox", { name: "Display Order (required)" }).fill(displayOrder);
  }

  if (description) {
    await page.getByRole("textbox", { name: "Description" }).fill(description);
  }
}

// ============================================
// TRANSACTION CATEGORY FORM
// ============================================

export async function fillTransactionCategoryForm(
  page: Page,
  options: {
    name: string;
    groupName?: string;
    budgetAmount?: string;
    budgetFrequency?: string;
    displayOrder?: string;
  },
) {
  const { name, groupName, budgetAmount, budgetFrequency, displayOrder } = options;

  await page.getByRole("textbox", { name: "Category Name (required)" }).fill(name);

  if (groupName) {
    const categorySection = page.getByRole("list", { name: "Category Details section content" });

    // Click the Transaction Group dropdown
    await categorySection.getByTestId(selectors.forms.dropdownButton).click();
    await page.waitForTimeout(300);

    // Use the search box to filter groups
    const searchBox = page.getByPlaceholder("Search...");
    if (await searchBox.isVisible().catch(() => false)) {
      await searchBox.fill(groupName);
      await page.waitForTimeout(300);
    }

    // Select the group from filtered dropdown globally using .last() to avoid matching the dropdown button
    await page.getByText(groupName, { exact: true }).last().click({ force: true });
    await page.waitForTimeout(200);
  }

  if (budgetAmount) {
    await page.getByRole("textbox", { name: "Budget Amount" }).fill(budgetAmount);
  }

  if (budgetFrequency) {
    // Select budget frequency from its dropdown in the Budget Settings section
    const budgetSection = page.getByRole("list", { name: "Budget Settings section content" });
    await budgetSection.getByTestId(selectors.forms.dropdownButton).click();
    await page.waitForTimeout(300);
    await page.getByText(budgetFrequency, { exact: true }).last().click({ force: true });
    await page.waitForTimeout(200);
  }

  if (displayOrder) {
    await page.getByRole("textbox", { name: "Display Order (required)" }).fill(displayOrder);
  }
}

// ============================================
// TRANSACTION FORM HELPERS
// ============================================

/**
 * Fill the transaction name field (SearchableDropdown with TextInput).
 */
export async function fillTransactionName(scope: TransactionFormScope, name: string) {
  const form = getTransactionFormScope(scope);
  const nameInput = form.getByPlaceholder("Type to search..");
  await nameInput.waitFor({ state: "visible", timeout: 15000 }).catch(() => {});
  await nameInput.fill(name);
}

/**
 * Fill the amount field.
 */
export async function fillAmount(scope: TransactionFormScope, amount: string) {
  const form = getTransactionFormScope(scope);
  const amountInput = form.getByRole("textbox", { name: /Amount/i });
  await amountInput.fill(amount);
}

/**
 * Select an option from a FormField dropdown on the Transaction form.
 * Handles both regular dropdowns (Category, Type) and popup dropdowns (Account).
 */
export async function selectFormDropdown(page: Page, fieldLabel: string, optionText: string) {
  // Strategy 1: Find dropdown-button testId that contains the field label
  const dropdownBtn = page.getByTestId(selectors.forms.dropdownButton).filter({ hasText: new RegExp(fieldLabel, "i") });

  if ((await dropdownBtn.count()) > 0) {
    await dropdownBtn.first().click();
  } else {
    // Strategy 2: Find the label text and click the adjacent clickable element
    const labelElement = page.getByText(new RegExp(`^${fieldLabel}\\*?$`)).first();
    const fieldContainer = labelElement.locator("..");
    const clickableDropdown = fieldContainer.locator('[data-cursor="pointer"], [cursor="pointer"]');
    if ((await clickableDropdown.count()) > 0) {
      await clickableDropdown.first().click();
    } else {
      await fieldContainer.click();
    }
  }
  await page.waitForTimeout(400);

  // Check if a search box appeared (popup dropdowns have a search)
  const searchBox = page.getByPlaceholder("Search...");
  if (await searchBox.isVisible().catch(() => false)) {
    await searchBox.fill(optionText);
    await page.waitForTimeout(400);
  }

  // Select the option globally using .last() to pick the dropdown list item over the dropdown button
  await page.getByText(optionText, { exact: true }).last().click({ force: true });
  await page.waitForTimeout(300);
}
