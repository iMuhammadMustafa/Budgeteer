import { db, LocalAccountCategory } from './BudgeteerDatabase';
// Account Categories local storage provider
import { AccountCategory, Inserts, Updates } from '@/src/types/db/Tables.Types';
import { TableNames } from '@/src/types/db/TableNames';
import dayjs from 'dayjs';
import { v4 as uuidv4 } from 'uuid';

export const getAllAccountCategories = async (tenantId: string): Promise<AccountCategory[]> => {
  try {
    const categories = await db.accountcategories
      .where('tenantid')
      .equals(tenantId)
      .and(category => !category.isdeleted)
      .orderBy('displayorder')
      .reverse()
      .toArray();

    return categories as AccountCategory[];
  } catch (error) {
    throw new Error(`Failed to get account categories: ${error}`);
  }
};

export const getAccountCategoryById = async (id: string, tenantId: string): Promise<AccountCategory | null> => {
  try {
    const category = await db.accountcategories
      .where('id')
      .equals(id)
      .and(category => category.tenantid === tenantId && !category.isdeleted)
      .first();

    return category as AccountCategory || null;
  } catch (error) {
    throw new Error(`Failed to get account category by id: ${error}`);
  }
};

export const createAccountCategory = async (category: Inserts<TableNames.AccountCategories>) => {
  try {
    const newCategory: LocalAccountCategory = {
      id: category.id || uuidv4(),
      tenantid: category.tenantid || '',
      name: category.name,
      type: category.type || 'Asset',
      color: category.color || '#000000',
      icon: category.icon || 'folder',
      displayorder: category.displayorder || 0,
      isdeleted: category.isdeleted || false,
      createdat: category.createdat || new Date().toISOString(),
      createdby: category.createdby || null,
      updatedat: category.updatedat || new Date().toISOString(),
      updatedby: category.updatedby || null
    };

    await db.accountcategories.add(newCategory);
    return newCategory;
  } catch (error) {
    throw new Error(`Failed to create account category: ${error}`);
  }
};

export const updateAccountCategory = async (category: Updates<TableNames.AccountCategories>) => {
  try {
    if (!category.id) {
      throw new Error('Account category ID is required for update');
    }

    const updateData = {
      ...category,
      updatedat: new Date().toISOString()
    };

    await db.accountcategories.update(category.id, updateData);
    
    const updatedCategory = await db.accountcategories.get(category.id);
    return updatedCategory;
  } catch (error) {
    throw new Error(`Failed to update account category: ${error}`);
  }
};

export const deleteAccountCategory = async (id: string, userId?: string) => {
  try {
    const updateData = {
      isdeleted: true,
      updatedby: userId || null,
      updatedat: dayjs().format("YYYY-MM-DDTHH:mm:ssZ")
    };

    await db.accountcategories.update(id, updateData);
    
    const deletedCategory = await db.accountcategories.get(id);
    return deletedCategory;
  } catch (error) {
    throw new Error(`Failed to delete account category: ${error}`);
  }
};

export const restoreAccountCategory = async (id: string, userId?: string) => {
  try {
    const updateData = {
      isdeleted: false,
      updatedby: userId || null,
      updatedat: dayjs().format("YYYY-MM-DDTHH:mm:ssZ")
    };

    await db.accountcategories.update(id, updateData);
    
    const restoredCategory = await db.accountcategories.get(id);
    return restoredCategory;
  } catch (error) {
    throw new Error(`Failed to restore account category: ${error}`);
  }
};