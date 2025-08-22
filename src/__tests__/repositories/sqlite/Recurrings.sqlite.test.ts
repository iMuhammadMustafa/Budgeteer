import { describe, it, expect } from '@jest/globals';
import { RecurringSQLiteRepository } from '../../../repositories/sqlite/Recurrings.sqlite';
import { IRecurringRepository } from '../../../repositories/interfaces/IRecurringRepository';

// Mock the SQLite provider
jest.mock('../../../providers/SQLite', () => ({
  getSQLiteDB: jest.fn(),
  isSQLiteReady: jest.fn(() => true),
}));

describe('RecurringSQLiteRepository', () => {

  it('should implement IRecurringRepository interface', () => {
    const repository = new RecurringSQLiteRepository();
    
    // Verify that the repository implements the interface
    expect(repository).toBeInstanceOf(RecurringSQLiteRepository);
    
    // Verify that all required methods exist
    expect(typeof repository.findById).toBe('function');
    expect(typeof repository.findAll).toBe('function');
    expect(typeof repository.create).toBe('function');
    expect(typeof repository.update).toBe('function');
    expect(typeof repository.delete).toBe('function');
    expect(typeof repository.softDelete).toBe('function');
    expect(typeof repository.restore).toBe('function');
  });

  it('should extend BaseSQLiteRepository', () => {
    const repository = new RecurringSQLiteRepository();
    
    // Verify the repository has the expected table property
    expect(repository).toHaveProperty('table');
  });

  it('should be compatible with IRecurringRepository interface', () => {
    const repository: IRecurringRepository = new RecurringSQLiteRepository();
    
    // This test passes if TypeScript compilation succeeds
    expect(repository).toBeDefined();
  });
});