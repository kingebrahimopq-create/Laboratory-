/**
 * Database Backup Script
 * 
 * Creates a JSON backup of all localStorage data.
 * Usage: npm run db:backup
 */

import { ClinicalDatabase } from '../src/db/storage';
import { DatabaseAdapter, StorageType } from '../src/db/database-adapter';

async function backup() {
  console.log('💾 Creating database backup...\n');

  const db = DatabaseAdapter.create(StorageType.LOCAL);
  await db.connect();

  const result = await db.backup();

  if (result.success) {
    // Write to file if in Node environment
    const fs = await import('fs');
    const fileName = `backups/${result.fileName}`;
    
    if (!fs.existsSync('backups')) {
      fs.mkdirSync('backups', { recursive: true });
    }

    fs.writeFileSync(fileName, JSON.stringify(result.data, null, 2));

    console.log(`✅ Backup created successfully!`);
    console.log(`📁 File: ${fileName}`);
    console.log(`📊 Size: ${(result.size / 1024).toFixed(2)} KB`);
    console.log(`📈 Records: ${result.data.metadata.totalRecords}`);
    console.log(`🕐 Time: ${result.backupAt}`);
  } else {
    console.error('❌ Backup failed');
    process.exit(1);
  }
}

backup().catch(console.error);
