import { db, LocalTransactionGroup } from './BudgeteerDatabase';
// Transaction Groups local storage provider
import { TransactionGroup, Inserts, Updates } from '@/src/types/db/Tables.Types';
import { TableNames } from '@/src/types/db/TableNames';
import dayjs from 'dayjs';
import { v4 as uuidv4 } from 'uuid';

export const getAllTransactionGroups = async (tenantId: string): Promise<TransactionGroup[]> => {
  try {
    const groups = await db.transactiongroups
      .where('tenantid')
      .equals(tenantId)
      .and(group => !group.isdeleted)
      .orderBy('displayorder')
      .reverse()
      .toArray();

    return groups as TransactionGroup[];
  } catch (error) {
    throw new Error(`Failed to get transaction groups: ${error}`);
  }
};

export const getTransactionGroupById = async (id: string, tenantId: string): Promise<TransactionGroup | null> => {
  try {
    const group = await db.transactiongroups
      .where('id')
      .equals(id)
      .and(group => group.tenantid === tenantId && !group.isdeleted)
      .first();

    return group as TransactionGroup || null;
  } catch (error) {
    throw new Error(`Failed to get transaction group by id: ${error}`);
  }
};

export const createTransactionGroup = async (group: Inserts<TableNames.TransactionGroups>) => {
  try {
    const newGroup: LocalTransactionGroup = {
      id: group.id || uuidv4(),
      tenantid: group.tenantid || '',
      name: group.name,
      type: group.type || 'Expense',
      color: group.color || '#000000',
      icon: group.icon || 'folder',
      description: group.description || null,
      displayorder: group.displayorder || 0,
      budgetamount: group.budgetamount || 0,
      budgetfrequency: group.budgetfrequency || 'monthly',
      isdeleted: group.isdeleted || false,
      createdat: group.createdat || new Date().toISOString(),
      createdby: group.createdby || null,
      updatedat: group.updatedat || new Date().toISOString(),
      updatedby: group.updatedby || null
    };

    await db.transactiongroups.add(newGroup);
    return newGroup;
  } catch (error) {
    throw new Error(`Failed to create transaction group: ${error}`);
  }
};

export const updateTransactionGroup = async (group: Updates<TableNames.TransactionGroups>) => {
  try {
    if (!group.id) {
      throw new Error('Transaction group ID is required for update');
    }

    const updateData = {
      ...group,
      updatedat: new Date().toISOString()
    };

    await db.transactiongroups.update(group.id, updateData);
    
    const updatedGroup = await db.transactiongroups.get(group.id);
    return updatedGroup;
  } catch (error) {
    throw new Error(`Failed to update transaction group: ${error}`);
  }
};

export const deleteTransactionGroup = async (id: string, userId?: string) => {
  try {
    const updateData = {
      isdeleted: true,
      updatedby: userId || null,
      updatedat: dayjs().format("YYYY-MM-DDTHH:mm:ssZ")
    };

    await db.transactiongroups.update(id, updateData);
    
    const deletedGroup = await db.transactiongroups.get(id);
    return deletedGroup;
  } catch (error) {
    throw new Error(`Failed to delete transaction group: ${error}`);
  }
};

export const restoreTransactionGroup = async (id: string, userId?: string) => {
  try {
    const updateData = {
      isdeleted: false,
      updatedby: userId || null,
      updatedat: dayjs().format("YYYY-MM-DDTHH:mm:ssZ")
    };

    await db.transactiongroups.update(id, updateData);
    
    const restoredGroup = await db.transactiongroups.get(id);
    return restoredGroup;
  } catch (error) {
    throw new Error(`Failed to restore transaction group: ${error}`);
  }
};