import { useMutation, useQuery } from "@tanstack/react-query";
import { Session } from "@supabase/supabase-js";
import dayjs from "dayjs";
import { queryClient } from "@/src/providers/QueryProvider";
import { useAuth } from "@/src/providers/AuthProvider";
import { useStorageMode } from "@/src/providers/StorageModeProvider";
import { TableNames } from "@/src/types/db/TableNames";
import GenerateUuid from "@/src/utils/UUID.Helper";
import {
  CreateTransferRequest,
  CreateCreditCardPaymentRequest,
  ExecutionOverrides,
  ExecutionPreview,
  RecurringFilters,
  AutoApplyStatus,
  ApplyResult,
} from "@/src/types/recurring";
import {
  validateTransferRecurring,
  validateCreditCardPaymentRecurring,
  validateRecurring,
  validateExecutionContext,
} from "@/src/utils/recurring-validation";
import { calculateNextOccurrence } from "@/src/utils/interval-calculation";
import { CreditCardPaymentService } from "./CreditCardPaymentService";
import { Recurring } from "../database/models";
import { RecurringInsert, RecurringUpdate } from "../types/db/sqllite/schema";

// Helper function to convert snake_case fields to camelCase for validation
function convertToValidationFormat(data: any): any {
  return {
    ...data,
    intervalmonths: data.interval_months || data.intervalmonths,
    recurringtype: data.recurring_type || data.recurringtype,
    autoapplyenabled: data.auto_apply_enabled || data.autoapplyenabled,
    isamountflexible: data.is_amount_flexible || data.isamountflexible,
    isdateflexible: data.is_date_flexible || data.isdateflexible,
    transferaccountid: data.transfer_account_id || data.transferaccountid,
  };
}

export interface IRecurringService {
  // CRUD operations
  create: () => ReturnType<typeof useMutation<Recurring, Error, RecurringInsert>>;
  update: () => ReturnType<typeof useMutation<Recurring | null, Error, { id: string; updates: RecurringUpdate }>>;
  delete: () => ReturnType<typeof useMutation<void, Error, { id: string }>>;
  findAll: (filters?: RecurringFilters) => ReturnType<typeof useQuery<Recurring[]>>;
  findById: (id?: string) => ReturnType<typeof useQuery<Recurring | null>>;

  // Specialized creation methods
  createRecurringTransfer: () => ReturnType<typeof useMutation<Recurring, Error, CreateTransferRequest>>;
  createCreditCardPayment: () => ReturnType<typeof useMutation<Recurring, Error, CreateCreditCardPaymentRequest>>;

  // Execution methods
  executeRecurring: () => ReturnType<
    typeof useMutation<ApplyResult, Error, { id: string; overrides?: ExecutionOverrides }>
  >;
  previewExecution: (id?: string) => ReturnType<typeof useQuery<ExecutionPreview | null>>;

  // Auto-apply management
  toggleAutoApply: () => ReturnType<typeof useMutation<void, Error, { id: string; enabled: boolean }>>;
  getAutoApplyStatus: () => ReturnType<typeof useQuery<AutoApplyStatus>>;
}

