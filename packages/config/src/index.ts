export const env = {
  SUPABASE_URL: process.env.SUPABASE_URL || 'https://adcxvmkzljfuvknmwbvy.supabase.co',
  SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY || 'sb_publishable_ks0CAyO_SD9EmCaDdhmZuw_OhvK9OFS',
  SQLITE_DB_NAME: process.env.SQLITE_DB_NAME || 'papsoft.db',
  IS_DEV: process.env.NODE_ENV === 'development',
  API_VERSION: 'v1'
} as const

export type Env = typeof env
export default env
