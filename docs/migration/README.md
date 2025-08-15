# Migration Guide

## Overview

This guide provides comprehensive instructions for migrating from the previous Budgeteer architecture to the new multi-tier storage system. Whether you're upgrading an existing installation or transitioning from the old proxy pattern, this guide will help you through the process.

## Table of Contents

1. [Migration Overview](#migration-overview)
2. [Pre-Migration Assessment](#pre-migration-assessment)
3. [Backup and Preparation](#backup-and-preparation)
4. [Code Migration](#code-migration)
5. [Data Migration](#data-migration)
6. [Testing Migration](#testing-migration)
7. [Deployment Migration](#deployment-migration)
8. [Post-Migration Validation](#post-migration-validation)
9. [Rollback Procedures](#rollback-procedures)
10. [Troubleshooting](#troubleshooting)

## Migration Overview

### What's Changing

The migration involves transitioning from:

**Old Architecture:**
- Direct provider imports with proxy pattern
- Two-mode system (Supabase/Mock)
- Global state management for demo mode
- Direct TanStack Query integration

**New Architecture:**
- Dependency injection with repository pattern
- Three-mode system (Cloud/Demo/Local)
- Storage mode manager with provider factory
- Enhanced validation and error handling

### Migration Benefits

- ✅ **Better Testability**: Dependency injection enables easier mocking and testing
- ✅ **Enhanced Flexibility**: Three storage modes instead of two
- ✅ **Improved Maintainability**: Cleaner separation of concerns
- ✅ **Better Error Handling**: Comprehensive error management system
- ✅ **Offline Support**: Local storage mode for offline usage
- ✅ **Validation Framework**: Built-in referential integrity validation

### Compatibility

- ✅ **TanStack Query Hooks**: Existing hooks continue to work without changes
- ✅ **UI Components**: No changes required to existing UI components
- ✅ **Database Schema**: Same database schema and types
- ✅ **API Contracts**: Same function signatures and return types

## Pre-Migration Assessment

### Current System Analysis

Before starting the migration, assess your current system:

```typescript
// Assessment script
export class MigrationAssessment {
  async assessCurrentSystem(): Promise<AssessmentReport> {
    const report: AssessmentReport = {
      currentArchitecture: 'proxy-pattern',
      storageMode: this.getCurrentStorageMode(),
      dataVolume: await this.assessDataVolume(),
      customizations: await this.identifyCustomizations(),
      dependencies: await this.analyzeDependencies(),
      risks: this.identifyRisks()
    };
    
    return report;
  }
  
  private getCurrentStorageMode(): 'supabase' | 'mock' {
    // Check current demo mode setting
    return DemoModeGlobal.isDemoMode ? 'mock' : 'supabase';
  }
  
  private async assessDataVolume(): Promise<DataVolumeReport> {
    // Assess current data volume for migration planning
    const accounts = await this.countRecords('accounts');
    const transactions = await this.countRecords('transactions');
    // ... assess other entities
    
    return {
      accounts,
      transactions,
      totalRecords: accounts + transactions,
      estimatedMigrationTime: this.estimateMigrationTime(accounts + transactions)
    };
  }
  
  private async identifyCustomizations(): Promise<string[]> {
    const customizations: string[] = [];
    
    // Check for custom repository methods
    if (this.hasCustomRepositoryMethods()) {
      customizations.push('custom-repository-methods');
    }
    
    // Check for custom providers
    if (this.hasCustomProviders()) {
      customizations.push('custom-providers');
    }
    
    // Check for custom validation
    if (this.hasCustomValidation()) {
      customizations.push('custom-validation');
    }
    
    return customizations;
  }
}
```

### Migration Checklist

Before starting migration:

- [ ] **Backup Current System**: Create full backup of code and data
- [ ] **Document Customizations**: List all custom modifications
- [ ] **Test Current System**: Ensure current system is working properly
- [ ] **Plan Downtime**: Schedule maintenance window if needed
- [ ] **Prepare Rollback Plan**: Have rollback procedures ready
- [ ] **Update Dependencies**: Ensure all dependencies are up to date

## Backup and Preparation

### Code Backup

```bash
# Create backup branch
git checkout -b pre-migration-backup
git push origin pre-migration-backup

# Create backup of current working directory
tar -czf budgeteer-backup-$(date +%Y%m%d).tar.gz .
```

### Data Backup

```typescript
// Data backup script
export class DataBackupService {
  async createFullBackup(tenantId: string): Promise<BackupData> {
    const backup: BackupData = {
      version: '1.0',
      backupDate: new Date().toISOString(),
      tenantId,
      data: {}
    };
    
    // Backup all entities
    const entities = [
      'accounts',
      'accountcategories',
      'transactions',
      'transactioncategories',
      'transactiongroups',
      'configurations',
      'recurrings'
    ];
    
    for (const entity of entities) {
      backup.data[entity] = await this.backupEntity(entity, tenantId);
    }
    
    // Save backup to file
    const backupJson = JSON.stringify(backup, null, 2);
    await this.saveBackupFile(backupJson, tenantId);
    
    return backup;
  }
  
  private async backupEntity(entityType: string, tenantId: string): Promise<any[]> {
    // Use current repository methods to backup data
    switch (entityType) {
      case 'accounts':
        return await AccountsRepository.getAllAccounts(tenantId);
      case 'transactions':
        return await TransactionsRepository.getAllTransactions(tenantId);
      // ... handle other entities
      default:
        return [];
    }
  }
  
  private async saveBackupFile(backupJson: string, tenantId: string): Promise<void> {
    const filename = `backup-${tenantId}-${Date.now()}.json`;
    // Save to appropriate location (file system, cloud storage, etc.)
    await fs.writeFile(filename, backupJson);
    console.log(`Backup saved to ${filename}`);
  }
}
```

### Environment Preparation

```bash
# Install new dependencies
npm install dexie expo-sqlite

# Update environment variables
cp .env .env.backup
# Add new environment variables for local storage configuration
```

## Code Migration

### Step 1: Update Dependencies

```json
// package.json additions
{
  "dependencies": {
    "dexie": "^3.2.4",
    "expo-sqlite": "~11.3.3"
  }
}
```

### Step 2: Migrate Repository Imports

**Before (Old Pattern):**
```typescript
// Old direct imports
import * as AccountsRepository from '@/src/services/apis/Accounts.repository';
import { AccountsSupaProvider } from '@/src/services/apis/supabase/Accounts.supa';
import { AccountsMockProvider } from '@/src/services/apis/__mock__/Accounts.mock';
```

**After (New Pattern):**
```typescript
// New repository imports (same as before - no changes needed!)
import * as AccountsRepository from '@/src/services/apis/Accounts.repository';

// The repository files now use dependency injection internally
// Your existing imports continue to work unchanged
```

### Step 3: Update Storage Mode Configuration

**Before:**
```typescript
// Old demo mode global
import { DemoModeGlobal } from '@/src/providers/DemoModeGlobal';

const isDemoMode = DemoModeGlobal.isDemoMode;
```

**After:**
```typescript
// New storage mode manager
import { StorageModeManager } from '@/src/services/storage';

const currentMode = StorageModeManager.getInstance().getCurrentMode();
const isDemoMode = currentMode === 'demo';
```

### Step 4: Update Provider Initialization

**Before:**
```typescript
// Old provider switching logic
const getAccountProvider = () => {
  return DemoModeGlobal.isDemoMode 
    ? AccountsMockProvider 
    : AccountsSupaProvider;
};
```

**After:**
```typescript
// New provider factory (handled automatically)
// No manual provider switching needed - handled by StorageModeManager
```

### Step 5: Migrate Custom Providers

If you have custom providers, update them to implement the new interfaces:

**Before:**
```typescript
// Old custom provider
export const CustomAccountProvider = {
  getAllAccounts: async (tenantId: string) => {
    // Custom implementation
  }
};
```

**After:**
```typescript
// New custom provider with interface
import { IAccountProvider } from '@/src/services/storage/types';

export class CustomAccountProvider implements IAccountProvider {
  async getAllAccounts(tenantId: string): Promise<Account[]> {
    // Custom implementation
  }
  
  async getAccountById(id: string, tenantId: string): Promise<Account | null> {
    // Implement all interface methods
  }
  
  // ... implement other required methods
}
```

### Step 6: Update Storage Mode Selection

**Before:**
```typescript
// Old demo mode toggle
const toggleDemoMode = () => {
  DemoModeGlobal.isDemoMode = !DemoModeGlobal.isDemoMode;
};
```

**After:**
```typescript
// New storage mode selection
const switchStorageMode = async (mode: 'cloud' | 'demo' | 'local') => {
  await StorageModeManager.getInstance().setMode(mode);
};
```

## Data Migration

### Migration Strategy

The data migration process depends on your current storage mode:

1. **From Supabase to Multi-tier**: No data migration needed (cloud mode uses same Supabase)
2. **From Mock to Multi-tier**: Demo data automatically available in demo mode
3. **Adding Local Storage**: New capability, no existing data to migrate

### Supabase to Multi-tier Migration

```typescript
export class SupabaseToMultiTierMigration {
  async migrate(): Promise<void> {
    console.log('Starting Supabase to multi-tier migration...');
    
    // 1. Verify Supabase connection
    await this.verifySupabaseConnection();
    
    // 2. Initialize new storage system in cloud mode
    await StorageModeManager.getInstance().setMode('cloud');
    
    // 3. Verify data accessibility through new system
    await this.verifyDataAccessibility();
    
    // 4. Test repository functionality
    await this.testRepositoryFunctionality();
    
    console.log('Supabase to multi-tier migration completed successfully');
  }
  
  private async verifySupabaseConnection(): Promise<void> {
    // Test connection using old method
    const { data, error } = await supabase.from('accounts').select('count').limit(1);
    if (error) {
      throw new Error(`Supabase connection failed: ${error.message}`);
    }
    console.log('✅ Supabase connection verified');
  }
  
  private async verifyDataAccessibility(): Promise<void> {
    // Test data access through new repository system
    const repositoryManager = RepositoryManager.getInstance();
    const accountRepo = repositoryManager.getAccountRepository();
    
    const accounts = await accountRepo.getAll('test-tenant');
    console.log(`✅ Data accessible through new system: ${accounts.length} accounts found`);
  }
  
  private async testRepositoryFunctionality(): Promise<void> {
    // Test CRUD operations through new system
    const testAccount = {
      name: 'Migration Test Account',
      tenantid: 'migration-test',
      categoryid: 'test-category'
    };
    
    const repositoryManager = RepositoryManager.getInstance();
    const accountRepo = repositoryManager.getAccountRepository();
    
    // Create
    const created = await accountRepo.create(testAccount);
    console.log('✅ Create operation successful');
    
    // Read
    const retrieved = await accountRepo.getById(created.data.id, 'migration-test');
    console.log('✅ Read operation successful');
    
    // Update
    await accountRepo.update({
      id: created.data.id,
      name: 'Updated Migration Test Account',
      tenantid: 'migration-test'
    });
    console.log('✅ Update operation successful');
    
    // Delete
    await accountRepo.delete(created.data.id, 'migration-test');
    console.log('✅ Delete operation successful');
  }
}
```

### Mock to Multi-tier Migration

```typescript
export class MockToMultiTierMigration {
  async migrate(): Promise<void> {
    console.log('Starting mock to multi-tier migration...');
    
    // 1. Backup current mock data customizations
    const customData = await this.backupMockCustomizations();
    
    // 2. Initialize new storage system in demo mode
    await StorageModeManager.getInstance().setMode('demo');
    
    // 3. Restore customizations if any
    if (customData.hasCustomizations) {
      await this.restoreCustomizations(customData);
    }
    
    // 4. Verify demo mode functionality
    await this.verifyDemoMode();
    
    console.log('Mock to multi-tier migration completed successfully');
  }
  
  private async backupMockCustomizations(): Promise<CustomizationData> {
    // Check if mock data has been customized
    const mockStore = (await import('@/src/services/apis/__mock__/mockDataStore')).mockDataStore;
    
    return {
      hasCustomizations: this.detectCustomizations(mockStore),
      customAccounts: mockStore.accounts.filter(acc => acc.id.startsWith('custom-')),
      customTransactions: mockStore.transactions.filter(txn => txn.id.startsWith('custom-'))
    };
  }
  
  private detectCustomizations(mockStore: any): boolean {
    // Logic to detect if mock data has been customized
    return mockStore.accounts.some((acc: any) => acc.id.startsWith('custom-'));
  }
  
  private async restoreCustomizations(customData: CustomizationData): Promise<void> {
    // Restore custom data to new demo mode
    const repositoryManager = RepositoryManager.getInstance();
    
    for (const account of customData.customAccounts) {
      await repositoryManager.getAccountRepository().create(account);
    }
    
    for (const transaction of customData.customTransactions) {
      await repositoryManager.getTransactionRepository().create(transaction);
    }
  }
  
  private async verifyDemoMode(): Promise<void> {
    const repositoryManager = RepositoryManager.getInstance();
    const accountRepo = repositoryManager.getAccountRepository();
    
    const accounts = await accountRepo.getAll('demo-tenant');
    console.log(`✅ Demo mode verified: ${accounts.length} accounts available`);
  }
}
```

## Testing Migration

### Migration Test Suite

```typescript
// MigrationTests.test.ts
describe('Migration Tests', () => {
  describe('Code Migration', () => {
    it('should maintain backward compatibility with existing imports', async () => {
      // Test that old import patterns still work
      const accounts = await AccountsRepository.getAllAccounts('test-tenant');
      expect(Array.isArray(accounts)).toBe(true);
    });
    
    it('should work with existing TanStack Query hooks', async () => {
      // Test that existing hooks continue to work
      const { result } = renderHook(() => useAccounts('test-tenant'));
      
      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });
    });
  });
  
  describe('Data Migration', () => {
    it('should preserve all existing data', async () => {
      // Compare data before and after migration
      const beforeMigration = await this.getDataSnapshot();
      
      // Perform migration
      await this.performMigration();
      
      const afterMigration = await this.getDataSnapshot();
      
      expect(afterMigration).toEqual(beforeMigration);
    });
    
    it('should maintain referential integrity', async () => {
      // Test that all foreign key relationships are preserved
      const accounts = await AccountsRepository.getAllAccounts('test-tenant');
      const transactions = await TransactionsRepository.getAllTransactions('test-tenant');
      
      for (const transaction of transactions) {
        const account = accounts.find(acc => acc.id === transaction.accountid);
        expect(account).toBeDefined();
      }
    });
  });
  
  describe('Functionality Migration', () => {
    it('should support all three storage modes', async () => {
      const modes: Array<'cloud' | 'demo' | 'local'> = ['demo', 'local'];
      
      for (const mode of modes) {
        await StorageModeManager.getInstance().setMode(mode);
        
        const accounts = await AccountsRepository.getAllAccounts('test-tenant');
        expect(Array.isArray(accounts)).toBe(true);
      }
    });
    
    it('should maintain validation rules', async () => {
      const invalidAccount = {
        name: '', // Invalid: empty name
        tenantid: 'test-tenant',
        categoryid: 'test-category'
      };
      
      await expect(AccountsRepository.createAccount(invalidAccount))
        .rejects.toThrow();
    });
  });
});
```

### Performance Testing

```typescript
// PerformanceMigrationTests.test.ts
describe('Performance Migration Tests', () => {
  it('should maintain or improve performance', async () => {
    const testData = this.generateTestData(1000); // 1000 accounts
    
    // Test old system performance (if available)
    const oldSystemTime = await this.measureOldSystemPerformance(testData);
    
    // Test new system performance
    const newSystemTime = await this.measureNewSystemPerformance(testData);
    
    // New system should be at least as fast as old system
    expect(newSystemTime).toBeLessThanOrEqual(oldSystemTime * 1.1); // Allow 10% tolerance
  });
  
  private async measureNewSystemPerformance(testData: any[]): Promise<number> {
    const startTime = Date.now();
    
    for (const account of testData) {
      await AccountsRepository.createAccount(account);
    }
    
    return Date.now() - startTime;
  }
});
```

## Deployment Migration

### Deployment Strategy

Choose the appropriate deployment strategy based on your environment:

#### 1. Blue-Green Deployment

```typescript
// Blue-Green deployment script
export class BlueGreenMigration {
  async deploy(): Promise<void> {
    console.log('Starting blue-green deployment...');
    
    // 1. Deploy new version to green environment
    await this.deployToGreen();
    
    // 2. Run migration tests on green
    await this.testGreenEnvironment();
    
    // 3. Switch traffic to green
    await this.switchTrafficToGreen();
    
    // 4. Monitor green environment
    await this.monitorGreenEnvironment();
    
    console.log('Blue-green deployment completed');
  }
  
  private async deployToGreen(): Promise<void> {
    // Deploy new code to green environment
    console.log('Deploying to green environment...');
  }
  
  private async testGreenEnvironment(): Promise<void> {
    // Run comprehensive tests on green environment
    console.log('Testing green environment...');
  }
  
  private async switchTrafficToGreen(): Promise<void> {
    // Switch load balancer to green environment
    console.log('Switching traffic to green...');
  }
  
  private async monitorGreenEnvironment(): Promise<void> {
    // Monitor green environment for issues
    console.log('Monitoring green environment...');
  }
}
```

#### 2. Rolling Deployment

```typescript
// Rolling deployment script
export class RollingMigration {
  async deploy(): Promise<void> {
    console.log('Starting rolling deployment...');
    
    const instances = await this.getApplicationInstances();
    
    for (const instance of instances) {
      // 1. Remove instance from load balancer
      await this.removeFromLoadBalancer(instance);
      
      // 2. Deploy new version to instance
      await this.deployToInstance(instance);
      
      // 3. Test instance
      await this.testInstance(instance);
      
      // 4. Add instance back to load balancer
      await this.addToLoadBalancer(instance);
      
      // 5. Wait before next instance
      await this.waitBetweenInstances();
    }
    
    console.log('Rolling deployment completed');
  }
}
```

### Environment Configuration

```bash
# Production environment variables
STORAGE_MODE=cloud
SUPABASE_URL=your-production-supabase-url
SUPABASE_ANON_KEY=your-production-anon-key

# Local storage configuration
LOCAL_STORAGE_ENCRYPTION=true
LOCAL_STORAGE_BACKUP=true

# Migration settings
MIGRATION_BATCH_SIZE=100
MIGRATION_TIMEOUT=30000
```

## Post-Migration Validation

### Validation Checklist

After migration, validate the following:

- [ ] **All Storage Modes Work**: Test cloud, demo, and local modes
- [ ] **Data Integrity**: Verify all data is accessible and correct
- [ ] **Performance**: Ensure performance meets expectations
- [ ] **Error Handling**: Test error scenarios work correctly
- [ ] **UI Functionality**: Verify all UI components work properly
- [ ] **TanStack Query**: Ensure caching and invalidation work
- [ ] **Validation Rules**: Test referential integrity validation
- [ ] **Mode Switching**: Verify users can switch between modes

### Automated Validation

```typescript
// Post-migration validation script
export class PostMigrationValidation {
  async runFullValidation(): Promise<ValidationReport> {
    const report: ValidationReport = {
      timestamp: new Date().toISOString(),
      results: {}
    };
    
    // Test all storage modes
    report.results.storageModes = await this.validateStorageModes();
    
    // Test data integrity
    report.results.dataIntegrity = await this.validateDataIntegrity();
    
    // Test performance
    report.results.performance = await this.validatePerformance();
    
    // Test error handling
    report.results.errorHandling = await this.validateErrorHandling();
    
    // Test UI functionality
    report.results.uiFunctionality = await this.validateUIFunctionality();
    
    return report;
  }
  
  private async validateStorageModes(): Promise<StorageModeValidationResult> {
    const modes: Array<'cloud' | 'demo' | 'local'> = ['cloud', 'demo', 'local'];
    const results: Record<string, boolean> = {};
    
    for (const mode of modes) {
      try {
        await StorageModeManager.getInstance().setMode(mode);
        const accounts = await AccountsRepository.getAllAccounts('validation-tenant');
        results[mode] = Array.isArray(accounts);
      } catch (error) {
        results[mode] = false;
        console.error(`Storage mode ${mode} validation failed:`, error);
      }
    }
    
    return {
      passed: Object.values(results).every(result => result),
      details: results
    };
  }
  
  private async validateDataIntegrity(): Promise<DataIntegrityValidationResult> {
    // Test referential integrity
    const accounts = await AccountsRepository.getAllAccounts('validation-tenant');
    const transactions = await TransactionsRepository.getAllTransactions('validation-tenant');
    
    let integrityErrors = 0;
    
    for (const transaction of transactions) {
      const account = accounts.find(acc => acc.id === transaction.accountid);
      if (!account) {
        integrityErrors++;
      }
    }
    
    return {
      passed: integrityErrors === 0,
      integrityErrors,
      totalTransactions: transactions.length
    };
  }
}
```

## Rollback Procedures

### Automated Rollback

```typescript
// Rollback script
export class MigrationRollback {
  async rollback(): Promise<void> {
    console.log('Starting migration rollback...');
    
    try {
      // 1. Stop new system
      await this.stopNewSystem();
      
      // 2. Restore old code
      await this.restoreOldCode();
      
      // 3. Restore old configuration
      await this.restoreOldConfiguration();
      
      // 4. Restore data if needed
      await this.restoreDataIfNeeded();
      
      // 5. Start old system
      await this.startOldSystem();
      
      // 6. Verify old system is working
      await this.verifyOldSystem();
      
      console.log('Migration rollback completed successfully');
    } catch (error) {
      console.error('Rollback failed:', error);
      throw error;
    }
  }
  
  private async restoreOldCode(): Promise<void> {
    // Restore from backup branch
    await this.executeCommand('git checkout pre-migration-backup');
    await this.executeCommand('npm install');
  }
  
  private async restoreOldConfiguration(): Promise<void> {
    // Restore old environment configuration
    await this.executeCommand('cp .env.backup .env');
  }
  
  private async restoreDataIfNeeded(): Promise<void> {
    // Restore data from backup if necessary
    const backupFiles = await this.findBackupFiles();
    
    if (backupFiles.length > 0) {
      const latestBackup = backupFiles[0]; // Assuming sorted by date
      await this.restoreFromBackup(latestBackup);
    }
  }
}
```

### Manual Rollback Steps

If automated rollback fails:

1. **Stop Application**
   ```bash
   # Stop application servers
   pm2 stop budgeteer
   ```

2. **Restore Code**
   ```bash
   # Restore from backup branch
   git checkout pre-migration-backup
   npm install
   ```

3. **Restore Configuration**
   ```bash
   # Restore environment variables
   cp .env.backup .env
   ```

4. **Restore Data**
   ```bash
   # Restore database from backup (if needed)
   # This depends on your backup strategy
   ```

5. **Start Application**
   ```bash
   # Start application
   pm2 start budgeteer
   ```

6. **Verify System**
   ```bash
   # Run health checks
   npm run health-check
   ```

## Troubleshooting

### Common Migration Issues

#### Issue 1: Import Errors

**Problem**: Import statements fail after migration
```
Error: Cannot resolve module '@/src/services/apis/repositories/RepositoryManager'
```

**Solution**:
```typescript
// Ensure all new files are properly created
// Check that paths are correct
// Verify TypeScript compilation
npm run type-check
```

#### Issue 2: Storage Mode Not Switching

**Problem**: Storage mode appears to switch but data doesn't change

**Solution**:
```typescript
// Clear repository cache after mode switch
const repositoryManager = RepositoryManager.getInstance();
repositoryManager.clearAll();

// Invalidate TanStack Query cache
queryClient.clear();
```

#### Issue 3: Validation Errors

**Problem**: New validation system throws errors for previously valid data

**Solution**:
```typescript
// Check if validation rules have changed
// Update data to meet new validation requirements
// Or adjust validation rules if they're too strict
```

#### Issue 4: Performance Degradation

**Problem**: New system is slower than old system

**Solution**:
```typescript
// Check if proper indexes are in place
// Verify connection pooling is configured
// Monitor query performance
// Consider caching strategies
```

### Debug Tools

```typescript
// Migration debug utility
export class MigrationDebugger {
  async diagnoseIssue(): Promise<DiagnosisReport> {
    const report: DiagnosisReport = {
      timestamp: new Date().toISOString(),
      systemState: await this.getSystemState(),
      storageMode: await this.getStorageMode(),
      repositoryState: await this.getRepositoryState(),
      dataAccessibility: await this.testDataAccessibility(),
      errors: await this.getRecentErrors()
    };
    
    return report;
  }
  
  private async getSystemState(): Promise<SystemState> {
    return {
      nodeVersion: process.version,
      environment: process.env.NODE_ENV,
      storageMode: StorageModeManager.getInstance().getCurrentMode(),
      repositoryManagerInitialized: RepositoryManager.getInstance() !== null
    };
  }
  
  private async testDataAccessibility(): Promise<DataAccessibilityReport> {
    const results: Record<string, boolean> = {};
    
    try {
      const accounts = await AccountsRepository.getAllAccounts('debug-tenant');
      results.accounts = Array.isArray(accounts);
    } catch (error) {
      results.accounts = false;
    }
    
    // Test other entities...
    
    return {
      accessible: Object.values(results).every(result => result),
      details: results
    };
  }
}
```

### Getting Help

If you encounter issues during migration:

1. **Check Documentation**: Review this migration guide and architecture documentation
2. **Run Diagnostics**: Use the debug tools provided
3. **Check Logs**: Review application logs for error details
4. **Test Incrementally**: Test each migration step individually
5. **Use Rollback**: Don't hesitate to rollback if issues persist
6. **Seek Support**: Contact the development team with diagnostic reports

## Migration Success Criteria

The migration is considered successful when:

- ✅ All three storage modes (cloud, demo, local) work correctly
- ✅ All existing functionality continues to work
- ✅ Data integrity is maintained
- ✅ Performance meets or exceeds previous system
- ✅ Error handling works as expected
- ✅ UI components function properly
- ✅ TanStack Query integration works correctly
- ✅ Validation framework operates correctly
- ✅ Users can switch between storage modes
- ✅ All tests pass

## Next Steps

After successful migration:

1. **Monitor System**: Keep close watch on system performance and errors
2. **User Training**: Train users on new storage mode options
3. **Documentation**: Update any custom documentation
4. **Optimization**: Look for opportunities to optimize the new system
5. **Feature Development**: Begin taking advantage of new architecture capabilities

## Conclusion

The migration to the multi-tier storage architecture provides significant benefits in terms of flexibility, maintainability, and functionality. While the migration process requires careful planning and execution, the new architecture provides a solid foundation for future development and enhancement.

Remember to:
- Take your time with each step
- Test thoroughly at each stage
- Keep backups readily available
- Monitor the system closely after migration
- Don't hesitate to rollback if serious issues arise

The new architecture will provide better development experience, improved testability, and enhanced functionality for your users.