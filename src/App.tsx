import { Routes, Route, Navigate, useNavigate } from 'react-router-dom'
import React, { Suspense, useState } from 'react'
import Layout from './components/Layout'
import ApplicantPortal from './components/ApplicantPortal'
import SetupPassword from './components/SetupPassword'
import { useStore } from './store'
import * as api from './lib/api'

// Lazy-load admin pages
const Dashboard = React.lazy(() => import('./components/Dashboard'))
const RecruitmentPipeline = React.lazy(() => import('./components/RecruitmentPipeline'))
const DocumentManagement = React.lazy(() => import('./components/DocumentManagement'))
const QuizBuilder = React.lazy(() => import('./components/QuizBuilder'))
const FlowBuilder = React.lazy(() => import('./components/FlowBuilder'))
const AdminSettings = React.lazy(() => import('./components/AdminSettings'))

function LoginPage() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [showForgot, setShowForgot] = useState(false)
  const [forgotEmail, setForgotEmail] = useState('')
  const [forgotSent, setForgotSent] = useState(false)
  const [forgotLoading, setForgotLoading] = useState(false)
  const setAuth = useStore(s => s.setAuth)
  const isAdmin = useStore(s => s.isAdmin)
  const navigate = useNavigate()

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

  const handleForgot = async (e: React.FormEvent) => {
    e.preventDefault()
    setForgotLoading(true)
    try {
      await api.forgotPassword(forgotEmail)
      setForgotSent(true)
    } catch { setForgotSent(true) } // Always show success to prevent enumeration
    finally { setForgotLoading(false) }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0d0c2c]">
      {!showForgot ? (
        <form onSubmit={handleLogin} className="bg-white p-8 rounded-xl shadow-lg w-96">
          <h1 className="text-2xl font-bold mb-6 text-[#0d0c2c]">Urgent Couriers</h1>
          {error && <p className="text-red-500 mb-4 text-sm">{error}</p>}
          <input className="w-full border rounded-lg p-3 mb-4" placeholder="Username" value={username} onChange={e => setUsername(e.target.value)} />
          <input className="w-full border rounded-lg p-3 mb-4" type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} />
          <button className="w-full bg-[#FFD200] text-[#0d0c2c] py-3 rounded-lg font-semibold hover:bg-[#E87C1E] hover:text-white transition-colors">Login</button>
          <button type="button" onClick={() => setShowForgot(true)} className="w-full text-sm text-gray-500 hover:text-[#E87C1E] mt-4 transition-colors">Forgot password?</button>
        </form>
      ) : (
        <div className="bg-white p-8 rounded-xl shadow-lg w-96">
          <h1 className="text-2xl font-bold mb-2 text-[#0d0c2c]">Reset Password</h1>
          {forgotSent ? (
            <div>
              <p className="text-sm text-gray-600 mb-6">If an account exists with that email, a reset link has been generated. Please contact your administrator to get the link.</p>
              <button onClick={() => { setShowForgot(false); setForgotSent(false); setForgotEmail('') }}
                className="w-full bg-[#0d0c2c] text-white py-3 rounded-lg font-semibold hover:bg-[#1a1950] transition-colors">Back to Login</button>
            </div>
          ) : (
            <form onSubmit={handleForgot}>
              <p className="text-sm text-gray-500 mb-6">Enter your email or username and we'll generate a password reset link.</p>
              <input className="w-full border rounded-lg p-3 mb-4" placeholder="Email or username" type="text"
                value={forgotEmail} onChange={e => setForgotEmail(e.target.value)} required />
              <button disabled={forgotLoading} className="w-full bg-[#FFD200] text-[#0d0c2c] py-3 rounded-lg font-semibold hover:bg-[#E87C1E] hover:text-white disabled:opacity-50 transition-colors">
                {forgotLoading ? 'Sending...' : 'Reset Password'}
              </button>
              <button type="button" onClick={() => setShowForgot(false)} className="w-full text-sm text-gray-500 hover:text-[#E87C1E] mt-4 transition-colors">Back to Login</button>
            </form>
          )}
        </div>
      )}
    </div>
  )
}

