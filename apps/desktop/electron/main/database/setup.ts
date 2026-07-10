import Database from 'better-sqlite3'
import { drizzle } from 'drizzle-orm/better-sqlite3'
import * as sqliteSchema from '@papsoft/database'
import * as path from 'path'
import * as fs from 'fs'

let dbInstance: any = null

export function initDatabase() {
  if (dbInstance) return dbInstance

  const appDataPath = process.env.APPDATA || (process.platform === 'darwin' ? process.env.HOME + '/Library/Application Support' : process.env.HOME + '/.config')
  const dir = path.join(appDataPath, 'papsoft')
  
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }

  const dbPath = path.join(dir, 'papsoft.db')
  const sqlite = new Database(dbPath)
  
  // Enable Write-Ahead Logging (WAL) for high performance concurrent read/writes
  sqlite.pragma('journal_mode = WAL')
  sqlite.pragma('synchronous = NORMAL')

  // Create core tables locally in SQLite
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS companies (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      legal_name TEXT,
      industry TEXT DEFAULT 'paper_board',
      gstin TEXT,
      pan TEXT,
      address TEXT,
      phone TEXT,
      email TEXT,
      logo_url TEXT,
      settings TEXT DEFAULT '{}',
      is_active INTEGER DEFAULT 1,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      deleted_at TEXT,
      sync_version INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS profiles (
      id TEXT PRIMARY KEY,
      full_name TEXT NOT NULL,
      phone TEXT,
      avatar_url TEXT,
      preferences TEXT DEFAULT '{}',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS user_company_roles (
      id TEXT PRIMARY KEY,
      user_id TEXT REFERENCES profiles(id) ON DELETE CASCADE,
      company_id TEXT REFERENCES companies(id) ON DELETE CASCADE,
      role TEXT NOT NULL,
      is_active INTEGER DEFAULT 1,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS contacts (
      id TEXT PRIMARY KEY,
      company_id TEXT REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
      type TEXT NOT NULL,
      name TEXT NOT NULL,
      legal_name TEXT,
      gstin TEXT,
      pan TEXT,
      phone TEXT,
      email TEXT,
      website TEXT,
      credit_limit REAL DEFAULT 0,
      credit_days INTEGER DEFAULT 0,
      opening_balance REAL DEFAULT 0,
      notes TEXT,
      is_active INTEGER DEFAULT 1,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      deleted_at TEXT,
      sync_version INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS contact_addresses (
      id TEXT PRIMARY KEY,
      contact_id TEXT REFERENCES contacts(id) ON DELETE CASCADE NOT NULL,
      type TEXT NOT NULL,
      address_line1 TEXT NOT NULL,
      address_line2 TEXT,
      city TEXT NOT NULL,
      state TEXT NOT NULL,
      postal_code TEXT NOT NULL,
      country TEXT DEFAULT 'India' NOT NULL,
      is_default INTEGER DEFAULT 0,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS contact_bank_accounts (
      id TEXT PRIMARY KEY,
      contact_id TEXT REFERENCES contacts(id) ON DELETE CASCADE NOT NULL,
      account_name TEXT NOT NULL,
      bank_name TEXT NOT NULL,
      account_number TEXT NOT NULL,
      ifsc_code TEXT NOT NULL,
      branch_name TEXT,
      is_default INTEGER DEFAULT 0,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS product_categories (
      id TEXT PRIMARY KEY,
      company_id TEXT REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
      name TEXT NOT NULL,
      description TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS units_of_measure (
      id TEXT PRIMARY KEY,
      company_id TEXT REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
      name TEXT NOT NULL,
      abbreviation TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS products (
      id TEXT PRIMARY KEY,
      company_id TEXT REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
      category_id TEXT REFERENCES product_categories(id),
      sku TEXT,
      name TEXT NOT NULL,
      description TEXT,
      hsn_code TEXT,
      unit_id TEXT REFERENCES units_of_measure(id),
      gsm REAL,
      bf INTEGER,
      size_length REAL,
      size_width REAL,
      ply INTEGER,
      flute_type TEXT,
      paper_type TEXT,
      base_price REAL DEFAULT 0,
      tax_rate REAL DEFAULT 18,
      is_active INTEGER DEFAULT 1,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      deleted_at TEXT,
      sync_version INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS purchase_orders (
      id TEXT PRIMARY KEY,
      company_id TEXT REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
      vendor_id TEXT REFERENCES contacts(id) NOT NULL,
      po_number TEXT NOT NULL,
      order_date TEXT NOT NULL,
      delivery_date TEXT,
      status TEXT DEFAULT 'draft' NOT NULL,
      subtotal REAL DEFAULT 0 NOT NULL,
      tax_amount REAL DEFAULT 0 NOT NULL,
      total_amount REAL DEFAULT 0 NOT NULL,
      notes TEXT,
      created_by TEXT REFERENCES profiles(id),
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      deleted_at TEXT,
      sync_version INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS purchase_order_items (
      id TEXT PRIMARY KEY,
      purchase_order_id TEXT REFERENCES purchase_orders(id) ON DELETE CASCADE NOT NULL,
      product_id TEXT REFERENCES products(id) NOT NULL,
      quantity REAL NOT NULL,
      unit_price REAL NOT NULL,
      tax_rate REAL DEFAULT 0 NOT NULL,
      tax_amount REAL DEFAULT 0 NOT NULL,
      total_amount REAL DEFAULT 0 NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS sales_orders (
      id TEXT PRIMARY KEY,
      company_id TEXT REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
      customer_id TEXT REFERENCES contacts(id) NOT NULL,
      so_number TEXT NOT NULL,
      order_date TEXT NOT NULL,
      delivery_date TEXT,
      status TEXT DEFAULT 'draft' NOT NULL,
      subtotal REAL DEFAULT 0 NOT NULL,
      tax_amount REAL DEFAULT 0 NOT NULL,
      total_amount REAL DEFAULT 0 NOT NULL,
      notes TEXT,
      created_by TEXT REFERENCES profiles(id),
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      deleted_at TEXT,
      sync_version INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS sales_order_items (
      id TEXT PRIMARY KEY,
      sales_order_id TEXT REFERENCES sales_orders(id) ON DELETE CASCADE NOT NULL,
      product_id TEXT REFERENCES products(id) NOT NULL,
      quantity REAL NOT NULL,
      unit_price REAL NOT NULL,
      tax_rate REAL DEFAULT 0 NOT NULL,
      tax_amount REAL DEFAULT 0 NOT NULL,
      total_amount REAL DEFAULT 0 NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS sync_queue (
      id TEXT PRIMARY KEY,
      table_name TEXT NOT NULL,
      record_id TEXT NOT NULL,
      operation TEXT NOT NULL,
      payload TEXT,
      created_at TEXT NOT NULL
    );
  `)

  dbInstance = drizzle(sqlite, { schema: sqliteSchema })
  return dbInstance
}

export function getDb() {
  if (!dbInstance) {
    return initDatabase()
  }
  return dbInstance
}
