/**
 * Database Migration Script
 * 
 * Handles schema migrations and data transformations.
 * Usage: npm run db:migrate
 */

import { ClinicalDatabase } from '../src/db/storage';

const CURRENT_VERSION = '2.0.0';
const MIGRATION_KEY = 'lims_mylab_db_version';

interface Migration {
  version: string;
  description: string;
  up: () => void;
}

const migrations: Migration[] = [
  {
    version: '1.0.0',
    description: 'Initial schema setup',
    up: () => {
      // Initial setup - data already exists in localStorage
      console.log('  ✓ Initial schema verified');
    }
  },
  {
    version: '1.1.0',
    description: 'Add electronic printer settings',
    up: () => {
      const settings = ClinicalDatabase.getSettings();
      if (!settings.printerConnectionType) {
        settings.printerConnectionType = 'network';
        settings.printerIpAddress = '192.168.1.100';
        settings.enableElectronicPrinter = true;
        ClinicalDatabase.saveSettings(settings);
        console.log('  ✓ Added default printer settings');
      }
    }
  },
  {
    version: '1.2.0',
    description: 'Add barcode location and thermal width settings',
    up: () => {
      const settings = ClinicalDatabase.getSettings();
      if (!settings.barcodeLocation) {
        settings.barcodeLocation = 'bottom';
        settings.thermalWidth = '80mm';
        ClinicalDatabase.saveSettings(settings);
        console.log('  ✓ Added barcode and thermal settings');
      }
    }
  },
  {
    version: '2.0.0',
    description: 'Add currency support and reference range customization',
    up: () => {
      const settings = ClinicalDatabase.getSettings();
      if (!settings.currency) {
        settings.currency = 'EGP';
        ClinicalDatabase.saveSettings(settings);
        console.log('  ✓ Added currency setting');
      }

      // Ensure all tests have proper parameter structure
      const tests = ClinicalDatabase.getTests();
      let updated = 0;
      for (const test of tests) {
        if (test.parameters) {
          for (const param of test.parameters) {
            if (param.isAbnormal === undefined) {
              param.isAbnormal = param.value !== undefined && 
                (param.value < param.minNormal || param.value > param.maxNormal);
              updated++;
            }
          }
        }
      }
      if (updated > 0) {
        ClinicalDatabase.saveAllTests(tests);
        console.log(`  ✓ Updated ${updated} parameter flags`);
      }
    }
  }
];

async function migrate() {
  console.log('🔄 Running database migrations...\n');

  const storedVersion = localStorage.getItem(MIGRATION_KEY) || '0.0.0';
  console.log(`Current database version: ${storedVersion}`);
  console.log(`Target version: ${CURRENT_VERSION}\n`);

  let currentVersion = storedVersion;

  for (const migration of migrations) {
    if (compareVersions(currentVersion, migration.version) < 0) {
      console.log(`📦 Migrating to ${migration.version}: ${migration.description}`);
      try {
        migration.up();
        currentVersion = migration.version;
        localStorage.setItem(MIGRATION_KEY, currentVersion);
        console.log(`  ✅ Migrated to ${migration.version}\n`);
      } catch (error) {
        console.error(`  ❌ Migration failed: ${String(error)}`);
        process.exit(1);
      }
    } else {
      console.log(`⏭️  Skipping ${migration.version} (already applied)`);
    }
  }

  console.log('\n✅ All migrations completed successfully!');
  console.log(`Database version: ${currentVersion}`);
}

function compareVersions(a: string, b: string): number {
  const partsA = a.split('.').map(Number);
  const partsB = b.split('.').map(Number);
  
  for (let i = 0; i < Math.max(partsA.length, partsB.length); i++) {
    const partA = partsA[i] || 0;
    const partB = partsB[i] || 0;
    if (partA < partB) return -1;
    if (partA > partB) return 1;
  }
  return 0;
}

migrate().catch(console.error);
