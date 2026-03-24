import { useEffect, useState } from 'react'
import * as api from '../lib/api'
import { useStore } from '../store'
import { X, Send, Clock, FileText, CheckCircle, XCircle, MessageSquare, ChevronDown } from 'lucide-react'

const STAGES = ['Applied', 'Screening', 'Interview', 'DocumentCheck', 'QuizPending', 'Approved', 'Rejected', 'Withdrawn']
const stageColors: Record<string, string> = {
  Applied: 'bg-blue-100 text-blue-800', Screening: 'bg-yellow-100 text-yellow-800',
  Interview: 'bg-purple-100 text-purple-800', DocumentCheck: 'bg-orange-100 text-orange-800',
  QuizPending: 'bg-indigo-100 text-indigo-800', Approved: 'bg-green-100 text-green-800',
  Rejected: 'bg-red-100 text-red-800', Withdrawn: 'bg-gray-100 text-gray-800',
}

interface Props {
  applicantId: number
  onClose: () => void
  onUpdated: () => void
}

export default function ApplicantDetail({ applicantId, onClose, onUpdated }: Props) {
  const [applicant, setApplicant] = useState<api.Applicant | null>(null)
  const [tab, setTab] = useState<'details' | 'history' | 'documents' | 'quiz' | 'notes'>('details')
  const [noteText, setNoteText] = useState('')
  const [newStatus, setNewStatus] = useState('')
  const [statusNotes, setStatusNotes] = useState('')
  const [showStatusChange, setShowStatusChange] = useState(false)
  const [loading, setLoading] = useState(true)
  const [documents, setDocuments] = useState<api.ApplicantDocument[]>([])

  const load = async () => {
    setLoading(true)
    try {
      const [a, docs] = await Promise.all([
        api.getApplicant(applicantId),
        api.getApplicantDocuments(applicantId),
      ])
      setApplicant(a)
      setDocuments(docs)
      setNewStatus(a.status)
    } catch (e) { console.error(e) }
    setLoading(false)
  }

  useEffect(() => { load() }, [applicantId])

  const handleAddNote = async () => {
    if (!noteText.trim()) return
    await api.addNote(applicantId, noteText)
    setNoteText('')
    load()
  }

  const handleStatusChange = async () => {
    if (!newStatus || newStatus === applicant?.status) return
    await api.updateApplicantStatus(applicantId, newStatus, statusNotes || undefined)
    setShowStatusChange(false)
    setStatusNotes('')
    load()
    onUpdated()
  }

  if (loading || !applicant) return (
    <div className="fixed inset-0 z-50 flex">
      <div className="fixed inset-0 bg-black/30" onClick={onClose} />
      <div className="ml-auto w-[600px] bg-white shadow-2xl relative z-10 flex items-center justify-center">
        <div className="text-gray-400">Loading...</div>
      </div>
    </div>
  )

  const tabs = [
    { id: 'details' as const, label: 'Details' },
    { id: 'history' as const, label: 'History' },
    { id: 'documents' as const, label: `Docs (${documents.length})` },
    { id: 'quiz' as const, label: `Quiz (${applicant.quizAttempts?.length || 0})` },
    { id: 'notes' as const, label: `Notes (${applicant.recruitmentNotes?.length || 0})` },
  ]

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="fixed inset-0 bg-black/30" onClick={onClose} />
      <div className="ml-auto w-[600px] bg-white shadow-2xl relative z-10 flex flex-col h-full overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b bg-white">
          <div className="flex items-start justify-between mb-3">
            <div>
              <h2 className="text-xl font-bold text-[#0d0c2c]">{applicant.firstName} {applicant.lastName}</h2>
              <p className="text-sm text-gray-500">{applicant.email}</p>
              {applicant.phone && <p className="text-sm text-gray-500">{applicant.phone}</p>}
            </div>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg"><X size={20} /></button>
          </div>
          <div className="flex items-center gap-3">
            <span className={`text-xs px-3 py-1.5 rounded-full font-medium ${stageColors[applicant.status] || 'bg-gray-100'}`}>
              {applicant.status}
            </span>
            <button onClick={() => setShowStatusChange(!showStatusChange)}
              className="text-xs text-[#3bc7f4] hover:underline flex items-center gap-1">
              Change <ChevronDown size={12} />
            </button>
          </div>
          {showStatusChange && (
            <div className="mt-3 p-3 bg-gray-50 rounded-lg">
              <select value={newStatus} onChange={e => setNewStatus(e.target.value)}
                className="w-full border rounded-lg p-2 text-sm mb-2">
                {STAGES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
              <input className="w-full border rounded-lg p-2 text-sm mb-2" placeholder="Notes (optional)"
                value={statusNotes} onChange={e => setStatusNotes(e.target.value)} />
              <div className="flex gap-2">
                <button onClick={handleStatusChange}
                  className="bg-[#3bc7f4] text-white px-4 py-1.5 rounded-lg text-sm hover:bg-[#2ab0dd]">Update</button>
                <button onClick={() => setShowStatusChange(false)}
                  className="border px-4 py-1.5 rounded-lg text-sm">Cancel</button>
              </div>
            </div>
          )}
        </div>

        {/* Tabs */}
        <div className="flex border-b px-6 bg-white">
          {tabs.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${tab === t.id ? 'border-[#3bc7f4] text-[#3bc7f4]' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
              {t.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {tab === 'details' && (
            <div className="space-y-4">
              <Section title="Personal">
                <Field label="Name" value={`${applicant.firstName} ${applicant.lastName}`} />
                <Field label="Email" value={applicant.email} />
                <Field label="Phone" value={applicant.phone} />
                <Field label="Address" value={[applicant.address, applicant.city, applicant.region].filter(Boolean).join(', ')} />
                <Field label="Source" value={applicant.source} />
                <Field label="Applied" value={new Date(applicant.appliedDate).toLocaleString()} />
              </Section>
              <Section title="Vehicle & License">
                <Field label="Vehicle Type" value={applicant.vehicleType} />
                <Field label="Own Vehicle" value={applicant.hasOwnVehicle ? 'Yes' : 'No'} />
                <Field label="License Type" value={applicant.licenseType} />
                <Field label="License Expiry" value={applicant.licenseExpiry ? new Date(applicant.licenseExpiry).toLocaleDateString() : undefined} />
              </Section>
            </div>
          )}

          {tab === 'history' && (
            <div className="space-y-1">
              {(applicant.stages || []).sort((a, b) => new Date(b.createdDate).getTime() - new Date(a.createdDate).getTime()).map(s => (
                <div key={s.id} className="flex gap-3 pb-4">
                  <div className="flex flex-col items-center">
                    <div className="w-3 h-3 rounded-full bg-[#3bc7f4] mt-1" />
                    <div className="w-0.5 flex-1 bg-gray-200" />
                  </div>
                  <div className="pb-4">
                    <p className="font-medium text-sm">{s.stage}</p>
                    {s.notes && <p className="text-sm text-gray-600 mt-0.5">{s.notes}</p>}
                    <p className="text-xs text-gray-400 mt-1">
                      {new Date(s.createdDate).toLocaleString()} {s.createdBy && `· ${s.createdBy}`}
                    </p>
                  </div>
                </div>
              ))}
              {(!applicant.stages || applicant.stages.length === 0) && (
                <p className="text-sm text-gray-400">No history yet</p>
              )}
            </div>
          )}

          {tab === 'documents' && (
            <div className="space-y-3">
              {documents.map(d => (
                <div key={d.id} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <FileText size={16} className="text-gray-400" />
                      <div>
                        <p className="font-medium text-sm">{d.documentType?.name || `Type #${d.documentTypeId}`}</p>
                        <p className="text-xs text-gray-500">{d.fileName} · {(d.fileSize / 1024).toFixed(0)} KB</p>
                      </div>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      d.status === 'Verified' ? 'bg-green-100 text-green-800' :
                      d.status === 'Rejected' ? 'bg-red-100 text-red-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>{d.status}</span>
                  </div>
                  {d.rejectionReason && (
                    <p className="text-xs text-red-600 mt-2">Reason: {d.rejectionReason}</p>
                  )}
                  <p className="text-xs text-gray-400 mt-2">Uploaded: {new Date(d.uploadedDate).toLocaleString()}</p>
                </div>
              ))}
              {documents.length === 0 && <p className="text-sm text-gray-400">No documents uploaded</p>}
            </div>
          )}

          {tab === 'quiz' && (
            <div className="space-y-3">
              {(applicant.quizAttempts || []).map(q => (
                <div key={q.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-medium text-sm">Quiz Attempt #{q.id}</p>
                    <span className={`text-xs px-2 py-1 rounded-full flex items-center gap-1 ${q.passed ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {q.passed ? <CheckCircle size={12} /> : <XCircle size={12} />}
                      {q.passed ? 'Passed' : 'Failed'}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">Score: {q.score}</p>
                  {q.timeTaken && <p className="text-xs text-gray-500">Time: {Math.floor(q.timeTaken / 60)}m {q.timeTaken % 60}s</p>}
                  <p className="text-xs text-gray-400 mt-1">{new Date(q.startedDate).toLocaleString()}</p>
                </div>
              ))}
              {(!applicant.quizAttempts || applicant.quizAttempts.length === 0) && (
                <p className="text-sm text-gray-400">No quiz attempts</p>
              )}
            </div>
          )}

          {tab === 'notes' && (
            <div>
              <div className="flex gap-2 mb-4">
                <input className="flex-1 border rounded-lg p-3 text-sm" placeholder="Add a note..."
                  value={noteText} onChange={e => setNoteText(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleAddNote()} />
                <button onClick={handleAddNote} disabled={!noteText.trim()}
                  className="bg-[#3bc7f4] text-white px-4 rounded-lg hover:bg-[#2ab0dd] disabled:opacity-50">
                  <Send size={16} />
                </button>
              </div>
              <div className="space-y-3">
                {(applicant.recruitmentNotes || []).sort((a, b) => new Date(b.createdDate).getTime() - new Date(a.createdDate).getTime()).map(n => (
                  <div key={n.id} className="bg-gray-50 rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <MessageSquare size={12} className="text-gray-400" />
                      <span className="text-xs text-gray-500">{n.createdBy || 'Admin'}</span>
                      <span className="text-xs text-gray-400">· {new Date(n.createdDate).toLocaleString()}</span>
                    </div>
                    <p className="text-sm">{n.content}</p>
                  </div>
                ))}
                {(!applicant.recruitmentNotes || applicant.recruitmentNotes.length === 0) && (
                  <p className="text-sm text-gray-400">No notes yet</p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="text-sm font-semibold text-gray-700 mb-2">{title}</h3>
      <div className="bg-gray-50 rounded-lg p-4 space-y-2">{children}</div>
    </div>
  )
}

function Field({ label, value }: { label: string; value?: string }) {
  return (
    <div className="flex justify-between text-sm">
      <span className="text-gray-500">{label}</span>
      <span className="font-medium">{value || '—'}</span>
    </div>
  )
}
