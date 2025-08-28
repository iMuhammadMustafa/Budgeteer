import { Recurring, CreateCreditCardPaymentRequest, ExecutionPreview } from "@/src/types/recurring";
import { RecurringType, VALIDATION_MESSAGES } from "@/src/types/enums/recurring";
import { Account, Transaction, Inserts } from "@/src/types/db/Tables.Types";
import { TableNames } from "@/src/types/db/TableNames";
import { IAccountRepository, ITransactionRepository, IRecurringRepository } from "@/src/repositories";
import dayjs from "dayjs";
import GenerateUuid from "@/src/utils/UUID.Helper";

/**
 * Service for handling credit card statement payment functionality
 */
export class CreditCardPaymentService {
  constructor(
    private accountRepo: IAccountRepository,
    private transactionRepo: ITransactionRepository,
    private recurringRepo: IRecurringRepository,
  ) {}

  /**
   * Create a credit card payment recurring transaction
   */
  async createCreditCardPayment(
    request: CreateCreditCardPaymentRequest,
    tenantId: string,
    userId: string,
  ): Promise<Recurring> {
    // Validate the request
    await this.validateCreditCardPaymentRequest(request, tenantId);

    // Set up the recurring transaction data
    const recurringData: Inserts<TableNames.Recurrings> = {
      ...request,
      id: GenerateUuid(),
      recurringtype: RecurringType.CreditCardPayment,
      type: "Transfer", // Credit card payments are transfers from source to liability account
      tenantid: tenantId,
      createdby: userId,
      createdat: dayjs().toISOString(),
      // For credit card payments, amount is always flexible and null
      isamountflexible: true,
      amount: null, // Amount is calculated at execution time
      // Set default values for enhanced fields
      intervalmonths: request.intervalmonths ?? 1,
      autoapplyenabled: request.autoapplyenabled ?? false,
      failedattempts: 0,
      maxfailedattempts: request.maxfailedattempts ?? 3,
    };

    return await this.recurringRepo.create(recurringData, tenantId);
  }

  /**
   * Execute a credit card statement payment
   */
  async executeCreditCardPayment(
    recurring: Recurring,
    tenantId: string,
    userId: string,
    overrideAmount?: number,
  ): Promise<{ transactions: Transaction[]; paymentAmount: number }> {
    if (recurring.recurringtype !== RecurringType.CreditCardPayment) {
      throw new Error("Invalid recurring type for credit card payment");
    }

    // Get the liability account (credit card) - this should be the transfer account
    const liabilityAccount = await this.accountRepo.findById(recurring.transferaccountid!, tenantId);
    if (!liabilityAccount) {
      throw new Error("Credit card account not found for payment");
    }

    // Get the source account (payment source)
    const sourceAccount = await this.accountRepo.findById(recurring.sourceaccountid, tenantId);
    if (!sourceAccount) {
      throw new Error("Source account not found for credit card payment");
    }

    // Calculate the payment amount based on current balance
    // For liability accounts, negative balance means debt (money owed)
    // Positive balance means credit (money available)
    const currentBalance = liabilityAccount.balance || 0;
    const paymentAmount = overrideAmount ?? Math.abs(Math.min(currentBalance, 0));

    // Skip payment if balance is positive (credit available) or zero
    if (currentBalance >= 0) {
      console.log(`Credit card payment skipped - account has positive balance: ${currentBalance}`);
      return { transactions: [], paymentAmount: 0 };
    }

    // Check for insufficient funds if needed
    await this.validateSufficientFunds(sourceAccount, paymentAmount, recurring);

    // Create the payment transactions (transfer from source to liability account)
    const transactions = await this.createPaymentTransactions(
      recurring,
      sourceAccount,
      liabilityAccount,
      paymentAmount,
      tenantId,
      userId,
    );

    // Update account balances
    await this.updateAccountBalances(sourceAccount.id, liabilityAccount.id, paymentAmount, tenantId);

    return { transactions, paymentAmount };
  }

  /**
   * Preview a credit card payment execution
   */
  async previewCreditCardPayment(recurring: Recurring, tenantId: string): Promise<ExecutionPreview> {
    if (recurring.recurringtype !== RecurringType.CreditCardPayment) {
      throw new Error("Invalid recurring type for credit card payment preview");
    }

    const liabilityAccount = await this.getLiabilityAccountFromCategory(recurring.categoryid!, tenantId);
    const sourceAccount = await this.accountRepo.findById(recurring.sourceaccountid, tenantId);

    if (!liabilityAccount || !sourceAccount) {
      throw new Error("Required accounts not found for credit card payment preview");
    }

    const estimatedAmount = await this.calculateStatementBalance(liabilityAccount, tenantId);
    const warnings: string[] = [];

    // Check for potential issues
    if (estimatedAmount <= 0) {
      warnings.push("No balance to pay on the credit card");
    }

    if (sourceAccount.balance < estimatedAmount) {
      warnings.push(`Insufficient funds in source account (${sourceAccount.balance} < ${estimatedAmount})`);
    }

    return {
      recurring,
      estimatedAmount,
      estimatedDate: recurring.nextoccurrencedate || dayjs().format("YYYY-MM-DD"),
      sourceAccount,
      destinationAccount: liabilityAccount,
      warnings,
    };
  }

