import { IRecurringProvider, ReferentialIntegrityError, StorageError } from '../../storage/types';
import { sqliteDb, LocalRecurring } from './BudgeteerSQLiteDatabase';
import { Database } from '@/src/types/db/database.types';
import { v4 as uuidv4 } from 'uuid';

type RecurringInsert = Database['public']['Tables']['recurrings']['Insert'];
type RecurringUpdate = Database['public']['Tables']['recurrings']['Update'];

export class SQLiteRecurringProvider implements IRecurringProvider {
  private get db() {
    return sqliteDb.getDatabase();
  }

  async getAllRecurrings(tenantId: string): Promise<LocalRecurring[]> {
    try {
      const recurrings = await this.db.getAllAsync(
        'SELECT * FROM recurrings WHERE tenantid = ? AND isdeleted = 0 ORDER BY nextoccurrencedate, name',
        [tenantId]
      ) as LocalRecurring[];
      
      return recurrings;
    } catch (error) {
      console.error('Error getting all recurrings:', error);
      throw new StorageError('Failed to get recurrings', 'GET_RECURRINGS_ERROR', error);
    }
  }

  async getRecurringById(id: string, tenantId: string): Promise<LocalRecurring | null> {
    try {
      const recurring = await this.db.getFirstAsync(
        'SELECT * FROM recurrings WHERE id = ? AND tenantid = ? AND isdeleted = 0',
        [id, tenantId]
      ) as LocalRecurring | null;
      
      return recurring;
    } catch (error) {
      console.error('Error getting recurring by id:', error);
      throw new StorageError('Failed to get recurring', 'GET_RECURRING_ERROR', error);
    }
  }

