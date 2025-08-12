import { db, LocalTransactionCategory } from './BudgeteerDatabase';
import { ReferentialIntegrityError } from '../../storage/types';
import { TransactionCategory, Inserts, Updates } from '@/src/types/db/Tables.Types';
import { TableNames } from '@/src/types/db/TableNames';
import dayjs from 'dayjs';
import { v4 as uuidv4 } from 'uuid';

export const getAllTransactionCategories = async (tenantId: string): Promise<TransactionCategory[]> => {
  try {
    const categories = await db.transactioncategories
      .where('tenantid')
      .equals(tenantId)
      .and(category => !category.isdeleted)
      .orderBy('displayorder')
      .reverse()
      .toArray();

    return categories as TransactionCategory[];
  } catch (error) {
    throw new Error(`Failed to get transaction categories: ${error}`);
  }
};

export const getTransactionCategoryById = async (id: string, tenantId: string): Promise<TransactionCategory | null> => {
  try {
    const category = await db.transactioncategories
      .where('id')
      .equals(id)
      .and(category => category.tenantid === tenantId && !category.isdeleted)
      .first();

    return category as TransactionCategory || null;
  } catch (error) {
    throw new Error(`Failed to get transaction category by id: ${error}`);
  }
};

export const createTransactionCategory = async (category: Inserts<TableNames.TransactionCategories>) => {
  try {
    // Validate foreign key constraint
    if (category.groupid) {
      const groupExists = await db.transactiongroups
        .where('id')
        .equals(category.groupid)
        .count();
      
      if (groupExists === 0) {
        throw new ReferentialIntegrityError('transactiongroups', 'id', category.groupid);
      }
    }

    const newCategory: LocalTransactionCategory = {
      id: category.id || uuidv4(),
      tenantid: category.tenantid,
      groupid: category.groupid,
      name: category.name || null,
      type: category.type || 'Expense',
      color: category.color || '#000000',
      icon: category.icon || 'tag',
      description: category.description || null,
      displayorder: category.displayorder || 0,
      budgetamount: category.budgetamount || 0,
      budgetfrequency: category.budgetfrequency || 'monthly',
      isdeleted: category.isdeleted || false,
      createdat: category.createdat || new Date().toISOString(),
      createdby: category.createdby || null,
      updatedat: category.updatedat || new Date().toISOString(),
      updatedby: category.updatedby || null
    };

    await db.transactioncategories.add(newCategory);
    return newCategory;
  } catch (error) {
    throw new Error(`Failed to create transaction category: ${error}`);
  }
};

export const updateTransactionCategory = async (category: Updates<TableNames.TransactionCategories>) => {
  try {
    if (!category.id) {
      throw new Error('Transaction category ID is required for update');
    }

    // Validate foreign key constraint if groupid is being updated
    if (category.groupid) {
      const groupExists = await db.transactiongroups
        .where('id')
        .equals(category.groupid)
        .count();
      
      if (groupExists === 0) {
        throw new ReferentialIntegrityError('transactiongroups', 'id', category.groupid);
      }
    }

    const updateData = {
      ...category,
      updatedat: new Date().toISOString()
    };

    await db.transactioncategories.update(category.id, updateData);
    
    const updatedCategory = await db.transactioncategories.get(category.id);
    return updatedCategory;
  } catch (error) {
    throw new Error(`Failed to update transaction category: ${error}`);
  }
};

export const deleteTransactionCategory = async (id: string, userId?: string) => {
  try {
    const updateData = {
      isdeleted: true,
      updatedby: userId || null,
      updatedat: dayjs().format("YYYY-MM-DDTHH:mm:ssZ")
    };

    await db.transactioncategories.update(id, updateData);
    
    const deletedCategory = await db.transactioncategories.get(id);
    return deletedCategory;
  } catch (error) {
    throw new Error(`Failed to delete transaction category: ${error}`);
  }
};

export const restoreTransactionCategory = async (id: string, userId?: string) => {
  try {
    const updateData = {
      isdeleted: false,
      updatedby: userId || null,
      updatedat: dayjs().format("YYYY-MM-DDTHH:mm:ssZ")
    };

    await db.transactioncategories.update(id, updateData);
    
    const restoredCategory = await db.transactioncategories.get(id);
    return restoredCategory;
  } catch (error) {
    throw new Error(`Failed to restore transaction category: ${error}`);
  }
};