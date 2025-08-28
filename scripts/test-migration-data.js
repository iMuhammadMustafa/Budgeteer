#!/usr/bin/env node

/**
 * Migration Data Testing Script
 * 
 * This script creates sample data to test the enhanced recurring transactions migration.
 * It generates test data that covers all the new fields and scenarios.
 * 
 * Usage: node scripts/test-migration-data.js [--generate|--validate]
 */

const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

// Sample data generators
function generateSampleRecurringTransactions() {
  const baseDate = new Date('2025-01-01');
  const tenantId = uuidv4();
  const accountId1 = uuidv4();
  const accountId2 = uuidv4();
  const categoryId = uuidv4();
  
  return [
    // Standard recurring transaction with auto-apply
    {
      id: uuidv4(),
      name: 'Monthly Rent Payment',
      sourceaccountid: accountId1,
      categoryid: categoryId,
      amount: 1200.00,
      type: 'Expense',
      description: 'Monthly rent payment',
      currencycode: 'USD',
      recurrencerule: 'FREQ=MONTHLY;INTERVAL=1;BYMONTHDAY=1',
      nextoccurrencedate: '2025-02-01',
      isactive: true,
      // Enhanced fields
      intervalmonths: 1,
      autoapplyenabled: true,
      transferaccountid: null,
      isamountflexible: false,
      isdateflexible: false,
      recurringtype: 'Standard',
      lastautoappliedat: null,
      failedattempts: 0,
      maxfailedattempts: 3,
      tenantid: tenantId,
      isdeleted: false,
      createdat: baseDate.toISOString(),
    },
    
    // Recurring transfer between accounts
    {
      id: uuidv4(),
      name: 'Monthly Savings Transfer',
      sourceaccountid: accountId1,
      categoryid: null,
      amount: 500.00,
      type: 'Transfer',
      description: 'Transfer to savings account',
      currencycode: 'USD',
      recurrencerule: 'FREQ=MONTHLY;INTERVAL=1;BYMONTHDAY=15',
      nextoccurrencedate: '2025-02-15',
      isactive: true,
      // Enhanced fields
      intervalmonths: 1,
      autoapplyenabled: false,
      transferaccountid: accountId2,
      isamountflexible: false,
      isdateflexible: false,
      recurringtype: 'Transfer',
      lastautoappliedat: null,
      failedattempts: 0,
      maxfailedattempts: 3,
      tenantid: tenantId,
      isdeleted: false,
      createdat: baseDate.toISOString(),
    },
    
    // Credit card payment (flexible amount)
    {
      id: uuidv4(),
      name: 'Credit Card Statement Payment',
      sourceaccountid: accountId1,
      categoryid: categoryId,
      amount: null, // Flexible amount
      type: 'Expense',
      description: 'Pay credit card statement balance',
      currencycode: 'USD',
      recurrencerule: 'FREQ=MONTHLY;INTERVAL=1;BYMONTHDAY=25',
      nextoccurrencedate: '2025-02-25',
      isactive: true,
      // Enhanced fields
      intervalmonths: 1,
      autoapplyenabled: true,
      transferaccountid: accountId2, // Credit card account
      isamountflexible: true,
      isdateflexible: false,
      recurringtype: 'CreditCardPayment',
      lastautoappliedat: null,
      failedattempts: 0,
      maxfailedattempts: 5, // Higher threshold for credit card payments
      tenantid: tenantId,
      isdeleted: false,
      createdat: baseDate.toISOString(),
    },
    
    // Quarterly recurring transaction (custom interval)
    {
      id: uuidv4(),
      name: 'Quarterly Insurance Payment',
      sourceaccountid: accountId1,
      categoryid: categoryId,
      amount: 450.00,
      type: 'Expense',
      description: 'Quarterly insurance premium',
      currencycode: 'USD',
      recurrencerule: 'FREQ=MONTHLY;INTERVAL=3;BYMONTHDAY=1',
      nextoccurrencedate: '2025-04-01',
      isactive: true,
      // Enhanced fields
      intervalmonths: 3,
      autoapplyenabled: false,
      transferaccountid: null,
      isamountflexible: false,
      isdateflexible: false,
      recurringtype: 'Standard',
      lastautoappliedat: null,
      failedattempts: 0,
      maxfailedattempts: 3,
      tenantid: tenantId,
      isdeleted: false,
      createdat: baseDate.toISOString(),
    },
    
    // Flexible date and amount transaction
    {
      id: uuidv4(),
      name: 'Variable Utility Payment',
      sourceaccountid: accountId1,
      categoryid: categoryId,
      amount: null, // Flexible amount
      type: 'Expense',
      description: 'Monthly utility bill (amount varies)',
      currencycode: 'USD',
      recurrencerule: 'FREQ=MONTHLY;INTERVAL=1',
      nextoccurrencedate: null, // Flexible date
      isactive: true,
      // Enhanced fields
      intervalmonths: 1,
      autoapplyenabled: false,
      transferaccountid: null,
      isamountflexible: true,
      isdateflexible: true,
      recurringtype: 'Standard',
      lastautoappliedat: null,
      failedattempts: 0,
      maxfailedattempts: 3,
      tenantid: tenantId,
      isdeleted: false,
      createdat: baseDate.toISOString(),
    }
  ];
}

