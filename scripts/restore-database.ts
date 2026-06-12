/**
 * Database Restore Script
 * 
 * Restores database from a JSON backup file.
 * Usage: npm run db:restore -- backups/mylab_backup_2026-01-01.json
 */

import { DatabaseAdapter, StorageType } from '../src/db/database-adapter';

async function restore() {
  const filePath = process.argv[2];
  
  if (!filePath) {
    console.error('❌ Please provide a backup file path:');
    console.error('  npm run db:restore -- backups/mylab_backup_2026-01-01.json');
    process.exit(1);
  }

  console.log(`📂 Reading backup file: ${filePath}\n`);

  const fs = await import('fs');
  
  if (!fs.existsSync(filePath)) {
    console.error(`❌ File not found: ${filePath}`);
    process.exit(1);
  }

  const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));

  console.log('🔍 Backup info:');
  console.log(`  Version: ${data.metadata?.version || 'unknown'}`);
  console.log(`  Backed up at: ${data.metadata?.backedUpAt || 'unknown'}`);
  console.log(`  Total records: ${data.metadata?.totalRecords || 'unknown'}`);
  console.log('');

  const db = DatabaseAdapter.create(StorageType.LOCAL);
  await db.connect();

  console.log('⚠️  This will overwrite existing data. Proceed? (yes/no)');
  
  // In non-interactive mode, proceed
  const result = await db.restore(data);

  if (result.success) {
    console.log('\n✅ Database restored successfully!');
    console.log(`  Patients: ${result.patients}`);
    console.log(`  Appointments: ${result.appointments}`);
    console.log(`  Tests: ${result.tests}`);
    console.log(`  Time: ${result.restoredAt}`);
  } else {
    console.error('\n❌ Restore failed');
    process.exit(1);
  }
}

restore().catch(console.error);
