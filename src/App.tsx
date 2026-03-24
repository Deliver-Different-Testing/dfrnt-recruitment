import { Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout'
import ApplicantPortal from './components/ApplicantPortal'
import RecruitmentPipeline from './components/RecruitmentPipeline'
import DocumentManagement from './components/DocumentManagement'
import QuizBuilder from './components/QuizBuilder'
import { useStore } from './store'
import { useState } from 'react'
import * as api from './lib/api'

function LoginPage() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const setAuth = useStore(s => s.setAuth)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const res = await api.login(username, password)
      setAuth(res.token)
    } catch { setError('Invalid credentials') }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0d0c2c]">
      <form onSubmit={handleLogin} className="bg-white p-8 rounded-xl shadow-lg w-96">
        <img src="/urgent-logo.png" alt="Urgent Couriers" className="h-12 mb-6 mx-auto" />
        {error && <p className="text-red-500 mb-4 text-sm">{error}</p>}
        <input className="w-full border rounded-lg p-3 mb-4" placeholder="Username" value={username} onChange={e => setUsername(e.target.value)} />
        <input className="w-full border rounded-lg p-3 mb-4" type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} />
        <button className="w-full bg-[#FFD200] text-[#0d0c2c] py-3 rounded-lg font-semibold hover:bg-[#E87C1E]">Login</button>
      </form>
    </div>
  )
}

export default function App() {
  const isAdmin = useStore(s => s.isAdmin)

  return (
    <Routes>
      <Route path="/apply/*" element={<ApplicantPortal />} />
      <Route path="/admin/login" element={<LoginPage />} />
      <Route path="/admin" element={isAdmin ? <Layout /> : <Navigate to="/admin/login" />}>
        <Route index element={<Navigate to="pipeline" />} />
        <Route path="pipeline" element={<RecruitmentPipeline />} />
        <Route path="documents" element={<DocumentManagement />} />
        <Route path="quizzes" element={<QuizBuilder />} />
      </Route>
      <Route path="*" element={<Navigate to="/apply" />} />
    </Routes>
  )
}
