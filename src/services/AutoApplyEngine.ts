import dayjs from "dayjs";
import { 
  Recurring, 
  AutoApplyResult, 
  ApplyResult, 
  BatchApplyResult, 
  AutoApplySettings, 
  DEFAULT_AUTO_APPLY_SETTINGS,
  ErrorHandlingResult,
  RecurringValidationError
} from "@/src/types/recurring";
import { RecurringType, AutoApplyAction, RECURRING_CONSTANTS } from "@/src/types/enums/recurring";
import { IRecurringRepository } from "@/src/repositories/interfaces/IRecurringRepository";
import { ITransactionRepository } from "@/src/repositories/interfaces/ITransactionRepository";
import { IAccountRepository } from "@/src/repositories/interfaces/IAccountRepository";
import { Inserts } from "@/src/types/db/Tables.Types";
import { TableNames } from "@/src/types/db/TableNames";
import GenerateUuid from "@/src/utils/UUID.Helper";

/**
 * Interface for the Auto-Apply Engine that handles automatic processing of due recurring transactions
 */
export interface IAutoApplyEngine {
  // Core auto-apply functionality
  checkAndApplyDueTransactions(tenantId: string, userId: string): Promise<AutoApplyResult>;
  getDueRecurringTransactions(tenantId: string, asOfDate?: Date): Promise<Recurring[]>;
  applyRecurringTransaction(recurring: Recurring, tenantId: string, userId: string): Promise<ApplyResult>;
  
  // Batch processing
  batchApplyTransactions(recurrings: Recurring[], tenantId: string, userId: string): Promise<BatchApplyResult>;
  
  // Configuration
  setAutoApplyEnabled(recurringId: string, enabled: boolean, tenantId: string): Promise<void>;
  getAutoApplySettings(): AutoApplySettings;
  updateAutoApplySettings(settings: Partial<AutoApplySettings>): void;
}

/**
 * Auto-Apply Engine implementation for processing due recurring transactions
 */
export class AutoApplyEngine implements IAutoApplyEngine {
  private settings: AutoApplySettings;
  
  constructor(
    private recurringRepo: IRecurringRepository,
    private transactionRepo: ITransactionRepository,
    private accountRepo: IAccountRepository,
    settings?: Partial<AutoApplySettings>
  ) {
    this.settings = { ...DEFAULT_AUTO_APPLY_SETTINGS, ...settings };
  }