  /**
   * Validate credit card payment request
   */
  private async validateCreditCardPaymentRequest(
    request: CreateCreditCardPaymentRequest,
    tenantId: string,
  ): Promise<void> {
    // Validate source account exists and belongs to tenant
    const sourceAccount = await this.accountRepo.findById(request.sourceaccountid, tenantId);
    if (!sourceAccount) {
      throw new Error(VALIDATION_MESSAGES.SOURCE_ACCOUNT_REQUIRED);
    }

    // Validate category is provided (required for credit card payments)
    if (!request.categoryid) {
      throw new Error("Category is required for credit card payments");
    }

    // Validate transfer account (credit card) exists and belongs to tenant
    if (!request.transferaccountid) {
      throw new Error("Credit card account is required for credit card payments");
    }

    const liabilityAccount = await this.accountRepo.findById(request.transferaccountid, tenantId);
    if (!liabilityAccount) {
      throw new Error("Credit card account not found or does not belong to user");
    }

    // Validate that source and liability accounts are different
    if (sourceAccount.id === liabilityAccount.id) {
      throw new Error("Source account and credit card account must be different");
    }

    // Validate interval months
    const intervalMonths = request.intervalmonths ?? 1;
    if (intervalMonths < 1 || intervalMonths > 24) {
      throw new Error(VALIDATION_MESSAGES.INTERVAL_MONTHS_RANGE);
    }
  }

  /**
   * Get liability account from category
   */
  private async getLiabilityAccountFromCategory(categoryId: string, tenantId: string): Promise<Account | null> {
    // This is a simplified approach - in a real implementation, you might need to:
    // 1. Get the category
    // 2. Check if it's associated with a liability account
    // 3. Return the associated account

    // For now, we'll assume the categoryid directly references the liability account
    // This might need to be adjusted based on your actual data model
    const account = await this.accountRepo.findById(categoryId, tenantId);

    if (account && account.category?.type === "Liability") {
      return account;
    }

    return null;
  }

  /**
   * Calculate current statement balance for a liability account
   * Uses statement date ranges if available, otherwise returns current balance
   */
  private async calculateStatementBalance(liabilityAccount: Account, tenantId: string): Promise<number> {
    // Check if the account has a statement date configured
    const statementDate = (liabilityAccount as any).statementdate;

    if (statementDate) {
      // Calculate statement balance between statement dates
      return await this.calculateStatementBalanceByDate(liabilityAccount, statementDate, tenantId);
    }

    // Fallback to current balance if no statement date is configured
    // For liability accounts, the balance represents the debt
    // A positive balance means money is owed
    // Return the absolute value since we want to pay off the debt
    return Math.abs(liabilityAccount.balance || 0);
  }

  /**
   * Calculate statement balance between statement dates
   */
  private async calculateStatementBalanceByDate(
    liabilityAccount: Account,
    statementDate: number,
    tenantId: string,
  ): Promise<number> {
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    const currentDay = today.getDate();

    // Determine the current statement period
    let statementStartDate: Date;
    let statementEndDate: Date;

    if (currentDay >= statementDate) {
      // We're in the current statement period
      statementStartDate = new Date(currentYear, currentMonth - 1, statementDate);
      statementEndDate = new Date(currentYear, currentMonth, statementDate);
    } else {
      // We're in the previous statement period
      statementStartDate = new Date(currentYear, currentMonth - 2, statementDate);
      statementEndDate = new Date(currentYear, currentMonth - 1, statementDate);
    }

    // Get all transactions for this account within the statement period
    const transactions = await this.getTransactionsInDateRange(
      liabilityAccount.id,
      statementStartDate,
      statementEndDate,
      tenantId,
    );

    // Calculate the statement balance
    // Start with the account balance at the beginning of the statement period
    const balanceAtStatementStart = await this.getAccountBalanceAtDate(
      liabilityAccount.id,
      statementStartDate,
      tenantId,
    );

    // Add all transactions within the statement period
    const transactionTotal = transactions.reduce((sum, transaction) => {
      return sum + (transaction.amount || 0);
    }, 0);

    const statementBalance = balanceAtStatementStart + transactionTotal;

    // Return the absolute value since we want to pay off the debt
    return Math.abs(statementBalance);
  }