function ResetPasswordPage() {
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const token = new URLSearchParams(window.location.search).get('token') || ''

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault()
    if (password.length < 8) { setError('Password must be at least 8 characters'); return }
    if (password !== confirm) { setError('Passwords do not match'); return }
    setLoading(true); setError('')
    try {
      await api.resetPassword(token, password)
      setSuccess(true)
    } catch { setError('Invalid or expired reset link') }
    finally { setLoading(false) }
  }

  if (!token) return (
    <div className="min-h-screen flex items-center justify-center bg-[#0d0c2c]">
      <div className="bg-white p-8 rounded-xl shadow-lg w-96 text-center">
        <p className="text-red-500 mb-4">Invalid reset link</p>
        <button onClick={() => navigate('/admin/login')} className="text-sm text-[#E87C1E] hover:underline">Back to Login</button>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0d0c2c]">
      <div className="bg-white p-8 rounded-xl shadow-lg w-96">
        <h1 className="text-2xl font-bold mb-2 text-[#0d0c2c]">Set New Password</h1>
        {success ? (
          <div>
            <p className="text-sm text-green-600 mb-6">Password reset successfully!</p>
            <button onClick={() => navigate('/admin/login')}
              className="w-full bg-[#FFD200] text-[#0d0c2c] py-3 rounded-lg font-semibold hover:bg-[#E87C1E] hover:text-white transition-colors">Go to Login</button>
          </div>
        ) : (
          <form onSubmit={handleReset}>
            <p className="text-sm text-gray-500 mb-6">Enter your new password below.</p>
            {error && <p className="text-red-500 mb-4 text-sm">{error}</p>}
            <input className="w-full border rounded-lg p-3 mb-4" type="password" placeholder="New password (min 8 chars)"
              value={password} onChange={e => setPassword(e.target.value)} required />
            <input className="w-full border rounded-lg p-3 mb-4" type="password" placeholder="Confirm password"
              value={confirm} onChange={e => setConfirm(e.target.value)} required />
            <button disabled={loading} className="w-full bg-[#FFD200] text-[#0d0c2c] py-3 rounded-lg font-semibold hover:bg-[#E87C1E] hover:text-white disabled:opacity-50 transition-colors">
              {loading ? 'Resetting...' : 'Reset Password'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}

export default function App() {
  const isAdmin = useStore(s => s.isAdmin)

  return (
    <Routes>
      <Route path="/apply/*" element={<ApplicantPortal />} />
      <Route path="/admin/login" element={<LoginPage />} />
      <Route path="/admin/reset-password" element={<ResetPasswordPage />} />
      <Route path="/admin/setup-password" element={<SetupPassword />} />
      <Route path="/admin" element={isAdmin ? <Layout /> : <Navigate to="/admin/login" />}>
        <Route index element={<Navigate to="dashboard" />} />
        <Route path="dashboard" element={<Suspense fallback={<div className="p-8 text-center">Loading...</div>}><Dashboard /></Suspense>} />
        <Route path="pipeline" element={<Suspense fallback={<div className="p-8 text-center">Loading...</div>}><RecruitmentPipeline /></Suspense>} />
        <Route path="documents" element={<Suspense fallback={<div className="p-8 text-center">Loading...</div>}><DocumentManagement /></Suspense>} />
        <Route path="quizzes" element={<Suspense fallback={<div className="p-8 text-center">Loading...</div>}><QuizBuilder /></Suspense>} />
        <Route path="flow-builder" element={<Suspense fallback={<div className="p-8 text-center">Loading...</div>}><FlowBuilder /></Suspense>} />
        <Route path="settings" element={<Suspense fallback={<div className="p-8 text-center">Loading...</div>}><AdminSettings /></Suspense>} />
      </Route>
      <Route path="*" element={<Navigate to="/apply" />} />
    </Routes>
  )
}
