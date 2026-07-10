export const PAPER_TYPES = [
  'Kraft',
  'Duplex',
  'Chromo',
  'Maplitho',
  'Art Card',
  'Grey Board',
  'Writable Kraft',
  'Fluting Medium',
  'Test Liner'
] as const

export const FLUTE_TYPES = [
  'A',
  'B',
  'C',
  'E',
  'F',
  'BC',
  'BC-double-wall',
  'N'
] as const

export const GSM_RANGES = {
  min: 40,
  max: 600,
  step: 5
} as const

export const BF_VALUES = [14, 16, 18, 20, 22, 24, 28, 30, 32, 35, 40] as const

export const PLY_VALUES = [3, 5, 7, 9] as const

export const CONTACT_TYPES = ['customer', 'supplier', 'both'] as const

export const ORDER_STATUSES = {
  purchase: ['draft', 'pending', 'approved', 'sent', 'received', 'cancelled'],
  sales: ['draft', 'pending', 'approved', 'processing', 'shipped', 'delivered', 'cancelled']
} as const

export const ROLES = ['owner', 'admin', 'manager', 'operator', 'viewer'] as const
