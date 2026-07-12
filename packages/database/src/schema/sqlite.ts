import { sqliteTable, text, integer, numeric, real } from 'drizzle-orm/sqlite-core'

export const companies = sqliteTable('companies', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  legalName: text('legal_name'),
  industry: text('industry').default('paper_board'),
  gstin: text('gstin'),
  pan: text('pan'),
  address: text('address'), // JSON stored as string
  phone: text('phone'),
  email: text('email'),
  logoUrl: text('logo_url'),
  settings: text('settings').default('{}'), // JSON stored as string
  isActive: integer('is_active', { mode: 'boolean' }).default(true),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
  deletedAt: text('deleted_at'),
  syncVersion: integer('sync_version').default(0)
})

export const profiles = sqliteTable('profiles', {
  id: text('id').primaryKey(),
  fullName: text('full_name').notNull(),
  phone: text('phone'),
  avatarUrl: text('avatar_url'),
  preferences: text('preferences').default('{}'), // JSON stored as string
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull()
})

export const userCompanyRoles = sqliteTable('user_company_roles', {
  id: text('id').primaryKey(),
  userId: text('user_id').references(() => profiles.id, { onDelete: 'cascade' }),
  companyId: text('company_id').references(() => companies.id, { onDelete: 'cascade' }),
  role: text('role').notNull(), // 'owner' | 'admin' | 'manager' | 'operator' | 'viewer'
  isActive: integer('is_active', { mode: 'boolean' }).default(true),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull()
})

export const contacts = sqliteTable('contacts', {
  id: text('id').primaryKey(),
  companyId: text('company_id').references(() => companies.id, { onDelete: 'cascade' }).notNull(),
  type: text('type').notNull(), // 'customer' | 'supplier' | 'both'
  name: text('name').notNull(),
  legalName: text('legal_name'),
  gstin: text('gstin'),
  pan: text('pan'),
  phone: text('phone'),
  email: text('email'),
  website: text('website'),
  creditLimit: real('credit_limit').default(0),
  creditDays: integer('credit_days').default(0),
  openingBalance: real('opening_balance').default(0),
  notes: text('notes'),
  isActive: integer('is_active', { mode: 'boolean' }).default(true),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
  deletedAt: text('deleted_at'),
  syncVersion: integer('sync_version').default(0)
})

export const contactAddresses = sqliteTable('contact_addresses', {
  id: text('id').primaryKey(),
  contactId: text('contact_id').references(() => contacts.id, { onDelete: 'cascade' }).notNull(),
  type: text('type').notNull(), // 'billing' | 'shipping' | 'both'
  addressLine1: text('address_line1').notNull(),
  addressLine2: text('address_line2'),
  city: text('city').notNull(),
  state: text('state').notNull(),
  postalCode: text('postal_code').notNull(),
  country: text('country').default('India').notNull(),
  isDefault: integer('is_default', { mode: 'boolean' }).default(false),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull()
})

export const contactBankAccounts = sqliteTable('contact_bank_accounts', {
  id: text('id').primaryKey(),
  contactId: text('contact_id').references(() => contacts.id, { onDelete: 'cascade' }).notNull(),
  accountName: text('account_name').notNull(),
  bankName: text('bank_name').notNull(),
  accountNumber: text('account_number').notNull(),
  ifscCode: text('ifsc_code').notNull(),
  branchName: text('branch_name'),
  isDefault: integer('is_default', { mode: 'boolean' }).default(false),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull()
})

export const productCategories = sqliteTable('product_categories', {
  id: text('id').primaryKey(),
  companyId: text('company_id').references(() => companies.id, { onDelete: 'cascade' }).notNull(),
  name: text('name').notNull(),
  description: text('description'),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull()
})

export const unitsOfMeasure = sqliteTable('units_of_measure', {
  id: text('id').primaryKey(),
  companyId: text('company_id').references(() => companies.id, { onDelete: 'cascade' }).notNull(),
  name: text('name').notNull(),
  abbreviation: text('abbreviation').notNull(),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull()
})

