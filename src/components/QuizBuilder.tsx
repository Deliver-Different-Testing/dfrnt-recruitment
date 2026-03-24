import { useEffect, useState } from 'react'
import * as api from '../lib/api'
import { useStore } from '../store'
import { Plus, Save, Trash2 } from 'lucide-react'

export default function QuizBuilder() {
  const quizzes = useStore(s => s.quizzes)
  const setQuizzes = useStore(s => s.setQuizzes)
  const [selected, setSelected] = useState<api.Quiz | null>(null)
  const [showNew, setShowNew] = useState(false)
  const [form, setForm] = useState({ title: '', description: '', passingScore: 70, isActive: true, timeLimit: '' })
  const [qForm, setQForm] = useState({ questionText: '', questionType: 'MultiChoice', options: '', correctAnswer: '', points: 1, sortOrder: 0 })

  useEffect(() => { api.getQuizzes().then(setQuizzes) }, [])

  const handleCreateQuiz = async () => {
    const result = await api.createQuiz({ ...form, timeLimit: form.timeLimit ? parseInt(form.timeLimit) : undefined })
    setQuizzes([...quizzes, result])
    setShowNew(false)
    setSelected(result)
  }

  const handleAddQuestion = async () => {
    if (!selected) return
    const result = await api.addQuestion(selected.id, { ...qForm, options: qForm.options || undefined })
    const updated = { ...selected, questions: [...(selected.questions || []), result] }
    setSelected(updated)
    setQuizzes(quizzes.map(q => q.id === selected.id ? updated : q))
    setQForm({ questionText: '', questionType: 'MultiChoice', options: '', correctAnswer: '', points: 1, sortOrder: (selected.questions?.length || 0) + 1 })
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-[#0d0c2c]">Quiz Builder</h1>
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
            <label className="flex items-center gap-2 p-3">
              <input type="checkbox" checked={form.isActive} onChange={e => setForm(f => ({ ...f, isActive: e.target.checked }))} /> Active
            </label>
          </div>
          <div className="flex gap-2 mt-4">
            <button onClick={handleCreateQuiz} className="bg-[#3bc7f4] text-white px-6 py-2 rounded-lg"><Save size={16} className="inline mr-2" />Create</button>
            <button onClick={() => setShowNew(false)} className="border px-6 py-2 rounded-lg">Cancel</button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-3 gap-4 mb-6">
        {quizzes.map(q => (
          <div key={q.id} onClick={() => setSelected(q)}
            className={`bg-white rounded-xl p-4 shadow-sm cursor-pointer border-2 transition-colors ${selected?.id === q.id ? 'border-[#3bc7f4]' : 'border-transparent hover:border-gray-200'}`}>
            <h3 className="font-semibold">{q.title}</h3>
            <p className="text-sm text-gray-500 mt-1">{q.questions?.length || 0} questions · Pass: {q.passingScore}%</p>
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
              <div className="flex justify-between">
                <p className="font-medium">Q{i + 1}: {q.questionText}</p>
                <span className="text-xs bg-gray-100 px-2 py-1 rounded">{q.questionType} · {q.points}pt</span>
              </div>
              {q.options && <p className="text-sm text-gray-500 mt-1">Options: {q.options}</p>}
              <p className="text-sm text-green-600 mt-1">Answer: {q.correctAnswer}</p>
            </div>
          ))}

          <div className="border-t pt-4 mt-4">
            <h4 className="font-semibold mb-3">Add Question</h4>
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
            <button onClick={handleAddQuestion} disabled={!qForm.questionText || !qForm.correctAnswer}
              className="mt-4 bg-[#3bc7f4] text-white px-6 py-2 rounded-lg disabled:opacity-50">Add Question</button>
          </div>
        </div>
      )}
    </div>
  )
}
