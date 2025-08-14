/**
 * Interface Compliance Test Suite
 * 
 * This module provides comprehensive interface compliance testing to ensure
 * all storage implementations (Supabase, Mock, Local) implement the same interfaces
 * with identical method signatures and behavior.
 */

import { ProviderRegistry, EntityType, StorageMode } from '../types';

export interface InterfaceComplianceReport {
  mode: StorageMode;
  timestamp: string;
  summary: {
    totalInterfaces: number;
    compliantInterfaces: number;
    nonCompliantInterfaces: number;
  };
  results: InterfaceComplianceResult[];
  violations: InterfaceViolation[];
}

export interface InterfaceComplianceResult {
  entityType: EntityType;
  isCompliant: boolean;
  requiredMethods: string[];
  implementedMethods: string[];
  missingMethods: string[];
  extraMethods: string[];
}

export interface InterfaceViolation {
  entityType: EntityType;
  method: string;
  violationType: 'missing' | 'extra' | 'signature_mismatch';
  expected?: string;
  actual?: string;
  details: string;
}

export interface MethodSignature {
  name: string;
  parameters: ParameterInfo[];
  returnType: string;
  isAsync: boolean;
}

export interface ParameterInfo {
  name: string;
  type: string;
  optional: boolean;
}

/**
 * Interface compliance tester
 */
export class InterfaceComplianceTests {
  private expectedInterfaces: Record<EntityType, MethodSignature[]>;

  constructor() {
    this.expectedInterfaces = this.defineExpectedInterfaces();
  }

  /**
   * Test interface compliance for all providers
   */
  async testCompliance(
    providers: ProviderRegistry,
    mode: StorageMode
  ): Promise<InterfaceComplianceReport> {
    const report: InterfaceComplianceReport = {
      mode,
      timestamp: new Date().toISOString(),
      summary: {
        totalInterfaces: 0,
        compliantInterfaces: 0,
        nonCompliantInterfaces: 0
      },
      results: [],
      violations: []
    };

    console.log(`Testing interface compliance for ${mode} mode...`);

    // Test each entity provider
    for (const entityType of Object.keys(providers) as EntityType[]) {
      const provider = providers[entityType];
      const result = await this.testProviderCompliance(provider, entityType);
      
      report.results.push(result);
      
      if (!result.isCompliant) {
        // Add violations for this provider
        for (const missingMethod of result.missingMethods) {
          report.violations.push({
            entityType,
            method: missingMethod,
            violationType: 'missing',
            details: `Required method '${missingMethod}' is not implemented`
          });
        }
        
        for (const extraMethod of result.extraMethods) {
          report.violations.push({
            entityType,
            method: extraMethod,
            violationType: 'extra',
            details: `Unexpected method '${extraMethod}' found in implementation`
          });
        }
      }
    }

    // Calculate summary
    report.summary.totalInterfaces = report.results.length;
    report.summary.compliantInterfaces = report.results.filter(r => r.isCompliant).length;
    report.summary.nonCompliantInterfaces = report.results.filter(r => !r.isCompliant).length;

    console.log(`Interface compliance test completed for ${mode}:`, report.summary);
    return report;
  }

  /**
   * Test compliance for a single provider
   */
  private async testProviderCompliance(
    provider: any,
    entityType: EntityType
  ): Promise<InterfaceComplianceResult> {
    const expectedMethods = this.expectedInterfaces[entityType] || [];
    const requiredMethodNames = expectedMethods.map(m => m.name);
    
    // Get all methods from the provider
    const implementedMethods = this.getProviderMethods(provider);
    
    // Find missing and extra methods
    const missingMethods = requiredMethodNames.filter(
      method => !implementedMethods.includes(method)
    );
    
    const extraMethods = implementedMethods.filter(
      method => !requiredMethodNames.includes(method) && !this.isUtilityMethod(method)
    );

    const isCompliant = missingMethods.length === 0 && extraMethods.length === 0;

    return {
      entityType,
      isCompliant,
      requiredMethods: requiredMethodNames,
      implementedMethods,
      missingMethods,
      extraMethods
    };
  }