export const products = sqliteTable('products', {
  id: text('id').primaryKey(),
  companyId: text('company_id').references(() => companies.id, { onDelete: 'cascade' }).notNull(),
  categoryId: text('category_id').references(() => productCategories.id),
  sku: text('sku'),
  name: text('name').notNull(),
  description: text('description'),
  hsnCode: text('hsn_code'),
  unitId: text('unit_id').references(() => unitsOfMeasure.id),
  
  // Paper & Board properties
  gsm: real('gsm'),
  bf: integer('bf'),
  sizeLength: real('size_length'),
  sizeWidth: real('size_width'),
  ply: integer('ply'),
  fluteType: text('flute_type'),
  paperType: text('paper_type'),

  // Pricing
  basePrice: real('base_price').default(0),
  taxRate: real('tax_rate').default(18),

  isActive: integer('is_active', { mode: 'boolean' }).default(true),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
  deletedAt: text('deleted_at'),
  syncVersion: integer('sync_version').default(0)
})

export const purchaseOrders = sqliteTable('purchase_orders', {
  id: text('id').primaryKey(),
  companyId: text('company_id').references(() => companies.id, { onDelete: 'cascade' }).notNull(),
  vendorId: text('vendor_id').references(() => contacts.id).notNull(),
  poNumber: text('po_number').notNull(),
  orderDate: text('order_date').notNull(),
  deliveryDate: text('delivery_date'),
  status: text('status').default('draft').notNull(),
  subtotal: real('subtotal').default(0).notNull(),
  taxAmount: real('tax_amount').default(0).notNull(),
  totalAmount: real('total_amount').default(0).notNull(),
  notes: text('notes'),
  createdBy: text('created_by').references(() => profiles.id),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
  deletedAt: text('deleted_at'),
  syncVersion: integer('sync_version').default(0)
})

export const purchaseOrderItems = sqliteTable('purchase_order_items', {
  id: text('id').primaryKey(),
  purchaseOrderId: text('purchase_order_id').references(() => purchaseOrders.id, { onDelete: 'cascade' }).notNull(),
  productId: text('product_id').references(() => products.id).notNull(),
  quantity: real('quantity').notNull(),
  unitPrice: real('unit_price').notNull(),
  taxRate: real('tax_rate').default(0).notNull(),
  taxAmount: real('tax_amount').default(0).notNull(),
  totalAmount: real('total_amount').default(0).notNull(),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull()
})

export const salesOrders = sqliteTable('sales_orders', {
  id: text('id').primaryKey(),
  companyId: text('company_id').references(() => companies.id, { onDelete: 'cascade' }).notNull(),
  customerId: text('customer_id').references(() => contacts.id).notNull(),
  soNumber: text('so_number').notNull(),
  orderDate: text('order_date').notNull(),
  deliveryDate: text('delivery_date'),
  status: text('status').default('draft').notNull(),
  subtotal: real('subtotal').default(0).notNull(),
  taxAmount: real('tax_amount').default(0).notNull(),
  totalAmount: real('total_amount').default(0).notNull(),
  notes: text('notes'),
  createdBy: text('created_by').references(() => profiles.id),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
  deletedAt: text('deleted_at'),
  syncVersion: integer('sync_version').default(0)
})

export const salesOrderItems = sqliteTable('sales_order_items', {
  id: text('id').primaryKey(),
  salesOrderId: text('sales_order_id').references(() => salesOrders.id, { onDelete: 'cascade' }).notNull(),
  productId: text('product_id').references(() => products.id).notNull(),
  quantity: real('quantity').notNull(),
  unitPrice: real('unit_price').notNull(),
  taxRate: real('tax_rate').default(0).notNull(),
  taxAmount: real('tax_amount').default(0).notNull(),
  totalAmount: real('total_amount').default(0).notNull(),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull()
})

export const syncQueue = sqliteTable('sync_queue', {
  id: text('id').primaryKey(), // local change uuid
  tableName: text('table_name').notNull(),
  recordId: text('record_id').notNull(),
  operation: text('operation').notNull(), // 'INSERT' | 'UPDATE' | 'DELETE'
  payload: text('payload'), // serialized JSON of the record
  createdAt: text('created_at').notNull()
})

export const locations = sqliteTable('locations', {
  id: text('id').primaryKey(),
  companyId: text('company_id').references(() => companies.id, { onDelete: 'cascade' }).notNull(),
  name: text('name').notNull(),
  city: text('city'),
  phone: text('phone'),
  status: text('status'),
  isActive: integer('is_active', { mode: 'boolean' }).default(true),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
  deletedAt: text('deleted_at'),
  syncVersion: integer('sync_version').default(0)
})

