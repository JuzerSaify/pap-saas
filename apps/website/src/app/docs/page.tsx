import React from 'react'

export default function DocsPage() {
  const sections = [
    {
      title: 'Introduction',
      content: 'PAPSoft ERP is a high-performance, offline-first operating system designed for paper mills, corrugated box converters, board distributors, and wholesale traders. By utilizing local SQLite storage, the desktop application remains fully functional even in areas with poor internet connectivity, syncing all records automatically when online.'
    },
    {
      title: 'Database Architecture',
      content: 'The application uses a dual-database model: SQLite for local storage and Supabase PostgreSQL for cloud sync. The Drizzle ORM schemas maintain data parity across both platforms, mapping UUID identifiers and timestamps to resolve conflicts. The system operates on a Row-Level Security (RLS) paradigm ensuring data isolation between companies.'
    },
    {
      title: 'Reconciliation & Conflict Resolution',
      content: 'Data replication is driven by local change queues (sync_queue) and server-side tracking (change_tracking). When a device goes online, it pushes local queue payloads sequentially. The server assigns an incremental sync_version sequence. The client then pulls modifications containing higher sync versions and updates SQLite. Conflicts are resolved on a Last-Write-Wins (LWW) basis using update timestamps.'
    }
  ]

  return (
    <div className="min-h-screen bg-white text-[#09090b] flex flex-col justify-between">
      {/* Header */}
      <header className="h-20 border-b border-[#e4e4e7] flex items-center justify-between px-8 w-full">
        <a href="/" className="font-bold text-sm tracking-wider uppercase">PAPSoft SaaS</a>
        <nav className="flex items-center gap-6">
          <a href="/docs" className="text-xs text-[#09090b] font-medium transition-colors">Documentation</a>
          <a href="/pricing" className="text-xs text-[#71717a] hover:text-[#09090b] transition-colors">Pricing</a>
          <a href="/login" className="h-9 px-4 text-xs bg-[#09090b] text-[#fafafa] font-medium rounded-sm hover:bg-[#27272a] transition-colors cursor-pointer flex items-center justify-center">
            Portal Log In
          </a>
        </nav>
      </header>

      {/* Main Docs Content */}
      <main className="flex-1 max-w-4xl mx-auto px-8 py-16 w-full flex gap-12">
        {/* Quick Sidebar */}
        <aside className="w-48 hidden md:block shrink-0">
          <h4 className="text-xs font-bold text-[#09090b] uppercase tracking-wider mb-4">Core Guide</h4>
          <ul className="space-y-3 text-xs text-[#71717a]">
            <li><a href="#introduction" className="hover:text-[#09090b]">Introduction</a></li>
            <li><a href="#database-architecture" className="hover:text-[#09090b]">Database Architecture</a></li>
            <li><a href="#reconciliation--conflict-resolution" className="hover:text-[#09090b]">Sync & Replication</a></li>
          </ul>
        </aside>

        {/* Content */}
        <div className="flex-1 space-y-12">
          {sections.map((sec) => (
            <section key={sec.title} id={sec.title.toLowerCase().replace(/ & /g, '-').replace(/ /g, '-')} className="space-y-4">
              <h2 className="text-xl font-bold tracking-tight text-[#09090b]">{sec.title}</h2>
              <p className="text-xs text-[#71717a] leading-relaxed">{sec.content}</p>
            </section>
          ))}
        </div>
      </main>

      {/* Footer */}
      <footer className="h-20 border-t border-[#e4e4e7] flex items-center justify-between px-8 w-full text-xs text-[#71717a]">
        <span>© {new Date().getFullYear()} PAPSoft. All rights reserved.</span>
      </footer>
    </div>
  )
}