export function useRecurringService(): IRecurringService {
  const { session } = useAuth();
  if (!session) throw new Error("Session not found");
  const tenantId = session?.user?.user_metadata?.tenantid;
  if (!tenantId) throw new Error("Tenant ID not found in session");
  const userId = session?.user?.id;
  const { dbContext } = useStorageMode();
  const recurringRepo = dbContext.RecurringRepository();
  const accountRepo = dbContext.AccountRepository();
  const transactionRepo = dbContext.TransactionRepository();

  const create = () => {
    return useMutation({
      mutationFn: async (data: RecurringInsert) => {
        return await createRecurringHelper(data, session, recurringRepo);
      },
      onSuccess: async () => {
        await queryClient.invalidateQueries({ queryKey: [TableNames.Recurrings] });
      },
      onError: error => {
        console.error("Error creating recurring:", error);
        throw error;
      },
    });
  };

  const update = () => {
    return useMutation({
      mutationFn: async ({ id, updates }: { id: string; updates: RecurringUpdate }) => {
        return await updateRecurringHelper(id, updates, session, recurringRepo);
      },
      onSuccess: async () => {
        await queryClient.invalidateQueries({ queryKey: [TableNames.Recurrings] });
      },
      onError: error => {
        console.error("Error updating recurring:", error);
        throw error;
      },
    });
  };

  const deleteRecurring = () => {
    return useMutation({
      mutationFn: async ({ id }: { id: string }) => {
        return await recurringRepo.softDelete(id, tenantId);
      },
      onSuccess: async () => {
        await queryClient.invalidateQueries({ queryKey: [TableNames.Recurrings] });
      },
      onError: error => {
        console.error("Error deleting recurring:", error);
        throw error;
      },
    });
  };

  const findAll = (filters?: RecurringFilters) => {
    return useQuery<Recurring[]>({
      queryKey: [TableNames.Recurrings, tenantId, filters],
      queryFn: async () => {
        return recurringRepo.findAll(filters || {}, tenantId);
      },
      enabled: !!tenantId,
    });
  };

  const findById = (id?: string) => {
    return useQuery<Recurring | null>({
      queryKey: [TableNames.Recurrings, id, tenantId],
      queryFn: async () => {
        if (!id) throw new Error("ID is required");
        return recurringRepo.findById(id, tenantId);
      },
      enabled: !!id && !!tenantId,
    });
  };

  // Specialized Creation Methods
  const createRecurringTransfer = () => {
    return useMutation({
      mutationFn: async (request: CreateTransferRequest) => {
        return await createRecurringTransferHelper(request, session, recurringRepo, accountRepo);
      },
      onSuccess: async () => {
        await queryClient.invalidateQueries({ queryKey: [TableNames.Recurrings] });
      },
      onError: error => {
        console.error("Error creating recurring transfer:", error);
        throw error;
      },
    });
  };

  const createCreditCardPayment = () => {
    return useMutation({
      mutationFn: async (request: CreateCreditCardPaymentRequest) => {
        return await createCreditCardPaymentHelper(request, session, recurringRepo, accountRepo);
      },
      onSuccess: async () => {
        await queryClient.invalidateQueries({ queryKey: [TableNames.Recurrings] });
      },
      onError: error => {
        console.error("Error creating credit card payment:", error);
        throw error;
      },
    });
  };

  // Execution Methods
  const executeRecurring = () => {
    return useMutation({
      mutationFn: async ({ id, overrides }: { id: string; overrides?: ExecutionOverrides }) => {
        return await executeRecurringHelper(id, overrides, session, recurringRepo, transactionRepo, accountRepo);
      },
      onSuccess: async () => {
        await queryClient.invalidateQueries({ queryKey: [TableNames.Recurrings] });
        await queryClient.invalidateQueries({ queryKey: [TableNames.Transactions] });
        await queryClient.invalidateQueries({ queryKey: [TableNames.Accounts] });
      },
      onError: error => {
        console.error("Error executing recurring:", error);
        throw error;
      },
    });
  };

  const previewExecution = (id?: string) => {
    return useQuery<ExecutionPreview | null>({
      queryKey: [TableNames.Recurrings, "preview", id, tenantId],
      queryFn: async () => {
        if (!id) return null;
        return await previewRecurringExecutionHelper(id, recurringRepo, accountRepo, tenantId);
      },
      enabled: !!id && !!tenantId,
    });
  };

  // Auto-apply Management
  const toggleAutoApply = () => {
    return useMutation({
      mutationFn: async ({ id, enabled }: { id: string; enabled: boolean }) => {
        return await recurringRepo.updateAutoApplyStatus(id, enabled, tenantId);
      },
      onSuccess: async () => {
        await queryClient.invalidateQueries({ queryKey: [TableNames.Recurrings] });
      },
      onError: error => {
        console.error("Error toggling auto-apply:", error);
        throw error;
      },
    });
  };

  const getAutoApplyStatus = () => {
    return useQuery<AutoApplyStatus>({
      queryKey: [TableNames.Recurrings, "auto-apply-status", tenantId],
      queryFn: async () => {
        return await getAutoApplyStatusHelper(recurringRepo, tenantId);
      },
      enabled: !!tenantId,
    });
  };

  return {
    create,
    update,
    delete: deleteRecurring,
    findAll,
    findById,
    createRecurringTransfer,
    createCreditCardPayment,
    executeRecurring,
    previewExecution,
    toggleAutoApply,
    getAutoApplyStatus,
  };
}

