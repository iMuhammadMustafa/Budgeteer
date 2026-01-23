export const selectors = {
    // Landing page
    landing: {
        welcomeText: 'text="Welcome to Budgeteer"',
        localModeButton: 'mode-local',
        cloudModeButton: 'mode-cloud',
        demoModeButton: 'mode-demo',
        themeToggle: '[aria-label="Go to Theme Settings"]',
    },

    // Navigation
    nav: {
        drawer: 'drawer',
        menuButton: '[aria-label="menu"]',
    },

    // Common UI elements
    ui: {
        modal: '[role="dialog"]',
        loadingSpinner: '[role="progressbar"]',
        submitButton: '[type="submit"]',
        cancelButton: 'button:has-text("Cancel")',
    },

    // MyTab component elements
    myTab: {
        addButton: "add-btn",
        refreshButton: "refresh-btn",
        restoreButton: "restore-btn",
        listItem: (id: string) => `list-item-${id}`,
        editButton: (id: string) => `edit-btn-${id}`,
        deleteButton: (id: string) => `delete-btn-${id}`,
    },

    // Forms
    forms: {
        dropdownButton: "dropdown-button",
        dropdownSelectedText: "dropdown-selected-text",
        nameInput: '[aria-label="Name"]',
        amountInput: '[aria-label="Amount"]',
        dateInput: '[aria-label="Date"]',
        categoryDropdown: '[aria-label="Category"]',
        accountDropdown: '[aria-label="Account"]',
    },

    // Auth
    auth: {
        emailInput: "Email",
        passwordInput: "Password",
        loginButton: /login|sign in/i,
        logoutButton: /logout|sign out/i,
    },
};

/**
 * Build a test ID selector
 */
export function testId(id: string): string {
    return `[data-testid="${id}"]`;
}

/**
 * Build a text-based selector
 */
export function hasText(text: string): string {
    return `:has-text("${text}")`;
}
