import { useEffect, useState } from 'react'
import * as api from '../lib/api'
import { useStore } from '../store'
import { Plus, Edit2, Save } from 'lucide-react'

export default function DocumentManagement() {
  const documentTypes = useStore(s => s.documentTypes)
  const setDocumentTypes = useStore(s => s.setDocumentTypes)
  const [editing, setEditing] = useState<number | null>(null)
  const [showNew, setShowNew] = useState(false)
  const [form, setForm] = useState({ name: '', description: '', isRequired: false, appliesTo: 'Applicant', validityMonths: '', sortOrder: 0, isActive: true })

  useEffect(() => { api.getDocumentTypes().then(setDocumentTypes) }, [])

  const resetForm = () => setForm({ name: '', description: '', isRequired: false, appliesTo: 'Applicant', validityMonths: '', sortOrder: 0, isActive: true })

  const handleCreate = async () => {
    const result = await api.createDocumentType({ ...form, validityMonths: form.validityMonths ? parseInt(form.validityMonths) : undefined })
    setDocumentTypes([...documentTypes, result])
    setShowNew(false)
    resetForm()
  }

  const handleUpdate = async (id: number) => {
    const result = await api.updateDocumentType(id, { ...form, validityMonths: form.validityMonths ? parseInt(form.validityMonths) : undefined })
    setDocumentTypes(documentTypes.map(d => d.id === id ? result : d))
    setEditing(null)
    resetForm()
  }

  const startEdit = (dt: api.DocumentType) => {
    setForm({ name: dt.name, description: dt.description || '', isRequired: dt.isRequired, appliesTo: dt.appliesTo, validityMonths: dt.validityMonths?.toString() || '', sortOrder: dt.sortOrder, isActive: dt.isActive })
    setEditing(dt.id)
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-[#0d0c2c]">Document Types</h1>
        <button onClick={() => { setShowNew(true); resetForm() }} className="flex items-center gap-2 bg-[#3bc7f4] text-white px-4 py-2 rounded-lg">
          <Plus size={18} /> Add Type
        </button>
      </div>

      {(showNew || editing !== null) && (
        <div className="bg-white rounded-xl p-6 shadow-sm mb-6">
          <h3 className="font-semibold mb-4">{editing !== null ? 'Edit' : 'New'} Document Type</h3>
          <div className="grid grid-cols-2 gap-4">
            <input className="border rounded-lg p-3" placeholder="Name *" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
            <input className="border rounded-lg p-3" placeholder="Description" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
            <select className="border rounded-lg p-3" value={form.appliesTo} onChange={e => setForm(f => ({ ...f, appliesTo: e.target.value }))}>
              <option value="Applicant">Applicant</option>
              <option value="ActiveCourier">Active Courier</option>
              <option value="Both">Both</option>
            </select>
            <input className="border rounded-lg p-3" placeholder="Validity (months)" type="number" value={form.validityMonths} onChange={e => setForm(f => ({ ...f, validityMonths: e.target.value }))} />
            <label className="flex items-center gap-2 p-3">
              <input type="checkbox" checked={form.isRequired} onChange={e => setForm(f => ({ ...f, isRequired: e.target.checked }))} /> Required
            </label>
            <label className="flex items-center gap-2 p-3">
              <input type="checkbox" checked={form.isActive} onChange={e => setForm(f => ({ ...f, isActive: e.target.checked }))} /> Active
            </label>
          </div>
          <div className="flex gap-2 mt-4">
            <button onClick={editing !== null ? () => handleUpdate(editing) : handleCreate}
              className="bg-[#3bc7f4] text-white px-6 py-2 rounded-lg flex items-center gap-2"><Save size={16} /> Save</button>
            <button onClick={() => { setEditing(null); setShowNew(false) }} className="border px-6 py-2 rounded-lg">Cancel</button>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left p-4 text-sm font-semibold">Name</th>
              <th className="text-left p-4 text-sm font-semibold">Applies To</th>
              <th className="text-left p-4 text-sm font-semibold">Required</th>
              <th className="text-left p-4 text-sm font-semibold">Validity</th>
              <th className="text-left p-4 text-sm font-semibold">Status</th>
              <th className="text-left p-4 text-sm font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {documentTypes.map(dt => (
              <tr key={dt.id} className="border-b">
                <td className="p-4 text-sm font-medium">{dt.name}</td>
                <td className="p-4 text-sm text-gray-600">{dt.appliesTo}</td>
                <td className="p-4 text-sm">{dt.isRequired ? '✅' : '—'}</td>
                <td className="p-4 text-sm text-gray-600">{dt.validityMonths ? `${dt.validityMonths} mo` : '—'}</td>
                <td className="p-4"><span className={`text-xs px-2 py-1 rounded-full ${dt.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>{dt.isActive ? 'Active' : 'Inactive'}</span></td>
                <td className="p-4"><button onClick={() => startEdit(dt)} className="text-[#3bc7f4] hover:underline text-sm"><Edit2 size={16} /></button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