  /**
   * Main entry point for checking and applying due recurring transactions
   */
  async checkAndApplyDueTransactions(tenantId: string, userId: string): Promise<AutoApplyResult> {
    try {
      if (!this.settings.globalEnabled) {
        return this.createEmptyResult();
      }

      const dueTransactions = await this.getDueRecurringTransactions(tenantId);
      
      if (dueTransactions.length === 0) {
        return this.createEmptyResult();
      }

      // Filter for auto-apply enabled transactions
      const autoApplyTransactions = dueTransactions.filter(t => t.autoapplyenabled);
      const pendingTransactions = dueTransactions.filter(t => !t.autoapplyenabled);

      let batchResult: BatchApplyResult;
      
      if (autoApplyTransactions.length > 0) {
        batchResult = await this.batchApplyTransactions(autoApplyTransactions, tenantId, userId);
      } else {
        batchResult = {
          results: [],
          summary: this.createEmptyResult()
        };
      }

      // Add pending transactions to the result
      batchResult.summary.pendingCount = pendingTransactions.length;
      batchResult.summary.pendingTransactions = pendingTransactions;

      return batchResult.summary;
    } catch (error) {
      console.error('Error in checkAndApplyDueTransactions:', error);
      throw new Error(`Auto-apply failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get all due recurring transactions for a tenant
   */
  async getDueRecurringTransactions(tenantId: string, asOfDate?: Date): Promise<Recurring[]> {
    const checkDate = asOfDate || new Date();
    return await this.recurringRepo.findDueRecurringTransactions(tenantId, checkDate);
  }

  /**
   * Apply a single recurring transaction
   */
  async applyRecurringTransaction(recurring: Recurring, tenantId: string, userId: string): Promise<ApplyResult> {
    try {
      // Validate the recurring transaction
      const validationResult = this.validateRecurringForExecution(recurring);
      if (!validationResult.isValid) {
        throw new Error(`Validation failed: ${validationResult.errors.map(e => e.message).join(', ')}`);
      }

      // Handle different recurring types
      let transactionIds: string[];
      
      switch (recurring.recurringtype) {
        case RecurringType.Standard:
          transactionIds = await this.applyStandardTransaction(recurring, tenantId, userId);
          break;
        case RecurringType.Transfer:
          transactionIds = await this.applyTransferTransaction(recurring, tenantId, userId);
          break;
        case RecurringType.CreditCardPayment:
          transactionIds = await this.applyCreditCardPayment(recurring, tenantId, userId);
          break;
        default:
          throw new Error(`Unsupported recurring type: ${recurring.recurringtype}`);
      }

      // Update the recurring transaction's next occurrence date
      await this.updateNextOccurrenceDate(recurring);
      
      // Reset failed attempts on success
      if (recurring.failedattempts > 0) {
        await this.recurringRepo.resetFailedAttempts([recurring.id]);
      }

      // Update last auto-applied timestamp
      await this.recurringRepo.update(recurring.id, {
        lastautoappliedat: dayjs().toISOString(),
        updatedby: userId,
        updatedat: dayjs().toISOString()
      });

      return {
        success: true,
        transactionId: transactionIds[0], // Return the primary transaction ID
        recurring
      };
    } catch (error) {
      // Handle the error and update failed attempts
      const errorResult = await this.handleTransactionError(recurring, error as Error);
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        recurring
      };
    }
  }

  /**
   * Apply multiple recurring transactions in batch
   */
  async batchApplyTransactions(recurrings: Recurring[], tenantId: string, userId: string): Promise<BatchApplyResult> {
    const results: ApplyResult[] = [];
    const batchSize = Math.min(recurrings.length, this.settings.maxBatchSize);
    
    // Process in batches to avoid overwhelming the system
    for (let i = 0; i < recurrings.length; i += batchSize) {
      const batch = recurrings.slice(i, i + batchSize);
      
      // Process batch concurrently but with timeout
      const batchPromises = batch.map(recurring => 
        this.applyWithTimeout(recurring, tenantId, userId)
      );
      
      const batchResults = await Promise.allSettled(batchPromises);
      
      // Convert settled results to ApplyResult
      batchResults.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          results.push(result.value);
        } else {
          results.push({
            success: false,
            error: result.reason instanceof Error ? result.reason.message : 'Batch processing failed',
            recurring: batch[index]
          });
        }
      });
    }

    // Generate summary
    const summary = this.generateBatchSummary(results);
    
    return {
      results,
      summary
    };
  }

  /**
   * Set auto-apply enabled status for a recurring transaction
   */
  async setAutoApplyEnabled(recurringId: string, enabled: boolean, tenantId: string): Promise<void> {
    await this.recurringRepo.updateAutoApplyStatus(recurringId, enabled, tenantId);
  }

  /**
   * Get current auto-apply settings
   */
  getAutoApplySettings(): AutoApplySettings {
    return { ...this.settings };
  }

  /**
   * Update auto-apply settings
   */
  updateAutoApplySettings(settings: Partial<AutoApplySettings>): void {
    this.settings = { ...this.settings, ...settings };
  }

  // Private helper methods

  private async applyWithTimeout(recurring: Recurring, tenantId: string, userId: string): Promise<ApplyResult> {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error(`Transaction application timed out after ${this.settings.timeoutMs}ms`));
      }, this.settings.timeoutMs);

      this.applyRecurringTransaction(recurring, tenantId, userId)
        .then(result => {
          clearTimeout(timeout);
          resolve(result);
        })
        .catch(error => {
          clearTimeout(timeout);
          reject(error);
        });
    });
  }

  private validateRecurringForExecution(recurring: Recurring): { isValid: boolean; errors: RecurringValidationError[] } {
    const errors: RecurringValidationError[] = [];

    // Check if recurring is active
    if (!recurring.isactive) {
      errors.push(new RecurringValidationError(
        'isactive',
        'required',
        recurring.isactive,
        'Recurring transaction is not active'
      ));
    }

    // Check if amount is available (for non-flexible amount transactions)
    if (!recurring.isamountflexible && (!recurring.amount || recurring.amount <= 0)) {
      errors.push(new RecurringValidationError(
        'amount',
        'required',
        recurring.amount,
        'Amount is required for non-flexible recurring transactions'
      ));
    }

    // Check if source account exists
    if (!recurring.sourceaccountid) {
      errors.push(new RecurringValidationError(
        'sourceaccountid',
        'required',
        recurring.sourceaccountid,
        'Source account is required'
      ));
    }

    // Validate transfer-specific requirements
    if (recurring.recurringtype === RecurringType.Transfer) {
      if (!recurring.transferaccountid) {
        errors.push(new RecurringValidationError(
          'transferaccountid',
          'required',
          recurring.transferaccountid,
          'Transfer account is required for transfer transactions'
        ));
      }
      
      if (recurring.transferaccountid === recurring.sourceaccountid) {
        errors.push(new RecurringValidationError(
          'transferaccountid',
          'mustBeDifferent',
          recurring.transferaccountid,
          'Transfer account must be different from source account'
        ));
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  private async applyStandardTransaction(recurring: Recurring, tenantId: string, userId: string): Promise<string[]> {
    const transactionData: Inserts<TableNames.Transactions> = {
      id: GenerateUuid(),
      name: recurring.name,
      description: recurring.description,
      amount: recurring.amount || 0,
      date: dayjs().toISOString(),
      accountid: recurring.sourceaccountid,
      payee: recurring.payeename,
      notes: recurring.notes,
      type: recurring.type,
      categoryid: recurring.categoryid || '',
      tenantid: tenantId,
      createdby: userId,
      createdat: dayjs().toISOString()
    };

    const transaction = await this.transactionRepo.create(transactionData, tenantId);
    
    if (!transaction) {
      throw new Error('Failed to create transaction');
    }

    // Update account balance
    await this.accountRepo.updateAccountBalance(recurring.sourceaccountid, recurring.amount || 0, tenantId);

    return [transaction.id];
  }

  private async applyTransferTransaction(recurring: Recurring, tenantId: string, userId: string): Promise<string[]> {
    if (!recurring.transferaccountid) {
      throw new Error('Transfer account ID is required for transfer transactions');
    }

    const primaryId = GenerateUuid();
    const transferId = GenerateUuid();
    const amount = recurring.amount || 0;

    // Create primary transaction (debit from source)
    const primaryTransaction: Inserts<TableNames.Transactions> = {
      id: primaryId,
      transferid: transferId,
      name: recurring.name,
      description: recurring.description,
      amount: amount,
      date: dayjs().toISOString(),
      accountid: recurring.sourceaccountid,
      transferaccountid: recurring.transferaccountid,
      payee: recurring.payeename,
      notes: recurring.notes,
      type: 'Transfer',
      categoryid: recurring.categoryid || '',
      tenantid: tenantId,
      createdby: userId,
      createdat: dayjs().toISOString()
    };

    // Create transfer transaction (credit to destination)
    const transferTransaction: Inserts<TableNames.Transactions> = {
      id: transferId,
      transferid: primaryId,
      name: recurring.name,
      description: recurring.description,
      amount: -amount,
      date: dayjs().add(1, 'second').toISOString(), // Slight offset for ordering
      accountid: recurring.transferaccountid,
      transferaccountid: recurring.sourceaccountid,
      payee: recurring.payeename,
      notes: recurring.notes,
      type: 'Transfer',
      categoryid: recurring.categoryid || '',
      tenantid: tenantId,
      createdby: userId,
      createdat: dayjs().toISOString()
    };

    // Create both transactions
    const transactions = await this.transactionRepo.createMultipleTransactions([primaryTransaction, transferTransaction]);
    
    if (!transactions || transactions.length !== 2) {
      throw new Error('Failed to create transfer transactions');
    }

    // Update both account balances atomically
    await Promise.all([
      this.accountRepo.updateAccountBalance(recurring.sourceaccountid, amount, tenantId),
      this.accountRepo.updateAccountBalance(recurring.transferaccountid, -amount, tenantId)
    ]);

    return [primaryId, transferId];
  }

  private async applyCreditCardPayment(recurring: Recurring, tenantId: string, userId: string): Promise<string[]> {
    // For credit card payments, we need to get the current balance of the liability account
    // This is a simplified implementation - in a real scenario, you'd calculate the statement balance
    
    const liabilityAccount = await this.accountRepo.findById(recurring.categoryid || '', tenantId);
    if (!liabilityAccount) {
      throw new Error('Liability account not found for credit card payment');
    }

    // Skip if no balance to pay
    if (!liabilityAccount.balance || liabilityAccount.balance >= 0) {
      throw new Error('No balance to pay on credit card');
    }

    const paymentAmount = Math.abs(liabilityAccount.balance); // Pay the full balance

    const transactionData: Inserts<TableNames.Transactions> = {
      id: GenerateUuid(),
      name: `${recurring.name} - Statement Payment`,
      description: `Automatic payment of credit card statement balance`,
      amount: paymentAmount,
      date: dayjs().toISOString(),
      accountid: recurring.sourceaccountid,
      payee: recurring.payeename || 'Credit Card Payment',
      notes: `Auto-payment of ${paymentAmount} to ${liabilityAccount.name}`,
      type: 'Expense',
      categoryid: recurring.categoryid || '',
      tenantid: tenantId,
      createdby: userId,
      createdat: dayjs().toISOString()
    };

    const transaction = await this.transactionRepo.create(transactionData, tenantId);
    
    if (!transaction) {
      throw new Error('Failed to create credit card payment transaction');
    }

    // Update both account balances
    await Promise.all([
      this.accountRepo.updateAccountBalance(recurring.sourceaccountid, paymentAmount, tenantId), // Debit source
      this.accountRepo.updateAccountBalance(liabilityAccount.id, -paymentAmount, tenantId) // Credit liability (reduce debt)
    ]);

    return [transaction.id];
  }

  private async updateNextOccurrenceDate(recurring: Recurring): Promise<void> {
    const currentDate = new Date(recurring.nextoccurrencedate);
    const intervalMonths = recurring.intervalmonths || 1;
    
    // Calculate next occurrence using enhanced calculation that handles month-end dates properly
    const { calculateNextOccurrence } = await import('@/src/utils/interval-calculation');
    const nextDate = calculateNextOccurrence(currentDate, intervalMonths);
    
    await this.recurringRepo.updateNextOccurrenceDates([{
      id: recurring.id,
      nextDate: nextDate
    }]);
  }

  private async handleTransactionError(recurring: Recurring, error: Error): Promise<ErrorHandlingResult> {
    // Increment failed attempts
    await this.recurringRepo.incrementFailedAttempts([recurring.id]);
    
    const newFailedAttempts = (recurring.failedattempts || 0) + 1;
    const maxAttempts = recurring.maxfailedattempts || RECURRING_CONSTANTS.FAILED_ATTEMPTS.DEFAULT;
    
    // Check if max attempts reached
    if (newFailedAttempts >= maxAttempts) {
      await this.recurringRepo.updateAutoApplyStatus(recurring.id, false);
      
      return {
        action: AutoApplyAction.DISABLED_AUTO_APPLY,
        message: `Auto-apply disabled due to repeated failures: ${error.message}`
      };
    }
    
    // For insufficient funds, we might want to skip and reschedule
    if (error.message.includes('insufficient funds') || error.message.includes('No balance to pay')) {
      return {
        action: AutoApplyAction.SKIP_AND_RESCHEDULE,
        message: `Insufficient funds - transaction skipped: ${error.message}`
      };
    }
    
    return {
      action: AutoApplyAction.RETRY_LATER,
      message: `Failed attempt ${newFailedAttempts}/${maxAttempts}: ${error.message}`
    };
  }

  private generateBatchSummary(results: ApplyResult[]): AutoApplyResult {
    const successful = results.filter(r => r.success);
    const failed = results.filter(r => !r.success);
    
    return {
      appliedCount: successful.length,
      failedCount: failed.length,
      pendingCount: 0, // Will be set by caller
      appliedTransactions: [], // Would need transaction objects
      failedTransactions: failed.map(f => ({
        recurring: f.recurring,
        error: f.error || 'Unknown error'
      })),
      pendingTransactions: [] // Will be set by caller
    };
  }

  private createEmptyResult(): AutoApplyResult {
    return {
      appliedCount: 0,
      failedCount: 0,
      pendingCount: 0,
      appliedTransactions: [],
      failedTransactions: [],
      pendingTransactions: []
    };
  }
}