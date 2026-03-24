import { useEffect, useState } from 'react'
import * as api from '../lib/api'
import { useStore } from '../store'
import { List, LayoutGrid, Search, Users, TrendingUp } from 'lucide-react'
import ApplicantDetail from './ApplicantDetail'

const STAGES = ['Applied', 'Screening', 'Interview', 'DocumentCheck', 'QuizPending', 'Approved', 'Rejected']
const stageColors: Record<string, string> = {
  Applied: 'bg-blue-100 text-blue-800', Screening: 'bg-yellow-100 text-yellow-800',
  Interview: 'bg-purple-100 text-purple-800', DocumentCheck: 'bg-orange-100 text-orange-800',
  QuizPending: 'bg-indigo-100 text-indigo-800', Approved: 'bg-green-100 text-green-800',
  Rejected: 'bg-red-100 text-red-800',
}

export default function RecruitmentPipeline() {
  const [pipeline, setPipeline] = useState<Record<string, api.Applicant[]>>({})
  const [view, setView] = useState<'kanban' | 'list'>('kanban')
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const setApplicants = useStore(s => s.setApplicants)

  const load = () => {
    api.getPipeline().then(setPipeline)
    api.getApplicants().then(setApplicants)
  }

  useEffect(() => { load() }, [])

  const allApplicants = Object.values(pipeline).flat()
  const filtered = allApplicants.filter(a => {
    const matchSearch = !search || `${a.firstName} ${a.lastName} ${a.email}`.toLowerCase().includes(search.toLowerCase())
    const matchStatus = !filterStatus || a.status === filterStatus
    return matchSearch && matchStatus
  })

  const filteredPipeline: Record<string, api.Applicant[]> = {}
  STAGES.forEach(s => {
    filteredPipeline[s] = (pipeline[s] || []).filter(a => {
      const matchSearch = !search || `${a.firstName} ${a.lastName} ${a.email}`.toLowerCase().includes(search.toLowerCase())
      return matchSearch
    })
  })

  const thisWeek = allApplicants.filter(a => {
    const d = new Date(a.appliedDate)
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    return d >= weekAgo
  })

  return (
    <div>
      {/* Stats Bar */}
      <div className="grid grid-cols-4 gap-3 mb-6">
        <div className="bg-white rounded-lg p-3 shadow-sm flex items-center gap-3">
          <Users size={18} className="text-[#3bc7f4]" />
          <div><p className="text-xs text-gray-500">Total</p><p className="font-bold">{allApplicants.length}</p></div>
        </div>
        <div className="bg-white rounded-lg p-3 shadow-sm flex items-center gap-3">
          <TrendingUp size={18} className="text-green-500" />
          <div><p className="text-xs text-gray-500">This Week</p><p className="font-bold">{thisWeek.length}</p></div>
        </div>
        {['Applied', 'Screening'].map(s => (
          <div key={s} className="bg-white rounded-lg p-3 shadow-sm flex items-center gap-3">
            <div className={`w-3 h-3 rounded-full ${s === 'Applied' ? 'bg-blue-500' : 'bg-yellow-500'}`} />
            <div><p className="text-xs text-gray-500">{s}</p><p className="font-bold">{(pipeline[s] || []).length}</p></div>
          </div>
        ))}
      </div>

      {/* Header + Search/Filter */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-[#0d0c2c]">Recruitment Pipeline</h1>
        <div className="flex gap-2 items-center">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input className="pl-9 pr-4 py-2 border rounded-lg text-sm w-64" placeholder="Search name or email..."
              value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          {view === 'list' && (
            <select className="border rounded-lg p-2 text-sm" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
              <option value="">All Statuses</option>
              {STAGES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          )}
          <button onClick={() => setView('kanban')} className={`p-2 rounded-lg ${view === 'kanban' ? 'bg-[#3bc7f4] text-white' : 'bg-white'}`}><LayoutGrid size={20} /></button>
          <button onClick={() => setView('list')} className={`p-2 rounded-lg ${view === 'list' ? 'bg-[#3bc7f4] text-white' : 'bg-white'}`}><List size={20} /></button>
        </div>
      </div>

      {view === 'kanban' ? (
        <div className="flex gap-4 overflow-x-auto pb-4">
          {STAGES.map(stage => (
            <div key={stage} className="min-w-[280px] bg-white rounded-xl p-4 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-sm">{stage}</h3>
                <span className="text-xs bg-gray-100 px-2 py-1 rounded-full">{(filteredPipeline[stage] || []).length}</span>
              </div>
              <div className="space-y-3">
                {(filteredPipeline[stage] || []).map(a => (
                  <div key={a.id} onClick={() => setSelectedId(a.id)}
                    className="bg-gray-50 rounded-lg p-3 border border-gray-100 hover:border-[#3bc7f4] cursor-pointer transition-colors">
                    <p className="font-medium text-sm">{a.firstName} {a.lastName}</p>
                    <p className="text-xs text-gray-500">{a.email}</p>
                    <p className="text-xs text-gray-400 mt-1">{new Date(a.appliedDate).toLocaleDateString()}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left p-4 text-sm font-semibold">Name</th>
                <th className="text-left p-4 text-sm font-semibold">Email</th>
                <th className="text-left p-4 text-sm font-semibold">Status</th>
                <th className="text-left p-4 text-sm font-semibold">Applied</th>
                <th className="text-left p-4 text-sm font-semibold">Source</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(a => (
                <tr key={a.id} className="border-b hover:bg-gray-50 cursor-pointer" onClick={() => setSelectedId(a.id)}>
                  <td className="p-4 text-sm font-medium">{a.firstName} {a.lastName}</td>
                  <td className="p-4 text-sm text-gray-600">{a.email}</td>
                  <td className="p-4"><span className={`text-xs px-2 py-1 rounded-full ${stageColors[a.status] || 'bg-gray-100'}`}>{a.status}</span></td>
                  <td className="p-4 text-sm text-gray-500">{new Date(a.appliedDate).toLocaleDateString()}</td>
                  <td className="p-4 text-sm text-gray-500">{a.source || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {selectedId && (
        <ApplicantDetail
          applicantId={selectedId}
          onClose={() => setSelectedId(null)}
          onUpdated={load}
        />
      )}
    </div>
  )
}
