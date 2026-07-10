// Shared type definitions used across all sub-tab components

export interface LocationRecord {
  id: number
  name: string
  city: string
  phone: string
  status?: 'Active' | 'Postponed'
}

export interface SalesPersonRecord {
  id: number
  name: string
  phone: string
  status?: 'Active' | 'Postponed'
}

export const HEAD_CLASSIFICATIONS: Record<string, string[]> = {
  assets: [
    'Sundry Debtors (Customer)',
    'Bank Account',
    'Cash-in-hand',
    'Stock-in-hand',
    'Other Current Assets'
  ],
  liabilities: [
    'Sundry Creditors (Supplier)',
    'Duties & Taxes (GST)',
    'Secured Loans',
    'Unsecured Loans',
    'Provisions'
  ],
  equity: [
    'Capital Account',
    'Reserves & Surplus'
  ],
  revenue: [
    'Sales Account',
    'Direct Incomes',
    'Indirect Incomes'
  ],
  expenses: [
    'Purchase Account',
    'Direct Expenses (Freight/Power)',
    'Indirect Expenses (Admin/Salaries)'
  ]
}
