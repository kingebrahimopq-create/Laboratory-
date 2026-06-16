import { describe, it, expect, beforeEach } from 'vitest';
import { DatabaseAdapter, StorageType } from '../db/database-adapter';
import { ClinicalDatabase } from '../db/storage';

describe('Database Adapter', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('should create local storage adapter by default', () => {
    const db = DatabaseAdapter.create(StorageType.LOCAL);
    expect(db).toBeDefined();
    expect(db.isConnected()).toBe(true);
  });

  it('should save and retrieve patients', async () => {
    const db = DatabaseAdapter.create(StorageType.LOCAL);
    await db.connect();

    const patient = {
      id: 'TEST-001',
      name: 'Test Patient',
      nameEn: 'Test Patient',
      phone: '0123456789',
      gender: 'ذكر' as const,
      birthDate: '1990-01-01'
    };

    await db.patients.create(patient);
    const patients = await db.patients.findAll();
    
    expect(patients).toHaveLength(1);
    expect(patients[0].name).toBe('Test Patient');
  });

  it('should update patient data', async () => {
    const db = DatabaseAdapter.create(StorageType.LOCAL);
    await db.connect();

    const patient = {
      id: 'TEST-002',
      name: 'Original Name',
      nameEn: 'Original Name',
      phone: '0123456789',
      gender: 'ذكر' as const,
      birthDate: '1990-01-01'
    };

    await db.patients.create(patient);
    await db.patients.update('TEST-002', { name: 'Updated Name' });
    
    const updated = await db.patients.findById('TEST-002');
    expect(updated?.name).toBe('Updated Name');
  });

  it('should create a backup', async () => {
    const db = DatabaseAdapter.create(StorageType.LOCAL);
    await db.connect();

    const result = await db.backup();
    
    expect(result.success).toBe(true);
    expect(result.data).toBeDefined();
    expect(result.data.metadata).toBeDefined();
    expect(result.data.metadata.version).toBe('2.0.0');
  });

  it('should restore from backup', async () => {
    const db = DatabaseAdapter.create(StorageType.LOCAL);
    await db.connect();

    // Create test data
    await db.patients.create({
      id: 'TEST-003',
      name: 'Backup Test',
      nameEn: 'Backup Test',
      phone: '0123456789',
      gender: 'ذكر' as const,
      birthDate: '1990-01-01'
    });

    const backup = await db.backup();
    
    // Clear and restore
    ClinicalDatabase.saveAllPatients([]);
    const result = await db.restore(backup.data);
    
    expect(result.success).toBe(true);
    expect(result.patients).toBe(3);
  });
});