  /**
   * Get all method names from a provider
   */
  private getProviderMethods(provider: any): string[] {
    const methods: string[] = [];
    
    // Handle null/undefined providers
    if (!provider || typeof provider !== 'object') {
      return methods;
    }
    
    // Get methods from the provider object
    for (const prop in provider) {
      if (typeof provider[prop] === 'function') {
        methods.push(prop);
      }
    }
    
    // Get methods from the prototype
    try {
      const prototype = Object.getPrototypeOf(provider);
      if (prototype && prototype !== Object.prototype) {
        for (const prop of Object.getOwnPropertyNames(prototype)) {
          if (prop !== 'constructor' && typeof provider[prop] === 'function') {
            methods.push(prop);
          }
        }
      }
    } catch (error) {
      // Ignore prototype access errors
    }
    
    return [...new Set(methods)]; // Remove duplicates
  }

  /**
   * Check if a method is a utility method (should be ignored in compliance testing)
   */
  private isUtilityMethod(methodName: string): boolean {
    const utilityMethods = [
      'constructor',
      'toString',
      'valueOf',
      'hasOwnProperty',
      'isPrototypeOf',
      'propertyIsEnumerable',
      'toLocaleString'
    ];
    
    return utilityMethods.includes(methodName) || methodName.startsWith('_');
  }

