import { ITransactionCategoryProvider, ReferentialIntegrityError, StorageError } from '../../storage/types';
import { sqliteDb, LocalTransactionCategory } from './BudgeteerSQLiteDatabase';
import { Database } from '@/src/types/db/database.types';
import { v4 as uuidv4 } from 'uuid';

type TransactionCategoryInsert = Database['public']['Tables']['transactioncategories']['Insert'];
type TransactionCategoryUpdate = Database['public']['Tables']['transactioncategories']['Update'];

export class SQLiteTransactionCategoryProvider implements ITransactionCategoryProvider {
  private get db() {
    return sqliteDb.getDatabase();
  }

  async getAllTransactionCategories(tenantId: string): Promise<LocalTransactionCategory[]> {
    try {
      const categories = await this.db.getAllAsync(
        'SELECT * FROM transactioncategories WHERE tenantid = ? AND isdeleted = 0 ORDER BY displayorder, name',
        [tenantId]
      ) as LocalTransactionCategory[];
      
      return categories;
    } catch (error) {
      console.error('Error getting all transaction categories:', error);
      throw new StorageError('Failed to get transaction categories', 'GET_TRANSACTION_CATEGORIES_ERROR', error);
    }
  }

  async getTransactionCategoryById(id: string, tenantId: string): Promise<LocalTransactionCategory | null> {
    try {
      const category = await this.db.getFirstAsync(
        'SELECT * FROM transactioncategories WHERE id = ? AND tenantid = ? AND isdeleted = 0',
        [id, tenantId]
      ) as LocalTransactionCategory | null;
      
      return category;
    } catch (error) {
      console.error('Error getting transaction category by id:', error);
      throw new StorageError('Failed to get transaction category', 'GET_TRANSACTION_CATEGORY_ERROR', error);
    }
  }

