import { useEffect, useState } from 'react'
import * as api from '../lib/api'
import { Save, Eye } from 'lucide-react'

export default function PortalSettings() {
  const [settings, setSettings] = useState<any>(null)
  const [quizzes, setQuizzes] = useState<api.Quiz[]>([])
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    api.getSettings().then(setSettings)
    api.getQuizzes().then(setQuizzes)
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

  if (!settings) return <div className="text-gray-400">Loading...</div>

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#0d0c2c]">Portal Settings</h1>
          <p className="text-sm text-gray-500 mt-1">Configure the applicant-facing portal</p>
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

      <div className="grid grid-cols-2 gap-6">
        {/* Branding */}
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <h2 className="font-semibold mb-4">Branding</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Company Name</label>
              <input className="w-full border rounded-lg p-3 text-sm" value={settings.companyName || ''}
                onChange={e => setSettings((s: any) => ({ ...s, companyName: e.target.value }))} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Welcome Title</label>
              <input className="w-full border rounded-lg p-3 text-sm" value={settings.welcomeTitle || ''}
                onChange={e => setSettings((s: any) => ({ ...s, welcomeTitle: e.target.value }))} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Welcome Subtitle</label>
              <input className="w-full border rounded-lg p-3 text-sm" value={settings.welcomeSubtitle || ''}
                onChange={e => setSettings((s: any) => ({ ...s, welcomeSubtitle: e.target.value }))} />
            </div>
          </div>
        </div>

        {/* Flow Configuration */}
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <h2 className="font-semibold mb-4">Application Flow</h2>
          <div className="space-y-4">
            <label className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <span className="font-medium text-sm">Vehicle Details Step</span>
                <p className="text-xs text-gray-500">Ask about vehicle type, make/model, license</p>
              </div>
              <input type="checkbox" checked={settings.showVehicleStep}
                onChange={e => setSettings((s: any) => ({ ...s, showVehicleStep: e.target.checked }))}
                className="w-5 h-5 accent-[#FFD200]" />
            </label>

            <label className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <span className="font-medium text-sm">Quiz Step</span>
                <p className="text-xs text-gray-500">Require applicants to complete an assessment quiz</p>
              </div>
              <input type="checkbox" checked={settings.showQuizStep}
                onChange={e => setSettings((s: any) => ({ ...s, showQuizStep: e.target.checked }))}
                className="w-5 h-5 accent-[#FFD200]" />
            </label>

            {settings.showQuizStep && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Active Quiz</label>
                <select className="w-full border rounded-lg p-3 text-sm"
                  value={settings.activeQuizId || ''}
                  onChange={e => setSettings((s: any) => ({ ...s, activeQuizId: e.target.value ? parseInt(e.target.value) : null }))}>
                  <option value="">Auto (first active quiz)</option>
                  {quizzes.map(q => (
                    <option key={q.id} value={q.id}>{q.title} {q.isActive ? '' : '(inactive)'}</option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Info */}
      <div className="mt-6 bg-blue-50 border border-blue-100 rounded-xl p-4">
        <h3 className="font-semibold text-sm text-blue-900 mb-1">How the portal flow works</h3>
        <p className="text-xs text-blue-700">
          The applicant portal dynamically builds its steps from your configuration:
          <strong> Details</strong> (always shown) →
          {settings.showVehicleStep && <strong> Vehicle Details</strong>}
          {settings.showVehicleStep && ' →'}
          <strong> One step per active document type</strong> (configured in Documents page) →
          {settings.showQuizStep && <strong> Quiz</strong>}
          {settings.showQuizStep && ' →'}
          <strong> Review & Submit</strong>.
          Add, remove, or reorder document types to change the steps applicants see.
        </p>
      </div>
    </div>
  )
}