// Helper Functions

export const createRecurringHelper = async (
  formData: RecurringInsert,
  session: Session,
  repository: any,
): Promise<Recurring> => {
  const userId = session.user.id;
  const tenantId = session.user.user_metadata.tenantid;

  // Validate the recurring data
  const validationData = convertToValidationFormat(formData);
  const validation = validateRecurring(validationData);
  if (!validation.isValid) {
    throw new Error(`Validation failed: ${validation.errors.map(e => e.message).join(", ")}`);
  }

  const recurringData: RecurringInsert = {
    ...formData,
    id: GenerateUuid(),
    createdat: dayjs().format("YYYY-MM-DDTHH:mm:ssZ"),
    createdby: userId,
    tenantid: tenantId,
    // Set defaults for fields if not provided
    intervalmonths: formData.intervalmonths || 1,
    autoapplyenabled: formData.autoapplyenabled || false,
    isamountflexible: formData.isamountflexible || false,
    isdateflexible: formData.isdateflexible || false,
    recurringtype: formData.recurringtype || RecurringType.Standard,
    failedattempts: 0,
    maxfailedattempts: formData.maxfailedattempts || 3,
  };

  const newEntity = await repository.create(recurringData, tenantId);
  return newEntity;
};

const updateRecurringHelper = async (
  id: string,
  formData: RecurringUpdate,
  session: Session,
  repository: any,
): Promise<Recurring | null> => {
  const userId = session.user.id;
  const tenantId = session.user.user_metadata.tenantid;

  // Get existing recurring to validate the update
  const existing = await repository.findById(id, tenantId);
  if (!existing) {
    throw new Error("Recurring transaction not found");
  }

  // Validate the update
  const merged = { ...existing, ...formData };
  const validationData = convertToValidationFormat(merged);
  const validation = validateRecurring(validationData);
  if (!validation.isValid) {
    throw new Error(`Validation failed: ${validation.errors.map(e => e.message).join(", ")}`);
  }

  const dataToUpdate: RecurringUpdate = {
    ...formData,
    updatedby: userId,
    updatedat: dayjs().format("YYYY-MM-DDTHH:mm:ssZ"),
  };

  const updatedEntity = await repository.update(id, dataToUpdate, tenantId);
  return updatedEntity;
};

export const createRecurringTransferHelper = async (
  request: CreateTransferRequest,
  session: Session,
  repository: any,
  accountRepo: any,
): Promise<Recurring> => {
  const userId = session.user.id;
  const tenantId = session.user.user_metadata.tenantid;

  // Validate transfer-specific requirements
  const validationData = convertToValidationFormat(request);
  const validation = validateTransferRecurring(validationData);
  if (!validation.isValid) {
    throw new Error(`Transfer validation failed: ${validation.errors.map(e => e.message).join(", ")}`);
  }

  // Validate that source and destination accounts exist and belong to user
  const sourceAccount = await accountRepo.findById(request.sourceaccountid, tenantId);
  const destinationAccount = await accountRepo.findById(request.transferaccountid, tenantId);

  if (!sourceAccount) {
    throw new Error("Source account not found or does not belong to user");
  }
  if (!destinationAccount) {
    throw new Error("Destination account not found or does not belong to user");
  }
  if (sourceAccount.id === destinationAccount.id) {
    throw new Error("Source and destination accounts must be different");
  }

  // Create the transfer recurring transaction
  const transferData: RecurringInsert = {
    ...request,
    id: GenerateUuid(),
    type: "Transfer", // Set transaction type to Transfer
    recurringtype: RecurringType.Transfer,
    createdat: dayjs().format("YYYY-MM-DDTHH:mm:ssZ"),
    createdby: userId,
    tenantid: tenantId,
    // Set defaults for fields if not provided
    intervalmonths: request.intervalmonths || 1,
    autoapplyenabled: request.autoapplyenabled || false,
    isamountflexible: request.isamountflexible || false,
    isdateflexible: request.isdateflexible || false,
    failedattempts: 0,
    maxfailedattempts: request.maxfailedattempts || 3,
  };

  const newTransfer = await repository.create(transferData, tenantId);
  return newTransfer;
};

