import { useState } from 'react'
import { Routes, Route } from 'react-router-dom'
import * as api from '../lib/api'
import { useStore } from '../store'

const steps = ['Personal Details', 'Vehicle & License', 'Documents', 'Quiz', 'Confirmation']

function ApplyFlow() {
  const [step, setStep] = useState(0)
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', phone: '', address: '', city: '', region: '', source: '', vehicleType: '', hasOwnVehicle: false, licenseType: '', licenseExpiry: '' })
  const [submitted, setSubmitted] = useState(false)
  const setCurrentApplicantId = useStore(s => s.setCurrentApplicantId)
  const update = (field: string, value: string | boolean) => setForm(f => ({ ...f, [field]: value }))

  const handleSubmitApplication = async () => {
    try {
      const result = await api.applyAsApplicant(form)
      setCurrentApplicantId(result.id)
      setStep(4)
      setSubmitted(true)
    } catch (e) {
      alert('Error submitting application')
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-[#0d0c2c] text-white py-6 px-8 flex items-center gap-4">
        <img src="/urgent-logo.png" alt="Urgent Couriers" className="h-14" />
        <div>
          <p className="text-gray-400 mt-1">Join our delivery team</p>
        </div>
      </header>

      <div className="max-w-2xl mx-auto py-8 px-4">
        {/* Step indicator */}
        <div className="flex gap-2 mb-8">
          {steps.map((s, i) => (
            <div key={s} className={`flex-1 h-2 rounded-full ${i <= step ? 'bg-[#FFD200]' : 'bg-gray-200'}`} />
          ))}
        </div>
        <h2 className="text-xl font-semibold mb-6">{steps[step]}</h2>

        {step === 0 && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <input className="border rounded-lg p-3" placeholder="First Name *" value={form.firstName} onChange={e => update('firstName', e.target.value)} />
              <input className="border rounded-lg p-3" placeholder="Last Name *" value={form.lastName} onChange={e => update('lastName', e.target.value)} />
            </div>
            <input className="w-full border rounded-lg p-3" placeholder="Email *" type="email" value={form.email} onChange={e => update('email', e.target.value)} />
            <input className="w-full border rounded-lg p-3" placeholder="Phone" value={form.phone} onChange={e => update('phone', e.target.value)} />
            <input className="w-full border rounded-lg p-3" placeholder="Address" value={form.address} onChange={e => update('address', e.target.value)} />
            <div className="grid grid-cols-2 gap-4">
              <input className="border rounded-lg p-3" placeholder="City" value={form.city} onChange={e => update('city', e.target.value)} />
              <input className="border rounded-lg p-3" placeholder="Region" value={form.region} onChange={e => update('region', e.target.value)} />
            </div>
            <select className="w-full border rounded-lg p-3" value={form.source} onChange={e => update('source', e.target.value)}>
              <option value="">How did you find us?</option>
              <option value="website">Website</option>
              <option value="referral">Referral</option>
              <option value="ad">Advertisement</option>
              <option value="social">Social Media</option>
              <option value="other">Other</option>
            </select>
            <button onClick={() => setStep(1)} disabled={!form.firstName || !form.lastName || !form.email}
              className="w-full bg-[#FFD200] text-[#0d0c2c] py-3 rounded-lg font-semibold hover:bg-[#E87C1E] disabled:opacity-50">Next</button>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-4">
            <select className="w-full border rounded-lg p-3" value={form.vehicleType} onChange={e => update('vehicleType', e.target.value)}>
              <option value="">Vehicle Type</option>
              <option value="car">Car</option>
              <option value="van">Van</option>
              <option value="bike">Bike</option>
              <option value="ebike">E-Bike</option>
              <option value="scooter">Scooter</option>
            </select>
            <label className="flex items-center gap-3 p-3">
              <input type="checkbox" checked={form.hasOwnVehicle} onChange={e => update('hasOwnVehicle', e.target.checked)} className="w-5 h-5" />
              <span>I have my own vehicle</span>
            </label>
            <input className="w-full border rounded-lg p-3" placeholder="License Type" value={form.licenseType} onChange={e => update('licenseType', e.target.value)} />
            <label className="block text-sm text-gray-600 mb-1">License Expiry</label>
            <input className="w-full border rounded-lg p-3" type="date" value={form.licenseExpiry} onChange={e => update('licenseExpiry', e.target.value)} />
            <div className="flex gap-4">
              <button onClick={() => setStep(0)} className="flex-1 border border-gray-300 py-3 rounded-lg">Back</button>
              <button onClick={() => setStep(2)} className="flex-1 bg-[#FFD200] text-[#0d0c2c] py-3 rounded-lg font-semibold hover:bg-[#E87C1E]">Next</button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <p className="text-gray-600">Document uploads will be available after your application is submitted. You can upload required documents from your status page.</p>
            <div className="flex gap-4">
              <button onClick={() => setStep(1)} className="flex-1 border border-gray-300 py-3 rounded-lg">Back</button>
              <button onClick={() => setStep(3)} className="flex-1 bg-[#FFD200] text-[#0d0c2c] py-3 rounded-lg font-semibold hover:bg-[#E87C1E]">Next</button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <p className="text-gray-600">If a quiz is required, you'll be able to take it from your status page after submitting your application.</p>
            <div className="flex gap-4">
              <button onClick={() => setStep(2)} className="flex-1 border border-gray-300 py-3 rounded-lg">Back</button>
              <button onClick={handleSubmitApplication} className="flex-1 bg-[#FFD200] text-[#0d0c2c] py-3 rounded-lg font-semibold hover:bg-[#E87C1E]">Submit Application</button>
            </div>
          </div>
        )}

        {step === 4 && submitted && (
          <div className="text-center py-8">
            <div className="text-6xl mb-4">✅</div>
            <h3 className="text-2xl font-bold mb-2">Application Submitted!</h3>
            <p className="text-gray-600 mb-6">Thank you, {form.firstName}. We'll review your application and get back to you soon.</p>
            <p className="text-sm text-gray-500">Check your status anytime at <a href={`/apply/status/${form.email}`} className="text-[#FFD200] underline">/apply/status</a></p>
          </div>
        )}
      </div>
    </div>
  )
}

function StatusCheck() {
  const [email, setEmail] = useState('')
  const [applicant, setApplicant] = useState<api.Applicant | null>(null)
  const [error, setError] = useState('')

  const check = async () => {
    try {
      setError('')
      const res = await api.getApplicantByEmail(email)
      setApplicant(res)
    } catch { setError('No application found for this email') }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-[#0d0c2c] text-white py-6 px-8">
        <img src="/urgent-logo.png" alt="Urgent Couriers" className="h-14" />
      </header>
      <div className="max-w-xl mx-auto py-8 px-4">
        <h2 className="text-xl font-semibold mb-4">Check Application Status</h2>
        <div className="flex gap-2 mb-6">
          <input className="flex-1 border rounded-lg p-3" placeholder="Your email address" value={email} onChange={e => setEmail(e.target.value)} />
          <button onClick={check} className="bg-[#FFD200] text-[#0d0c2c] px-6 rounded-lg font-semibold">Check</button>
        </div>
        {error && <p className="text-red-500">{error}</p>}
        {applicant && (
          <div className="bg-white rounded-xl p-6 shadow">
            <h3 className="font-bold text-lg">{applicant.firstName} {applicant.lastName}</h3>
            <p className="text-gray-600">{applicant.email}</p>
            <div className="mt-4 inline-block px-4 py-2 rounded-full text-sm font-semibold bg-[#FFD200]/10 text-[#FFD200]">
              Status: {applicant.status}
            </div>
            <p className="text-sm text-gray-500 mt-2">Applied: {new Date(applicant.appliedDate).toLocaleDateString()}</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default function ApplicantPortal() {
  return (
    <Routes>
      <Route index element={<ApplyFlow />} />
      <Route path="status/:email?" element={<StatusCheck />} />
    </Routes>
  )
}