  /**
   * Define expected interfaces for all entity types
   */
  private defineExpectedInterfaces(): Record<EntityType, MethodSignature[]> {
    return {
      accounts: [
        {
          name: 'getAllAccounts',
          parameters: [{ name: 'tenantId', type: 'string', optional: false }],
          returnType: 'Promise<any[]>',
          isAsync: true
        },
        {
          name: 'getAccountById',
          parameters: [
            { name: 'id', type: 'string', optional: false },
            { name: 'tenantId', type: 'string', optional: false }
          ],
          returnType: 'Promise<any | null>',
          isAsync: true
        },
        {
          name: 'createAccount',
          parameters: [{ name: 'account', type: 'any', optional: false }],
          returnType: 'Promise<any>',
          isAsync: true
        },
        {
          name: 'updateAccount',
          parameters: [{ name: 'account', type: 'any', optional: false }],
          returnType: 'Promise<any>',
          isAsync: true
        },
        {
          name: 'deleteAccount',
          parameters: [
            { name: 'id', type: 'string', optional: false },
            { name: 'userId', type: 'string', optional: true }
          ],
          returnType: 'Promise<any>',
          isAsync: true
        },
        {
          name: 'restoreAccount',
          parameters: [
            { name: 'id', type: 'string', optional: false },
            { name: 'userId', type: 'string', optional: true }
          ],
          returnType: 'Promise<any>',
          isAsync: true
        },
        {
          name: 'updateAccountBalance',
          parameters: [
            { name: 'accountid', type: 'string', optional: false },
            { name: 'amount', type: 'number', optional: false }
          ],
          returnType: 'Promise<any>',
          isAsync: true
        },
        {
          name: 'getAccountOpenedTransaction',
          parameters: [
            { name: 'accountid', type: 'string', optional: false },
            { name: 'tenantId', type: 'string', optional: false }
          ],
          returnType: 'Promise<any>',
          isAsync: true
        },
        {
          name: 'getTotalAccountBalance',
          parameters: [{ name: 'tenantId', type: 'string', optional: false }],
          returnType: 'Promise<{ totalbalance: number } | null>',
          isAsync: true
        }
      ],
      accountCategories: [
        {
          name: 'getAllAccountCategories',
          parameters: [{ name: 'tenantId', type: 'string', optional: false }],
          returnType: 'Promise<any[]>',
          isAsync: true
        },
        {
          name: 'getAccountCategoryById',
          parameters: [
            { name: 'id', type: 'string', optional: false },
            { name: 'tenantId', type: 'string', optional: false }
          ],
          returnType: 'Promise<any | null>',
          isAsync: true
        },
        {
          name: 'createAccountCategory',
          parameters: [{ name: 'category', type: 'any', optional: false }],
          returnType: 'Promise<any>',
          isAsync: true
        },
        {
          name: 'updateAccountCategory',
          parameters: [{ name: 'category', type: 'any', optional: false }],
          returnType: 'Promise<any>',
          isAsync: true
        },
        {
          name: 'deleteAccountCategory',
          parameters: [
            { name: 'id', type: 'string', optional: false },
            { name: 'userId', type: 'string', optional: true }
          ],
          returnType: 'Promise<any>',
          isAsync: true
        },
        {
          name: 'restoreAccountCategory',
          parameters: [
            { name: 'id', type: 'string', optional: false },
            { name: 'userId', type: 'string', optional: true }
          ],
          returnType: 'Promise<any>',
          isAsync: true
        }
      ],
      transactions: [
        {
          name: 'getAllTransactions',
          parameters: [{ name: 'tenantId', type: 'string', optional: false }],
          returnType: 'Promise<any[]>',
          isAsync: true
        },
        {
          name: 'getTransactions',
          parameters: [
            { name: 'searchFilters', type: 'any', optional: false },
            { name: 'tenantId', type: 'string', optional: false }
          ],
          returnType: 'Promise<any[]>',
          isAsync: true
        },
        {
          name: 'getTransactionFullyById',
          parameters: [
            { name: 'transactionid', type: 'string', optional: false },
            { name: 'tenantId', type: 'string', optional: false }
          ],
          returnType: 'Promise<any | null>',
          isAsync: true
        },
        {
          name: 'getTransactionById',
          parameters: [
            { name: 'transactionid', type: 'string', optional: false },
            { name: 'tenantId', type: 'string', optional: false }
          ],
          returnType: 'Promise<any | null>',
          isAsync: true
        },
        {
          name: 'getTransactionByTransferId',
          parameters: [
            { name: 'id', type: 'string', optional: false },
            { name: 'tenantId', type: 'string', optional: false }
          ],
          returnType: 'Promise<any | null>',
          isAsync: true
        },
        {
          name: 'getTransactionsByName',
          parameters: [
            { name: 'text', type: 'string', optional: false },
            { name: 'tenantId', type: 'string', optional: false }
          ],
          returnType: 'Promise<any[]>',
          isAsync: true
        },
        {
          name: 'createTransaction',
          parameters: [{ name: 'transaction', type: 'any', optional: false }],
          returnType: 'Promise<any>',
          isAsync: true
        },
        {
          name: 'createTransactions',
          parameters: [{ name: 'transactions', type: 'any[]', optional: false }],
          returnType: 'Promise<any[]>',
          isAsync: true
        },
        {
          name: 'createMultipleTransactions',
          parameters: [{ name: 'transactions', type: 'any[]', optional: false }],
          returnType: 'Promise<any[]>',
          isAsync: true
        },
        {
          name: 'updateTransaction',
          parameters: [{ name: 'transaction', type: 'any', optional: false }],
          returnType: 'Promise<any>',
          isAsync: true
        },
        {
          name: 'updateTransferTransaction',
          parameters: [{ name: 'transaction', type: 'any', optional: false }],
          returnType: 'Promise<any>',
          isAsync: true
        },
        {
          name: 'deleteTransaction',
          parameters: [
            { name: 'id', type: 'string', optional: false },
            { name: 'userId', type: 'string', optional: false }
          ],
          returnType: 'Promise<any>',
          isAsync: true
        },
        {
          name: 'restoreTransaction',
          parameters: [
            { name: 'id', type: 'string', optional: false },
            { name: 'userId', type: 'string', optional: false }
          ],
          returnType: 'Promise<any>',
          isAsync: true
        }
      ],
      transactionCategories: [
        {
          name: 'getAllTransactionCategories',
          parameters: [{ name: 'tenantId', type: 'string', optional: false }],
          returnType: 'Promise<any[]>',
          isAsync: true
        },
        {
          name: 'getTransactionCategoryById',
          parameters: [
            { name: 'id', type: 'string', optional: false },
            { name: 'tenantId', type: 'string', optional: false }
          ],
          returnType: 'Promise<any | null>',
          isAsync: true
        },
        {
          name: 'createTransactionCategory',
          parameters: [{ name: 'category', type: 'any', optional: false }],
          returnType: 'Promise<any>',
          isAsync: true
        },
        {
          name: 'updateTransactionCategory',
          parameters: [{ name: 'category', type: 'any', optional: false }],
          returnType: 'Promise<any>',
          isAsync: true
        },
        {
          name: 'deleteTransactionCategory',
          parameters: [
            { name: 'id', type: 'string', optional: false },
            { name: 'userId', type: 'string', optional: true }
          ],
          returnType: 'Promise<any>',
          isAsync: true
        },
        {
          name: 'restoreTransactionCategory',
          parameters: [
            { name: 'id', type: 'string', optional: false },
            { name: 'userId', type: 'string', optional: true }
          ],
          returnType: 'Promise<any>',
          isAsync: true
        }
      ],
      transactionGroups: [
        {
          name: 'getAllTransactionGroups',
          parameters: [{ name: 'tenantId', type: 'string', optional: false }],
          returnType: 'Promise<any[]>',
          isAsync: true
        },
        {
          name: 'getTransactionGroupById',
          parameters: [
            { name: 'id', type: 'string', optional: false },
            { name: 'tenantId', type: 'string', optional: false }
          ],
          returnType: 'Promise<any | null>',
          isAsync: true
        },
        {
          name: 'createTransactionGroup',
          parameters: [{ name: 'group', type: 'any', optional: false }],
          returnType: 'Promise<any>',
          isAsync: true
        },
        {
          name: 'updateTransactionGroup',
          parameters: [{ name: 'group', type: 'any', optional: false }],
          returnType: 'Promise<any>',
          isAsync: true
        },
        {
          name: 'deleteTransactionGroup',
          parameters: [
            { name: 'id', type: 'string', optional: false },
            { name: 'userId', type: 'string', optional: true }
          ],
          returnType: 'Promise<any>',
          isAsync: true
        },
        {
          name: 'restoreTransactionGroup',
          parameters: [
            { name: 'id', type: 'string', optional: false },
            { name: 'userId', type: 'string', optional: true }
          ],
          returnType: 'Promise<any>',
          isAsync: true
        }
      ],
      configurations: [
        {
          name: 'getAllConfigurations',
          parameters: [{ name: 'tenantId', type: 'string', optional: false }],
          returnType: 'Promise<any[]>',
          isAsync: true
        },
        {
          name: 'getConfigurationById',
          parameters: [
            { name: 'id', type: 'string', optional: false },
            { name: 'tenantId', type: 'string', optional: false }
          ],
          returnType: 'Promise<any | null>',
          isAsync: true
        },
        {
          name: 'getConfiguration',
          parameters: [
            { name: 'table', type: 'string', optional: false },
            { name: 'type', type: 'string', optional: false },
            { name: 'key', type: 'string', optional: false },
            { name: 'tenantId', type: 'string', optional: false }
          ],
          returnType: 'Promise<any | null>',
          isAsync: true
        },
        {
          name: 'createConfiguration',
          parameters: [{ name: 'config', type: 'any', optional: false }],
          returnType: 'Promise<any>',
          isAsync: true
        },
        {
          name: 'updateConfiguration',
          parameters: [{ name: 'config', type: 'any', optional: false }],
          returnType: 'Promise<any>',
          isAsync: true
        },
        {
          name: 'deleteConfiguration',
          parameters: [
            { name: 'id', type: 'string', optional: false },
            { name: 'userId', type: 'string', optional: true }
          ],
          returnType: 'Promise<any>',
          isAsync: true
        },
        {
          name: 'restoreConfiguration',
          parameters: [
            { name: 'id', type: 'string', optional: false },
            { name: 'userId', type: 'string', optional: true }
          ],
          returnType: 'Promise<any>',
          isAsync: true
        }
      ],
      recurrings: [
        {
          name: 'listRecurrings',
          parameters: [{ name: 'params', type: '{ tenantId: string; filters?: any }', optional: false }],
          returnType: 'Promise<any[]>',
          isAsync: true
        },
        {
          name: 'getRecurringById',
          parameters: [
            { name: 'id', type: 'string', optional: false },
            { name: 'tenantId', type: 'string', optional: false }
          ],
          returnType: 'Promise<any | null>',
          isAsync: true
        },
        {
          name: 'createRecurring',
          parameters: [
            { name: 'recurringData', type: 'any', optional: false },
            { name: 'tenantId', type: 'string', optional: false }
          ],
          returnType: 'Promise<any>',
          isAsync: true
        },
        {
          name: 'updateRecurring',
          parameters: [
            { name: 'id', type: 'string', optional: false },
            { name: 'recurringData', type: 'any', optional: false },
            { name: 'tenantId', type: 'string', optional: false }
          ],
          returnType: 'Promise<any>',
          isAsync: true
        },
        {
          name: 'deleteRecurring',
          parameters: [
            { name: 'id', type: 'string', optional: false },
            { name: 'tenantId', type: 'string', optional: false },
            { name: 'userId', type: 'string', optional: true }
          ],
          returnType: 'Promise<any>',
          isAsync: true
        }
      ],
      stats: [
        {
          name: 'getStatsDailyTransactions',
          parameters: [
            { name: 'tenantId', type: 'string', optional: false },
            { name: 'startDate', type: 'string', optional: true },
            { name: 'endDate', type: 'string', optional: true },
            { name: 'type', type: 'any', optional: true }
          ],
          returnType: 'Promise<any>',
          isAsync: true
        },
        {
          name: 'getStatsMonthlyTransactionsTypes',
          parameters: [
            { name: 'tenantId', type: 'string', optional: false },
            { name: 'startDate', type: 'string', optional: true },
            { name: 'endDate', type: 'string', optional: true }
          ],
          returnType: 'Promise<any>',
          isAsync: true
        },
        {
          name: 'getStatsMonthlyCategoriesTransactions',
          parameters: [
            { name: 'tenantId', type: 'string', optional: false },
            { name: 'startDate', type: 'string', optional: true },
            { name: 'endDate', type: 'string', optional: true }
          ],
          returnType: 'Promise<any>',
          isAsync: true
        },
        {
          name: 'getStatsMonthlyAccountsTransactions',
          parameters: [
            { name: 'tenantId', type: 'string', optional: false },
            { name: 'startDate', type: 'string', optional: true },
            { name: 'endDate', type: 'string', optional: true }
          ],
          returnType: 'Promise<any>',
          isAsync: true
        },
        {
          name: 'getStatsNetWorthGrowth',
          parameters: [
            { name: 'tenantId', type: 'string', optional: false },
            { name: 'startDate', type: 'string', optional: true },
            { name: 'endDate', type: 'string', optional: true }
          ],
          returnType: 'Promise<any>',
          isAsync: true
        }
      ]
    };
  }

