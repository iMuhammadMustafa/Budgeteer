import { ITransactionRepository } from '../interfaces/ITransactionRepository'
import { Transaction } from '../../database/models'
import { Transaction as TransactionType, Inserts, Updates } from '@/src/types/db/Tables.Types'
import { TableNames } from '@/src/types/db/TableNames'
import { mapTransactionFromWatermelon } from './TypeMappers'
import { getWatermelonDB } from '../../database'
import { Q } from '@nozbe/watermelondb'

export class TransactionWatermelonRepository implements ITransactionRepository {
  private async getDb() {
    return await getWatermelonDB()
  }

  async findById(id: string, tenantId?: string): Promise<TransactionType | null> {
    try {
      const db = await this.getDb()
      
      const query = db.get('transactions').query(
        Q.where('id', id),
        ...(tenantId ? [Q.where('tenant_id', tenantId)] : []),
        Q.where('is_deleted', false)
      )

      const results = await query
      const model = results[0] as Transaction | undefined
      return model ? mapTransactionFromWatermelon(model) : null
    } catch (error) {
      throw new Error(`Failed to find record by ID: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  async findAll(filters?: any, tenantId?: string): Promise<TransactionType[]> {
    try {
      const db = await this.getDb()
      const conditions = []

      if (tenantId) {
        conditions.push(Q.where('tenant_id', tenantId))
      }

      conditions.push(Q.where('is_deleted', false))

      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            conditions.push(Q.where(key, value as any))
          }
        })
      }

      const query = db.get('transactions').query(...conditions)
      const results = await query
      return (results as Transaction[]).map(mapTransactionFromWatermelon)
    } catch (error) {
      throw new Error(`Failed to find records: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  async create(data: Inserts<TableNames.Transactions>, tenantId?: string): Promise<TransactionType> {
    try {
      const db = await this.getDb()

      return await db.write(async () => {
        const record = await db.get('transactions').create((record: any) => {
          if (!data.id) {
            record.id = crypto.randomUUID()
          }

          if (tenantId) {
            record.tenantId = tenantId
            record.createdBy = tenantId
          }

          Object.entries(data).forEach(([key, value]) => {
            if (key !== 'id' && value !== undefined) {
              const dbKey = this.camelToSnake(key)
              if (key === 'tags' && Array.isArray(value)) {
                record[dbKey] = JSON.stringify(value)
              } else {
                record[dbKey] = value
              }
            }
          })

          const now = Date.now()
          record.createdAt = now
          record.updatedAt = now
          record.isDeleted = false
          record.isVoid = false
        })

        return mapTransactionFromWatermelon(record as Transaction)
      })
    } catch (error) {
      throw new Error(`Failed to create record: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  async update(id: string, data: Updates<TableNames.Transactions>, tenantId?: string): Promise<TransactionType | null> {
    try {
      const db = await this.getDb()

      return await db.write(async () => {
        const conditions = [Q.where('id', id)]
        
        if (tenantId) {
          conditions.push(Q.where('tenant_id', tenantId))
        }
        
        conditions.push(Q.where('is_deleted', false))

        const query = db.get('transactions').query(...conditions)
        const results = await query
        const record = results[0]

        if (!record) {
          return null
        }

        const updatedRecord = await record.update((record: any) => {
          Object.entries(data).forEach(([key, value]) => {
            if (value !== undefined) {
              const dbKey = this.camelToSnake(key)
              if (key === 'tags' && Array.isArray(value)) {
                record[dbKey] = JSON.stringify(value)
              } else {
                record[dbKey] = value
              }
            }
          })

          record.updatedAt = Date.now()
        })

        return mapTransactionFromWatermelon(updatedRecord as Transaction)
      })
    } catch (error) {
      throw new Error(`Failed to update record: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  async delete(id: string, tenantId?: string): Promise<void> {
    try {
      const db = await this.getDb()

      await db.write(async () => {
        const conditions = [Q.where('id', id)]
        
        if (tenantId) {
          conditions.push(Q.where('tenant_id', tenantId))
        }

        const query = db.get('transactions').query(...conditions)
        const results = await query
        const record = results[0]

        if (record) {
          await record.destroyPermanently()
        }
      })
    } catch (error) {
      throw new Error(`Failed to delete record: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  async softDelete(id: string, tenantId?: string): Promise<void> {
    try {
      const db = await this.getDb()

      await db.write(async () => {
        const conditions = [Q.where('id', id)]
        
        if (tenantId) {
          conditions.push(Q.where('tenant_id', tenantId))
        }
        
        conditions.push(Q.where('is_deleted', false))

        const query = db.get('transactions').query(...conditions)
        const results = await query
        const record = results[0]

        if (record) {
          await record.update((record: any) => {
            record.isDeleted = true
            record.updatedAt = Date.now()
          })
        }
      })
    } catch (error) {
      throw new Error(`Failed to soft delete record: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  async restore(id: string, tenantId?: string): Promise<void> {
    try {
      const db = await this.getDb()

      await db.write(async () => {
        const conditions = [Q.where('id', id)]
        
        if (tenantId) {
          conditions.push(Q.where('tenant_id', tenantId))
        }

        const query = db.get('transactions').query(...conditions)
        const results = await query
        const record = results[0]

        if (record) {
          await record.update((record: any) => {
            record.isDeleted = false
            record.updatedAt = Date.now()
          })
        }
      })
    } catch (error) {
      throw new Error(`Failed to restore record: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  private camelToSnake(str: string): string {
    return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`)
  }
}
