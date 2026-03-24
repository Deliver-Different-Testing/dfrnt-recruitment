import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import * as api from '../lib/api'
import { Users, FileCheck, Clock, ArrowRight, TrendingUp } from 'lucide-react'

const STAGES = ['Applied', 'Screening', 'Interview', 'DocumentCheck', 'QuizPending', 'Approved', 'Rejected']
const stageColors: Record<string, string> = {
  Applied: '#3b82f6', Screening: '#eab308', Interview: '#a855f7',
  DocumentCheck: '#f97316', QuizPending: '#6366f1', Approved: '#22c55e', Rejected: '#ef4444',
}

export default function Dashboard() {
  const [applicants, setApplicants] = useState<api.Applicant[]>([])
  const [pendingDocs, setPendingDocs] = useState(0)
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    Promise.all([api.getApplicants()]).then(([apps]) => {
      setApplicants(apps)
      // Count pending docs across all applicants
      let pending = 0
      const docPromises = apps.slice(0, 50).map(a =>
        api.getApplicantDocuments(a.id).then(docs => {
          pending += docs.filter(d => d.status === 'Pending').length
        }).catch(() => {})
      )
      Promise.all(docPromises).then(() => setPendingDocs(pending))
      setLoading(false)
    })
  }, [])

  const stageCounts = STAGES.reduce((acc, s) => {
    acc[s] = applicants.filter(a => a.status === s).length
    return acc
  }, {} as Record<string, number>)

  const thisWeek = applicants.filter(a => {
    const d = new Date(a.appliedDate)
    const now = new Date()
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    return d >= weekAgo
  })

  const recent = applicants.slice(0, 5)
  const maxCount = Math.max(...Object.values(stageCounts), 1)

  if (loading) return <div className="flex items-center justify-center h-64"><div className="text-gray-400">Loading...</div></div>

  return (
    <div>
      <h1 className="text-2xl font-bold text-[#0d0c2c] mb-6">Dashboard</h1>

      {/* Stats Cards */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-xl p-5 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-blue-50 rounded-lg"><Users size={20} className="text-blue-600" /></div>
            <span className="text-sm text-gray-500">Total Applicants</span>
          </div>
          <p className="text-3xl font-bold text-[#0d0c2c]">{applicants.length}</p>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-green-50 rounded-lg"><TrendingUp size={20} className="text-green-600" /></div>
            <span className="text-sm text-gray-500">This Week</span>
          </div>
          <p className="text-3xl font-bold text-[#0d0c2c]">{thisWeek.length}</p>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-orange-50 rounded-lg"><FileCheck size={20} className="text-orange-600" /></div>
            <span className="text-sm text-gray-500">Docs to Review</span>
          </div>
          <p className="text-3xl font-bold text-[#0d0c2c]">{pendingDocs}</p>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-purple-50 rounded-lg"><Clock size={20} className="text-purple-600" /></div>
            <span className="text-sm text-gray-500">Approved</span>
          </div>
          <p className="text-3xl font-bold text-[#0d0c2c]">{stageCounts['Approved'] || 0}</p>
        </div>
      </div>

      {/* Pipeline Stage Bars */}
      <div className="bg-white rounded-xl p-6 shadow-sm mb-8">
        <h2 className="font-semibold text-lg mb-4">Pipeline Overview</h2>
        <div className="space-y-3">
          {STAGES.map(stage => (
            <div key={stage} className="flex items-center gap-4">
              <span className="text-sm w-32 text-gray-600">{stage}</span>
              <div className="flex-1 bg-gray-100 rounded-full h-8 relative overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500 flex items-center px-3"
                  style={{ width: `${Math.max((stageCounts[stage] / maxCount) * 100, stageCounts[stage] > 0 ? 8 : 0)}%`, backgroundColor: stageColors[stage] }}
                >
                  {stageCounts[stage] > 0 && <span className="text-white text-xs font-semibold">{stageCounts[stage]}</span>}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* Recent Applications */}
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-lg">Recent Applications</h2>
            <button onClick={() => navigate('/admin/pipeline')} className="text-[#3bc7f4] text-sm flex items-center gap-1 hover:underline">
              View all <ArrowRight size={14} />
            </button>
          </div>
          <div className="space-y-3">
            {recent.map(a => (
              <div key={a.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                <div>
                  <p className="font-medium text-sm">{a.firstName} {a.lastName}</p>
                  <p className="text-xs text-gray-500">{a.email}</p>
                </div>
                <div className="text-right">
                  <span className="text-xs px-2 py-1 rounded-full bg-gray-100">{a.status}</span>
                  <p className="text-xs text-gray-400 mt-1">{new Date(a.appliedDate).toLocaleDateString()}</p>
                </div>
              </div>
            ))}
            {recent.length === 0 && <p className="text-sm text-gray-400">No applications yet</p>}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <h2 className="font-semibold text-lg mb-4">Quick Actions</h2>
          <div className="space-y-3">
            <button onClick={() => navigate('/admin/pipeline')} className="w-full text-left p-4 rounded-lg border border-gray-100 hover:border-[#3bc7f4] hover:bg-[#3bc7f4]/5 transition-colors">
              <p className="font-medium text-sm">View Pipeline</p>
              <p className="text-xs text-gray-500">Manage applicants through stages</p>
            </button>
            <button onClick={() => navigate('/admin/documents')} className="w-full text-left p-4 rounded-lg border border-gray-100 hover:border-[#3bc7f4] hover:bg-[#3bc7f4]/5 transition-colors">
              <p className="font-medium text-sm">Review Documents</p>
              <p className="text-xs text-gray-500">{pendingDocs} pending reviews</p>
            </button>
            <button onClick={() => navigate('/admin/quizzes')} className="w-full text-left p-4 rounded-lg border border-gray-100 hover:border-[#3bc7f4] hover:bg-[#3bc7f4]/5 transition-colors">
              <p className="font-medium text-sm">Quiz Builder</p>
              <p className="text-xs text-gray-500">Create and manage quizzes</p>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
