// WatermelonDB Migration Index
// This file exports all database migrations for WatermelonDB

import enhanceRecurringTransactions from './001_enhance_recurring_transactions';

export const migrations = [
  enhanceRecurringTransactions,
];

export default migrations;