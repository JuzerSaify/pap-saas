import { z } from 'zod'
import { PAPER_TYPES, FLUTE_TYPES, BF_VALUES, PLY_VALUES } from './constants.js'

export const companySchema = z.object({
  name: z.string().min(2, 'Company name is required (min 2 characters)'),
  legalName: z.string().optional().nullable(),
  gstin: z.string().regex(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/, 'Invalid GSTIN format').optional().nullable(),
  pan: z.string().regex(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/, 'Invalid PAN format').optional().nullable(),
  phone: z.string().optional().nullable(),
  email: z.string().email('Invalid email address').optional().nullable(),
  address: z.record(z.any()).optional().nullable()
})

export const contactSchema = z.object({
  type: z.enum(['customer', 'supplier', 'both']),
  name: z.string().min(2, 'Name is required'),
  legalName: z.string().optional().nullable(),
  gstin: z.string().optional().nullable(),
  pan: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  email: z.string().email().or(z.literal('')).optional().nullable(),
  website: z.string().url().or(z.literal('')).optional().nullable(),
  creditLimit: z.number().min(0).default(0),
  creditDays: z.number().int().min(0).default(0),
  openingBalance: z.number().default(0),
  notes: z.string().optional().nullable()
})

export const productSchema = z.object({
  sku: z.string().optional().nullable(),
  name: z.string().min(2, 'Product name is required'),
  description: z.string().optional().nullable(),
  hsnCode: z.string().optional().nullable(),
  unitId: z.string().uuid().optional().nullable(),
  categoryId: z.string().uuid().optional().nullable(),
  gsm: z.number().min(10).max(1000).optional().nullable(),
  bf: z.enum(BF_VALUES.map(String) as [string, ...string[]]).or(z.number()).optional().nullable(),
  sizeLength: z.number().min(0).optional().nullable(),
  sizeWidth: z.number().min(0).optional().nullable(),
  ply: z.enum(PLY_VALUES.map(String) as [string, ...string[]]).or(z.number()).optional().nullable(),
  fluteType: z.enum(FLUTE_TYPES).optional().nullable(),
  paperType: z.enum(PAPER_TYPES).optional().nullable(),
  basePrice: z.number().min(0).default(0),
  taxRate: z.number().min(0).max(100).default(18)
})

export const orderItemSchema = z.object({
  productId: z.string().uuid(),
  quantity: z.number().positive('Quantity must be greater than 0'),
  unitPrice: z.number().min(0, 'Unit price cannot be negative'),
  taxRate: z.number().min(0).max(100).default(0)
})

export const orderSchema = z.object({
  contactId: z.string().uuid(),
  orderNumber: z.string().min(1, 'Order number is required'),
  orderDate: z.string(),
  deliveryDate: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  items: z.array(orderItemSchema).min(1, 'Order must contain at least one item')
})
