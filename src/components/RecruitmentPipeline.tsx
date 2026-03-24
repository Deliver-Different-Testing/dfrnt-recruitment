import { useEffect, useState } from 'react'
import * as api from '../lib/api'
import { useStore } from '../store'
import { List, LayoutGrid } from 'lucide-react'

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

export default function RecruitmentPipeline() {
  const [pipeline, setPipeline] = useState<Record<string, api.Applicant[]>>({})
  const [view, setView] = useState<'kanban' | 'list'>('kanban')
  const applicants = useStore(s => s.applicants)
  const setApplicants = useStore(s => s.setApplicants)

  useEffect(() => {
    api.getPipeline().then(setPipeline)
    api.getApplicants().then(setApplicants)
  }, [])

  const allApplicants = Object.values(pipeline).flat()

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-[#0d0c2c]">Recruitment Pipeline</h1>
        <div className="flex gap-2">
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
                <span className="text-xs bg-gray-100 px-2 py-1 rounded-full">{(pipeline[stage] || []).length}</span>
              </div>
              <div className="space-y-3">
                {(pipeline[stage] || []).map(a => (
                  <div key={a.id} className="bg-gray-50 rounded-lg p-3 border border-gray-100">
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
              {allApplicants.map(a => (
                <tr key={a.id} className="border-b hover:bg-gray-50 cursor-pointer">
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
    </div>
  )
}
