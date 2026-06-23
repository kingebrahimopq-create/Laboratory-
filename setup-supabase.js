import { Client } from 'pg';

const connectionString = 'postgresql://postgres:0E02ddd1@11@db.tgbwmcgnyqejjyrxurab.supabase.co:5432/postgres';

async function setup() {
  const client = new Client({ connectionString });
  await client.connect();

  const query = `
    -- Enable UUIDs
    CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

    -- Create tables
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT,
      role TEXT,
      name TEXT,
      "nameAr" TEXT,
      phone TEXT,
      email TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS appointments (
      id TEXT PRIMARY KEY,
      "patientId" TEXT,
      date TIMESTAMP,
      type TEXT,
      status TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS home_visits (
      id TEXT PRIMARY KEY,
      "patientId" TEXT,
      "patientNameAr" TEXT,
      phone TEXT,
      address TEXT,
      "visitDate" TEXT,
      "visitTime" TEXT,
      "testsReq" JSONB,
      status TEXT,
      phlebotomist TEXT,
      notes TEXT,
      "createdAt" TEXT
    );

    CREATE TABLE IF NOT EXISTS notifications (
      id TEXT PRIMARY KEY,
      title TEXT,
      "titleAr" TEXT,
      message TEXT,
      "messageAr" TEXT,
      type TEXT,
      timestamp TEXT,
      read BOOLEAN
    );

    CREATE TABLE IF NOT EXISTS inventory (
      id TEXT PRIMARY KEY,
      name TEXT,
      "nameAr" TEXT,
      category TEXT,
      quantity NUMERIC,
      unit TEXT,
      "reorderLevel" NUMERIC,
      "supplierName" TEXT,
      description TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS inventory_logs (
      id TEXT PRIMARY KEY,
      "itemId" TEXT,
      "itemName" TEXT,
      action TEXT,
      amount NUMERIC,
      reason TEXT,
      timestamp TEXT,
      user TEXT
    );

    CREATE TABLE IF NOT EXISTS tests_catalog (
      id TEXT PRIMARY KEY,
      "testId" TEXT,
      name TEXT,
      "nameAr" TEXT,
      category TEXT,
      price NUMERIC,
      parameters JSONB,
      requirements TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS expenses (
      id TEXT PRIMARY KEY,
      amount NUMERIC,
      category TEXT,
      description TEXT,
      date TEXT,
      receipt TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS shifts (
      id TEXT PRIMARY KEY,
      "userId" TEXT,
      "startTime" TEXT,
      "endTime" TEXT,
      role TEXT,
      notes TEXT
    );

    CREATE TABLE IF NOT EXISTS qc (
      id TEXT PRIMARY KEY,
      "testId" TEXT,
      "lotNumber" TEXT,
      "expirationDate" TEXT,
      results JSONB,
      status TEXT,
      operator TEXT,
      "checkDate" TEXT
    );

    CREATE TABLE IF NOT EXISTS audit_logs (
      id TEXT PRIMARY KEY,
      action TEXT,
      "userId" TEXT,
      details TEXT,
      timestamp TEXT
    );
    
    CREATE TABLE IF NOT EXISTS patients (
      id TEXT PRIMARY KEY,
      name TEXT,
      "nameAr" TEXT,
      email TEXT,
      phone TEXT,
      gender TEXT,
      dob TIMESTAMP,
      address TEXT,
      "createdAt" TIMESTAMP,
      "updatedAt" TIMESTAMP
    );
  `;
  
  await client.query("ALTER ROLE postgres SET statement_timeout = '0'");
  await client.query(query);
  console.log("Supabase schema deployed");
  await client.end();
}

setup().catch(console.error);
