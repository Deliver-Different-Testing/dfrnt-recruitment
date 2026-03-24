import { Routes, Route, Navigate, useNavigate } from 'react-router-dom'
import Layout from './components/Layout'
import ApplicantPortal from './components/ApplicantPortal'
import RecruitmentPipeline from './components/RecruitmentPipeline'
import DocumentManagement from './components/DocumentManagement'
import QuizBuilder from './components/QuizBuilder'
import Dashboard from './components/Dashboard'
import PortalSettings from './components/PortalSettings'
import { useStore } from './store'
import { useState } from 'react'
import * as api from './lib/api'

function LoginPage() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const setAuth = useStore(s => s.setAuth)
  const isAdmin = useStore(s => s.isAdmin)
  const navigate = useNavigate()

  // Already logged in — redirect
  if (isAdmin) return <Navigate to="/admin/dashboard" />

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    try {
      const res = await api.login(username, password)
      setAuth(res.token)
      navigate('/admin/dashboard')
    } catch { setError('Invalid credentials') }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0d0c2c]">
      <form onSubmit={handleLogin} className="bg-white p-8 rounded-xl shadow-lg w-96">
        <h1 className="text-2xl font-bold mb-6 text-[#0d0c2c]">Urgent Couriers</h1>
        {error && <p className="text-red-500 mb-4 text-sm">{error}</p>}
        <input className="w-full border rounded-lg p-3 mb-4" placeholder="Username" value={username} onChange={e => setUsername(e.target.value)} />
        <input className="w-full border rounded-lg p-3 mb-4" type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} />
        <button className="w-full bg-[#FFD200] text-[#0d0c2c] py-3 rounded-lg font-semibold hover:bg-[#E87C1E] hover:text-white transition-colors">Login</button>
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
        <Route index element={<Navigate to="dashboard" />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="pipeline" element={<RecruitmentPipeline />} />
        <Route path="documents" element={<DocumentManagement />} />
        <Route path="quizzes" element={<QuizBuilder />} />
        <Route path="settings" element={<PortalSettings />} />
      </Route>
      <Route path="*" element={<Navigate to="/apply" />} />
    </Routes>
  )
}
