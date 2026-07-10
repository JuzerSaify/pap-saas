import { getSupabaseClient } from '@papsoft/auth'
import { sqliteSchema } from '@papsoft/database'
import { eq, gt, and } from 'drizzle-orm'

export class SyncManager {
  private localDb: any
  private lastSyncedVersion: number = 0

  constructor(localDb: any) {
    this.localDb = localDb
    this.loadLastSyncedVersion()
  }

  private loadLastSyncedVersion() {
    try {
      // Find metadata or config
      // Simple implementation: check local db metadata
      const res = this.localDb.select().from(sqliteSchema.companies).all()
      if (res && res.length > 0) {
        this.lastSyncedVersion = Math.max(...res.map((c: any) => c.syncVersion || 0), 0)
      }
    } catch {
      this.lastSyncedVersion = 0
    }
  }

  // Push local modifications to Supabase
  async pushLocalChanges(): Promise<{ success: boolean; pushedCount: number }> {
    const supabase = getSupabaseClient()
    const session = await supabase.auth.getSession()
    if (!session.data.session) {
      return { success: false, pushedCount: 0 }
    }

    const queuedChanges = this.localDb
      .select()
      .from(sqliteSchema.syncQueue)
      .all()

    let pushedCount = 0

    for (const change of queuedChanges) {
      const { tableName, recordId, operation, payload } = change
      const record = payload ? JSON.parse(payload) : null

      try {
        if (operation === 'INSERT' || operation === 'UPDATE') {
          // Perform upsert on Supabase
          const { error } = await supabase
            .from(tableName)
            .upsert({ ...record, id: recordId })

          if (error) throw error
        } else if (operation === 'DELETE') {
          const { error } = await supabase
            .from(tableName)
            .delete()
            .eq('id', recordId)

          if (error) throw error
        }

        // Successfully pushed, remove from local queue
        this.localDb
          .delete(sqliteSchema.syncQueue)
          .where(eq(sqliteSchema.syncQueue.id, change.id))
          .run()

        pushedCount++
      } catch (err) {
        console.error(`Failed to sync change for ${tableName} (${recordId}):`, err)
        // Stop pushing to preserve dependency order on failures
        return { success: false, pushedCount }
      }
    }

    return { success: true, pushedCount }
  }

  // Pull modifications from Supabase
  async pullRemoteChanges(): Promise<{ success: boolean; pulledCount: number }> {
    const supabase = getSupabaseClient()
    const session = await supabase.auth.getSession()
    if (!session.data.session) {
      return { success: false, pulledCount: 0 }
    }

    try {
      // Query server change log for modifications since last sync version
      const { data: remoteChanges, error } = await supabase
        .from('change_tracking')
        .select('*')
        .gt('sync_version', this.lastSyncedVersion)
        .order('sync_version', { ascending: true })

      if (error) throw error
      if (!remoteChanges || remoteChanges.length === 0) {
        return { success: true, pulledCount: 0 }
      }

      let pulledCount = 0

      for (const change of remoteChanges) {
        const { table_name, record_id, operation, sync_version } = change

        if (operation === 'INSERT' || operation === 'UPDATE') {
          // Fetch the full record from the server
          const { data: record, error: fetchErr } = await supabase
            .from(table_name)
            .select('*')
            .eq('id', record_id)
            .single()

          if (fetchErr || !record) continue

          // Map snake_case server variables to local JS format if needed,
          // or just write directly to local db using SQL/Drizzle
          const mappedRecord: Record<string, any> = {}
          for (const key of Object.keys(record)) {
            // Map snake_case key to camelCase for Drizzle
            const camelKey = key.replace(/_([a-z])/g, (g) => g[1].toUpperCase())
            mappedRecord[camelKey] = record[key]
          }

          // Write to local SQLite
          const localTable = (sqliteSchema as any)[table_name]
          if (localTable) {
            this.localDb
              .insert(localTable)
              .values({ ...mappedRecord, syncVersion: sync_version })
              .onConflictDoUpdate({
                target: localTable.id,
                set: { ...mappedRecord, syncVersion: sync_version }
              })
              .run()
          }
        } else if (operation === 'DELETE') {
          const localTable = (sqliteSchema as any)[table_name]
          if (localTable) {
            this.localDb
              .delete(localTable)
              .where(eq(localTable.id, record_id))
              .run()
          }
        }

        this.lastSyncedVersion = sync_version
        pulledCount++
      }

      return { success: true, pulledCount }
    } catch (err) {
      console.error('Failed to pull remote changes:', err)
      return { success: false, pulledCount: 0 }
    }
  }

  // Trigger both push and pull
  async sync(): Promise<{ success: boolean; pushed: number; pulled: number }> {
    const pushRes = await this.pushLocalChanges()
    const pullRes = await this.pullRemoteChanges()
    return {
      success: pushRes.success && pullRes.success,
      pushed: pushRes.pushedCount,
      pulled: pullRes.pulledCount
    }
  }
}