export const createCreditCardPaymentHelper = async (
  request: CreateCreditCardPaymentRequest,
  session: Session,
  repository: any,
  accountRepo: any,
): Promise<Recurring> => {
  const userId = session.user.id;
  const tenantId = session.user.user_metadata.tenantid;

  // Use the dedicated credit card payment service for validation and creation
  const creditCardService = new CreditCardPaymentService(accountRepo, null as any, repository);

  return await creditCardService.createCreditCardPayment(request, tenantId, userId);
};

export const executeRecurringHelper = async (
  id: string,
  overrides: ExecutionOverrides | undefined,
  session: Session,
  recurringRepo: any,
  transactionRepo: any,
  accountRepo: any,
): Promise<ApplyResult> => {
  const userId = session.user.id;
  const tenantId = session.user.user_metadata.tenantid;

  try {
    // Get the recurring transaction
    const recurring = await recurringRepo.findById(id, tenantId);
    if (!recurring) {
      throw new Error("Recurring transaction not found");
    }

    // Validate execution context
    const executionValidation = validateExecutionContext(recurring, overrides?.amount);
    if (!executionValidation.isValid) {
      throw new Error(`Execution validation failed: ${executionValidation.errors.join(", ")}`);
    }

    // Determine execution parameters
    const executionAmount = overrides?.amount ?? recurring.amount;
    const executionDate = overrides?.date ?? dayjs().toISOString();
    const executionDescription = overrides?.description ?? recurring.description;
    const executionNotes = overrides?.notes ?? recurring.notes;

    if (!executionAmount && !recurring.isamountflexible) {
      throw new Error("Amount is required for execution");
    }

    let transactionIds: string[] = [];

    if (recurring.recurringtype === RecurringType.Transfer) {
      // Execute transfer logic
      transactionIds = await executeTransferLogic(
        recurring,
        executionAmount!,
        executionDate,
        executionDescription,
        executionNotes,
        userId,
        tenantId,
        transactionRepo,
        accountRepo,
      );
    } else if (recurring.recurringtype === RecurringType.CreditCardPayment) {
      // Execute credit card payment logic
      await executeCreditCardPaymentLogic(
        recurring,
        executionDate,
        executionDescription,
        executionNotes,
        userId,
        tenantId,
        transactionRepo,
        accountRepo,
      );
      // For credit card payments, we create a single transaction
      // The actual transaction creation is handled in the payment logic
    } else {
      // Execute standard recurring transaction
      const transactionId = await executeStandardRecurringLogic(
        recurring,
        executionAmount!,
        executionDate,
        executionDescription,
        executionNotes,
        userId,
        tenantId,
        transactionRepo,
        accountRepo,
      );
      transactionIds = [transactionId];
    }

    // Update the recurring transaction's next occurrence date and last executed date
    // For flexible date transactions, don't update next occurrence date since they don't follow a schedule
    let updateData: any = {
      lastexecutedat: executionDate,
      lastautoappliedat: dayjs().toISOString(),
      failedattempts: 0, // Reset failed attempts on successful execution
      updatedby: userId,
      updatedat: dayjs().toISOString(),
    };

    // Only update next occurrence date for non-flexible date transactions
    if (!recurring.isdateflexible && recurring.nextoccurrencedate) {
      const nextOccurrenceDate = calculateNextOccurrence(
        new Date(recurring.nextoccurrencedate),
        recurring.intervalmonths,
      );
      updateData.nextoccurrencedate = nextOccurrenceDate.toISOString().split("T")[0]; // Format as YYYY-MM-DD
    }

    await recurringRepo.update(recurring.id, updateData, tenantId);

    return {
      success: true,
      transactionId: transactionIds[0], // Return the first transaction ID
      recurring,
    };
  } catch (error) {
    // Increment failed attempts on error
    try {
      await recurringRepo.incrementFailedAttempts([id]);
    } catch (updateError) {
      console.error("Failed to increment failed attempts:", updateError);
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
      recurring: await recurringRepo.findById(id, tenantId),
    };
  }
};

