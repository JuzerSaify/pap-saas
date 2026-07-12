'use client'

import React, { useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'
import { Users, UserPlus, Building, Shield, Power, LogOut, Loader2, ArrowLeft } from 'lucide-react'

// Browser client factory
const supabase = createClient(
  'https://adcxvmkzljfuvknmwbvy.supabase.co',
  'sb_publishable_ks0CAyO_SD9EmCaDdhmZuw_OhvK9OFS'
)

interface Company {
  id: string
  name: string
  industry?: string
}

interface Member {
  id: string          // user_company_roles.id
  user_id: string     // snake_case — matches DB column
  role: string
  is_active: boolean
  profile?: {
    full_name: string
    avatar_url?: string
    preferences?: any
  }
}

export default function DashboardPage() {
  const [session, setSession] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [company, setCompany] = useState<Company | null>(null)
  const [roleInCompany, setRoleInCompany] = useState<string>('')
  const [members, setMembers] = useState<Member[]>([])

  // Create Company form state
  const [companyName, setCompanyName] = useState('')
  const [creatingCompany, setCreatingCompany] = useState(false)

  // Add Member form state
  const [newMemberName, setNewMemberName] = useState('')
  const [newMemberEmail, setNewMemberEmail] = useState('')
  const [newMemberRole, setNewMemberRole] = useState('manager')
  const [addingMember, setAddingMember] = useState(false)

  const [errorMsg, setErrorMsg] = useState('')
  const [successMsg, setSuccessMsg] = useState('')

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      if (session) {
        loadCompanyAndMembers(session.user)
      } else {
        setLoading(false)
      }
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      if (session) {
        loadCompanyAndMembers(session.user)
      } else {
        setCompany(null)
        setMembers([])
        setLoading(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const loadCompanyAndMembers = async (currUser: any) => {
    try {
      setLoading(true)
      setErrorMsg('')

      // 1. Fetch user's active company role — use snake_case column names
      const { data: roles, error: rolesErr } = await supabase
        .from('user_company_roles')
        .select('*')
        .eq('user_id', currUser.id)
        .eq('is_active', true)

      if (rolesErr) throw rolesErr

      if (!roles || roles.length === 0) {
        setCompany(null)
        setLoading(false)
        return
      }

      const activeRole = roles[0]
      setRoleInCompany(activeRole.role)

      // 2. Fetch company details
      const { data: compData, error: compErr } = await supabase
        .from('companies')
        .select('*')
        .eq('id', activeRole.company_id)
        .single()

      if (compErr) throw compErr
      setCompany(compData)

      // 3. Fetch all members of this company
      const { data: allRoles, error: allRolesErr } = await supabase
        .from('user_company_roles')
        .select('*')
        .eq('company_id', activeRole.company_id)

      if (allRolesErr) throw allRolesErr

      // 4. Fetch profiles for each member
      const memberList: Member[] = []
      for (const roleRow of (allRoles || [])) {
        const { data: profData } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', roleRow.user_id)
          .single()

        memberList.push({
          id: roleRow.id,
          user_id: roleRow.user_id,
          role: roleRow.role,
          is_active: roleRow.is_active,
          profile: profData ? {
            full_name: profData.full_name,
            avatar_url: profData.avatar_url,
            preferences: profData.preferences
          } : {
            full_name: 'Unknown Member'
          }
        })
      }

      setMembers(memberList)
    } catch (err: any) {
      console.error('Dashboard load error:', err)
      setErrorMsg(err.message || 'Error loading workspace data.')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateCompany = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!session || !companyName.trim()) return
    setCreatingCompany(true)
    setErrorMsg('')
    setSuccessMsg('')

    try {
      // 1. Upsert profile if missing
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', session.user.id)
        .single()

      if (!existingProfile) {
        const { error: profErr } = await supabase
          .from('profiles')
          .insert({
            id: session.user.id,
            full_name: session.user.user_metadata?.full_name || session.user.email.split('@')[0],
            avatar_url: session.user.user_metadata?.avatar_url || ''
          })
        if (profErr) throw profErr
      }

      // 2. Insert new company
      const { data: newComp, error: compErr } = await supabase
        .from('companies')
        .insert({
          name: companyName.trim(),
          industry: 'paper_board'
        })
        .select()
        .single()

      if (compErr) throw compErr

      // 3. Create owner role mapping — snake_case column names
      const { error: roleErr } = await supabase
        .from('user_company_roles')
        .insert({
          user_id: session.user.id,
          company_id: newComp.id,
          role: 'owner',
          is_active: true
        })

      if (roleErr) throw roleErr

      setSuccessMsg(`Company "${companyName}" registered successfully!`)
      setCompanyName('')
      await loadCompanyAndMembers(session.user)
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to register company workspace.')
    } finally {
      setCreatingCompany(false)
    }
  }

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!company || !newMemberName.trim() || !newMemberEmail.trim()) return

    if (roleInCompany !== 'owner' && roleInCompany !== 'admin') {
      alert('Only Company Owners or Admins are authorized to register new members.')
      return
    }

    setAddingMember(true)
    setErrorMsg('')
    setSuccessMsg('')

    try {
      // Create placeholder profile
      const generatedProfileId = 'user-' + Math.random().toString(36).substr(2, 9)

      const { error: profErr } = await supabase
        .from('profiles')
        .insert({
          id: generatedProfileId,
          full_name: newMemberName.trim(),
          preferences: { email: newMemberEmail.trim().toLowerCase() }
        })

      if (profErr) throw profErr

      // Map into company — snake_case column names
      const { error: roleErr } = await supabase
        .from('user_company_roles')
        .insert({
          user_id: generatedProfileId,
          company_id: company.id,
          role: newMemberRole,
          is_active: true
        })

      if (roleErr) throw roleErr

      setSuccessMsg(`Member "${newMemberName}" registered as ${newMemberRole}!`)
      setNewMemberName('')
      setNewMemberEmail('')
      setNewMemberRole('manager')
      await loadCompanyAndMembers(session.user)
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to add company member.')
    } finally {
      setAddingMember(false)
    }
  }

  const handleToggleMemberStatus = async (member: Member) => {
    if (roleInCompany !== 'owner' && roleInCompany !== 'admin') {
      alert('Only Company Owners or Admins can modify member status.')
      return
    }
    if (member.user_id === session.user.id) {
      alert('You cannot disable your own active workspace session.')
      return
    }

    try {
      const { error } = await supabase
        .from('user_company_roles')
        .update({ is_active: !member.is_active })
        .eq('id', member.id)

      if (error) throw error
      await loadCompanyAndMembers(session.user)
    } catch (err: any) {
      alert(err.message || 'Failed to update member status.')
    }
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    window.location.href = '/'
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-6 h-6 text-[#22b2ba] animate-spin" />
          <span className="text-[10px] font-bold text-[#71717a] uppercase tracking-wider">Loading Cloud Portal...</span>
        </div>
      </div>
    )
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-[#fafafa] flex flex-col justify-center items-center p-4 font-sans select-none">
        <div className="w-full max-w-sm border border-[#e4e4e7] p-8 rounded-sm bg-white text-center">
          <Shield className="w-10 h-10 text-neutral-400 mx-auto mb-3" />
          <h1 className="text-lg font-bold text-black uppercase tracking-wider">Access Restrained</h1>
          <p className="text-xs text-[#71717a] mt-2 mb-6 leading-relaxed">
            Please authenticate your account credentials via the Portal Login to view your workspace.
          </p>
          <a
            href="/login"
            className="w-full h-10 bg-black hover:bg-neutral-800 text-white font-bold text-xs rounded-sm transition-colors cursor-pointer flex items-center justify-center uppercase tracking-wider"
          >
            Portal Log In
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#fafafa] text-neutral-800 font-sans flex flex-col select-none">

      {/* Header bar */}
      <header className="h-16 bg-white border-b border-[#e4e4e7] px-8 flex items-center justify-between shadow-sm shrink-0">
        <div className="flex items-center gap-3">
          <a href="/" className="p-1 hover:bg-[#fafafa] rounded-sm transition-colors" title="Back to Home">
            <ArrowLeft className="w-4 h-4 text-[#71717a]" />
          </a>
          <span className="font-extrabold text-xs uppercase tracking-widest text-[#22b2ba]">
            Cloud Workspace Dashboard
          </span>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <div className="text-[10px] text-[#71717a] font-bold uppercase tracking-wider">Logged In As</div>
            <div className="text-xs font-semibold text-black">{session.user.email}</div>
          </div>
          <button
            onClick={handleSignOut}
            className="h-8 w-8 rounded-sm border border-[#e4e4e7] hover:bg-red-50 hover:text-red-600 transition-colors flex items-center justify-center cursor-pointer"
            title="Sign Out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main Body */}
      <main className="flex-1 max-w-6xl w-full mx-auto p-8 flex flex-col gap-8 overflow-y-auto">

        {errorMsg && (
          <div className="p-3.5 bg-red-50 border border-red-200 text-red-700 text-xs font-semibold rounded-sm">
            {errorMsg}
          </div>
        )}
        {successMsg && (
          <div className="p-3.5 bg-green-50 border border-green-200 text-green-700 text-xs font-semibold rounded-sm">
            {successMsg}
          </div>
        )}

        {!company ? (
          /* NO COMPANY - REGISTER SCREEN */
          <div className="max-w-md mx-auto w-full border border-[#e4e4e7] bg-white p-8 rounded-sm shadow-sm text-center my-12">
            <Building className="w-12 h-12 text-[#22b2ba] mx-auto mb-4" />
            <h2 className="text-lg font-bold text-black uppercase tracking-wider">Register Company Workspace</h2>
            <p className="text-xs text-[#71717a] mt-2 mb-6 leading-relaxed">
              No active company workspace found for this account. Register your manufacturing, wholesale or distribution company to initialize.
            </p>
            <form onSubmit={handleCreateCompany} className="space-y-4 text-left">
              <div>
                <label className="block text-[9px] font-bold text-[#71717a] mb-1.5 uppercase tracking-wider">Company Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Paramount Paper & Board Mills"
                  value={companyName}
                  onChange={e => setCompanyName(e.target.value)}
                  className="w-full h-10 border border-[#e4e4e7] px-3 rounded-sm text-xs focus:outline-none focus:border-[#22b2ba] bg-[#fafafa]"
                />
              </div>
              <button
                type="submit"
                disabled={creatingCompany}
                className="w-full h-10 bg-[#54e0e7] hover:bg-[#3cd5dc] text-[#09090b] font-bold text-xs rounded-sm transition-colors cursor-pointer uppercase tracking-wider flex items-center justify-center disabled:opacity-50"
              >
                {creatingCompany ? 'Registering...' : 'Register Workspace'}
              </button>
            </form>
          </div>
        ) : (
          /* ACTIVE COMPANY VIEW */
          <div className="flex flex-col lg:flex-row gap-8">

            {/* Left Column: Member List */}
            <div className="flex-1 flex flex-col gap-6">
              <div className="border border-[#e4e4e7] bg-white rounded-sm p-6 shadow-sm">
                <div className="flex items-center justify-between pb-4 border-b border-[#f4f4f5]">
                  <div>
                    <h3 className="text-lg font-extrabold text-black">{company.name}</h3>
                    <p className="text-[10px] text-[#71717a] mt-0.5 font-bold uppercase tracking-wider">
                      Workspace Members — {members.length} Total
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[9px] font-bold text-[#71717a] uppercase tracking-wider">Your Role:</span>
                    <span className="px-2 py-0.5 text-[9px] font-bold bg-[#54e0e7]/10 text-[#1fa2a8] border border-[#54e0e7]/20 rounded-full uppercase">
                      {roleInCompany}
                    </span>
                  </div>
                </div>

                <div className="overflow-x-auto mt-4">
                  <table className="w-full text-[11px] text-left border-collapse">
                    <thead>
                      <tr className="border-b border-[#f4f4f5] text-[9px] font-bold text-[#71717a] uppercase tracking-wider">
                        <th className="py-2.5 font-bold">Full Name</th>
                        <th className="py-2.5 font-bold">Role</th>
                        <th className="py-2.5 font-bold">Status</th>
                        {(roleInCompany === 'owner' || roleInCompany === 'admin') && (
                          <th className="py-2.5 font-bold text-right">Actions</th>
                        )}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#f4f4f5]">
                      {members.map(member => (
                        <tr key={member.id} className="hover:bg-[#fafafa]/50 transition-colors">
                          <td className="py-3 font-semibold text-black">
                            {member.profile?.full_name}
                            {member.profile?.preferences?.email && (
                              <span className="block text-[9px] text-[#a1a1aa] font-medium mt-0.5">
                                {member.profile.preferences.email}
                              </span>
                            )}
                          </td>
                          <td className="py-3 uppercase tracking-wider font-bold text-[#71717a]">
                            <span className="flex items-center gap-1.5">
                              <Shield className="w-3.5 h-3.5 text-neutral-400" />
                              {member.role}
                            </span>
                          </td>
                          <td className="py-3">
                            <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                              member.is_active
                                ? 'bg-green-50 border border-green-200 text-green-700'
                                : 'bg-red-50 border border-red-200 text-red-700'
                            }`}>
                              <span className={`w-1 h-1 rounded-full ${member.is_active ? 'bg-green-500' : 'bg-red-500'}`} />
                              {member.is_active ? 'Active' : 'Disabled'}
                            </span>
                          </td>
                          {(roleInCompany === 'owner' || roleInCompany === 'admin') && (
                            <td className="py-3 text-right">
                              <button
                                onClick={() => handleToggleMemberStatus(member)}
                                disabled={member.user_id === session.user.id}
                                className={`h-7 px-3 border border-[#e4e4e7] rounded-sm text-[10px] font-bold uppercase transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed ${
                                  member.is_active
                                    ? 'hover:bg-red-50 hover:text-red-600 hover:border-red-200'
                                    : 'hover:bg-green-50 hover:text-green-600 hover:border-green-200'
                                }`}
                              >
                                {member.is_active ? 'Disable' : 'Enable'}
                              </button>
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Right Column: Register Member Form */}
            {(roleInCompany === 'owner' || roleInCompany === 'admin') && (
              <div className="w-full lg:w-80 shrink-0">
                <div className="border border-[#e4e4e7] bg-white rounded-sm p-6 shadow-sm">
                  <h4 className="text-xs font-bold text-black uppercase tracking-wider flex items-center gap-1.5 pb-3 border-b border-[#f4f4f5]">
                    <UserPlus className="w-4 h-4 text-[#22b2ba]" />
                    Register New Member
                  </h4>
                  <form onSubmit={handleAddMember} className="space-y-4 pt-4">
                    <div>
                      <label className="block text-[9px] font-bold text-[#71717a] mb-1 uppercase tracking-wider">Full Name</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Haris Khan"
                        value={newMemberName}
                        onChange={e => setNewMemberName(e.target.value)}
                        className="w-full h-9 border border-[#e4e4e7] px-3 rounded-sm text-xs focus:outline-none focus:border-[#22b2ba] bg-[#fafafa]"
                      />
                    </div>
                    <div>
                      <label className="block text-[9px] font-bold text-[#71717a] mb-1 uppercase tracking-wider">Email Address</label>
                      <input
                        type="email"
                        required
                        placeholder="e.g. haris@company.com"
                        value={newMemberEmail}
                        onChange={e => setNewMemberEmail(e.target.value)}
                        className="w-full h-9 border border-[#e4e4e7] px-3 rounded-sm text-xs focus:outline-none focus:border-[#22b2ba] bg-[#fafafa]"
                      />
                    </div>
                    <div>
                      <label className="block text-[9px] font-bold text-[#71717a] mb-1 uppercase tracking-wider">Role / Access Level</label>
                      <select
                        value={newMemberRole}
                        onChange={e => setNewMemberRole(e.target.value)}
                        className="w-full h-9 border border-[#e4e4e7] px-3 rounded-sm text-xs focus:outline-none focus:border-[#22b2ba] bg-[#fafafa] uppercase font-bold"
                      >
                        <option value="admin">Admin</option>
                        <option value="manager">Manager</option>
                        <option value="operator">Operator / Sales</option>
                        <option value="viewer">Viewer</option>
                      </select>
                    </div>
                    <button
                      type="submit"
                      disabled={addingMember}
                      className="w-full h-9 bg-black hover:bg-neutral-800 text-white font-bold text-xs rounded-sm transition-all cursor-pointer uppercase tracking-wider flex items-center justify-center gap-1.5 disabled:opacity-50"
                    >
                      <UserPlus className="w-3.5 h-3.5" />
                      {addingMember ? 'Registering...' : 'Register User'}
                    </button>
                  </form>
                </div>
              </div>
            )}

          </div>
        )}

      </main>
    </div>
  )
}
