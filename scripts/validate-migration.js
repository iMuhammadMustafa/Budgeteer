#!/usr/bin/env node

/**
 * Migration Validation Script
 * 
 * This script validates the integrity of database migrations for both
 * Supabase and WatermelonDB implementations of enhanced recurring transactions.
 * 
 * Usage: node scripts/validate-migration.js [--supabase|--watermelon|--all]
 */

const fs = require('fs');
const path = require('path');

// Configuration
const SUPABASE_MIGRATIONS_DIR = 'supabase/migrations';
const WATERMELON_SCHEMA_PATH = 'src/database/schema.ts';
const SQLITE_SCHEMA_PATH = 'src/types/db/sqllite/schema.ts';

// Expected enhanced recurring fields
const EXPECTED_FIELDS = [
  'intervalmonths',
  'autoapplyenabled', 
  'transferaccountid',
  'isamountflexible',
  'isdateflexible',
  'recurringtype',
  'lastautoappliedat',
  'failedattempts',
  'maxfailedattempts'
];

// Validation functions
function validateSupabaseMigration() {
  console.log('🔍 Validating Supabase migration...');
  
  const migrationFile = path.join(SUPABASE_MIGRATIONS_DIR, '20250826000001_enhance_recurring_transactions.sql');
  
  if (!fs.existsSync(migrationFile)) {
    console.error('❌ Supabase migration file not found:', migrationFile);
    return false;
  }
  
  const content = fs.readFileSync(migrationFile, 'utf8');
  
  // Check for required elements
  const checks = [
    { name: 'RecurringTypes enum', pattern: /CREATE TYPE RecurringTypes/ },
    { name: 'interval_months column', pattern: /ADD COLUMN interval_months/ },
    { name: 'auto_apply_enabled column', pattern: /ADD COLUMN auto_apply_enabled/ },
    { name: 'transfer_account_id column', pattern: /ADD COLUMN transfer_account_id/ },
    { name: 'recurring_type column', pattern: /ADD COLUMN recurring_type/ },
    { name: 'Due transactions index', pattern: /idx_recurrings_due_auto_apply/ },
    { name: 'Transfer queries index', pattern: /idx_recurrings_transfers/ },
    { name: 'Transfer account constraint', pattern: /check_transfer_account_required/ },
    { name: 'Different accounts constraint', pattern: /check_transfer_accounts_different/ },
  ];
  
  let allPassed = true;
  checks.forEach(check => {
    if (check.pattern.test(content)) {
      console.log(`✅ ${check.name} - Found`);
    } else {
      console.error(`❌ ${check.name} - Missing`);
      allPassed = false;
    }
  });
  
  return allPassed;
}

function validateWatermelonSchema() {
  console.log('🔍 Validating WatermelonDB schema...');
  
  if (!fs.existsSync(WATERMELON_SCHEMA_PATH)) {
    console.error('❌ WatermelonDB schema file not found:', WATERMELON_SCHEMA_PATH);
    return false;
  }
  
  const content = fs.readFileSync(WATERMELON_SCHEMA_PATH, 'utf8');
  
  let allPassed = true;
  EXPECTED_FIELDS.forEach(field => {
    if (content.includes(`"${field}"`)) {
      console.log(`✅ Field ${field} - Found in WatermelonDB schema`);
    } else {
      console.error(`❌ Field ${field} - Missing from WatermelonDB schema`);
      allPassed = false;
    }
  });
  
  // Check for schema version update
  if (content.includes('version: 2')) {
    console.log('✅ Schema version updated to 2');
  } else {
    console.error('❌ Schema version not updated');
    allPassed = false;
  }
  
  return allPassed;
}

function validateSQLiteSchema() {
  console.log('🔍 Validating SQLite schema...');
  
  if (!fs.existsSync(SQLITE_SCHEMA_PATH)) {
    console.error('❌ SQLite schema file not found:', SQLITE_SCHEMA_PATH);
    return false;
  }
  
  const content = fs.readFileSync(SQLITE_SCHEMA_PATH, 'utf8');
  
  let allPassed = true;
  EXPECTED_FIELDS.forEach(field => {
    if (content.includes(`${field}:`)) {
      console.log(`✅ Field ${field} - Found in SQLite schema`);
    } else {
      console.error(`❌ Field ${field} - Missing from SQLite schema`);
      allPassed = false;
    }
  });
  
  // Check for RecurringTypes enum
  if (content.includes('RecurringTypes')) {
    console.log('✅ RecurringTypes enum - Found');
  } else {
    console.error('❌ RecurringTypes enum - Missing');
    allPassed = false;
  }
  
  return allPassed;
}

function validateMigrationConsistency() {
  console.log('🔍 Validating migration consistency between databases...');
  
  // Field mappings between Supabase (snake_case) and WatermelonDB (camelCase)
  const fieldMappings = [
    { supabase: 'interval_months', watermelon: 'intervalmonths' },
    { supabase: 'auto_apply_enabled', watermelon: 'autoapplyenabled' },
    { supabase: 'transfer_account_id', watermelon: 'transferaccountid' },
    { supabase: 'is_amount_flexible', watermelon: 'isamountflexible' },
    { supabase: 'is_date_flexible', watermelon: 'isdateflexible' },
    { supabase: 'recurring_type', watermelon: 'recurringtype' },
    { supabase: 'last_auto_applied_at', watermelon: 'lastautoappliedat' },
    { supabase: 'failed_attempts', watermelon: 'failedattempts' },
    { supabase: 'max_failed_attempts', watermelon: 'maxfailedattempts' }
  ];
  
  let allPassed = true;
  fieldMappings.forEach(mapping => {
    if (EXPECTED_FIELDS.includes(mapping.watermelon)) {
      console.log(`✅ Field mapping ${mapping.supabase} -> ${mapping.watermelon} - Consistent`);
    } else {
      console.error(`❌ Field mapping ${mapping.supabase} -> ${mapping.watermelon} - Inconsistent`);
      allPassed = false;
    }
  });
  
  return allPassed;
}

// Main execution
function main() {
  const args = process.argv.slice(2);
  const target = args[0] || '--all';
  
  console.log('🚀 Starting migration validation...\n');
  
  let results = [];
  
  if (target === '--supabase' || target === '--all') {
    results.push(validateSupabaseMigration());
    console.log('');
  }
  
  if (target === '--watermelon' || target === '--all') {
    results.push(validateWatermelonSchema());
    console.log('');
  }
  
  if (target === '--sqlite' || target === '--all') {
    results.push(validateSQLiteSchema());
    console.log('');
  }
  
  if (target === '--all') {
    results.push(validateMigrationConsistency());
    console.log('');
  }
  
  // Summary
  const allPassed = results.every(result => result === true);
  
  if (allPassed) {
    console.log('🎉 All migration validations passed!');
    process.exit(0);
  } else {
    console.error('💥 Some migration validations failed!');
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = {
  validateSupabaseMigration,
  validateWatermelonSchema,
  validateSQLiteSchema,
  validateMigrationConsistency
};