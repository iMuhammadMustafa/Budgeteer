import { IAccountCategoryProvider, StorageError, StorageErrorCode } from '../../storage/types';
import { sqliteDb, LocalAccountCategory } from './BudgeteerSQLiteDatabase';
import { Database } from '../../../types/db/database.types';
import { SQLiteErrorMapper } from './SQLiteErrorMapper';
import { v4 as uuidv4 } from 'uuid';

type AccountCategoryInsert = Database['public']['Tables']['accountcategories']['Insert'];
type AccountCategoryUpdate = Database['public']['Tables']['accountcategories']['Update'];

export class SQLiteAccountCategoryProvider implements IAccountCategoryProvider {
  private get db() {
    return sqliteDb.getDatabase();
  }

  async getAllAccountCategories(tenantId: string): Promise<LocalAccountCategory[]> {
    try {
      const categories = await this.db.getAllAsync(
        'SELECT * FROM accountcategories WHERE tenantid = ? AND isdeleted = 0 ORDER BY displayorder, name',
        [tenantId]
      ) as LocalAccountCategory[];
      
      return categories;
    } catch (error) {
      console.error('Error getting all account categories:', error);
      throw SQLiteErrorMapper.mapError(error, 'getAllAccountCategories', 'SELECT');
    }
  }

  async getAccountCategoryById(id: string, tenantId: string): Promise<LocalAccountCategory | null> {
    try {
      const category = await this.db.getFirstAsync(
        'SELECT * FROM accountcategories WHERE id = ? AND tenantid = ? AND isdeleted = 0',
        [id, tenantId]
      ) as LocalAccountCategory | null;
      
      return category;
    } catch (error) {
      console.error('Error getting account category by id:', error);
      throw SQLiteErrorMapper.mapError(error, 'getAccountCategoryById', 'SELECT');
    }
  }

  async createAccountCategory(categoryData: AccountCategoryInsert): Promise<LocalAccountCategory> {
    try {
      // Validate required fields
      if (!categoryData.name) {
        throw new StorageError(
          'Account category name is required',
          StorageErrorCode.MISSING_REQUIRED_FIELD,
          { field: 'name', table: 'accountcategories' }
        );
      }

      const category: LocalAccountCategory = {
        id: categoryData.id || uuidv4(),
        tenantid: categoryData.tenantid || '',
        name: categoryData.name,
        type: categoryData.type || 'asset',
        color: categoryData.color || '#000000',
        icon: categoryData.icon || 'folder',
        displayorder: categoryData.displayorder || 0,
        isdeleted: categoryData.isdeleted || false,
        createdat: categoryData.createdat || new Date().toISOString(),
        createdby: categoryData.createdby || null,
        updatedat: categoryData.updatedat || new Date().toISOString(),
        updatedby: categoryData.updatedby || null
      };

      await this.db.runAsync(
        `INSERT INTO accountcategories (
          id, tenantid, name, type, color, icon, displayorder, 
          isdeleted, createdat, createdby, updatedat, updatedby
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          category.id, category.tenantid, category.name, category.type,
          category.color, category.icon, category.displayorder,
          category.isdeleted ? 1 : 0, category.createdat, category.createdby,
          category.updatedat, category.updatedby
        ]
      );

      return category;
    } catch (error) {
      console.error('Error creating account category:', error);
      if (error instanceof StorageError) {
        throw error;
      }
      throw SQLiteErrorMapper.mapError(error, 'createAccountCategory', 'INSERT');
    }
  }

  async updateAccountCategory(categoryData: AccountCategoryUpdate): Promise<LocalAccountCategory> {
    try {
      if (!categoryData.id) {
        throw new StorageError('Account category ID is required for update', 'MISSING_ID_ERROR');
      }

      // Get current category to merge with updates
      const currentCategory = await this.db.getFirstAsync(
        'SELECT * FROM accountcategories WHERE id = ?',
        [categoryData.id]
      ) as LocalAccountCategory;

      if (!currentCategory) {
        throw new StorageError('Account category not found', 'ACCOUNT_CATEGORY_NOT_FOUND');
      }

      const updatedCategory: LocalAccountCategory = {
        ...currentCategory,
        ...categoryData,
        updatedat: new Date().toISOString()
      };

      await this.db.runAsync(
        `UPDATE accountcategories SET 
          tenantid = ?, name = ?, type = ?, color = ?, icon = ?, 
          displayorder = ?, isdeleted = ?, updatedat = ?, updatedby = ?
        WHERE id = ?`,
        [
          updatedCategory.tenantid, updatedCategory.name, updatedCategory.type,
          updatedCategory.color, updatedCategory.icon, updatedCategory.displayorder,
          updatedCategory.isdeleted ? 1 : 0, updatedCategory.updatedat,
          updatedCategory.updatedby, updatedCategory.id
        ]
      );

      return updatedCategory;
    } catch (error) {
      console.error('Error updating account category:', error);
      if (error instanceof StorageError) {
        throw error;
      }
      throw new StorageError('Failed to update account category', 'UPDATE_ACCOUNT_CATEGORY_ERROR', error);
    }
  }

  async deleteAccountCategory(id: string, userId?: string): Promise<LocalAccountCategory> {
    try {
      const category = await this.db.getFirstAsync(
        'SELECT * FROM accountcategories WHERE id = ?',
        [id]
      ) as LocalAccountCategory;

      if (!category) {
        throw new StorageError('Account category not found', 'ACCOUNT_CATEGORY_NOT_FOUND');
      }

      const deletedCategory: LocalAccountCategory = {
        ...category,
        isdeleted: true,
        updatedat: new Date().toISOString(),
        updatedby: userId || null
      };

      await this.db.runAsync(
        'UPDATE accountcategories SET isdeleted = 1, updatedat = ?, updatedby = ? WHERE id = ?',
        [deletedCategory.updatedat, deletedCategory.updatedby, id]
      );

      return deletedCategory;
    } catch (error) {
      console.error('Error deleting account category:', error);
      if (error instanceof StorageError) {
        throw error;
      }
      throw new StorageError('Failed to delete account category', 'DELETE_ACCOUNT_CATEGORY_ERROR', error);
    }
  }

  async restoreAccountCategory(id: string, userId?: string): Promise<LocalAccountCategory> {
    try {
      const category = await this.db.getFirstAsync(
        'SELECT * FROM accountcategories WHERE id = ?',
        [id]
      ) as LocalAccountCategory;

      if (!category) {
        throw new StorageError('Account category not found', 'ACCOUNT_CATEGORY_NOT_FOUND');
      }

      const restoredCategory: LocalAccountCategory = {
        ...category,
        isdeleted: false,
        updatedat: new Date().toISOString(),
        updatedby: userId || null
      };

      await this.db.runAsync(
        'UPDATE accountcategories SET isdeleted = 0, updatedat = ?, updatedby = ? WHERE id = ?',
        [restoredCategory.updatedat, restoredCategory.updatedby, id]
      );

      return restoredCategory;
    } catch (error) {
      console.error('Error restoring account category:', error);
      if (error instanceof StorageError) {
        throw error;
      }
      throw new StorageError('Failed to restore account category', 'RESTORE_ACCOUNT_CATEGORY_ERROR', error);
    }
  }
}

export const sqliteAccountCategoryProvider = new SQLiteAccountCategoryProvider();