function generateSupabaseTestSQL() {
  const sampleData = generateSampleRecurringTransactions();
  
  let sql = `-- Test data for Enhanced Recurring Transactions Migration
-- This script inserts sample data to test all enhanced recurring transaction features

-- Insert test data
`;

  sampleData.forEach((record, index) => {
    sql += `
INSERT INTO recurrings (
  id, name, sourceaccountid, categoryid, amount, type, description, 
  currencycode, recurrencerule, nextoccurrencedate, isactive,
  interval_months, auto_apply_enabled, transfer_account_id, 
  is_amount_flexible, is_date_flexible, recurring_type,
  last_auto_applied_at, failed_attempts, max_failed_attempts,
  tenantid, isdeleted, createdat
) VALUES (
  '${record.id}',
  '${record.name}',
  '${record.sourceaccountid}',
  ${record.categoryid ? `'${record.categoryid}'` : 'NULL'},
  ${record.amount || 'NULL'},
  '${record.type}',
  '${record.description}',
  '${record.currencycode}',
  '${record.recurrencerule}',
  ${record.nextoccurrencedate ? `'${record.nextoccurrencedate}'` : 'NULL'},
  ${record.isactive},
  ${record.intervalmonths},
  ${record.autoapplyenabled},
  ${record.transferaccountid ? `'${record.transferaccountid}'` : 'NULL'},
  ${record.isamountflexible},
  ${record.isdateflexible},
  '${record.recurringtype}',
  ${record.lastautoappliedat ? `'${record.lastautoappliedat}'` : 'NULL'},
  ${record.failedattempts},
  ${record.maxfailedattempts},
  '${record.tenantid}',
  ${record.isdeleted},
  '${record.createdat}'
);`;
  });

  sql += `

-- Validation queries to test the migration
SELECT 
  name,
  recurring_type,
  interval_months,
  auto_apply_enabled,
  is_amount_flexible,
  is_date_flexible,
  failed_attempts
FROM recurrings 
WHERE isdeleted = false
ORDER BY name;

-- Test due transactions query (should use the new index)
EXPLAIN (ANALYZE, BUFFERS) 
SELECT * FROM recurrings 
WHERE nextoccurrencedate <= CURRENT_DATE 
  AND auto_apply_enabled = true 
  AND isactive = true 
  AND isdeleted = false;

-- Test transfer transactions query
SELECT 
  name,
  sourceaccountid,
  transfer_account_id,
  recurring_type
FROM recurrings 
WHERE recurring_type = 'Transfer' 
  AND isdeleted = false;
`;

  return sql;
}

function generateWatermelonTestData() {
  const sampleData = generateSampleRecurringTransactions();
  
  return {
    recurrings: sampleData.map(record => ({
      ...record,
      // Convert boolean values for WatermelonDB
      isactive: record.isactive ? 1 : 0,
      autoapplyenabled: record.autoapplyenabled ? 1 : 0,
      isamountflexible: record.isamountflexible ? 1 : 0,
      isdateflexible: record.isdateflexible ? 1 : 0,
      isdeleted: record.isdeleted ? 1 : 0,
      // Convert date to timestamp
      createdat: new Date(record.createdat).getTime(),
    }))
  };
}

function validateTestData() {
  console.log('🔍 Validating test data...');
  
  const sampleData = generateSampleRecurringTransactions();
  
  const validationRules = [
    {
      name: 'Transfer transactions have transfer_account_id',
      test: (data) => data.filter(r => r.recurringtype === 'Transfer').every(r => r.transferaccountid !== null)
    },
    {
      name: 'Credit card payments have transfer_account_id',
      test: (data) => data.filter(r => r.recurringtype === 'CreditCardPayment').every(r => r.transferaccountid !== null)
    },
    {
      name: 'Standard transactions do not have transfer_account_id',
      test: (data) => data.filter(r => r.recurringtype === 'Standard').every(r => r.transferaccountid === null)
    },
    {
      name: 'Flexible amount transactions have null amount',
      test: (data) => data.filter(r => r.isamountflexible).every(r => r.amount === null)
    },
    {
      name: 'Flexible date transactions have null nextoccurrencedate',
      test: (data) => data.filter(r => r.isdateflexible).every(r => r.nextoccurrencedate === null)
    },
    {
      name: 'Interval months within valid range',
      test: (data) => data.every(r => r.intervalmonths >= 1 && r.intervalmonths <= 24)
    },
    {
      name: 'Failed attempts non-negative',
      test: (data) => data.every(r => r.failedattempts >= 0)
    },
    {
      name: 'Max failed attempts positive',
      test: (data) => data.every(r => r.maxfailedattempts > 0)
    }
  ];
  
  let allPassed = true;
  validationRules.forEach(rule => {
    if (rule.test(sampleData)) {
      console.log(`✅ ${rule.name}`);
    } else {
      console.error(`❌ ${rule.name}`);
      allPassed = false;
    }
  });
  
  return allPassed;
}

// Main execution
function main() {
  const args = process.argv.slice(2);
  const action = args[0] || '--generate';
  
  if (action === '--generate') {
    console.log('📝 Generating test migration data...\n');
    
    // Generate Supabase test SQL
    const supabaseSQL = generateSupabaseTestSQL();
    fs.writeFileSync('scripts/test-data-supabase.sql', supabaseSQL);
    console.log('✅ Generated Supabase test data: scripts/test-data-supabase.sql');
    
    // Generate WatermelonDB test data
    const watermelonData = generateWatermelonTestData();
    fs.writeFileSync('scripts/test-data-watermelon.json', JSON.stringify(watermelonData, null, 2));
    console.log('✅ Generated WatermelonDB test data: scripts/test-data-watermelon.json');
    
  } else if (action === '--validate') {
    console.log('🔍 Validating test data...\n');
    
    const isValid = validateTestData();
    
    if (isValid) {
      console.log('\n🎉 All test data validations passed!');
      process.exit(0);
    } else {
      console.error('\n💥 Some test data validations failed!');
      process.exit(1);
    }
  } else {
    console.error('Usage: node scripts/test-migration-data.js [--generate|--validate]');
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = {
  generateSampleRecurringTransactions,
  generateSupabaseTestSQL,
  generateWatermelonTestData,
  validateTestData
};