export const executeTransferLogic = async (
  recurring: Recurring,
  amount: number,
  date: string,
  description: string | null,
  notes: string | null,
  userId: string,
  tenantId: string,
  transactionRepo: any,
  accountRepo: any,
): Promise<string[]> => {
  if (!recurring.transferaccountid) {
    throw new Error("Transfer account ID is required for transfer transactions");
  }

  // Always use absolute value for transfer amounts
  const transferAmount = Math.abs(amount);

  // Validate accounts exist and have sufficient funds if needed
  const sourceAccount = await accountRepo.findById(recurring.sourceaccountid, tenantId);
  const destinationAccount = await accountRepo.findById(recurring.transferaccountid, tenantId);

  if (!sourceAccount || !destinationAccount) {
    throw new Error("Source or destination account not found");
  }

  // Check for sufficient funds (allow overdraft for credit accounts)
  if (sourceAccount.balance < transferAmount && sourceAccount.type !== "Liability") {
    throw new Error("Insufficient funds in source account");
  }

  // Create linked debit and credit transactions
  const debitTransactionId = GenerateUuid();
  const creditTransactionId = GenerateUuid();

  const baseTransactionData = {
    name: recurring.name,
    description: description,
    payee: recurring.payeename,
    notes: notes,
    type: "Transfer",
    categoryid: recurring.categoryid || " ",
    tenantid: tenantId,
    createdby: userId,
    createdat: dayjs().toISOString(),
    updatedby: userId,
    updatedat: dayjs().toISOString(),
    isvoid: false,
    isdeleted: false,
  };

  // Debit transaction (from source account) - minus abs(amount)
  const debitTransaction = {
    ...baseTransactionData,
    id: debitTransactionId,
    accountid: recurring.sourceaccountid,
    transferaccountid: recurring.transferaccountid,
    transferid: creditTransactionId,
    amount: -transferAmount, // Always negative for source account
    date: date,
  };

  // Credit transaction (to destination account) - plus abs(amount)
  const creditTransaction = {
    ...baseTransactionData,
    id: creditTransactionId,
    accountid: recurring.transferaccountid,
    transferaccountid: recurring.sourceaccountid,
    transferid: debitTransactionId,
    amount: transferAmount, // Always positive for destination account
    date: dayjs(date).add(1, "second").toISOString(), // Slightly offset to maintain order
  };

  // Create both transactions atomically
  await transactionRepo.createMultipleTransactions([debitTransaction, creditTransaction]);

  // Update account balances atomically - minus abs(amount) from source, plus abs(amount) to destination
  await accountRepo.updateAccountBalance(recurring.sourceaccountid, -transferAmount, tenantId);
  await accountRepo.updateAccountBalance(recurring.transferaccountid, transferAmount, tenantId);

  return [debitTransactionId, creditTransactionId];
};

