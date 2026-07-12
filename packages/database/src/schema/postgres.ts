import { pgTable, uuid, text, boolean, timestamp, numeric, integer, jsonb } from 'drizzle-orm/pg-core'

export const companies = pgTable('companies', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull(),
  legalName: text('legal_name'),
  industry: text('industry').default('paper_board'),
  gstin: text('gstin'),
  pan: text('pan'),
  address: jsonb('address'),
  phone: text('phone'),
  email: text('email'),
  logoUrl: text('logo_url'),
  settings: jsonb('settings').default({}),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
  syncVersion: integer('sync_version').default(0)
})

export const profiles = pgTable('profiles', {
  id: uuid('id').primaryKey(), // matches auth.users(id)
  fullName: text('full_name').notNull(),
  phone: text('phone'),
  avatarUrl: text('avatar_url'),
  preferences: jsonb('preferences').default({}),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull()
})

export const userCompanyRoles = pgTable('user_company_roles', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => profiles.id, { onDelete: 'cascade' }),
  companyId: uuid('company_id').references(() => companies.id, { onDelete: 'cascade' }),
  role: text('role').notNull(), // 'owner' | 'admin' | 'manager' | 'operator' | 'viewer'
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull()
})

export const contacts = pgTable('contacts', {
  id: uuid('id').defaultRandom().primaryKey(),
  companyId: uuid('company_id').references(() => companies.id, { onDelete: 'cascade' }).notNull(),
  type: text('type').notNull(), // 'customer' | 'supplier' | 'both'
  name: text('name').notNull(),
  legalName: text('legal_name'),
  gstin: text('gstin'),
  pan: text('pan'),
  phone: text('phone'),
  email: text('email'),
  website: text('website'),
  creditLimit: numeric('credit_limit', { precision: 15, scale: 2 }).default('0'),
  creditDays: integer('credit_days').default(0),
  openingBalance: numeric('opening_balance', { precision: 15, scale: 2 }).default('0'),
  notes: text('notes'),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
  syncVersion: integer('sync_version').default(0)
})

export const contactAddresses = pgTable('contact_addresses', {
  id: uuid('id').defaultRandom().primaryKey(),
  contactId: uuid('contact_id').references(() => contacts.id, { onDelete: 'cascade' }).notNull(),
  type: text('type').notNull(), // 'billing' | 'shipping' | 'both'
  addressLine1: text('address_line1').notNull(),
  addressLine2: text('address_line2'),
  city: text('city').notNull(),
  state: text('state').notNull(),
  postalCode: text('postal_code').notNull(),
  country: text('country').default('India').notNull(),
  isDefault: boolean('is_default').default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull()
})

export const contactBankAccounts = pgTable('contact_bank_accounts', {
  id: uuid('id').defaultRandom().primaryKey(),
  contactId: uuid('contact_id').references(() => contacts.id, { onDelete: 'cascade' }).notNull(),
  accountName: text('account_name').notNull(),
  bankName: text('bank_name').notNull(),
  accountNumber: text('account_number').notNull(),
  ifscCode: text('ifsc_code').notNull(),
  branchName: text('branch_name'),
  isDefault: boolean('is_default').default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull()
})

