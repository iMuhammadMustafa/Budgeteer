# Budgeteer

## 1. Project Overview

Budgeteer is a full-stack personal finance management application designed to help users track their income, expenses, and investments. It provides a comprehensive suite of tools for budgeting, financial planning, and analysis. The primary goal of Budgeteer is to offer a user-friendly and powerful platform for individuals to gain insights into their financial habits and make informed decisions.

This project is built with a modern tech stack, featuring a React Native frontend for cross-platform mobile access, a Supabase backend for robust data management, and an Electron wrapper for a native desktop experience.

## 2. Live Demo & Screenshots

- **Live Demo:** [Link to Live Demo]
- **Screenshots:**
  - ![Screenshot 1](placeholder.png)
  - ![Screenshot 2](placeholder.png)
  - ![Screenshot 3](placeholder.png)

## 3. Tech Stack

### Frontend

- **Framework:** [React Native](https://reactnative.dev/) with [Expo](https://expo.dev/)
- **Styling:** [Nativewind](https://www.nativewind.dev/) (Tailwind CSS for React Native)
- **Navigation:** [React Navigation](https://reactnavigation.org/)
- **Data Fetching & Caching:** [TanStack Query](https://tanstack.com/query/v4)
- **UI Components:** Custom-built components, `react-native-calendars`, `react-native-svg`, `victory-native` for charts.

### Backend

- **Platform:** [Supabase](https://supabase.io/)
  - **Database:** [PostgreSQL](https://www.postgresql.org/)
  - **Authentication:** [Supabase Auth](https://supabase.io/docs/guides/auth)
  - **APIs:** [Supabase Realtime](https://supabase.io/docs/guides/realtime) and RESTful APIs

### Desktop

- **Framework:** [Electron](https://www.electronjs.org/)

### Languages

- **Primary:** [TypeScript](https://www.typescriptlang.org/)

### Testing

- **Framework:** [Jest](https://jestjs.io/)

## 4. System Design

### a. Architecture Overview

Budgeteer follows a **monolithic architecture** with a clear separation of concerns between the frontend, backend, and desktop components.

- **Frontend (Mobile):** A React Native application built with Expo, allowing for a single codebase to target both iOS and Android.
- **Backend (BaaS):** Supabase provides the backend infrastructure, including the PostgreSQL database, user authentication, and a data API. This Backend-as-a-Service model simplifies development and allows for rapid iteration.
- **Desktop:** An Electron wrapper packages the web version of the application into a native desktop app for Windows, macOS, and Linux.

### b. Database Schema Overview

The database schema is designed to be relational and scalable, with a focus on data integrity and performance. Key tables include:

- **`Accounts`:** Stores user bank accounts, credit cards, and other financial assets.
- **`AccountCategories`:** Groups accounts into categories like "Assets" and "Liabilities."
- **`Transactions`:** Records all financial transactions, including expenses, income, transfers, and adjustments.
- **`TransactionCategories`:** Categorizes transactions for budgeting and analysis (e.g., "Groceries," "Utilities").
- **`TransactionGroups`:** A higher-level grouping for transaction categories.
- **`Recurrings`:** Manages recurring transactions, such as monthly bills or subscriptions.
- **`Configurations`:** A key-value store for application settings and user preferences.

Row-Level Security (RLS) is enabled on all tables to ensure that users can only access their own data.

### c. API Structure

The application utilizes the auto-generated RESTful API provided by Supabase, which is built on top of [PostgREST](https://postgrest.org/). This provides a secure and efficient way to perform CRUD operations on the database. Additionally, Supabase's Realtime capabilities are used to subscribe to database changes and update the UI in real-time.

### d. Caching, Background Jobs, Auth, 3rd-Party Services

- **Caching:** [TanStack Query](https://tanstack.com/query/v4) is used for client-side caching of server state. This improves performance by reducing the number of network requests and providing optimistic updates.
- **Background Jobs:** The backend leverages PostgreSQL functions and triggers to perform background tasks, such as updating account balances and refreshing materialized views.
- **Authentication:** User authentication is handled by [Supabase Auth](https://supabase.io/docs/guides/auth), which supports email/password, OAuth, and magic links.
- **3rd-Party Services:** The application does not currently rely on any major third-party services beyond Supabase.

## 5. Reasoning for Technical Decisions

| Technology/Decision | Reasoning | Tradeoffs |
| --- | --- | --- |
| **React Native with Expo** | Enables cross-platform development for iOS and Android from a single codebase, significantly reducing development time and effort. Expo provides a managed workflow and simplifies the build and deployment process. | Performance might not be as high as a fully native application for extremely demanding tasks. Less flexibility in accessing certain native APIs compared to a bare React Native project. |
| **Supabase** | Provides a complete backend solution out-of-the-box, including a database, authentication, and APIs. This significantly accelerates development and reduces the need for backend infrastructure management. | Less control over the backend infrastructure compared to a self-hosted solution. Potential for vendor lock-in. |
| **Electron** | Allows for the web application to be packaged as a native desktop app, providing a consistent user experience across all platforms. | Increased application size due to the bundled Chromium browser. Higher memory consumption compared to a fully native desktop application. |
| **TanStack Query** | Simplifies data fetching, caching, and state management on the client-side. It provides a powerful and flexible solution for managing server state, which is crucial for a data-intensive application like Budgeteer. | Adds a learning curve for developers unfamiliar with the library. Can add some complexity to the codebase. |
| **TypeScript** | Provides static typing for JavaScript, which helps to catch errors early in the development process and improves code quality and maintainability. | Requires a compilation step, which can slightly slow down the development workflow. Can be more verbose than plain JavaScript. |

## 6. Challenges Faced & Solutions

### a. Real-time Data Synchronization

- **Challenge:** Ensuring that the application's UI updates in real-time as data changes in the backend (e.g., when a new transaction is added).
- **Solution:** Leveraged Supabase's Realtime capabilities to subscribe to database changes. When a change is detected, the client-side cache is invalidated and the UI is re-rendered with the latest data.

### b. Complex State Management

- **Challenge:** Managing complex application state, especially when dealing with multiple forms, filters, and user interactions.
- **Solution:** Utilized TanStack Query for managing server state and React's built-in state management for UI state. This separation of concerns simplifies the codebase and makes it easier to reason about the application's state.

### c. Cross-Platform UI Consistency

- **Challenge:** Ensuring a consistent and polished user experience across different platforms (iOS, Android, Web, Desktop).
- **Solution:** Used Nativewind (Tailwind CSS for React Native) to create a design system of reusable components. This allows for a consistent look and feel across all platforms while still adhering to platform-specific conventions.

## 7. Core Features

### a. Account Management

- **Description:** Users can add, edit, and delete their financial accounts. Each account has a name, balance, currency, and category.
- **Implementation:** A simple CRUD interface is provided for managing accounts. The `Accounts` table in the database stores all account information.

### b. Transaction Tracking

- **Description:** Users can track their expenses, income, and transfers between accounts. Transactions can be categorized, tagged, and annotated with notes.
- **Implementation:** A form is used to add new transactions. The `Transactions` table stores all transaction data, with foreign key relationships to the `Accounts` and `TransactionCategories` tables.

### c. Budgeting

- **Description:** Users can create budgets for different transaction categories and track their spending against those budgets.
- **Implementation:** The `TransactionCategories` and `TransactionGroups` tables store budget information. The application calculates the total spending for each category and compares it to the budgeted amount.

### d. Financial Reports

- **Description:** The application provides a variety of reports to help users visualize their financial data, including monthly spending summaries, net worth growth charts, and more.
- **Implementation:** The backend uses a combination of database views and functions to generate the data for these reports. The frontend uses charting libraries like `victory-native` to display the data in a visually appealing way.