  /**
   * Get transactions within a date range for an account
   */
  private async getTransactionsInDateRange(
    accountId: string,
    startDate: Date,
    endDate: Date,
    tenantId: string,
  ): Promise<any[]> {
    return await this.transactionRepo.findByAccountInDateRange(accountId, startDate, endDate, tenantId);
  }

  /**
   * Get account balance at a specific date
   */
  private async getAccountBalanceAtDate(accountId: string, date: Date, tenantId: string): Promise<number> {
    return await this.transactionRepo.getAccountBalanceAtDate(accountId, date, tenantId);
  }

  /**
   * Validate sufficient funds for payment
   */
  private async validateSufficientFunds(
    sourceAccount: Account,
    paymentAmount: number,
    recurring: Recurring,
  ): Promise<void> {
    // For asset accounts, check if balance is sufficient
    if (sourceAccount.category?.type === "Asset" && sourceAccount.balance < paymentAmount) {
      if (recurring.autoapplyenabled) {
        // For auto-apply, we might want to skip or do partial payment
        throw new Error(`Insufficient funds in source account for credit card payment`);
      } else {
        // For manual execution, let user decide
        throw new Error(`Insufficient funds: ${sourceAccount.balance} < ${paymentAmount}`);
      }
    }

    // For liability accounts (credit cards), allow overdraft
    // No validation needed as credit cards can typically handle payments
  }

  /**
   * Create payment transactions (transfer from source to liability account)
   */
  private async createPaymentTransactions(
    recurring: Recurring,
    sourceAccount: Account,
    liabilityAccount: Account,
    paymentAmount: number,
    tenantId: string,
    userId: string,
  ): Promise<Transaction[]> {
    const transactionId = GenerateUuid();
    const transferId = GenerateUuid();
    const currentDate = dayjs().toISOString();

    const transactions: Inserts<TableNames.Transactions>[] = [
      // Debit transaction (decrease source account) - minus abs(amount)
      {
        id: transactionId,
        name: recurring.name || `Credit Card Payment - ${liabilityAccount.name}`,
        description: recurring.description || `Payment to ${liabilityAccount.name}`,
        amount: -Math.abs(paymentAmount), // Always negative for source account
        date: currentDate,
        accountid: sourceAccount.id,
        categoryid: recurring.categoryid!,
        payee: recurring.payeename || liabilityAccount.name,
        notes: recurring.notes,
        type: "Transfer",
        transferaccountid: liabilityAccount.id,
        transferid: transferId,
        tenantid: tenantId,
        createdby: userId,
        createdat: currentDate,
      },
      // Credit transaction (increase liability account) - plus abs(amount)
      {
        id: transferId,
        name: recurring.name || `Credit Card Payment - ${liabilityAccount.name}`,
        description: recurring.description || `Payment from ${sourceAccount.name}`,
        amount: Math.abs(paymentAmount), // Always positive for liability account (reducing debt)
        date: dayjs(currentDate).add(1, "second").toISOString(),
        accountid: liabilityAccount.id,
        categoryid: recurring.categoryid!,
        payee: recurring.payeename || sourceAccount.name,
        notes: recurring.notes,
        type: "Transfer",
        transferaccountid: sourceAccount.id,
        transferid: transactionId,
        tenantid: tenantId,
        createdby: userId,
        createdat: currentDate,
      },
    ];

    return await this.transactionRepo.createMultipleTransactions(transactions);
  }

  /**
   * Update account balances after payment
   */
  private async updateAccountBalances(
    sourceAccountId: string,
    liabilityAccountId: string,
    paymentAmount: number,
    tenantId: string,
  ): Promise<void> {
    // Update source account (decrease balance) - minus abs(amount)
    await this.accountRepo.updateAccountBalance(sourceAccountId, -Math.abs(paymentAmount), tenantId);

    // Update liability account (increase balance, reducing debt) - plus abs(amount)
    await this.accountRepo.updateAccountBalance(liabilityAccountId, Math.abs(paymentAmount), tenantId);
  }

  /**
   * Handle insufficient funds scenarios
   */
  async handleInsufficientFunds(
    recurring: Recurring,
    sourceAccount: Account,
    requiredAmount: number,
    tenantId: string,
  ): Promise<{ action: string; message: string }> {
    const availableAmount = sourceAccount.balance;

    if (recurring.autoapplyenabled) {
      // For auto-apply, skip the payment and reschedule
      return {
        action: "SKIP_AND_RESCHEDULE",
        message: `Insufficient funds for credit card payment (${availableAmount} < ${requiredAmount}). Payment skipped.`,
      };
    } else {
      // For manual execution, provide options
      if (availableAmount > 0) {
        return {
          action: "PARTIAL_PAYMENT_AVAILABLE",
          message: `Insufficient funds for full payment. Partial payment of ${availableAmount} available.`,
        };
      } else {
        return {
          action: "NO_FUNDS_AVAILABLE",
          message: "No funds available for credit card payment.",
        };
      }
    }
  }
}