export const productCategories = pgTable('product_categories', {
  id: uuid('id').defaultRandom().primaryKey(),
  companyId: uuid('company_id').references(() => companies.id, { onDelete: 'cascade' }).notNull(),
  name: text('name').notNull(),
  description: text('description'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull()
})

export const unitsOfMeasure = pgTable('units_of_measure', {
  id: uuid('id').defaultRandom().primaryKey(),
  companyId: uuid('company_id').references(() => companies.id, { onDelete: 'cascade' }).notNull(),
  name: text('name').notNull(),
  abbreviation: text('abbreviation').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull()
})

export const products = pgTable('products', {
  id: uuid('id').defaultRandom().primaryKey(),
  companyId: uuid('company_id').references(() => companies.id, { onDelete: 'cascade' }).notNull(),
  categoryId: uuid('category_id').references(() => productCategories.id),
  sku: text('sku'),
  name: text('name').notNull(),
  description: text('description'),
  hsnCode: text('hsn_code'),
  unitId: uuid('unit_id').references(() => unitsOfMeasure.id),
  
  // Paper & Board properties
  gsm: numeric('gsm', { precision: 8, scale: 2 }),
  bf: integer('bf'),
  sizeLength: numeric('size_length', { precision: 10, scale: 2 }),
  sizeWidth: numeric('size_width', { precision: 10, scale: 2 }),
  ply: integer('ply'),
  fluteType: text('flute_type'),
  paperType: text('paper_type'),

  // Pricing
  basePrice: numeric('base_price', { precision: 15, scale: 2 }).default('0'),
  taxRate: numeric('tax_rate', { precision: 5, scale: 2 }).default('18'),

  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
  syncVersion: integer('sync_version').default(0)
})

export const purchaseOrders = pgTable('purchase_orders', {
  id: uuid('id').defaultRandom().primaryKey(),
  companyId: uuid('company_id').references(() => companies.id, { onDelete: 'cascade' }).notNull(),
  vendorId: uuid('vendor_id').references(() => contacts.id).notNull(),
  poNumber: text('po_number').notNull(),
  orderDate: timestamp('order_date').notNull(),
  deliveryDate: timestamp('delivery_date'),
  status: text('status').default('draft').notNull(),
  subtotal: numeric('subtotal', { precision: 15, scale: 2 }).default('0').notNull(),
  taxAmount: numeric('tax_amount', { precision: 15, scale: 2 }).default('0').notNull(),
  totalAmount: numeric('total_amount', { precision: 15, scale: 2 }).default('0').notNull(),
  notes: text('notes'),
  createdBy: uuid('created_by').references(() => profiles.id),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
  syncVersion: integer('sync_version').default(0)
})

export const purchaseOrderItems = pgTable('purchase_order_items', {
  id: uuid('id').defaultRandom().primaryKey(),
  purchaseOrderId: uuid('purchase_order_id').references(() => purchaseOrders.id, { onDelete: 'cascade' }).notNull(),
  productId: uuid('product_id').references(() => products.id).notNull(),
  quantity: numeric('quantity', { precision: 12, scale: 4 }).notNull(),
  unitPrice: numeric('unit_price', { precision: 15, scale: 2 }).notNull(),
  taxRate: numeric('tax_rate', { precision: 5, scale: 2 }).default('0').notNull(),
  taxAmount: numeric('tax_amount', { precision: 15, scale: 2 }).default('0').notNull(),
  totalAmount: numeric('total_amount', { precision: 15, scale: 2 }).default('0').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull()
})

export const salesOrders = pgTable('sales_orders', {
  id: uuid('id').defaultRandom().primaryKey(),
  companyId: uuid('company_id').references(() => companies.id, { onDelete: 'cascade' }).notNull(),
  customerId: uuid('customer_id').references(() => contacts.id).notNull(),
  soNumber: text('so_number').notNull(),
  orderDate: timestamp('order_date').notNull(),
  deliveryDate: timestamp('delivery_date'),
  status: text('status').default('draft').notNull(),
  subtotal: numeric('subtotal', { precision: 15, scale: 2 }).default('0').notNull(),
  taxAmount: numeric('tax_amount', { precision: 15, scale: 2 }).default('0').notNull(),
  totalAmount: numeric('total_amount', { precision: 15, scale: 2 }).default('0').notNull(),
  notes: text('notes'),
  createdBy: uuid('created_by').references(() => profiles.id),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
  syncVersion: integer('sync_version').default(0)
})

export const salesOrderItems = pgTable('sales_order_items', {
  id: uuid('id').defaultRandom().primaryKey(),
  salesOrderId: uuid('sales_order_id').references(() => salesOrders.id, { onDelete: 'cascade' }).notNull(),
  productId: uuid('product_id').references(() => products.id).notNull(),
  quantity: numeric('quantity', { precision: 12, scale: 4 }).notNull(),
  unitPrice: numeric('unit_price', { precision: 15, scale: 2 }).notNull(),
  taxRate: numeric('tax_rate', { precision: 5, scale: 2 }).default('0').notNull(),
  taxAmount: numeric('tax_amount', { precision: 15, scale: 2 }).default('0').notNull(),
  totalAmount: numeric('total_amount', { precision: 15, scale: 2 }).default('0').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull()
})

export const locations = pgTable('locations', {
  id: uuid('id').defaultRandom().primaryKey(),
  companyId: uuid('company_id').references(() => companies.id, { onDelete: 'cascade' }).notNull(),
  name: text('name').notNull(),
  city: text('city'),
  phone: text('phone'),
  status: text('status'),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
  syncVersion: integer('sync_version').default(0)
})

export const salesPersons = pgTable('sales_persons', {
  id: uuid('id').defaultRandom().primaryKey(),
  companyId: uuid('company_id').references(() => companies.id, { onDelete: 'cascade' }).notNull(),
  name: text('name').notNull(),
  phone: text('phone'),
  status: text('status'),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
  syncVersion: integer('sync_version').default(0)
})

export const stockInwards = pgTable('stock_inwards', {
  id: uuid('id').defaultRandom().primaryKey(),
  companyId: uuid('company_id').references(() => companies.id, { onDelete: 'cascade' }).notNull(),
  voucherNo: text('voucher_no').notNull(),
  date: text('date'),
  accountName: text('account_name'),
  narration: text('narration'),
  items: jsonb('items'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
  syncVersion: integer('sync_version').default(0)
})

export const stockTransfers = pgTable('stock_transfers', {
  id: uuid('id').defaultRandom().primaryKey(),
  companyId: uuid('company_id').references(() => companies.id, { onDelete: 'cascade' }).notNull(),
  voucherNo: text('voucher_no').notNull(),
  date: text('date'),
  narration: text('narration'),
  items: jsonb('items'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
  syncVersion: integer('sync_version').default(0)
})

export const invoices = pgTable('invoices', {
  id: uuid('id').defaultRandom().primaryKey(),
  companyId: uuid('company_id').references(() => companies.id, { onDelete: 'cascade' }).notNull(),
  voucherNo: text('voucher_no').notNull(),
  date: text('date'),
  accountName: text('account_name'),
  narration: text('narration'),
  items: jsonb('items'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
  syncVersion: integer('sync_version').default(0)
})

export const deliveryOrders = pgTable('delivery_orders', {
  id: uuid('id').defaultRandom().primaryKey(),
  companyId: uuid('company_id').references(() => companies.id, { onDelete: 'cascade' }).notNull(),
  voucherNo: text('voucher_no').notNull(),
  invoiceNo: text('invoice_no').notNull(),
  date: text('date'),
  accountName: text('account_name'),
  vehicle: text('vehicle'),
  narration: text('narration'),
  items: jsonb('items'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
  syncVersion: integer('sync_version').default(0)
})

export const receipts = pgTable('receipts', {
  id: uuid('id').defaultRandom().primaryKey(),
  companyId: uuid('company_id').references(() => companies.id, { onDelete: 'cascade' }).notNull(),
  voucherNo: text('voucher_no').notNull(),
  date: text('date'),
  accountName: text('account_name'),
  narration: text('narration'),
  amount: numeric('amount', { precision: 15, scale: 2 }).default('0'),
  paymentMode: text('payment_mode'),
  refNo: text('ref_no'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
  syncVersion: integer('sync_version').default(0)
})

export const payments = pgTable('payments', {
  id: uuid('id').defaultRandom().primaryKey(),
  companyId: uuid('company_id').references(() => companies.id, { onDelete: 'cascade' }).notNull(),
  voucherNo: text('voucher_no').notNull(),
  date: text('date'),
  accountName: text('account_name'),
  narration: text('narration'),
  amount: numeric('amount', { precision: 15, scale: 2 }).default('0'),
  paymentMode: text('payment_mode'),
  refNo: text('ref_no'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
  syncVersion: integer('sync_version').default(0)
})

export const journalVouchers = pgTable('journal_vouchers', {
  id: uuid('id').defaultRandom().primaryKey(),
  companyId: uuid('company_id').references(() => companies.id, { onDelete: 'cascade' }).notNull(),
  voucherNo: text('voucher_no').notNull(),
  date: text('date'),
  narration: text('narration'),
  items: jsonb('items'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
  syncVersion: integer('sync_version').default(0)
})

export const staffUsers = pgTable('staff_users', {
  id: uuid('id').defaultRandom().primaryKey(),
  companyId: uuid('company_id').references(() => companies.id, { onDelete: 'cascade' }).notNull(),
  name: text('name').notNull(),
  username: text('username').notNull(),
  pin: text('pin').notNull(),
  role: text('role').notNull(),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
  syncVersion: integer('sync_version').default(0)
})

export const changeTracking = pgTable('change_tracking', {
  id: uuid('id').defaultRandom().primaryKey(),
  tableName: text('table_name').notNull(),
  recordId: uuid('record_id').notNull(),
  companyId: uuid('company_id'),
  operation: text('operation').notNull(), // 'INSERT' | 'UPDATE' | 'DELETE'
  syncVersion: integer('sync_version'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull()
})