const executeCreditCardPaymentLogic = async (
  recurring: Recurring,
  date: string,
  description: string | null,
  notes: string | null,
  userId: string,
  tenantId: string,
  transactionRepo: any,
  accountRepo: any,
): Promise<number> => {
  // Use the dedicated credit card payment service for execution
  const creditCardService = new CreditCardPaymentService(accountRepo, transactionRepo, null as any);

  const result = await creditCardService.executeCreditCardPayment(recurring, tenantId, userId);

  return result.paymentAmount;
};

const executeStandardRecurringLogic = async (
  recurring: Recurring,
  amount: number,
  date: string,
  description: string | null,
  notes: string | null,
  userId: string,
  tenantId: string,
  transactionRepo: any,
  accountRepo: any,
): Promise<string> => {
  // Create a standard transaction
  const transactionId = GenerateUuid();
  const transaction = {
    id: transactionId,
    name: recurring.name,
    description: description,
    amount: amount,
    date: date,
    accountid: recurring.sourceaccountid,
    payee: recurring.payeename,
    notes: notes,
    type: recurring.type,
    categoryid: recurring.categoryid || " ",
    tenantid: tenantId,
    createdby: userId,
    createdat: dayjs().toISOString(),
    updatedby: userId,
    updatedat: dayjs().toISOString(),
    isvoid: false,
    isdeleted: false,
  };

  // Create the transaction
  await transactionRepo.create(transaction, tenantId);

  // Update account balance
  await accountRepo.updateAccountBalance(recurring.sourceaccountid, amount, tenantId);

  return transactionId;
};

const previewRecurringExecutionHelper = async (
  id: string,
  recurringRepo: any,
  accountRepo: any,
  tenantId: string,
): Promise<ExecutionPreview | null> => {
  const recurring = await recurringRepo.findById(id, tenantId);
  if (!recurring) {
    return null;
  }

  const sourceAccount = await accountRepo.findById(recurring.sourceaccountid, tenantId);
  let destinationAccount = null;

  if (recurring.transferaccountid) {
    destinationAccount = await accountRepo.findById(recurring.transferaccountid, tenantId);
  }

  const warnings: string[] = [];
  let estimatedAmount = recurring.amount || 0;
  const estimatedDate = recurring.nextoccurrencedate;

  // Add warnings based on account balances and transaction type
  if (recurring.recurringtype === RecurringType.Transfer) {
    if (sourceAccount && sourceAccount.balance < estimatedAmount && sourceAccount.type !== "Liability") {
      warnings.push("Insufficient funds in source account for transfer");
    }
  } else if (recurring.recurringtype === RecurringType.CreditCardPayment) {
    if (recurring.isamountflexible) {
      warnings.push("Payment amount will be determined by current statement balance");
      estimatedAmount = 0; // Will be calculated at execution time
    }
  }

  if (!recurring.isactive) {
    warnings.push("Recurring transaction is not active");
  }

  if (recurring.failedattempts > 0) {
    warnings.push(
      `Previous execution attempts have failed (${recurring.failedattempts}/${recurring.maxfailedattempts})`,
    );
  }

  return {
    recurring,
    estimatedAmount,
    estimatedDate,
    sourceAccount,
    destinationAccount,
    warnings,
  };
};

const getAutoApplyStatusHelper = async (recurringRepo: any, tenantId: string): Promise<AutoApplyStatus> => {
  const allRecurring = await recurringRepo.findAll({}, tenantId);
  const autoApplyEnabled = await recurringRepo.findByAutoApplyEnabled(tenantId, true);
  const dueTransactions = await recurringRepo.findDueRecurringTransactions(tenantId);

  const failedTransactions = allRecurring.filter((r: Recurring) => r.failedattempts && r.failedattempts > 0);

  return {
    totalRecurring: allRecurring.length,
    autoApplyEnabled: autoApplyEnabled.length,
    dueTransactions: dueTransactions.length,
    failedTransactions: failedTransactions.length,
    lastRunAt: undefined, // This would be set by the auto-apply engine
  };
};
