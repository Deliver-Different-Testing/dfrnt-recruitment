import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import * as api from '../lib/api'
import { Users, FileCheck, ClipboardList, TrendingUp, ArrowRight } from 'lucide-react'

export default function Dashboard() {
  const [pipeline, setPipeline] = useState<Record<string, api.Applicant[]>>({})
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    api.getPipeline().then(p => { setPipeline(p); setLoading(false) })
  }, [])

  const all = Object.values(pipeline).flat()
  const thisWeek = all.filter(a => {
    const d = new Date(a.appliedDate)
    const now = new Date()
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    return d >= weekAgo
  })

  const stages = ['Applied', 'Screening', 'Interview', 'DocumentCheck', 'QuizPending', 'Approved', 'Rejected']
  const stageLabels: Record<string, string> = {
    Applied: 'Applied', Screening: 'Screening', Interview: 'Interview',
    DocumentCheck: 'Doc Check', QuizPending: 'Quiz', Approved: 'Approved', Rejected: 'Rejected'
  }
  const stageColors: Record<string, string> = {
    Applied: 'bg-blue-500', Screening: 'bg-yellow-500', Interview: 'bg-purple-500',
    DocumentCheck: 'bg-orange-500', QuizPending: 'bg-indigo-500', Approved: 'bg-green-500', Rejected: 'bg-red-400'
  }
  const maxStage = Math.max(...stages.map(s => (pipeline[s] || []).length), 1)

  if (loading) return <div className="flex items-center justify-center h-64 text-gray-400">Loading...</div>

  return (
    <div>
      <h1 className="text-2xl font-bold text-[#0d0c2c] mb-6">Dashboard</h1>

      {/* Stat Cards */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-xl p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center"><Users size={20} className="text-blue-600" /></div>
            <div>
              <p className="text-2xl font-bold">{all.length}</p>
              <p className="text-sm text-gray-500">Total Applicants</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center"><TrendingUp size={20} className="text-green-600" /></div>
            <div>
              <p className="text-2xl font-bold">{thisWeek.length}</p>
              <p className="text-sm text-gray-500">This Week</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center"><FileCheck size={20} className="text-orange-600" /></div>
            <div>
              <p className="text-2xl font-bold">{(pipeline['DocumentCheck'] || []).length}</p>
              <p className="text-sm text-gray-500">Docs to Review</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center"><ClipboardList size={20} className="text-purple-600" /></div>
            <div>
              <p className="text-2xl font-bold">{(pipeline['Interview'] || []).length}</p>
              <p className="text-sm text-gray-500">In Interview</p>
            </div>
          </div>
        </div>
      </div>

      {/* Pipeline Funnel */}
      <div className="bg-white rounded-xl p-6 shadow-sm mb-8">
        <h2 className="font-semibold mb-4">Pipeline Overview</h2>
        <div className="space-y-3">
          {stages.filter(s => s !== 'Rejected').map(stage => {
            const count = (pipeline[stage] || []).length
            const pct = (count / maxStage) * 100
            return (
              <div key={stage} className="flex items-center gap-3">
                <span className="text-sm w-20 text-gray-600">{stageLabels[stage]}</span>
                <div className="flex-1 bg-gray-100 rounded-full h-7 relative overflow-hidden">
                  <div className={`h-full rounded-full ${stageColors[stage]} transition-all`} style={{ width: `${Math.max(pct, 2)}%` }} />
                  <span className="absolute inset-0 flex items-center justify-center text-xs font-semibold text-gray-700">{count}</span>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* Recent Applications */}
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold">Recent Applications</h2>
            <button onClick={() => navigate('/admin/pipeline')} className="text-sm text-[#E87C1E] hover:underline flex items-center gap-1">
              View all <ArrowRight size={14} />
            </button>
          </div>
          {all.slice(0, 5).map(a => (
            <div key={a.id} className="flex items-center justify-between py-2 border-b last:border-0">
              <div>
                <p className="font-medium text-sm">{a.firstName} {a.lastName}</p>
                <p className="text-xs text-gray-500">{a.email}</p>
              </div>
              <span className="text-xs text-gray-400">{new Date(a.appliedDate).toLocaleDateString('en-NZ')}</span>
            </div>
          ))}
          {all.length === 0 && <p className="text-sm text-gray-400 text-center py-4">No applications yet</p>}
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <h2 className="font-semibold mb-4">Quick Actions</h2>
          <div className="space-y-3">
            <button onClick={() => navigate('/admin/pipeline')}
              className="w-full flex items-center gap-3 p-3 rounded-lg border hover:bg-gray-50 transition-colors">
              <Users size={20} className="text-[#E87C1E]" />
              <span className="font-medium text-sm">View Pipeline</span>
            </button>
            <button onClick={() => navigate('/admin/documents')}
              className="w-full flex items-center gap-3 p-3 rounded-lg border hover:bg-gray-50 transition-colors">
              <FileCheck size={20} className="text-[#E87C1E]" />
              <span className="font-medium text-sm">Review Documents</span>
            </button>
            <button onClick={() => navigate('/admin/quizzes')}
              className="w-full flex items-center gap-3 p-3 rounded-lg border hover:bg-gray-50 transition-colors">
              <ClipboardList size={20} className="text-[#E87C1E]" />
              <span className="font-medium text-sm">Manage Quizzes</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
