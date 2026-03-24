import { useEffect, useState } from 'react'
import * as api from '../lib/api'
import { Plus, Users, Shield, Eye, EyeOff } from 'lucide-react'

export default function AdminSettings() {
  const [users, setUsers] = useState<api.AdminUserInfo[]>([])
  const [showCreate, setShowCreate] = useState(false)
  const [form, setForm] = useState({ username: '', email: '', password: '', role: 'Reviewer' })
  const [creating, setCreating] = useState(false)

  useEffect(() => { api.getUsers().then(setUsers).catch(() => {}) }, [])

  const handleCreate = async () => {
    setCreating(true)
    try {
      const user = await api.createUser(form)
      setUsers([...users, user])
      setShowCreate(false)
      setForm({ username: '', email: '', password: '', role: 'Reviewer' })
    } catch (e: any) { alert('Error: ' + e.message) }
    finally { setCreating(false) }
  }

  const toggleActive = async (user: api.AdminUserInfo) => {
    try {
      const updated = await api.updateUser(user.id, { isActive: !user.isActive })
      setUsers(users.map(u => u.id === user.id ? updated : u))
    } catch { alert('Error updating user') }
  }

  const changeRole = async (user: api.AdminUserInfo, role: string) => {
    try {
      const updated = await api.updateUser(user.id, { role })
      setUsers(users.map(u => u.id === user.id ? updated : u))
    } catch { alert('Error updating role') }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#0d0c2c]">Settings</h1>
          <p className="text-sm text-gray-500 mt-1">Manage admin users and system settings</p>
        </div>
      </div>

      {/* Users Section */}
      <div className="bg-white rounded-xl shadow-sm">
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center gap-3">
            <Users size={20} className="text-[#0d0c2c]" />
            <div>
              <h2 className="font-semibold">Admin Users</h2>
              <p className="text-sm text-gray-500">Manage who can access the admin panel</p>
            </div>
          </div>
          <button onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 bg-[#FFD200] text-[#0d0c2c] px-4 py-2 rounded-lg text-sm font-semibold hover:bg-[#E87C1E] hover:text-white transition-colors">
            <Plus size={16} /> Invite User
          </button>
        </div>

        {showCreate && (
          <div className="p-6 bg-yellow-50 border-b">
            <h3 className="font-semibold mb-3">Create New User</h3>
            <div className="grid grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Username *</label>
                <input className="w-full border rounded-lg p-2.5 text-sm" placeholder="john.doe" value={form.username}
                  onChange={e => setForm(f => ({ ...f, username: e.target.value }))} />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Email *</label>
                <input className="w-full border rounded-lg p-2.5 text-sm" type="email" placeholder="john@example.com" value={form.email}
                  onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Password *</label>
                <input className="w-full border rounded-lg p-2.5 text-sm" type="password" placeholder="Temporary password" value={form.password}
                  onChange={e => setForm(f => ({ ...f, password: e.target.value }))} />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Role</label>
                <select className="w-full border rounded-lg p-2.5 text-sm" value={form.role}
                  onChange={e => setForm(f => ({ ...f, role: e.target.value }))}>
                  <option value="Admin">Admin</option>
                  <option value="Reviewer">Reviewer</option>
                </select>
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <button onClick={handleCreate} disabled={!form.username || !form.email || !form.password || creating}
                className="bg-[#0d0c2c] text-white px-4 py-2 rounded-lg text-sm font-semibold disabled:opacity-50">
                {creating ? 'Creating...' : 'Create User'}
              </button>
              <button onClick={() => setShowCreate(false)} className="border px-4 py-2 rounded-lg text-sm">Cancel</button>
            </div>
          </div>
        )}

        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left p-4 text-xs font-semibold text-gray-600 uppercase">Username</th>
              <th className="text-left p-4 text-xs font-semibold text-gray-600 uppercase">Email</th>
              <th className="text-left p-4 text-xs font-semibold text-gray-600 uppercase">Role</th>
              <th className="text-left p-4 text-xs font-semibold text-gray-600 uppercase">Created</th>
              <th className="text-center p-4 text-xs font-semibold text-gray-600 uppercase">Status</th>
              <th className="text-right p-4 text-xs font-semibold text-gray-600 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map(user => (
              <tr key={user.id} className={`border-b hover:bg-gray-50 ${!user.isActive ? 'opacity-50' : ''}`}>
                <td className="p-4 text-sm font-medium">{user.username}</td>
                <td className="p-4 text-sm text-gray-600">{user.email}</td>
                <td className="p-4">
                  <select className="text-xs border rounded px-2 py-1" value={user.role}
                    onChange={e => changeRole(user, e.target.value)}>
                    <option value="Admin">Admin</option>
                    <option value="Reviewer">Reviewer</option>
                  </select>
                </td>
                <td className="p-4 text-sm text-gray-500">{new Date(user.createdDate).toLocaleDateString('en-NZ')}</td>
                <td className="p-4 text-center">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${user.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {user.isActive ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="p-4 text-right">
                  <button onClick={() => toggleActive(user)}
                    className="text-gray-400 hover:text-[#0d0c2c] p-1" title={user.isActive ? 'Deactivate' : 'Activate'}>
                    {user.isActive ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </td>
              </tr>
            ))}
            {users.length === 0 && (
              <tr><td colSpan={6} className="p-8 text-center text-gray-400">No users yet. Create one above.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
