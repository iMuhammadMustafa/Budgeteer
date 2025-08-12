import { ITransactionGroupProvider, StorageError } from '../../storage/types';
import { sqliteDb, LocalTransactionGroup } from './BudgeteerSQLiteDatabase';
import { Database } from '@/src/types/db/database.types';
import { v4 as uuidv4 } from 'uuid';

type TransactionGroupInsert = Database['public']['Tables']['transactiongroups']['Insert'];
type TransactionGroupUpdate = Database['public']['Tables']['transactiongroups']['Update'];

export class SQLiteTransactionGroupProvider implements ITransactionGroupProvider {
  private get db() {
    return sqliteDb.getDatabase();
  }

  async getAllTransactionGroups(tenantId: string): Promise<LocalTransactionGroup[]> {
    try {
      const groups = await this.db.getAllAsync(
        'SELECT * FROM transactiongroups WHERE tenantid = ? AND isdeleted = 0 ORDER BY displayorder, name',
        [tenantId]
      ) as LocalTransactionGroup[];
      
      return groups;
    } catch (error) {
      console.error('Error getting all transaction groups:', error);
      throw new StorageError('Failed to get transaction groups', 'GET_TRANSACTION_GROUPS_ERROR', error);
    }
  }

  async getTransactionGroupById(id: string, tenantId: string): Promise<LocalTransactionGroup | null> {
    try {
      const group = await this.db.getFirstAsync(
        'SELECT * FROM transactiongroups WHERE id = ? AND tenantid = ? AND isdeleted = 0',
        [id, tenantId]
      ) as LocalTransactionGroup | null;
      
      return group;
    } catch (error) {
      console.error('Error getting transaction group by id:', error);
      throw new StorageError('Failed to get transaction group', 'GET_TRANSACTION_GROUP_ERROR', error);
    }
  }

  async createTransactionGroup(groupData: TransactionGroupInsert): Promise<LocalTransactionGroup> {
    try {
      const group: LocalTransactionGroup = {
        id: groupData.id || uuidv4(),
        tenantid: groupData.tenantid || '',
        name: groupData.name,
        type: groupData.type || 'expense',
        color: groupData.color || '#000000',
        icon: groupData.icon || 'folder',
        description: groupData.description || null,
        budgetamount: groupData.budgetamount || 0,
        budgetfrequency: groupData.budgetfrequency || 'monthly',
        displayorder: groupData.displayorder || 0,
        isdeleted: groupData.isdeleted || false,
        createdat: groupData.createdat || new Date().toISOString(),
        createdby: groupData.createdby || null,
        updatedat: groupData.updatedat || new Date().toISOString(),
        updatedby: groupData.updatedby || null
      };

      await this.db.runAsync(
        `INSERT INTO transactiongroups (
          id, tenantid, name, type, color, icon, description, 
          budgetamount, budgetfrequency, displayorder, isdeleted, 
          createdat, createdby, updatedat, updatedby
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          group.id, group.tenantid, group.name, group.type,
          group.color, group.icon, group.description,
          group.budgetamount, group.budgetfrequency, group.displayorder,
          group.isdeleted ? 1 : 0, group.createdat, group.createdby,
          group.updatedat, group.updatedby
        ]
      );

      return group;
    } catch (error) {
      console.error('Error creating transaction group:', error);
      throw new StorageError('Failed to create transaction group', 'CREATE_TRANSACTION_GROUP_ERROR', error);
    }
  }

  async updateTransactionGroup(groupData: TransactionGroupUpdate): Promise<LocalTransactionGroup> {
    try {
      if (!groupData.id) {
        throw new StorageError('Transaction group ID is required for update', 'MISSING_ID_ERROR');
      }

      // Get current group to merge with updates
      const currentGroup = await this.db.getFirstAsync(
        'SELECT * FROM transactiongroups WHERE id = ?',
        [groupData.id]
      ) as LocalTransactionGroup;

      if (!currentGroup) {
        throw new StorageError('Transaction group not found', 'TRANSACTION_GROUP_NOT_FOUND');
      }

      const updatedGroup: LocalTransactionGroup = {
        ...currentGroup,
        ...groupData,
        updatedat: new Date().toISOString()
      };

      await this.db.runAsync(
        `UPDATE transactiongroups SET 
          tenantid = ?, name = ?, type = ?, color = ?, icon = ?, description = ?, 
          budgetamount = ?, budgetfrequency = ?, displayorder = ?, isdeleted = ?, 
          updatedat = ?, updatedby = ?
        WHERE id = ?`,
        [
          updatedGroup.tenantid, updatedGroup.name, updatedGroup.type,
          updatedGroup.color, updatedGroup.icon, updatedGroup.description,
          updatedGroup.budgetamount, updatedGroup.budgetfrequency, updatedGroup.displayorder,
          updatedGroup.isdeleted ? 1 : 0, updatedGroup.updatedat,
          updatedGroup.updatedby, updatedGroup.id
        ]
      );

      return updatedGroup;
    } catch (error) {
      console.error('Error updating transaction group:', error);
      if (error instanceof StorageError) {
        throw error;
      }
      throw new StorageError('Failed to update transaction group', 'UPDATE_TRANSACTION_GROUP_ERROR', error);
    }
  }

  async deleteTransactionGroup(id: string, userId?: string): Promise<LocalTransactionGroup> {
    try {
      const group = await this.db.getFirstAsync(
        'SELECT * FROM transactiongroups WHERE id = ?',
        [id]
      ) as LocalTransactionGroup;

      if (!group) {
        throw new StorageError('Transaction group not found', 'TRANSACTION_GROUP_NOT_FOUND');
      }

      const deletedGroup: LocalTransactionGroup = {
        ...group,
        isdeleted: true,
        updatedat: new Date().toISOString(),
        updatedby: userId || null
      };

      await this.db.runAsync(
        'UPDATE transactiongroups SET isdeleted = 1, updatedat = ?, updatedby = ? WHERE id = ?',
        [deletedGroup.updatedat, deletedGroup.updatedby, id]
      );

      return deletedGroup;
    } catch (error) {
      console.error('Error deleting transaction group:', error);
      if (error instanceof StorageError) {
        throw error;
      }
      throw new StorageError('Failed to delete transaction group', 'DELETE_TRANSACTION_GROUP_ERROR', error);
    }
  }

  async restoreTransactionGroup(id: string, userId?: string): Promise<LocalTransactionGroup> {
    try {
      const group = await this.db.getFirstAsync(
        'SELECT * FROM transactiongroups WHERE id = ?',
        [id]
      ) as LocalTransactionGroup;

      if (!group) {
        throw new StorageError('Transaction group not found', 'TRANSACTION_GROUP_NOT_FOUND');
      }

      const restoredGroup: LocalTransactionGroup = {
        ...group,
        isdeleted: false,
        updatedat: new Date().toISOString(),
        updatedby: userId || null
      };

      await this.db.runAsync(
        'UPDATE transactiongroups SET isdeleted = 0, updatedat = ?, updatedby = ? WHERE id = ?',
        [restoredGroup.updatedat, restoredGroup.updatedby, id]
      );

      return restoredGroup;
    } catch (error) {
      console.error('Error restoring transaction group:', error);
      if (error instanceof StorageError) {
        throw error;
      }
      throw new StorageError('Failed to restore transaction group', 'RESTORE_TRANSACTION_GROUP_ERROR', error);
    }
  }
}

export const sqliteTransactionGroupProvider = new SQLiteTransactionGroupProvider();