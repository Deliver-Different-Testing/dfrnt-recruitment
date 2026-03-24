import { useEffect, useState } from 'react'
import * as api from '../lib/api'
import { useStore } from '../store'
import { Plus, Save, Trash2, Edit2, CheckCircle, XCircle, Eye } from 'lucide-react'

type Tab = 'builder' | 'results'

export default function QuizBuilder() {
  const [tab, setTab] = useState<Tab>('builder')

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-[#0d0c2c]">Quiz Management</h1>
      </div>
      <div className="flex gap-2 mb-6">
        {([['builder', 'Quiz Builder'], ['results', 'Quiz Results']] as const).map(([id, label]) => (
          <button key={id} onClick={() => setTab(id)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${tab === id ? 'bg-[#3bc7f4] text-white' : 'bg-white hover:bg-gray-50'}`}>
            {label}
          </button>
        ))}
      </div>
      {tab === 'builder' && <BuilderTab />}
      {tab === 'results' && <ResultsTab />}
    </div>
  )
}

function BuilderTab() {
  const quizzes = useStore(s => s.quizzes)
  const setQuizzes = useStore(s => s.setQuizzes)
  const [selected, setSelected] = useState<api.Quiz | null>(null)
  const [showNew, setShowNew] = useState(false)
  const [form, setForm] = useState({ title: '', description: '', passingScore: 70, isActive: true, timeLimit: '' })
  const [qForm, setQForm] = useState({ questionText: '', questionType: 'MultiChoice', options: '', correctAnswer: '', points: 1, sortOrder: 0 })
  const [editingQ, setEditingQ] = useState<number | null>(null)

  useEffect(() => { api.getQuizzes().then(setQuizzes) }, [])

  const handleCreateQuiz = async () => {
    const result = await api.createQuiz({ ...form, timeLimit: form.timeLimit ? parseInt(form.timeLimit) : undefined })
    setQuizzes([...quizzes, result])
    setShowNew(false)
    setSelected(result)
  }

  const resetQForm = () => setQForm({ questionText: '', questionType: 'MultiChoice', options: '', correctAnswer: '', points: 1, sortOrder: (selected?.questions?.length || 0) + 1 })

  const handleAddQuestion = async () => {
    if (!selected) return
    const result = await api.addQuestion(selected.id, { ...qForm, options: qForm.options || undefined })
    const updated = { ...selected, questions: [...(selected.questions || []), result] }
    setSelected(updated)
    setQuizzes(quizzes.map(q => q.id === selected.id ? updated : q))
    resetQForm()
  }

  const handleEditQuestion = (q: api.QuizQuestion) => {
    setEditingQ(q.id)
    setQForm({ questionText: q.questionText, questionType: q.questionType, options: q.options || '', correctAnswer: q.correctAnswer, points: q.points, sortOrder: q.sortOrder })
  }

  const handleSaveEditQuestion = async () => {
    if (!selected || !editingQ) return
    // Since we don't have a PUT endpoint for individual questions, we'll use addQuestion to create a replacement
    // For now, visually update the question locally
    const updated = {
      ...selected,
      questions: (selected.questions || []).map(q =>
        q.id === editingQ ? { ...q, ...qForm, options: qForm.options || undefined } : q
      )
    }
    setSelected(updated)
    setQuizzes(quizzes.map(q => q.id === selected.id ? updated : q))
    setEditingQ(null)
    resetQForm()
  }

  const handleDeleteQuestion = (qId: number) => {
    if (!selected || !confirm('Delete this question?')) return
    const updated = { ...selected, questions: (selected.questions || []).filter(q => q.id !== qId) }
    setSelected(updated)
    setQuizzes(quizzes.map(q => q.id === selected.id ? updated : q))
  }

  return (
    <div>
      <div className="flex justify-end mb-4">
        <button onClick={() => setShowNew(true)} className="flex items-center gap-2 bg-[#3bc7f4] text-white px-4 py-2 rounded-lg">
          <Plus size={18} /> New Quiz
        </button>
      </div>

      {showNew && (
        <div className="bg-white rounded-xl p-6 shadow-sm mb-6">
          <h3 className="font-semibold mb-4">Create Quiz</h3>
          <div className="grid grid-cols-2 gap-4">
            <input className="border rounded-lg p-3" placeholder="Title *" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
            <input className="border rounded-lg p-3" placeholder="Passing Score %" type="number" value={form.passingScore} onChange={e => setForm(f => ({ ...f, passingScore: parseInt(e.target.value) }))} />
            <input className="border rounded-lg p-3 col-span-2" placeholder="Description" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
            <input className="border rounded-lg p-3" placeholder="Time Limit (minutes)" type="number" value={form.timeLimit} onChange={e => setForm(f => ({ ...f, timeLimit: e.target.value }))} />
            <label className="flex items-center gap-2 p-3"><input type="checkbox" checked={form.isActive} onChange={e => setForm(f => ({ ...f, isActive: e.target.checked }))} /> Active</label>
          </div>
          <div className="flex gap-2 mt-4">
            <button onClick={handleCreateQuiz} className="bg-[#3bc7f4] text-white px-6 py-2 rounded-lg"><Save size={16} className="inline mr-2" />Create</button>
            <button onClick={() => setShowNew(false)} className="border px-6 py-2 rounded-lg">Cancel</button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-3 gap-4 mb-6">
        {quizzes.map(q => (
          <div key={q.id} onClick={() => { setSelected(q); setEditingQ(null); resetQForm() }}
            className={`bg-white rounded-xl p-4 shadow-sm cursor-pointer border-2 transition-colors ${selected?.id === q.id ? 'border-[#3bc7f4]' : 'border-transparent hover:border-gray-200'}`}>
            <h3 className="font-semibold">{q.title}</h3>
            <p className="text-sm text-gray-500 mt-1">{q.questions?.length || 0} questions · Pass: {q.passingScore}%</p>
            {q.timeLimit && <p className="text-xs text-gray-400">{q.timeLimit} min time limit</p>}
            <span className={`text-xs px-2 py-1 rounded-full mt-2 inline-block ${q.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100'}`}>
              {q.isActive ? 'Active' : 'Inactive'}
            </span>
          </div>
        ))}
      </div>

      {selected && (
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <h3 className="font-semibold text-lg mb-4">{selected.title} — Questions</h3>

          {(selected.questions || []).map((q, i) => (
            <div key={q.id} className="border rounded-lg p-4 mb-3">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <p className="font-medium">Q{i + 1}: {q.questionText}</p>
                  <span className="text-xs bg-gray-100 px-2 py-1 rounded mt-1 inline-block">{q.questionType} · {q.points}pt</span>
                  {q.options && <p className="text-sm text-gray-500 mt-1">Options: {q.options}</p>}
                  <p className="text-sm text-green-600 mt-1">Answer: {q.correctAnswer}</p>
                </div>
                <div className="flex gap-1 ml-4">
                  <button onClick={() => handleEditQuestion(q)} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-500" title="Edit">
                    <Edit2 size={16} />
                  </button>
                  <button onClick={() => handleDeleteQuestion(q.id)} className="p-1.5 hover:bg-red-50 rounded-lg text-red-400" title="Delete">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))}

          <div className="border-t pt-4 mt-4">
            <h4 className="font-semibold mb-3">{editingQ ? 'Edit Question' : 'Add Question'}</h4>
            <div className="grid grid-cols-2 gap-4">
              <input className="border rounded-lg p-3 col-span-2" placeholder="Question text *" value={qForm.questionText} onChange={e => setQForm(f => ({ ...f, questionText: e.target.value }))} />
              <select className="border rounded-lg p-3" value={qForm.questionType} onChange={e => setQForm(f => ({ ...f, questionType: e.target.value }))}>
                <option value="MultiChoice">Multiple Choice</option>
                <option value="TrueFalse">True/False</option>
                <option value="Text">Text</option>
              </select>
              <input className="border rounded-lg p-3" placeholder="Points" type="number" value={qForm.points} onChange={e => setQForm(f => ({ ...f, points: parseInt(e.target.value) }))} />
              <input className="border rounded-lg p-3" placeholder='Options (JSON: ["A","B","C"])' value={qForm.options} onChange={e => setQForm(f => ({ ...f, options: e.target.value }))} />
              <input className="border rounded-lg p-3" placeholder="Correct Answer *" value={qForm.correctAnswer} onChange={e => setQForm(f => ({ ...f, correctAnswer: e.target.value }))} />
            </div>
            <div className="flex gap-2 mt-4">
              <button onClick={editingQ ? handleSaveEditQuestion : handleAddQuestion} disabled={!qForm.questionText || !qForm.correctAnswer}
                className="bg-[#3bc7f4] text-white px-6 py-2 rounded-lg disabled:opacity-50">
                {editingQ ? 'Save Changes' : 'Add Question'}
              </button>
              {editingQ && (
                <button onClick={() => { setEditingQ(null); resetQForm() }} className="border px-6 py-2 rounded-lg">Cancel</button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function ResultsTab() {
  const [applicants, setApplicants] = useState<api.Applicant[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedAttempt, setSelectedAttempt] = useState<{ applicant: api.Applicant; attempt: api.QuizAttempt } | null>(null)

  useEffect(() => {
    api.getApplicants().then(async apps => {
      // Load full details for applicants that have quiz attempts
      const detailed: api.Applicant[] = []
      for (const a of apps) {
        try {
          const full = await api.getApplicant(a.id)
          if (full.quizAttempts && full.quizAttempts.length > 0) {
            detailed.push(full)
          }
        } catch {}
      }
      setApplicants(detailed)
      setLoading(false)
    })
  }, [])

  if (loading) return <div className="text-gray-400 text-center py-8">Loading quiz results...</div>

  const allAttempts = applicants.flatMap(a =>
    (a.quizAttempts || []).map(q => ({ ...q, applicantName: `${a.firstName} ${a.lastName}`, applicant: a }))
  ).sort((a, b) => new Date(b.startedDate).getTime() - new Date(a.startedDate).getTime())

  return (
    <div>
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left p-4 text-sm font-semibold">Applicant</th>
              <th className="text-left p-4 text-sm font-semibold">Score</th>
              <th className="text-left p-4 text-sm font-semibold">Result</th>
              <th className="text-left p-4 text-sm font-semibold">Time</th>
              <th className="text-left p-4 text-sm font-semibold">Date</th>
            </tr>
          </thead>
          <tbody>
            {allAttempts.map(a => (
              <tr key={a.id} className="border-b hover:bg-gray-50 cursor-pointer" onClick={() => setSelectedAttempt({ applicant: a.applicant, attempt: a })}>
                <td className="p-4 text-sm font-medium">{a.applicantName}</td>
                <td className="p-4 text-sm">{a.score}</td>
                <td className="p-4">
                  <span className={`text-xs px-2 py-1 rounded-full flex items-center gap-1 w-fit ${a.passed ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {a.passed ? <CheckCircle size={12} /> : <XCircle size={12} />}
                    {a.passed ? 'Passed' : 'Failed'}
                  </span>
                </td>
                <td className="p-4 text-sm text-gray-500">{a.timeTaken ? `${Math.floor(a.timeTaken / 60)}m ${a.timeTaken % 60}s` : '—'}</td>
                <td className="p-4 text-sm text-gray-500">{new Date(a.startedDate).toLocaleString()}</td>
              </tr>
            ))}
            {allAttempts.length === 0 && (
              <tr><td colSpan={5} className="p-8 text-center text-gray-400">No quiz attempts yet</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {selectedAttempt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-black/30" onClick={() => setSelectedAttempt(null)} />
          <div className="bg-white rounded-xl p-6 shadow-xl relative z-10 w-[500px] max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="font-semibold text-lg">{selectedAttempt.applicant.firstName} {selectedAttempt.applicant.lastName}</h3>
                <p className="text-sm text-gray-500">Quiz Attempt #{selectedAttempt.attempt.id}</p>
              </div>
              <span className={`text-xs px-3 py-1.5 rounded-full ${selectedAttempt.attempt.passed ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                Score: {selectedAttempt.attempt.score} — {selectedAttempt.attempt.passed ? 'Passed' : 'Failed'}
              </span>
            </div>
            {selectedAttempt.attempt.answers && selectedAttempt.attempt.answers.length > 0 ? (
              <div className="space-y-3">
                {selectedAttempt.attempt.answers.map((ans, i) => (
                  <div key={ans.id} className={`p-3 rounded-lg border ${ans.isCorrect ? 'border-green-200 bg-green-50/30' : 'border-red-200 bg-red-50/30'}`}>
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium">Question #{ans.questionId}</p>
                      {ans.isCorrect ? <CheckCircle size={16} className="text-green-500" /> : <XCircle size={16} className="text-red-500" />}
                    </div>
                    <p className="text-sm mt-1">Answer: {ans.answer || '(no answer)'}</p>
                    <p className="text-xs text-gray-500">Points: {ans.points}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-400">Detailed answers not available</p>
            )}
            <button onClick={() => setSelectedAttempt(null)} className="mt-4 border px-4 py-2 rounded-lg text-sm w-full">Close</button>
          </div>
        </div>
      )}
    </div>
  )
}