export const salesPersons = sqliteTable('sales_persons', {
  id: text('id').primaryKey(),
  companyId: text('company_id').references(() => companies.id, { onDelete: 'cascade' }).notNull(),
  name: text('name').notNull(),
  phone: text('phone'),
  status: text('status'),
  isActive: integer('is_active', { mode: 'boolean' }).default(true),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
  deletedAt: text('deleted_at'),
  syncVersion: integer('sync_version').default(0)
})

export const stockInwards = sqliteTable('stock_inwards', {
  id: text('id').primaryKey(),
  companyId: text('company_id').references(() => companies.id, { onDelete: 'cascade' }).notNull(),
  voucherNo: text('voucher_no').notNull(),
  date: text('date'),
  accountName: text('account_name'),
  narration: text('narration'),
  items: text('items'), // serialized JSON of InwardItem[]
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
  deletedAt: text('deleted_at'),
  syncVersion: integer('sync_version').default(0)
})

export const stockTransfers = sqliteTable('stock_transfers', {
  id: text('id').primaryKey(),
  companyId: text('company_id').references(() => companies.id, { onDelete: 'cascade' }).notNull(),
  voucherNo: text('voucher_no').notNull(),
  date: text('date'),
  narration: text('narration'),
  items: text('items'), // serialized JSON of TransferItem[]
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
  deletedAt: text('deleted_at'),
  syncVersion: integer('sync_version').default(0)
})

export const invoices = sqliteTable('invoices', {
  id: text('id').primaryKey(),
  companyId: text('company_id').references(() => companies.id, { onDelete: 'cascade' }).notNull(),
  voucherNo: text('voucher_no').notNull(),
  date: text('date'),
  accountName: text('account_name'),
  narration: text('narration'),
  items: text('items'), // serialized JSON of InvoiceItem[]
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
  deletedAt: text('deleted_at'),
  syncVersion: integer('sync_version').default(0)
})

export const deliveryOrders = sqliteTable('delivery_orders', {
  id: text('id').primaryKey(),
  companyId: text('company_id').references(() => companies.id, { onDelete: 'cascade' }).notNull(),
  voucherNo: text('voucher_no').notNull(),
  invoiceNo: text('invoice_no').notNull(),
  date: text('date'),
  accountName: text('account_name'),
  vehicle: text('vehicle'),
  narration: text('narration'),
  items: text('items'), // serialized JSON of delivered items
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
  deletedAt: text('deleted_at'),
  syncVersion: integer('sync_version').default(0)
})

export const receipts = sqliteTable('receipts', {
  id: text('id').primaryKey(),
  companyId: text('company_id').references(() => companies.id, { onDelete: 'cascade' }).notNull(),
  voucherNo: text('voucher_no').notNull(),
  date: text('date'),
  accountName: text('account_name'),
  narration: text('narration'),
  amount: real('amount').default(0),
  paymentMode: text('payment_mode'),
  refNo: text('ref_no'),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
  deletedAt: text('deleted_at'),
  syncVersion: integer('sync_version').default(0)
})

export const payments = sqliteTable('payments', {
  id: text('id').primaryKey(),
  companyId: text('company_id').references(() => companies.id, { onDelete: 'cascade' }).notNull(),
  voucherNo: text('voucher_no').notNull(),
  date: text('date'),
  accountName: text('account_name'),
  narration: text('narration'),
  amount: real('amount').default(0),
  paymentMode: text('payment_mode'),
  refNo: text('ref_no'),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
  deletedAt: text('deleted_at'),
  syncVersion: integer('sync_version').default(0)
})

export const journalVouchers = sqliteTable('journal_vouchers', {
  id: text('id').primaryKey(),
  companyId: text('company_id').references(() => companies.id, { onDelete: 'cascade' }).notNull(),
  voucherNo: text('voucher_no').notNull(),
  date: text('date'),
  narration: text('narration'),
  items: text('items'), // serialized JSON array
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
  deletedAt: text('deleted_at'),
  syncVersion: integer('sync_version').default(0)
})

export const staffUsers = sqliteTable('staff_users', {
  id: text('id').primaryKey(),
  companyId: text('company_id').references(() => companies.id, { onDelete: 'cascade' }).notNull(),
  name: text('name').notNull(),
  username: text('username').notNull(),
  pin: text('pin').notNull(),
  role: text('role').notNull(), // 'Admin' | 'Manager' | 'Sale Person' | 'Accountant'
  isActive: integer('is_active', { mode: 'boolean' }).default(true),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
  deletedAt: text('deleted_at'),
  syncVersion: integer('sync_version').default(0)
})

