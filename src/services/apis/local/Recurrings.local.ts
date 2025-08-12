import { db, LocalRecurring } from './BudgeteerDatabase';
import { ReferentialIntegrityError } from '../../storage/types';
import { Recurring, Inserts, Updates } from '@/src/types/db/Tables.Types';
import { TableNames } from '@/src/types/db/TableNames';
import dayjs from 'dayjs';
import { v4 as uuidv4 } from 'uuid';

export const getAllRecurrings = async (tenantId: string): Promise<Recurring[]> => {
  try {
    const recurrings = await db.recurrings
      .where('tenantid')
      .equals(tenantId)
      .and(recurring => !recurring.isdeleted)
      .orderBy('nextoccurrencedate')
      .toArray();

    return recurrings as Recurring[];
  } catch (error) {
    throw new Error(`Failed to get recurrings: ${error}`);
  }
};

export const getRecurringById = async (id: string, tenantId: string): Promise<Recurring | null> => {
  try {
    const recurring = await db.recurrings
      .where('id')
      .equals(id)
      .and(recurring => recurring.tenantid === tenantId && !recurring.isdeleted)
      .first();

    return recurring as Recurring || null;
  } catch (error) {
    throw new Error(`Failed to get recurring by id: ${error}`);
  }
};

export const createRecurring = async (recurring: Inserts<TableNames.Recurrings>) => {
  try {
    // Validate foreign key constraints
    if (recurring.sourceaccountid) {
      const accountExists = await db.accounts
        .where('id')
        .equals(recurring.sourceaccountid)
        .count();
      
      if (accountExists === 0) {
        throw new ReferentialIntegrityError('accounts', 'id', recurring.sourceaccountid);
      }
    }

    if (recurring.categoryid) {
      const categoryExists = await db.transactioncategories
        .where('id')
        .equals(recurring.categoryid)
        .count();
      
      if (categoryExists === 0) {
        throw new ReferentialIntegrityError('transactioncategories', 'id', recurring.categoryid);
      }
    }

    const newRecurring: LocalRecurring = {
      id: recurring.id || uuidv4(),
      tenantid: recurring.tenantid,
      sourceaccountid: recurring.sourceaccountid,
      categoryid: recurring.categoryid || null,
      name: recurring.name,
      amount: recurring.amount || null,
      type: recurring.type || 'Expense',
      description: recurring.description || null,
      notes: recurring.notes || null,
      payeename: recurring.payeename || null,
      currencycode: recurring.currencycode || 'USD',
      recurrencerule: recurring.recurrencerule,
      nextoccurrencedate: recurring.nextoccurrencedate,
      enddate: recurring.enddate || null,
      isactive: recurring.isactive || true,
      isdeleted: recurring.isdeleted || false,
      lastexecutedat: recurring.lastexecutedat || null,
      createdat: recurring.createdat || new Date().toISOString(),
      createdby: recurring.createdby || null,
      updatedat: recurring.updatedat || new Date().toISOString(),
      updatedby: recurring.updatedby || null
    };

    await db.recurrings.add(newRecurring);
    return newRecurring;
  } catch (error) {
    throw new Error(`Failed to create recurring: ${error}`);
  }
};

export const updateRecurring = async (recurring: Updates<TableNames.Recurrings>) => {
  try {
    if (!recurring.id) {
      throw new Error('Recurring ID is required for update');
    }

    // Validate foreign key constraints if they are being updated
    if (recurring.sourceaccountid) {
      const accountExists = await db.accounts
        .where('id')
        .equals(recurring.sourceaccountid)
        .count();
      
      if (accountExists === 0) {
        throw new ReferentialIntegrityError('accounts', 'id', recurring.sourceaccountid);
      }
    }

    if (recurring.categoryid) {
      const categoryExists = await db.transactioncategories
        .where('id')
        .equals(recurring.categoryid)
        .count();
      
      if (categoryExists === 0) {
        throw new ReferentialIntegrityError('transactioncategories', 'id', recurring.categoryid);
      }
    }

    const updateData = {
      ...recurring,
      updatedat: new Date().toISOString()
    };

    await db.recurrings.update(recurring.id, updateData);
    
    const updatedRecurring = await db.recurrings.get(recurring.id);
    return updatedRecurring;
  } catch (error) {
    throw new Error(`Failed to update recurring: ${error}`);
  }
};

export const deleteRecurring = async (id: string, userId?: string) => {
  try {
    const updateData = {
      isdeleted: true,
      updatedby: userId || null,
      updatedat: dayjs().format("YYYY-MM-DDTHH:mm:ssZ")
    };

    await db.recurrings.update(id, updateData);
    
    const deletedRecurring = await db.recurrings.get(id);
    return deletedRecurring;
  } catch (error) {
    throw new Error(`Failed to delete recurring: ${error}`);
  }
};

export const restoreRecurring = async (id: string, userId?: string) => {
  try {
    const updateData = {
      isdeleted: false,
      updatedby: userId || null,
      updatedat: dayjs().format("YYYY-MM-DDTHH:mm:ssZ")
    };

    await db.recurrings.update(id, updateData);
    
    const restoredRecurring = await db.recurrings.get(id);
    return restoredRecurring;
  } catch (error) {
    throw new Error(`Failed to restore recurring: ${error}`);
  }
};