  /**
   * Generate a detailed compliance report
   */
  generateComplianceReport(reports: InterfaceComplianceReport[]): string {
    let report = '# Interface Compliance Report\n\n';
    report += `Generated: ${new Date().toISOString()}\n\n`;

    // Summary section
    report += '## Summary\n\n';
    for (const modeReport of reports) {
      const complianceRate = (modeReport.summary.compliantInterfaces / modeReport.summary.totalInterfaces) * 100;
      report += `### ${modeReport.mode.toUpperCase()} Mode\n`;
      report += `- Total Interfaces: ${modeReport.summary.totalInterfaces}\n`;
      report += `- Compliant: ${modeReport.summary.compliantInterfaces}\n`;
      report += `- Non-Compliant: ${modeReport.summary.nonCompliantInterfaces}\n`;
      report += `- Compliance Rate: ${complianceRate.toFixed(1)}%\n\n`;
    }

    // Detailed results
    report += '## Detailed Results\n\n';
    const entityTypes = Object.keys(this.expectedInterfaces) as EntityType[];
    
    for (const entityType of entityTypes) {
      report += `### ${entityType}\n\n`;
      report += '| Mode | Status | Missing Methods | Extra Methods |\n';
      report += '|------|--------|----------------|---------------|\n';
      
      for (const modeReport of reports) {
        const result = modeReport.results.find(r => r.entityType === entityType);
        if (result) {
          const status = result.isCompliant ? '✅ Compliant' : '❌ Non-Compliant';
          const missing = result.missingMethods.length > 0 ? result.missingMethods.join(', ') : 'None';
          const extra = result.extraMethods.length > 0 ? result.extraMethods.join(', ') : 'None';
          
          report += `| ${modeReport.mode} | ${status} | ${missing} | ${extra} |\n`;
        }
      }
      report += '\n';
    }

    // Violations section
    const hasViolations = reports.some(r => r.violations.length > 0);
    if (hasViolations) {
      report += '## Violations\n\n';
      for (const modeReport of reports) {
        if (modeReport.violations.length > 0) {
          report += `### ${modeReport.mode.toUpperCase()} Mode Violations\n\n`;
          for (const violation of modeReport.violations) {
            report += `- **${violation.entityType}.${violation.method}** (${violation.violationType}): ${violation.details}\n`;
          }
          report += '\n';
        }
      }
    }

    return report;
  }
}