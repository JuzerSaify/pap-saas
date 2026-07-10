import { ROLES, CONTACT_TYPES, PAPER_TYPES, FLUTE_TYPES } from './constants.js'

export type Role = typeof ROLES[number]
export type ContactType = typeof CONTACT_TYPES[number]
export type PaperType = typeof PAPER_TYPES[number]
export type FluteType = typeof FLUTE_TYPES[number]

export interface Company {
  id: string
  name: string
  legalName?: string | null
  industry: string
  gstin?: string | null
  pan?: string | null
  address?: Record<string, any> | null
  phone?: string | null
  email?: string | null
  logoUrl?: string | null
  settings?: Record<string, any> | null
  isActive: boolean
  createdAt: string
  updatedAt: string
  deletedAt?: string | null
  syncVersion: number
}

export interface Profile {
  id: string
  fullName: string
  phone?: string | null
  avatarUrl?: string | null
  preferences?: Record<string, any> | null
  createdAt: string
  updatedAt: string
}

export interface UserCompanyRole {
  id: string
  userId: string
  companyId: string
  role: Role
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface Contact {
  id: string
  companyId: string
  type: ContactType
  name: string
  legalName?: string | null
  gstin?: string | null
  pan?: string | null
  phone?: string | null
  email?: string | null
  website?: string | null
  creditLimit: number
  creditDays: number
  openingBalance: number
  notes?: string | null
  isActive: boolean
  createdAt: string
  updatedAt: string
  deletedAt?: string | null
  syncVersion: number
}

export interface ContactAddress {
  id: string
  contactId: string
  type: 'billing' | 'shipping' | 'both'
  addressLine1: string
  addressLine2?: string | null
  city: string
  state: string
  postalCode: string
  country: string
  isDefault: boolean
  createdAt: string
  updatedAt: string
}

export interface ContactBankAccount {
  id: string
  contactId: string
  accountName: string
  bankName: string
  accountNumber: string
  ifscCode: string
  branchName?: string | null
  isDefault: boolean
  createdAt: string
  updatedAt: string
}

export interface ProductCategory {
  id: string
  companyId: string
  name: string
  description?: string | null
  createdAt: string
  updatedAt: string
}

export interface UnitOfMeasure {
  id: string
  companyId: string
  name: string
  abbreviation: string
  createdAt: string
  updatedAt: string
}

export interface Product {
  id: string
  companyId: string
  categoryId?: string | null
  sku?: string | null
  name: string
  description?: string | null
  hsnCode?: string | null
  unitId?: string | null
  gsm?: number | null
  bf?: number | null
  sizeLength?: number | null
  sizeWidth?: number | null
  ply?: number | null
  fluteType?: string | null
  paperType?: string | null
  basePrice: number
  taxRate: number
  isActive: boolean
  createdAt: string
  updatedAt: string
  deletedAt?: string | null
  syncVersion: number
}
