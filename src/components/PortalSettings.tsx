import { useEffect, useState } from 'react'
import * as api from '../lib/api'
import { Save, Eye, Plus, Edit2, GripVertical, Trash2, ChevronRight } from 'lucide-react'

export default function PortalSettings() {
  const [settings, setSettings] = useState<any>(null)
  const [quizzes, setQuizzes] = useState<api.Quiz[]>([])
  const [docTypes, setDocTypes] = useState<api.DocumentType[]>([])
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [editing, setEditing] = useState<number | null>(null)
  const [showNew, setShowNew] = useState(false)
  const [form, setForm] = useState({ name: '', description: '', isRequired: false, appliesTo: 'Applicant', validityMonths: '', sortOrder: 0, isActive: true })

  useEffect(() => {
    api.getSettings().then(setSettings)
    api.getQuizzes().then(setQuizzes)
    api.getDocumentTypes().then(setDocTypes)
  }, [])

  const handleSave = async () => {
    setSaving(true); setSaved(false)
    try {
      const result = await api.updateSettings(settings)
      setSettings(result)
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch { alert('Error saving settings') }
    finally { setSaving(false) }
  }

  const resetForm = () => setForm({ name: '', description: '', isRequired: false, appliesTo: 'Applicant', validityMonths: '', sortOrder: docTypes.length + 1, isActive: true })

  const handleCreateDoc = async () => {
    const result = await api.createDocumentType({ ...form, validityMonths: form.validityMonths ? parseInt(form.validityMonths) : undefined })
    setDocTypes([...docTypes, result])
    setShowNew(false); resetForm()
  }

  const handleUpdateDoc = async (id: number) => {
    const result = await api.updateDocumentType(id, { ...form, validityMonths: form.validityMonths ? parseInt(form.validityMonths) : undefined })
    setDocTypes(docTypes.map(d => d.id === id ? result : d))
    setEditing(null); resetForm()
  }

  const startEdit = (dt: api.DocumentType) => {
    setForm({ name: dt.name, description: dt.description || '', isRequired: dt.isRequired, appliesTo: dt.appliesTo, validityMonths: dt.validityMonths?.toString() || '', sortOrder: dt.sortOrder, isActive: dt.isActive })
    setEditing(dt.id)
    setShowNew(false)
  }

  const toggleDocActive = async (dt: api.DocumentType) => {
    const result = await api.updateDocumentType(dt.id, { ...dt, isActive: !dt.isActive })
    setDocTypes(docTypes.map(d => d.id === dt.id ? result : d))
  }

  if (!settings) return <div className="text-gray-400 flex items-center justify-center h-64">Loading...</div>

  // Build step preview
  const activeDocTypes = docTypes.filter(d => d.isActive)
  const steps: string[] = ['Your Details']
  if (settings.showVehicleStep) steps.push('Vehicle & License')
  activeDocTypes.forEach(d => steps.push(d.name))
  if (settings.showQuizStep) steps.push('Quiz')
  steps.push('Review & Submit')

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#0d0c2c]">Portal Settings</h1>
          <p className="text-sm text-gray-500 mt-1">Configure the applicant-facing portal and required documents</p>
        </div>
        <div className="flex items-center gap-3">
          <a href="/apply" target="_blank" className="flex items-center gap-2 text-sm text-gray-600 border rounded-lg px-4 py-2 hover:bg-gray-50">
            <Eye size={16} /> Preview Portal
          </a>
          <button onClick={handleSave} disabled={saving}
            className="flex items-center gap-2 bg-[#FFD200] text-[#0d0c2c] px-4 py-2 rounded-lg font-semibold hover:bg-[#E87C1E] hover:text-white disabled:opacity-50 transition-colors">
            <Save size={16} /> {saving ? 'Saving...' : saved ? 'Saved ✓' : 'Save Changes'}
          </button>
        </div>
      </div>

      {/* Application Flow Preview */}
      <div className="bg-[#0d0c2c] rounded-xl p-5 mb-6">
        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-3">Applicant Flow Preview</h3>
        <div className="flex items-center flex-wrap gap-1">
          {steps.map((s, i) => (
            <div key={i} className="flex items-center">
              <div className="flex items-center gap-1.5">
                <span className="w-6 h-6 rounded-full bg-[#FFD200] text-[#0d0c2c] flex items-center justify-center text-xs font-bold">{i + 1}</span>
                <span className="text-sm text-white">{s}</span>
              </div>
              {i < steps.length - 1 && <ChevronRight size={14} className="text-gray-500 mx-1" />}
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6 mb-6">
        {/* Branding */}
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <h2 className="font-semibold mb-4">Branding</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Company Name</label>
              <input className="w-full border rounded-lg p-2.5 text-sm" value={settings.companyName || ''}
                onChange={e => setSettings((s: any) => ({ ...s, companyName: e.target.value }))} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Welcome Title</label>
              <input className="w-full border rounded-lg p-2.5 text-sm" value={settings.welcomeTitle || ''}
                onChange={e => setSettings((s: any) => ({ ...s, welcomeTitle: e.target.value }))} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Welcome Subtitle</label>
              <input className="w-full border rounded-lg p-2.5 text-sm" value={settings.welcomeSubtitle || ''}
                onChange={e => setSettings((s: any) => ({ ...s, welcomeSubtitle: e.target.value }))} />
            </div>
          </div>
        </div>

        {/* Flow Toggles */}
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <h2 className="font-semibold mb-4">Flow Steps</h2>
          <div className="space-y-3">
            <div className="p-3 bg-gray-50 rounded-lg text-sm text-gray-600">
              <span className="font-medium text-[#0d0c2c]">Your Details</span> — always shown
            </div>
            <label className="flex items-center justify-between p-3 bg-gray-50 rounded-lg cursor-pointer">
              <span className="font-medium text-sm">Vehicle & License</span>
              <input type="checkbox" checked={settings.showVehicleStep}
                onChange={e => setSettings((s: any) => ({ ...s, showVehicleStep: e.target.checked }))}
                className="w-5 h-5 accent-[#FFD200]" />
            </label>
            <div className="p-3 bg-gray-50 rounded-lg text-sm text-gray-600">
              <span className="font-medium text-[#0d0c2c]">Document uploads</span> — configured below
            </div>
            <label className="flex items-center justify-between p-3 bg-gray-50 rounded-lg cursor-pointer">
              <span className="font-medium text-sm">Assessment Quiz</span>
              <input type="checkbox" checked={settings.showQuizStep}
                onChange={e => setSettings((s: any) => ({ ...s, showQuizStep: e.target.checked }))}
                className="w-5 h-5 accent-[#FFD200]" />
            </label>
            {settings.showQuizStep && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Active Quiz</label>
                <select className="w-full border rounded-lg p-2.5 text-sm"
                  value={settings.activeQuizId || ''}
                  onChange={e => setSettings((s: any) => ({ ...s, activeQuizId: e.target.value ? parseInt(e.target.value) : null }))}>
                  <option value="">Auto (first active)</option>
                  {quizzes.map(q => <option key={q.id} value={q.id}>{q.title}</option>)}
                </select>
              </div>
            )}
            <div className="p-3 bg-gray-50 rounded-lg text-sm text-gray-600">
              <span className="font-medium text-[#0d0c2c]">Review & Submit</span> — always shown
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <h2 className="font-semibold mb-4">Summary</h2>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between p-3 bg-gray-50 rounded-lg">
              <span className="text-gray-600">Total steps</span>
              <span className="font-bold text-[#0d0c2c]">{steps.length}</span>
            </div>
            <div className="flex justify-between p-3 bg-gray-50 rounded-lg">
              <span className="text-gray-600">Required documents</span>
              <span className="font-bold text-[#0d0c2c]">{activeDocTypes.filter(d => d.isRequired).length}</span>
            </div>
            <div className="flex justify-between p-3 bg-gray-50 rounded-lg">
              <span className="text-gray-600">Optional documents</span>
              <span className="font-bold text-[#0d0c2c]">{activeDocTypes.filter(d => !d.isRequired).length}</span>
            </div>
            <div className="flex justify-between p-3 bg-gray-50 rounded-lg">
              <span className="text-gray-600">Quiz enabled</span>
              <span className="font-bold text-[#0d0c2c]">{settings.showQuizStep ? 'Yes' : 'No'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Document Types */}
      <div className="bg-white rounded-xl shadow-sm">
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="font-semibold">Document Upload Steps</h2>
            <p className="text-sm text-gray-500 mt-0.5">Each active document becomes a step in the applicant flow</p>
          </div>
          <button onClick={() => { setShowNew(true); setEditing(null); resetForm() }}
            className="flex items-center gap-2 bg-[#FFD200] text-[#0d0c2c] px-4 py-2 rounded-lg text-sm font-semibold hover:bg-[#E87C1E] hover:text-white transition-colors">
            <Plus size={16} /> Add Document Type
          </button>
        </div>

        {/* Add/Edit Form */}
        {(showNew || editing !== null) && (
          <div className="p-6 bg-yellow-50 border-b">
            <h3 className="font-semibold mb-3">{editing !== null ? 'Edit' : 'New'} Document Type</h3>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Name *</label>
                <input className="w-full border rounded-lg p-2.5 text-sm" placeholder="e.g. TSL Certificate" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Description</label>
                <input className="w-full border rounded-lg p-2.5 text-sm" placeholder="Brief description for applicants" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Validity (months)</label>
                <input className="w-full border rounded-lg p-2.5 text-sm" type="number" placeholder="e.g. 12" value={form.validityMonths} onChange={e => setForm(f => ({ ...f, validityMonths: e.target.value }))} />
              </div>
            </div>
            <div className="flex items-center gap-6 mt-3">
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input type="checkbox" checked={form.isRequired} onChange={e => setForm(f => ({ ...f, isRequired: e.target.checked }))} className="accent-[#FFD200]" />
                Required
              </label>
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input type="checkbox" checked={form.isActive} onChange={e => setForm(f => ({ ...f, isActive: e.target.checked }))} className="accent-[#FFD200]" />
                Active (visible to applicants)
              </label>
            </div>
            <div className="flex gap-2 mt-4">
              <button onClick={editing !== null ? () => handleUpdateDoc(editing) : handleCreateDoc} disabled={!form.name}
                className="bg-[#0d0c2c] text-white px-4 py-2 rounded-lg text-sm font-semibold disabled:opacity-50">
                {editing !== null ? 'Update' : 'Add'}
              </button>
              <button onClick={() => { setEditing(null); setShowNew(false) }} className="border px-4 py-2 rounded-lg text-sm">Cancel</button>
            </div>
          </div>
        )}

        {/* Document List */}
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left p-4 text-xs font-semibold text-gray-600 uppercase">Step</th>
              <th className="text-left p-4 text-xs font-semibold text-gray-600 uppercase">Document Name</th>
              <th className="text-left p-4 text-xs font-semibold text-gray-600 uppercase">Description</th>
              <th className="text-center p-4 text-xs font-semibold text-gray-600 uppercase">Required</th>
              <th className="text-left p-4 text-xs font-semibold text-gray-600 uppercase">Validity</th>
              <th className="text-center p-4 text-xs font-semibold text-gray-600 uppercase">Active</th>
              <th className="text-right p-4 text-xs font-semibold text-gray-600 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody>
            {docTypes.sort((a, b) => a.sortOrder - b.sortOrder).map((dt, i) => {
              const stepNum = 1 + (settings.showVehicleStep ? 1 : 0) + 1 + i // details + vehicle? + 1-indexed
              return (
                <tr key={dt.id} className={`border-b ${!dt.isActive ? 'opacity-50' : ''} hover:bg-gray-50`}>
                  <td className="p-4">
                    {dt.isActive && (
                      <span className="w-6 h-6 rounded-full bg-[#FFD200] text-[#0d0c2c] flex items-center justify-center text-xs font-bold">{stepNum}</span>
                    )}
                  </td>
                  <td className="p-4 text-sm font-medium">{dt.name}</td>
                  <td className="p-4 text-sm text-gray-500 max-w-xs truncate">{dt.description || '—'}</td>
                  <td className="p-4 text-center">
                    {dt.isRequired ? <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full">Required</span> : <span className="text-xs text-gray-400">Optional</span>}
                  </td>
                  <td className="p-4 text-sm text-gray-600">{dt.validityMonths ? `${dt.validityMonths} mo` : '—'}</td>
                  <td className="p-4 text-center">
                    <button onClick={() => toggleDocActive(dt)}
                      className={`w-10 h-6 rounded-full transition-colors relative ${dt.isActive ? 'bg-green-500' : 'bg-gray-300'}`}>
                      <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${dt.isActive ? 'left-4' : 'left-0.5'}`} />
                    </button>
                  </td>
                  <td className="p-4 text-right">
                    <button onClick={() => startEdit(dt)} className="text-gray-400 hover:text-[#0d0c2c] p-1"><Edit2 size={16} /></button>
                  </td>
                </tr>
              )
            })}
            {docTypes.length === 0 && (
              <tr><td colSpan={7} className="p-8 text-center text-gray-400">No document types configured. Add one above.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