  async createRecurring(recurringData: RecurringInsert): Promise<LocalRecurring> {
    try {
      // Validate foreign key constraints
      if (recurringData.sourceaccountid) {
        const accountExists = await this.db.getFirstAsync(
          'SELECT id FROM accounts WHERE id = ? AND tenantid = ? AND isdeleted = 0',
          [recurringData.sourceaccountid, recurringData.tenantid]
        );
        
        if (!accountExists) {
          throw new ReferentialIntegrityError('accounts', 'id', recurringData.sourceaccountid);
        }
      }

      if (recurringData.categoryid) {
        const categoryExists = await this.db.getFirstAsync(
          'SELECT id FROM transactioncategories WHERE id = ? AND tenantid = ? AND isdeleted = 0',
          [recurringData.categoryid, recurringData.tenantid]
        );
        
        if (!categoryExists) {
          throw new ReferentialIntegrityError('transactioncategories', 'id', recurringData.categoryid);
        }
      }

      const recurring: LocalRecurring = {
        id: recurringData.id || uuidv4(),
        tenantid: recurringData.tenantid,
        sourceaccountid: recurringData.sourceaccountid,
        categoryid: recurringData.categoryid || null,
        name: recurringData.name,
        type: recurringData.type || 'expense',
        amount: recurringData.amount || null,
        currencycode: recurringData.currencycode || 'USD',
        description: recurringData.description || null,
        notes: recurringData.notes || null,
        payeename: recurringData.payeename || null,
        recurrencerule: recurringData.recurrencerule,
        nextoccurrencedate: recurringData.nextoccurrencedate,
        enddate: recurringData.enddate || null,
        isactive: recurringData.isactive ?? true,
        isdeleted: recurringData.isdeleted ?? false,
        lastexecutedat: recurringData.lastexecutedat || null,
        createdat: recurringData.createdat || new Date().toISOString(),
        createdby: recurringData.createdby || null,
        updatedat: recurringData.updatedat || new Date().toISOString(),
        updatedby: recurringData.updatedby || null
      };

      await this.db.runAsync(
        `INSERT INTO recurrings (
          id, tenantid, sourceaccountid, categoryid, name, type, amount, 
          currencycode, description, notes, payeename, recurrencerule, 
          nextoccurrencedate, enddate, isactive, isdeleted, lastexecutedat, 
          createdat, createdby, updatedat, updatedby
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          recurring.id, recurring.tenantid, recurring.sourceaccountid, recurring.categoryid,
          recurring.name, recurring.type, recurring.amount, recurring.currencycode,
          recurring.description, recurring.notes, recurring.payeename, recurring.recurrencerule,
          recurring.nextoccurrencedate, recurring.enddate, recurring.isactive ? 1 : 0,
          recurring.isdeleted ? 1 : 0, recurring.lastexecutedat, recurring.createdat,
          recurring.createdby, recurring.updatedat, recurring.updatedby
        ]
      );

      return recurring;
    } catch (error) {
      console.error('Error creating recurring:', error);
      if (error instanceof ReferentialIntegrityError) {
        throw error;
      }
      throw new StorageError('Failed to create recurring', 'CREATE_RECURRING_ERROR', error);
    }
  }

  async updateRecurring(recurringData: RecurringUpdate): Promise<LocalRecurring> {
    try {
      if (!recurringData.id) {
        throw new StorageError('Recurring ID is required for update', 'MISSING_ID_ERROR');
      }

      // Validate foreign key constraints if they are being updated
      if (recurringData.sourceaccountid) {
        const accountExists = await this.db.getFirstAsync(
          'SELECT id FROM accounts WHERE id = ? AND isdeleted = 0',
          [recurringData.sourceaccountid]
        );
        
        if (!accountExists) {
          throw new ReferentialIntegrityError('accounts', 'id', recurringData.sourceaccountid);
        }
      }

      if (recurringData.categoryid) {
        const categoryExists = await this.db.getFirstAsync(
          'SELECT id FROM transactioncategories WHERE id = ? AND isdeleted = 0',
          [recurringData.categoryid]
        );
        
        if (!categoryExists) {
          throw new ReferentialIntegrityError('transactioncategories', 'id', recurringData.categoryid);
        }
      }

      // Get current recurring to merge with updates
      const currentRecurring = await this.db.getFirstAsync(
        'SELECT * FROM recurrings WHERE id = ?',
        [recurringData.id]
      ) as LocalRecurring;

      if (!currentRecurring) {
        throw new StorageError('Recurring not found', 'RECURRING_NOT_FOUND');
      }

      const updatedRecurring: LocalRecurring = {
        ...currentRecurring,
        ...recurringData,
        updatedat: new Date().toISOString()
      };

      await this.db.runAsync(
        `UPDATE recurrings SET 
          tenantid = ?, sourceaccountid = ?, categoryid = ?, name = ?, type = ?, 
          amount = ?, currencycode = ?, description = ?, notes = ?, payeename = ?, 
          recurrencerule = ?, nextoccurrencedate = ?, enddate = ?, isactive = ?, 
          isdeleted = ?, lastexecutedat = ?, updatedat = ?, updatedby = ?
        WHERE id = ?`,
        [
          updatedRecurring.tenantid, updatedRecurring.sourceaccountid, updatedRecurring.categoryid,
          updatedRecurring.name, updatedRecurring.type, updatedRecurring.amount,
          updatedRecurring.currencycode, updatedRecurring.description, updatedRecurring.notes,
          updatedRecurring.payeename, updatedRecurring.recurrencerule, updatedRecurring.nextoccurrencedate,
          updatedRecurring.enddate, updatedRecurring.isactive ? 1 : 0, updatedRecurring.isdeleted ? 1 : 0,
          updatedRecurring.lastexecutedat, updatedRecurring.updatedat, updatedRecurring.updatedby,
          updatedRecurring.id
        ]
      );

      return updatedRecurring;
    } catch (error) {
      console.error('Error updating recurring:', error);
      if (error instanceof ReferentialIntegrityError || error instanceof StorageError) {
        throw error;
      }
      throw new StorageError('Failed to update recurring', 'UPDATE_RECURRING_ERROR', error);
    }
  }

  async deleteRecurring(id: string, userId?: string): Promise<LocalRecurring> {
    try {
      const recurring = await this.db.getFirstAsync(
        'SELECT * FROM recurrings WHERE id = ?',
        [id]
      ) as LocalRecurring;

      if (!recurring) {
        throw new StorageError('Recurring not found', 'RECURRING_NOT_FOUND');
      }

      const deletedRecurring: LocalRecurring = {
        ...recurring,
        isdeleted: true,
        updatedat: new Date().toISOString(),
        updatedby: userId || null
      };

      await this.db.runAsync(
        'UPDATE recurrings SET isdeleted = 1, updatedat = ?, updatedby = ? WHERE id = ?',
        [deletedRecurring.updatedat, deletedRecurring.updatedby, id]
      );

      return deletedRecurring;
    } catch (error) {
      console.error('Error deleting recurring:', error);
      if (error instanceof StorageError) {
        throw error;
      }
      throw new StorageError('Failed to delete recurring', 'DELETE_RECURRING_ERROR', error);
    }
  }

  async restoreRecurring(id: string, userId?: string): Promise<LocalRecurring> {
    try {
      const recurring = await this.db.getFirstAsync(
        'SELECT * FROM recurrings WHERE id = ?',
        [id]
      ) as LocalRecurring;

      if (!recurring) {
        throw new StorageError('Recurring not found', 'RECURRING_NOT_FOUND');
      }

      const restoredRecurring: LocalRecurring = {
        ...recurring,
        isdeleted: false,
        updatedat: new Date().toISOString(),
        updatedby: userId || null
      };

      await this.db.runAsync(
        'UPDATE recurrings SET isdeleted = 0, updatedat = ?, updatedby = ? WHERE id = ?',
        [restoredRecurring.updatedat, restoredRecurring.updatedby, id]
      );

      return restoredRecurring;
    } catch (error) {
      console.error('Error restoring recurring:', error);
      if (error instanceof StorageError) {
        throw error;
      }
      throw new StorageError('Failed to restore recurring', 'RESTORE_RECURRING_ERROR', error);
    }
  }
}

export const sqliteRecurringProvider = new SQLiteRecurringProvider();