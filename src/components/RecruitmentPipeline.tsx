import { useEffect, useState } from 'react'
import * as api from '../lib/api'
import { List, LayoutGrid, X, Send, Search, ChevronDown, FileText, CheckCircle, XCircle, Clock } from 'lucide-react'

const STAGES = ['Applied', 'Screening', 'Interview', 'DocumentCheck', 'QuizPending', 'Approved', 'Rejected']
const stageColors: Record<string, string> = {
  Applied: 'bg-blue-100 text-blue-800',
  Screening: 'bg-yellow-100 text-yellow-800',
  Interview: 'bg-purple-100 text-purple-800',
  DocumentCheck: 'bg-orange-100 text-orange-800',
  QuizPending: 'bg-indigo-100 text-indigo-800',
  Approved: 'bg-green-100 text-green-800',
  Rejected: 'bg-red-100 text-red-800',
}
const stageLabels: Record<string, string> = {
  Applied: 'Applied', Screening: 'Screening', Interview: 'Interview',
  DocumentCheck: 'Document Check', QuizPending: 'Quiz Pending', Approved: 'Approved', Rejected: 'Rejected'
}

export default function RecruitmentPipeline() {
  const [pipeline, setPipeline] = useState<Record<string, api.Applicant[]>>({})
  const [view, setView] = useState<'kanban' | 'list'>('kanban')
  const [selected, setSelected] = useState<api.Applicant | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [noteText, setNoteText] = useState('')
  const [addingNote, setAddingNote] = useState(false)
  const [statusChanging, setStatusChanging] = useState(false)
  const [docs, setDocs] = useState<api.ApplicantDocument[]>([])

  const loadPipeline = () => api.getPipeline().then(setPipeline)
  useEffect(() => { loadPipeline() }, [])

  const openDetail = async (applicant: api.Applicant) => {
    setDetailLoading(true)
    try {
      const full = await api.getApplicant(applicant.id)
      setSelected(full)
      const d = await api.getApplicantDocuments(applicant.id)
      setDocs(d)
    } catch { setSelected(applicant) }
    finally { setDetailLoading(false) }
  }

  const closeDetail = () => { setSelected(null); setNoteText(''); setDocs([]) }

  const handleAddNote = async () => {
    if (!selected || !noteText.trim()) return
    setAddingNote(true)
    try {
      await api.addNote(selected.id, noteText)
      const full = await api.getApplicant(selected.id)
      setSelected(full)
      setNoteText('')
    } catch (e: any) { alert('Error adding note') }
    finally { setAddingNote(false) }
  }

  const handleStatusChange = async (newStatus: string) => {
    if (!selected) return
    setStatusChanging(true)
    try {
      await api.updateApplicantStatus(selected.id, newStatus)
      const full = await api.getApplicant(selected.id)
      setSelected(full)
      await loadPipeline()
    } catch { alert('Error updating status') }
    finally { setStatusChanging(false) }
  }

  // Filter applicants
  const allApplicants = Object.values(pipeline).flat()
  const filtered = allApplicants.filter(a => {
    if (search) {
      const q = search.toLowerCase()
      if (!(`${a.firstName} ${a.lastName}`.toLowerCase().includes(q) || a.email.toLowerCase().includes(q))) return false
    }
    if (filterStatus && a.status !== filterStatus) return false
    return true
  })

  const filteredPipeline: Record<string, api.Applicant[]> = {}
  if (search || filterStatus) {
    STAGES.forEach(s => { filteredPipeline[s] = filtered.filter(a => a.status === s) })
  }
  const displayPipeline = (search || filterStatus) ? filteredPipeline : pipeline

  return (
    <div className="relative">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-[#0d0c2c]">Recruitment Pipeline</h1>
        <div className="flex items-center gap-3">
          {/* Search */}
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input className="pl-9 pr-4 py-2 border rounded-lg text-sm w-64" placeholder="Search name or email..."
              value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          {/* Filter */}
          <div className="relative">
            <select className="appearance-none border rounded-lg px-3 py-2 pr-8 text-sm bg-white"
              value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
              <option value="">All Stages</option>
              {STAGES.map(s => <option key={s} value={s}>{stageLabels[s]}</option>)}
            </select>
            <ChevronDown size={14} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          </div>
          {/* View toggle */}
          <div className="flex border rounded-lg overflow-hidden">
            <button onClick={() => setView('kanban')} className={`p-2 ${view === 'kanban' ? 'bg-[#FFD200] text-[#0d0c2c]' : 'bg-white text-gray-600'}`}><LayoutGrid size={18} /></button>
            <button onClick={() => setView('list')} className={`p-2 ${view === 'list' ? 'bg-[#FFD200] text-[#0d0c2c]' : 'bg-white text-gray-600'}`}><List size={18} /></button>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="flex gap-3 mb-6">
        {STAGES.filter(s => s !== 'Rejected').map(stage => (
          <div key={stage} className="bg-white rounded-lg px-4 py-2 shadow-sm flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${stageColors[stage]?.replace('100', '500').replace(/text-\S+/, '') || 'bg-gray-300'}`} />
            <span className="text-sm font-medium">{(displayPipeline[stage] || []).length}</span>
            <span className="text-xs text-gray-500">{stageLabels[stage]}</span>
          </div>
        ))}
      </div>

      {/* Kanban View */}
      {view === 'kanban' && (
        <div className="flex gap-4 overflow-x-auto pb-4">
          {STAGES.map(stage => (
            <div key={stage} className="min-w-[280px] bg-white rounded-xl shadow-sm flex flex-col max-h-[70vh]">
              <div className="flex items-center justify-between p-4 border-b">
                <h3 className="font-semibold text-sm">{stageLabels[stage]}</h3>
                <span className="text-xs bg-gray-100 px-2 py-1 rounded-full">{(displayPipeline[stage] || []).length}</span>
              </div>
              <div className="flex-1 overflow-y-auto p-3 space-y-2">
                {(displayPipeline[stage] || []).map(a => (
                  <div key={a.id} onClick={() => openDetail(a)}
                    className="bg-gray-50 rounded-lg p-3 border border-gray-100 hover:border-[#FFD200] hover:shadow-sm cursor-pointer transition-all">
                    <p className="font-medium text-sm">{a.firstName} {a.lastName}</p>
                    <p className="text-xs text-gray-500 truncate">{a.email}</p>
                    <div className="flex items-center justify-between mt-2">
                      <p className="text-xs text-gray-400">{new Date(a.appliedDate).toLocaleDateString('en-NZ')}</p>
                      {a.source && <span className="text-xs bg-gray-100 px-1.5 py-0.5 rounded">{a.source}</span>}
                    </div>
                  </div>
                ))}
                {(displayPipeline[stage] || []).length === 0 && (
                  <p className="text-xs text-gray-400 text-center py-4">No applicants</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* List View */}
      {view === 'list' && (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left p-4 text-sm font-semibold">Name</th>
                <th className="text-left p-4 text-sm font-semibold">Email</th>
                <th className="text-left p-4 text-sm font-semibold">Phone</th>
                <th className="text-left p-4 text-sm font-semibold">Status</th>
                <th className="text-left p-4 text-sm font-semibold">Applied</th>
                <th className="text-left p-4 text-sm font-semibold">Source</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(a => (
                <tr key={a.id} onClick={() => openDetail(a)} className="border-b hover:bg-yellow-50 cursor-pointer transition-colors">
                  <td className="p-4 text-sm font-medium">{a.firstName} {a.lastName}</td>
                  <td className="p-4 text-sm text-gray-600">{a.email}</td>
                  <td className="p-4 text-sm text-gray-600">{a.phone || '—'}</td>
                  <td className="p-4"><span className={`text-xs px-2 py-1 rounded-full font-medium ${stageColors[a.status] || 'bg-gray-100'}`}>{stageLabels[a.status] || a.status}</span></td>
                  <td className="p-4 text-sm text-gray-500">{new Date(a.appliedDate).toLocaleDateString('en-NZ')}</td>
                  <td className="p-4 text-sm text-gray-500">{a.source || '—'}</td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={6} className="p-8 text-center text-gray-400">No applicants found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Slide-out Detail Panel */}
      {selected && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/30" onClick={closeDetail} />
          <div className="relative w-[480px] bg-white h-full shadow-xl overflow-y-auto">
            {detailLoading && <div className="absolute inset-0 bg-white/80 flex items-center justify-center z-10">Loading...</div>}

            {/* Header */}
            <div className="sticky top-0 bg-[#0d0c2c] text-white p-6 z-10">
              <button onClick={closeDetail} className="absolute top-4 right-4 text-gray-400 hover:text-white"><X size={20} /></button>
              <h2 className="text-xl font-bold">{selected.firstName} {selected.lastName}</h2>
              <p className="text-gray-400 text-sm">{selected.email}</p>
              {selected.phone && <p className="text-gray-400 text-sm">{selected.phone}</p>}
              <div className="mt-3">
                <span className={`text-xs px-3 py-1 rounded-full font-semibold ${stageColors[selected.status] || 'bg-gray-200'}`}>
                  {stageLabels[selected.status] || selected.status}
                </span>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Change Status */}
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-2">Move to Stage</h3>
                <div className="flex flex-wrap gap-2">
                  {STAGES.filter(s => s !== selected.status).map(s => (
                    <button key={s} onClick={() => handleStatusChange(s)} disabled={statusChanging}
                      className={`text-xs px-3 py-1.5 rounded-full border hover:shadow-sm transition-all ${stageColors[s]} border-transparent`}>
                      {stageLabels[s]}
                    </button>
                  ))}
                </div>
              </div>

              {/* Details */}
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-2">Details</h3>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-gray-500 text-xs">Location</p>
                    <p className="font-medium">{[selected.city, selected.region].filter(Boolean).join(', ') || '—'}</p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-gray-500 text-xs">Applied</p>
                    <p className="font-medium">{new Date(selected.appliedDate).toLocaleDateString('en-NZ')}</p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-gray-500 text-xs">Vehicle</p>
                    <p className="font-medium">{selected.vehicleType || '—'} {selected.hasOwnVehicle ? '(Own)' : ''}</p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-gray-500 text-xs">License</p>
                    <p className="font-medium">{selected.licenseType || '—'}</p>
                  </div>
                  {selected.licenseExpiry && (
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <p className="text-gray-500 text-xs">License Expiry</p>
                      <p className="font-medium">{new Date(selected.licenseExpiry).toLocaleDateString('en-NZ')}</p>
                    </div>
                  )}
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-gray-500 text-xs">Source</p>
                    <p className="font-medium">{selected.source || '—'}</p>
                  </div>
                </div>
              </div>

              {/* Documents */}
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                  <FileText size={16} /> Documents ({docs.length})
                </h3>
                {docs.length > 0 ? (
                  <div className="space-y-2">
                    {docs.map(d => (
                      <div key={d.id} className="flex items-center gap-2 text-sm p-2 bg-gray-50 rounded-lg">
                        {d.status === 'Verified' ? <CheckCircle size={14} className="text-green-600" /> :
                         d.status === 'Rejected' ? <XCircle size={14} className="text-red-600" /> :
                         <Clock size={14} className="text-yellow-600" />}
                        <span className="flex-1">{d.documentType?.name || d.fileName}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          d.status === 'Verified' ? 'bg-green-100 text-green-700' :
                          d.status === 'Rejected' ? 'bg-red-100 text-red-700' :
                          'bg-yellow-100 text-yellow-700'}`}>{d.status}</span>
                      </div>
                    ))}
                  </div>
                ) : <p className="text-sm text-gray-400">No documents uploaded</p>}
              </div>

              {/* Quiz Results */}
              {selected.quizAttempts && selected.quizAttempts.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-2">Quiz Results</h3>
                  {selected.quizAttempts.map(qa => (
                    <div key={qa.id} className="flex items-center gap-2 text-sm p-3 bg-gray-50 rounded-lg">
                      {qa.passed ? <CheckCircle size={16} className="text-green-600" /> : <XCircle size={16} className="text-red-600" />}
                      <span className="flex-1">Score: {qa.score}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${qa.passed ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {qa.passed ? 'Passed' : 'Failed'}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {/* Stage History */}
              {selected.stages && selected.stages.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-2">History</h3>
                  <div className="border-l-2 border-gray-200 pl-4 space-y-3">
                    {selected.stages.map((s, i) => (
                      <div key={s.id || i} className="relative">
                        <div className="absolute -left-[1.35rem] top-1 w-3 h-3 rounded-full bg-[#FFD200] border-2 border-white" />
                        <p className="text-sm font-medium">{stageLabels[s.stage] || s.stage}</p>
                        {s.notes && <p className="text-xs text-gray-500">{s.notes}</p>}
                        <p className="text-xs text-gray-400">{new Date(s.createdDate).toLocaleString('en-NZ')}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Notes */}
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-2">Notes</h3>
                {selected.recruitmentNotes && selected.recruitmentNotes.length > 0 && (
                  <div className="space-y-2 mb-3">
                    {selected.recruitmentNotes.map(n => (
                      <div key={n.id} className="bg-yellow-50 border border-yellow-100 rounded-lg p-3">
                        <p className="text-sm">{n.content}</p>
                        <p className="text-xs text-gray-400 mt-1">{new Date(n.createdDate).toLocaleString('en-NZ')}</p>
                      </div>
                    ))}
                  </div>
                )}
                <div className="flex gap-2">
                  <input className="flex-1 border rounded-lg px-3 py-2 text-sm" placeholder="Add a note..."
                    value={noteText} onChange={e => setNoteText(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleAddNote()} />
                  <button onClick={handleAddNote} disabled={addingNote || !noteText.trim()}
                    className="bg-[#FFD200] text-[#0d0c2c] px-3 py-2 rounded-lg disabled:opacity-50 hover:bg-[#E87C1E] hover:text-white transition-colors">
                    <Send size={16} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