  async createTransactionCategory(categoryData: TransactionCategoryInsert): Promise<LocalTransactionCategory> {
    try {
      // Validate foreign key constraints
      if (categoryData.groupid) {
        const groupExists = await this.db.getFirstAsync(
          'SELECT id FROM transactiongroups WHERE id = ? AND tenantid = ? AND isdeleted = 0',
          [categoryData.groupid, categoryData.tenantid]
        );
        
        if (!groupExists) {
          throw new ReferentialIntegrityError('transactiongroups', 'id', categoryData.groupid);
        }
      }

      const category: LocalTransactionCategory = {
        id: categoryData.id || uuidv4(),
        tenantid: categoryData.tenantid,
        groupid: categoryData.groupid,
        name: categoryData.name || null,
        type: categoryData.type || 'expense',
        color: categoryData.color || '#000000',
        icon: categoryData.icon || 'tag',
        description: categoryData.description || null,
        budgetamount: categoryData.budgetamount || 0,
        budgetfrequency: categoryData.budgetfrequency || 'monthly',
        displayorder: categoryData.displayorder || 0,
        isdeleted: categoryData.isdeleted || false,
        createdat: categoryData.createdat || new Date().toISOString(),
        createdby: categoryData.createdby || null,
        updatedat: categoryData.updatedat || new Date().toISOString(),
        updatedby: categoryData.updatedby || null
      };

      await this.db.runAsync(
        `INSERT INTO transactioncategories (
          id, tenantid, groupid, name, type, color, icon, description, 
          budgetamount, budgetfrequency, displayorder, isdeleted, 
          createdat, createdby, updatedat, updatedby
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          category.id, category.tenantid, category.groupid, category.name,
          category.type, category.color, category.icon, category.description,
          category.budgetamount, category.budgetfrequency, category.displayorder,
          category.isdeleted ? 1 : 0, category.createdat, category.createdby,
          category.updatedat, category.updatedby
        ]
      );

      return category;
    } catch (error) {
      console.error('Error creating transaction category:', error);
      if (error instanceof ReferentialIntegrityError) {
        throw error;
      }
      throw new StorageError('Failed to create transaction category', 'CREATE_TRANSACTION_CATEGORY_ERROR', error);
    }
  }

  async updateTransactionCategory(categoryData: TransactionCategoryUpdate): Promise<LocalTransactionCategory> {
    try {
      if (!categoryData.id) {
        throw new StorageError('Transaction category ID is required for update', 'MISSING_ID_ERROR');
      }

      // Validate foreign key constraints if groupid is being updated
      if (categoryData.groupid) {
        const groupExists = await this.db.getFirstAsync(
          'SELECT id FROM transactiongroups WHERE id = ? AND isdeleted = 0',
          [categoryData.groupid]
        );
        
        if (!groupExists) {
          throw new ReferentialIntegrityError('transactiongroups', 'id', categoryData.groupid);
        }
      }

      // Get current category to merge with updates
      const currentCategory = await this.db.getFirstAsync(
        'SELECT * FROM transactioncategories WHERE id = ?',
        [categoryData.id]
      ) as LocalTransactionCategory;

      if (!currentCategory) {
        throw new StorageError('Transaction category not found', 'TRANSACTION_CATEGORY_NOT_FOUND');
      }

      const updatedCategory: LocalTransactionCategory = {
        ...currentCategory,
        ...categoryData,
        updatedat: new Date().toISOString()
      };

      await this.db.runAsync(
        `UPDATE transactioncategories SET 
          tenantid = ?, groupid = ?, name = ?, type = ?, color = ?, icon = ?, 
          description = ?, budgetamount = ?, budgetfrequency = ?, displayorder = ?, 
          isdeleted = ?, updatedat = ?, updatedby = ?
        WHERE id = ?`,
        [
          updatedCategory.tenantid, updatedCategory.groupid, updatedCategory.name,
          updatedCategory.type, updatedCategory.color, updatedCategory.icon,
          updatedCategory.description, updatedCategory.budgetamount, updatedCategory.budgetfrequency,
          updatedCategory.displayorder, updatedCategory.isdeleted ? 1 : 0,
          updatedCategory.updatedat, updatedCategory.updatedby, updatedCategory.id
        ]
      );

      return updatedCategory;
    } catch (error) {
      console.error('Error updating transaction category:', error);
      if (error instanceof ReferentialIntegrityError || error instanceof StorageError) {
        throw error;
      }
      throw new StorageError('Failed to update transaction category', 'UPDATE_TRANSACTION_CATEGORY_ERROR', error);
    }
  }

  async deleteTransactionCategory(id: string, userId?: string): Promise<LocalTransactionCategory> {
    try {
      const category = await this.db.getFirstAsync(
        'SELECT * FROM transactioncategories WHERE id = ?',
        [id]
      ) as LocalTransactionCategory;

      if (!category) {
        throw new StorageError('Transaction category not found', 'TRANSACTION_CATEGORY_NOT_FOUND');
      }

      const deletedCategory: LocalTransactionCategory = {
        ...category,
        isdeleted: true,
        updatedat: new Date().toISOString(),
        updatedby: userId || null
      };

      await this.db.runAsync(
        'UPDATE transactioncategories SET isdeleted = 1, updatedat = ?, updatedby = ? WHERE id = ?',
        [deletedCategory.updatedat, deletedCategory.updatedby, id]
      );

      return deletedCategory;
    } catch (error) {
      console.error('Error deleting transaction category:', error);
      if (error instanceof StorageError) {
        throw error;
      }
      throw new StorageError('Failed to delete transaction category', 'DELETE_TRANSACTION_CATEGORY_ERROR', error);
    }
  }

  async restoreTransactionCategory(id: string, userId?: string): Promise<LocalTransactionCategory> {
    try {
      const category = await this.db.getFirstAsync(
        'SELECT * FROM transactioncategories WHERE id = ?',
        [id]
      ) as LocalTransactionCategory;

      if (!category) {
        throw new StorageError('Transaction category not found', 'TRANSACTION_CATEGORY_NOT_FOUND');
      }

      const restoredCategory: LocalTransactionCategory = {
        ...category,
        isdeleted: false,
        updatedat: new Date().toISOString(),
        updatedby: userId || null
      };

      await this.db.runAsync(
        'UPDATE transactioncategories SET isdeleted = 0, updatedat = ?, updatedby = ? WHERE id = ?',
        [restoredCategory.updatedat, restoredCategory.updatedby, id]
      );

      return restoredCategory;
    } catch (error) {
      console.error('Error restoring transaction category:', error);
      if (error instanceof StorageError) {
        throw error;
      }
      throw new StorageError('Failed to restore transaction category', 'RESTORE_TRANSACTION_CATEGORY_ERROR', error);
    }
  }
}

export const sqliteTransactionCategoryProvider = new SQLiteTransactionCategoryProvider();