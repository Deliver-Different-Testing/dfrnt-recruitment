import { useState, useEffect, useRef } from 'react'
import { Routes, Route, useNavigate } from 'react-router-dom'
import * as api from '../lib/api'
import { Upload, CheckCircle, XCircle, Clock, FileText, AlertCircle, Camera, ChevronRight, CreditCard, Car, Shield, FileCheck, Building, Hash, Loader2 } from 'lucide-react'

// ─── Upload Zone ─────────────────────────────────────────
function UploadZone({ label, description, file, uploading, onFile }: {
  label: string; description?: string; file: File | null; uploading: boolean; onFile: (f: File) => void
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  return (
    <div>
      {file ? (
        <div className="border-2 border-green-200 bg-green-50 rounded-xl p-5 flex items-center gap-3">
          <CheckCircle size={24} className="text-green-600 shrink-0" />
          <div className="min-w-0 flex-1">
            <p className="font-medium text-sm text-green-800 truncate">{file.name}</p>
            <p className="text-xs text-green-600">{(file.size / 1024).toFixed(0)} KB</p>
          </div>
          <button onClick={() => inputRef.current?.click()} className="text-xs text-green-700 underline">Replace</button>
          <input ref={inputRef} type="file" className="hidden" accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,.heic"
            onChange={e => { if (e.target.files?.[0]) onFile(e.target.files[0]) }} />
        </div>
      ) : (
        <label className={`block border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors
          ${uploading ? 'border-gray-300 bg-gray-50' : 'border-[#3bc7f4]/40 hover:border-[#FFD200] hover:bg-yellow-50'}`}>
          {uploading ? (
            <div className="flex items-center justify-center gap-2 text-gray-500"><Loader2 size={20} className="animate-spin" /> Uploading...</div>
          ) : (
            <>
              <Camera size={32} className="mx-auto mb-3 text-[#3bc7f4]" />
              <p className="font-semibold text-sm text-[#3bc7f4]">{label}</p>
              {description && <p className="text-xs text-gray-500 mt-1">{description}</p>}
            </>
          )}
          <input type="file" className="hidden" accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,.heic" capture="environment"
            onChange={e => { if (e.target.files?.[0]) onFile(e.target.files[0]) }} />
        </label>
      )}
    </div>
  )
}

// ─── Dynamic Step Indicator ──────────────────────────────
function StepIndicator({ steps, current }: { steps: { key: string; label: string }[]; current: number }) {
  return (
    <div className="bg-white border-b sticky top-0 z-20">
      <div className="max-w-3xl mx-auto px-4 py-3 overflow-x-auto">
        <div className="flex items-center min-w-max">
          {steps.map((s, i) => (
            <div key={s.key} className="flex items-center">
              <div className={`flex items-center gap-1.5 ${i <= current ? '' : 'opacity-40'}`}>
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0
                  ${i < current ? 'bg-green-500 text-white' : i === current ? 'bg-[#0d0c2c] text-white' : 'bg-gray-200 text-gray-600'}`}>
                  {i < current ? '✓' : i + 1}
                </div>
                <span className="text-xs font-medium text-gray-700 hidden sm:inline max-w-[70px] truncate">{s.label}</span>
              </div>
              {i < steps.length - 1 && <div className={`w-4 sm:w-6 h-0.5 mx-1 ${i < current ? 'bg-green-400' : 'bg-gray-200'}`} />}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── Main Apply Flow (DYNAMIC) ───────────────────────────
function ApplyFlow() {
  const [config, setConfig] = useState<api.PortalConfig | null>(null)
  const [loading, setLoading] = useState(true)
  const [step, setStep] = useState(0)
  const [form, setForm] = useState({
    firstName: '', lastName: '', email: '', phone: '', dateOfBirth: '',
    address: '', city: '', region: '', postcode: '', source: '',
    vehicleType: '', hasOwnVehicle: false, vehicleMake: '', vehicleModel: '', vehicleYear: '',
    licenseType: '', licenseExpiry: '', licenseNumber: '',
  })
  const [applicantId, setApplicantId] = useState<number | null>(null)
  const [files, setFiles] = useState<Record<number, File | null>>({}) // keyed by docType.id
  const [uploading, setUploading] = useState<number | null>(null)
  const [uploadedDocs, setUploadedDocs] = useState<Set<number>>(new Set()) // docType IDs that uploaded
  const [answers, setAnswers] = useState<Record<number, string>>({})
  const [quizResult, setQuizResult] = useState<{ score: number; passed: boolean; totalQuestions: number } | null>(null)
  const [quizStarted, setQuizStarted] = useState<Date | null>(null)
  const [timeLeft, setTimeLeft] = useState<number | null>(null)
  const [submittingQuiz, setSubmittingQuiz] = useState(false)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const update = (field: string, value: string | boolean) => setForm(f => ({ ...f, [field]: value }))

  // Load config on mount
  useEffect(() => {
    api.getPortalConfig().then(c => { setConfig(c); setLoading(false) }).catch(() => setLoading(false))
  }, [])

  // Build dynamic steps from config
  const dynamicSteps: { key: string; label: string; type: 'details' | 'vehicle' | 'doc' | 'quiz' | 'review'; docTypeId?: number }[] = []
  if (config) {
    dynamicSteps.push({ key: 'details', label: 'Details', type: 'details' })
    if (config.showVehicleStep) dynamicSteps.push({ key: 'vehicle', label: 'Vehicle', type: 'vehicle' })
    for (const dt of config.documentTypes) {
      dynamicSteps.push({ key: `doc-${dt.id}`, label: dt.name, type: 'doc', docTypeId: dt.id })
    }
    if (config.showQuizStep && config.quiz) dynamicSteps.push({ key: 'quiz', label: 'Quiz', type: 'quiz' })
    dynamicSteps.push({ key: 'review', label: 'Review', type: 'review' })
  }

  const currentStep = dynamicSteps[step]

  // Save applicant
  const saveApplicant = async () => {
    setSaving(true); setError('')
    try {
      const result = await api.applyAsApplicant({
        firstName: form.firstName, lastName: form.lastName, email: form.email,
        phone: form.phone, address: form.address, city: form.city, region: form.region,
        vehicleType: form.vehicleType, hasOwnVehicle: form.hasOwnVehicle,
        licenseType: form.licenseType, licenseExpiry: form.licenseExpiry || undefined,
        source: form.source, notes: [form.postcode && `Postcode: ${form.postcode}`, form.dateOfBirth && `DOB: ${form.dateOfBirth}`, form.vehicleMake && `Vehicle: ${form.vehicleMake} ${form.vehicleModel} ${form.vehicleYear}`, form.licenseNumber && `License #: ${form.licenseNumber}`].filter(Boolean).join('; ') || undefined,
      } as any)
      setApplicantId(result.id)
      return result.id
    } catch (e: any) { setError(e.message || 'Error saving'); return null }
    finally { setSaving(false) }
  }

  // Upload a document
  const handleUpload = async (docTypeId: number, file: File) => {
    let id = applicantId
    if (!id) { id = await saveApplicant(); if (!id) return }
    setUploading(docTypeId)
    setFiles(f => ({ ...f, [docTypeId]: file }))
    try {
      await api.uploadDocument(id, docTypeId, file)
      setUploadedDocs(prev => new Set([...prev, docTypeId]))
    } catch (e: any) { alert('Upload failed: ' + (e.message || 'Unknown error')) }
    finally { setUploading(null) }
  }

  // Quiz timer
  useEffect(() => {
    if (quizStarted && config?.quiz?.timeLimit && timeLeft !== null && timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev !== null && prev <= 1) { clearInterval(timerRef.current!); return 0 }
          return prev !== null ? prev - 1 : null
        })
      }, 1000)
      return () => { if (timerRef.current) clearInterval(timerRef.current) }
    }
  }, [quizStarted])

  const handleSubmitQuiz = async () => {
    if (!applicantId || !config?.quiz) return
    setSubmittingQuiz(true)
    if (timerRef.current) clearInterval(timerRef.current)
    try {
      const answerList = Object.entries(answers).map(([qId, answer]) => ({ questionId: parseInt(qId), answer }))
      const result = await api.submitQuiz({
        applicantId, quizId: config.quiz.id,
        startedDate: quizStarted?.toISOString(),
        timeTaken: quizStarted ? Math.round((Date.now() - quizStarted.getTime()) / 1000) : undefined,
        answers: answerList
      })
      setQuizResult(result)
    } catch (e: any) { alert('Error submitting quiz') }
    finally { setSubmittingQuiz(false) }
  }

  const handleNext = async () => {
    if (step === 0 && !applicantId) {
      const id = await saveApplicant()
      if (!id) return
    }
    if (step < dynamicSteps.length - 1) { setStep(s => s + 1); window.scrollTo(0, 0) }
  }
  const handleBack = () => { setStep(s => Math.max(s - 1, 0)); window.scrollTo(0, 0) }

  const formatTime = (secs: number) => `${Math.floor(secs / 60)}:${(secs % 60).toString().padStart(2, '0')}`

  if (loading) return <div className="min-h-screen bg-gray-50 flex items-center justify-center"><Loader2 size={32} className="animate-spin text-gray-400" /></div>
  if (!config) return <div className="min-h-screen bg-gray-50 flex items-center justify-center text-gray-500">Unable to load application form.</div>

  return (
    <div className="min-h-screen bg-gray-50">
      <StepIndicator steps={dynamicSteps.map(s => ({ key: s.key, label: s.label }))} current={step} />

      <div className="max-w-2xl mx-auto py-8 px-4">
        {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 flex items-center gap-2"><AlertCircle size={18} />{error}</div>}

        {/* ── DETAILS STEP ──────────────────────── */}
        {currentStep?.type === 'details' && (
          <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
            <h2 className="text-2xl font-bold text-[#0d0c2c] mb-1">Your Details</h2>
            <p className="text-gray-500 mb-6">Enter your personal information below.</p>

            <div className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <Field label="First Name *" placeholder="John" value={form.firstName} onChange={v => update('firstName', v)} />
                <Field label="Last Name *" placeholder="Smith" value={form.lastName} onChange={v => update('lastName', v)} />
              </div>
              <Field label="Email *" placeholder="john@example.com" type="email" value={form.email} onChange={v => update('email', v)} />
              <Field label="Mobile Number *" placeholder="+64 21 123 4567" value={form.phone} onChange={v => update('phone', v)} />
              <Field label="Date of Birth" type="date" value={form.dateOfBirth} onChange={v => update('dateOfBirth', v)} />
              <Field label="Address" placeholder="Street address" value={form.address} onChange={v => update('address', v)} />
              <div className="grid grid-cols-3 gap-4">
                <Field label="City" placeholder="Auckland" value={form.city} onChange={v => update('city', v)} />
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1.5">Region</label>
                  <select className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-[#FFD200] focus:border-[#FFD200] outline-none"
                    value={form.region} onChange={e => update('region', e.target.value)}>
                    <option value="">Select</option>
                    {['Auckland','Wellington','Canterbury','Waikato','Bay of Plenty','Otago','Manawatu-Whanganui',"Hawke's Bay",'Northland','Taranaki','Southland','Nelson','Marlborough','West Coast','Gisborne','Tasman'].map(r =>
                      <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
                <Field label="Postcode" placeholder="1010" value={form.postcode} onChange={v => update('postcode', v)} />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1.5">How did you hear about us?</label>
                <select className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-[#FFD200] focus:border-[#FFD200] outline-none"
                  value={form.source} onChange={e => update('source', e.target.value)}>
                  <option value="">Select...</option>
                  <option value="seek">Seek</option><option value="trademe">Trade Me Jobs</option><option value="website">Urgent Couriers Website</option>
                  <option value="referral">Referral from existing driver</option><option value="facebook">Facebook</option>
                  <option value="linkedin">LinkedIn</option><option value="walkin">Walk-in</option><option value="other">Other</option>
                </select>
              </div>
            </div>
            <NavButtons onNext={handleNext} disabled={!form.firstName || !form.lastName || !form.email || !form.phone || saving} nextLabel={saving ? 'Saving...' : undefined} />
          </div>
        )}

        {/* ── VEHICLE STEP ─────────────────────── */}
        {currentStep?.type === 'vehicle' && (
          <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
            <h2 className="text-2xl font-bold text-[#0d0c2c] mb-1">Vehicle Details</h2>
            <p className="text-gray-500 mb-6">Tell us about the vehicle you'll use for deliveries.</p>

            <div className="space-y-5">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1.5">Vehicle Type *</label>
                <select className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-[#FFD200] focus:border-[#FFD200] outline-none"
                  value={form.vehicleType} onChange={e => update('vehicleType', e.target.value)}>
                  <option value="">Select vehicle type</option>
                  <option value="car">Car / Sedan</option><option value="suv">SUV / Station Wagon</option>
                  <option value="van">Van</option><option value="ute">Ute</option><option value="truck">Truck (Class 2+)</option>
                  <option value="bike">Motorbike</option><option value="ebike">E-Bike / Bicycle</option>
                  <option value="none">No vehicle — need company vehicle</option>
                </select>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <Field label="Make" placeholder="Toyota" value={form.vehicleMake} onChange={v => update('vehicleMake', v)} />
                <Field label="Model" placeholder="Hiace" value={form.vehicleModel} onChange={v => update('vehicleModel', v)} />
                <Field label="Year" placeholder="2020" value={form.vehicleYear} onChange={v => update('vehicleYear', v)} />
              </div>
              <label className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl cursor-pointer border border-gray-200">
                <input type="checkbox" checked={form.hasOwnVehicle} onChange={e => update('hasOwnVehicle', e.target.checked)} className="w-5 h-5 accent-[#FFD200]" />
                <div><span className="font-medium text-sm">I own this vehicle</span><p className="text-xs text-gray-500">Available for courier work</p></div>
              </label>
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1.5">Driver's License Class *</label>
                <select className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-[#FFD200] focus:border-[#FFD200] outline-none"
                  value={form.licenseType} onChange={e => update('licenseType', e.target.value)}>
                  <option value="">Select license class</option>
                  <option value="Class 1 - Full">Class 1 — Full (Car)</option><option value="Class 1 - Restricted">Class 1 — Restricted</option>
                  <option value="Class 2 - Full">Class 2 — Full (Medium rigid)</option><option value="Class 2 - Restricted">Class 2 — Restricted</option>
                  <option value="Class 3 - Full">Class 3 — Full</option><option value="Class 4 - Full">Class 4 — Full</option>
                  <option value="Class 5 - Full">Class 5 — Full</option><option value="Overseas">Overseas License</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Field label="License Number" placeholder="AB123456" value={form.licenseNumber} onChange={v => update('licenseNumber', v)} />
                <Field label="License Expiry *" type="date" value={form.licenseExpiry} onChange={v => update('licenseExpiry', v)} />
              </div>
            </div>
            <NavButtons onBack={handleBack} onNext={handleNext} disabled={!form.vehicleType || !form.licenseType} />
          </div>
        )}

        {/* ── DOCUMENT UPLOAD STEP (one per doc type) */}
        {currentStep?.type === 'doc' && (() => {
          const dt = config.documentTypes.find(d => d.id === currentStep.docTypeId)!
          const file = files[dt.id] || null
          const uploaded = uploadedDocs.has(dt.id)
          return (
            <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
              <div className="flex items-center gap-2 mb-1">
                <h2 className="text-2xl font-bold text-[#0d0c2c]">{dt.name}</h2>
                {dt.isRequired && <span className="text-xs text-red-500 font-semibold bg-red-50 px-2 py-0.5 rounded-full">Required</span>}
              </div>
              {dt.description && <p className="text-gray-500 mb-6">{dt.description}</p>}

              <UploadZone
                label={`📷 Upload ${dt.name}`}
                description="Take a photo or upload a file"
                file={file}
                uploading={uploading === dt.id}
                onFile={f => handleUpload(dt.id, f)}
              />

              {dt.validityMonths && <p className="text-xs text-gray-400 mt-3">This document is valid for {dt.validityMonths} months after upload.</p>}

              <div className="flex gap-4 mt-8">
                <button onClick={handleBack} className="flex-1 border border-gray-300 py-3.5 rounded-xl font-medium hover:bg-gray-50 transition-colors">← Back</button>
                {!dt.isRequired && !file && (
                  <button onClick={handleNext} className="flex-1 bg-gray-100 text-gray-700 py-3.5 rounded-xl font-medium hover:bg-gray-200 transition-colors">
                    Skip — I'll add this later
                  </button>
                )}
                <button onClick={handleNext} disabled={dt.isRequired && !uploaded && !file}
                  className="flex-1 bg-[#0d0c2c] text-white py-3.5 rounded-xl font-semibold hover:bg-[#1a1950] disabled:opacity-50 transition-colors flex items-center justify-center gap-2">
                  Next <ChevronRight size={18} />
                </button>
              </div>
            </div>
          )
        })()}

        {/* ── QUIZ STEP ────────────────────────── */}
        {currentStep?.type === 'quiz' && config.quiz && (
          <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
            <h2 className="text-2xl font-bold text-[#0d0c2c] mb-2">Assessment Quiz</h2>

            {quizResult ? (
              <div className="text-center py-8">
                {quizResult.passed ? <CheckCircle size={48} className="mx-auto mb-3 text-green-500" /> : <XCircle size={48} className="mx-auto mb-3 text-red-500" />}
                <h3 className="text-2xl font-bold">{quizResult.passed ? 'Passed!' : 'Not Passed'}</h3>
                <p className="text-gray-600 mt-2">Score: {quizResult.score} ({quizResult.totalQuestions} questions)</p>
                <NavButtons onBack={handleBack} onNext={handleNext} nextLabel="Continue →" />
              </div>
            ) : !quizStarted ? (
              <div className="text-center py-8">
                <h3 className="text-lg font-semibold">{config.quiz.title}</h3>
                {config.quiz.description && <p className="text-gray-500 mt-2">{config.quiz.description}</p>}
                <div className="flex justify-center gap-6 mt-4 text-sm text-gray-600">
                  <span>{config.quiz.questions?.length || 0} questions</span>
                  <span>Pass: {config.quiz.passingScore}%</span>
                  {config.quiz.timeLimit && <span>Time: {config.quiz.timeLimit} min</span>}
                </div>
                <button onClick={() => { setQuizStarted(new Date()); if (config.quiz?.timeLimit) setTimeLeft(config.quiz.timeLimit * 60) }}
                  className="mt-6 bg-[#FFD200] text-[#0d0c2c] px-8 py-3 rounded-xl font-semibold hover:bg-[#E87C1E] hover:text-white transition-colors">
                  Start Quiz
                </button>
              </div>
            ) : (
              <div>
                {timeLeft !== null && (
                  <div className={`flex items-center justify-end gap-2 mb-4 text-sm font-mono ${timeLeft < 60 ? 'text-red-600 animate-pulse' : 'text-gray-600'}`}>
                    <Clock size={16} />{formatTime(timeLeft)}
                  </div>
                )}
                <div className="space-y-6">
                  {config.quiz.questions?.map((q, i) => {
                    const options = q.options ? JSON.parse(q.options) as string[] : []
                    return (
                      <div key={q.id} className="border rounded-xl p-5">
                        <p className="font-medium mb-3"><span className="text-[#FFD200] font-bold mr-2">Q{i + 1}.</span>{q.questionText}</p>
                        {q.questionType === 'MultiChoice' && options.map((opt, oi) => (
                          <label key={oi} className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer border mb-2 transition-colors
                            ${answers[q.id] === opt ? 'border-[#FFD200] bg-yellow-50' : 'border-gray-200 hover:bg-gray-50'}`}>
                            <input type="radio" name={`q-${q.id}`} checked={answers[q.id] === opt}
                              onChange={() => setAnswers(a => ({ ...a, [q.id]: opt }))} className="accent-[#FFD200]" />
                            <span>{opt}</span>
                          </label>
                        ))}
                        {q.questionType === 'TrueFalse' && ['True', 'False'].map(opt => (
                          <label key={opt} className={`inline-flex items-center gap-2 p-3 rounded-lg cursor-pointer border mr-3 transition-colors
                            ${answers[q.id] === opt ? 'border-[#FFD200] bg-yellow-50' : 'border-gray-200 hover:bg-gray-50'}`}>
                            <input type="radio" name={`q-${q.id}`} checked={answers[q.id] === opt}
                              onChange={() => setAnswers(a => ({ ...a, [q.id]: opt }))} className="accent-[#FFD200]" />
                            <span className="font-medium">{opt}</span>
                          </label>
                        ))}
                        {q.questionType === 'Text' && (
                          <textarea className="w-full border rounded-lg p-3 mt-1" rows={3} placeholder="Your answer..."
                            value={answers[q.id] || ''} onChange={e => setAnswers(a => ({ ...a, [q.id]: e.target.value }))} />
                        )}
                      </div>
                    )
                  })}
                </div>
                <div className="flex items-center justify-between mt-6">
                  <span className="text-sm text-gray-500">{Object.keys(answers).length} / {config.quiz.questions?.length || 0} answered</span>
                  <button onClick={handleSubmitQuiz} disabled={submittingQuiz || Object.keys(answers).length === 0}
                    className="bg-[#FFD200] text-[#0d0c2c] px-8 py-3 rounded-xl font-semibold hover:bg-[#E87C1E] hover:text-white disabled:opacity-50 transition-colors">
                    {submittingQuiz ? 'Submitting...' : 'Submit Quiz'}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── REVIEW STEP ──────────────────────── */}
        {currentStep?.type === 'review' && !submitted && (
          <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
            <h2 className="text-2xl font-bold text-[#0d0c2c] mb-1">Review Your Application</h2>
            <p className="text-gray-500 mb-6">Check everything looks correct before submitting.</p>

            <ReviewSection title="Personal Details">
              <ReviewRow label="Name" value={`${form.firstName} ${form.lastName}`} />
              <ReviewRow label="Email" value={form.email} />
              <ReviewRow label="Phone" value={form.phone} />
              {form.dateOfBirth && <ReviewRow label="Date of Birth" value={form.dateOfBirth} />}
              {form.address && <ReviewRow label="Address" value={[form.address, form.city, form.region, form.postcode].filter(Boolean).join(', ')} />}
            </ReviewSection>

            {config.showVehicleStep && (
              <ReviewSection title="Vehicle & License">
                <ReviewRow label="Vehicle" value={[form.vehicleMake, form.vehicleModel, form.vehicleYear].filter(Boolean).join(' ') || form.vehicleType || '—'} />
                <ReviewRow label="Own Vehicle" value={form.hasOwnVehicle ? 'Yes' : 'No'} />
                <ReviewRow label="License" value={form.licenseType || '—'} />
                {form.licenseNumber && <ReviewRow label="License #" value={form.licenseNumber} />}
                {form.licenseExpiry && <ReviewRow label="Expiry" value={form.licenseExpiry} />}
              </ReviewSection>
            )}

            <ReviewSection title="Documents">
              {config.documentTypes.map(dt => (
                <div key={dt.id} className="flex items-center justify-between text-sm py-1.5">
                  <span className="text-gray-600">{dt.name} {dt.isRequired && <span className="text-red-400 text-xs">*</span>}</span>
                  {uploadedDocs.has(dt.id) || files[dt.id] ? (
                    <span className="flex items-center gap-1 text-green-600 text-xs font-medium"><CheckCircle size={14} /> Uploaded</span>
                  ) : (
                    <span className="flex items-center gap-1 text-gray-400 text-xs"><Clock size={14} /> {dt.isRequired ? 'Missing' : 'Skipped'}</span>
                  )}
                </div>
              ))}
            </ReviewSection>

            <div className="flex gap-4 mt-8">
              <button onClick={handleBack} className="flex-1 border border-gray-300 py-3.5 rounded-xl font-medium hover:bg-gray-50">← Back</button>
              <button onClick={() => setSubmitted(true)}
                className="flex-1 bg-[#FFD200] text-[#0d0c2c] py-3.5 rounded-xl font-bold text-lg hover:bg-[#E87C1E] hover:text-white transition-colors">
                Submit Application ✓
              </button>
            </div>
          </div>
        )}

        {/* ── CONFIRMATION ─────────────────────── */}
        {submitted && (
          <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 text-center">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle size={40} className="text-green-600" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Application Submitted!</h2>
            <p className="text-gray-600 mb-6">Thank you, <strong>{form.firstName}</strong>. We'll review your application and be in touch.</p>
            <div className="bg-gray-50 rounded-xl p-5 text-left max-w-sm mx-auto mb-6">
              <h3 className="font-semibold text-sm mb-3">What happens next?</h3>
              <ol className="text-sm text-gray-600 space-y-2">
                <li className="flex items-start gap-2"><span className="bg-[#FFD200] text-[#0d0c2c] rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold shrink-0">1</span> We review your details & documents</li>
                <li className="flex items-start gap-2"><span className="bg-[#FFD200] text-[#0d0c2c] rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold shrink-0">2</span> Document verification</li>
                <li className="flex items-start gap-2"><span className="bg-[#FFD200] text-[#0d0c2c] rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold shrink-0">3</span> We'll contact you for next steps</li>
              </ol>
            </div>
            <p className="text-sm text-gray-500">Check your status: <a href={`/apply/status?email=${form.email}`} className="text-[#E87C1E] underline font-medium">Check Status</a></p>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Shared components ───────────────────────────────────
function Field({ label, placeholder, type = 'text', value, onChange }: {
  label: string; placeholder?: string; type?: string; value: string; onChange: (v: string) => void
}) {
  return (
    <div>
      <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1.5">{label}</label>
      <input className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-[#FFD200] focus:border-[#FFD200] outline-none"
        type={type} placeholder={placeholder} value={value} onChange={e => onChange(e.target.value)} />
    </div>
  )
}

function NavButtons({ onBack, onNext, disabled, nextLabel, skipLabel }: {
  onBack?: () => void; onNext: () => void; disabled?: boolean; nextLabel?: string; skipLabel?: string
}) {
  return (
    <div className="flex gap-4 mt-8">
      {onBack && <button onClick={onBack} className="flex-1 border border-gray-300 py-3.5 rounded-xl font-medium hover:bg-gray-50 transition-colors">← Back</button>}
      <button onClick={onNext} disabled={disabled}
        className="flex-1 bg-[#0d0c2c] text-white py-3.5 rounded-xl font-semibold hover:bg-[#1a1950] disabled:opacity-50 transition-colors flex items-center justify-center gap-2">
        {nextLabel || <>Next <ChevronRight size={18} /></>}
      </button>
    </div>
  )
}

function ReviewSection({ title, children }: { title: string; children: React.ReactNode }) {
  return <div className="mb-6"><h3 className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3 border-b pb-2">{title}</h3><div className="space-y-1.5">{children}</div></div>
}
function ReviewRow({ label, value }: { label: string; value: string }) {
  return <div className="flex justify-between text-sm"><span className="text-gray-500">{label}</span><span className="font-medium text-[#0d0c2c]">{value || '—'}</span></div>
}

// ─── Status Check ────────────────────────────────────────
function StatusCheck() {
  const [email, setEmail] = useState('')
  const [applicant, setApplicant] = useState<api.Applicant | null>(null)
  const [error, setError] = useState('')
  const [docs, setDocs] = useState<api.ApplicantDocument[]>([])
  const [loading, setLoading] = useState(false)

  const check = async () => {
    setLoading(true); setError('')
    try {
      const res = await api.getApplicantByEmail(email)
      setApplicant(res)
      if (res.id) { const d = await api.getApplicantDocuments(res.id); setDocs(d) }
    } catch { setError('No application found for this email address.') }
    finally { setLoading(false) }
  }

  const statusColors: Record<string, string> = {
    Applied: 'bg-blue-100 text-blue-800', Screening: 'bg-yellow-100 text-yellow-800',
    Interview: 'bg-purple-100 text-purple-800', DocumentCheck: 'bg-orange-100 text-orange-800',
    QuizPending: 'bg-indigo-100 text-indigo-800', Approved: 'bg-green-100 text-green-800', Rejected: 'bg-red-100 text-red-800',
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-[#0d0c2c] text-white py-6 px-8 flex items-center gap-4">
        
      </header>
      <div className="max-w-xl mx-auto py-8 px-4">
        <h2 className="text-xl font-semibold mb-4">Check Application Status</h2>
        <div className="flex gap-2 mb-6">
          <input className="flex-1 border rounded-lg p-3" placeholder="Enter your email address" type="email"
            value={email} onChange={e => setEmail(e.target.value)} onKeyDown={e => e.key === 'Enter' && check()} />
          <button onClick={check} disabled={loading || !email}
            className="bg-[#FFD200] text-[#0d0c2c] px-6 rounded-lg font-semibold hover:bg-[#E87C1E] hover:text-white disabled:opacity-50 transition-colors">
            {loading ? '...' : 'Check'}
          </button>
        </div>
        {error && <p className="text-red-500 bg-red-50 p-3 rounded-lg">{error}</p>}
        {applicant && (
          <div className="space-y-4">
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <div className="flex items-start justify-between">
                <div><h3 className="font-bold text-lg">{applicant.firstName} {applicant.lastName}</h3><p className="text-gray-600">{applicant.email}</p></div>
                <span className={`px-3 py-1 rounded-full text-sm font-semibold ${statusColors[applicant.status] || 'bg-gray-100'}`}>{applicant.status}</span>
              </div>
              <p className="text-sm text-gray-500 mt-3">Applied: {new Date(applicant.appliedDate).toLocaleDateString('en-NZ')}</p>
            </div>
            {docs.length > 0 && (
              <div className="bg-white rounded-xl p-6 shadow-sm">
                <h3 className="font-semibold mb-3">Documents</h3>
                {docs.map(d => (
                  <div key={d.id} className="flex items-center gap-3 text-sm p-2 rounded-lg bg-gray-50 mb-2">
                    {d.status === 'Verified' ? <CheckCircle size={14} className="text-green-600" /> : d.status === 'Rejected' ? <XCircle size={14} className="text-red-600" /> : <Clock size={14} className="text-yellow-600" />}
                    <span className="font-medium">{d.documentType?.name || 'Document'}</span>
                    <span className={`ml-auto text-xs px-2 py-0.5 rounded-full ${d.status === 'Verified' ? 'bg-green-100 text-green-700' : d.status === 'Rejected' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>{d.status}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Landing Page ────────────────────────────────────────
function LandingPage() {
  const navigate = useNavigate()
  const [config, setConfig] = useState<api.PortalConfig | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => { api.getPortalConfig().then(setConfig).finally(() => setLoading(false)) }, [])

  if (loading) return <div className="min-h-screen bg-gray-50 flex items-center justify-center"><Loader2 size={32} className="animate-spin text-gray-400" /></div>

  // Build the same dynamic steps the applicant will see
  const flowSteps: { icon: typeof FileText; label: string; description?: string; required?: boolean }[] = []
  if (config) {
    flowSteps.push({ icon: FileText, label: 'Your Details', description: 'Name, email, phone & address' })
    if (config.showVehicleStep) flowSteps.push({ icon: Car, label: 'Vehicle & License', description: 'Vehicle type, make/model & license details' })
    for (const dt of config.documentTypes) {
      const docIcons = [CreditCard, Car, Shield, FileCheck, Building, Hash, FileText, FileText]
      flowSteps.push({ icon: docIcons[flowSteps.length % docIcons.length], label: dt.name, description: dt.description || undefined, required: dt.isRequired })
    }
    if (config.showQuizStep && config.quiz) flowSteps.push({ icon: CheckCircle, label: 'Assessment Quiz', description: config.quiz.title || 'Quick knowledge check' })
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto py-8 px-4">
        <div className="bg-[#0d0c2c] rounded-2xl p-8 mb-8">
          
          <h1 className="text-3xl font-bold text-white mb-2">{config?.welcomeTitle || 'Join Our Team'}</h1>
          <p className="text-gray-400">{config?.welcomeSubtitle || "We're looking for reliable courier drivers across New Zealand."}</p>
        </div>

        {flowSteps.length > 0 && (
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-[#0d0c2c] mb-4">What you'll need to apply</h2>
            <div className="grid grid-cols-2 gap-3">
              {flowSteps.map((step, i) => {
                const Icon = step.icon
                return (
                  <div key={i} className="bg-white rounded-xl p-4 border border-gray-100 flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center shrink-0"><Icon size={20} className="text-[#0d0c2c]" /></div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-sm text-[#0d0c2c]">{step.label}</span>
                        {step.required && <span className="text-xs text-red-500 font-medium">Required</span>}
                      </div>
                      {step.description && <p className="text-xs text-gray-500 mt-0.5">{step.description}</p>}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        <div className="bg-green-50 border border-green-100 rounded-xl p-4 flex items-start gap-3 mb-6">
          <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center shrink-0"><Clock size={20} className="text-green-600" /></div>
          <div><p className="font-semibold text-sm text-[#0d0c2c]">Quick & Easy — About {flowSteps.length + 1} steps</p><p className="text-xs text-green-700 mt-0.5">Take photos of your documents with your phone camera. Upload them directly.</p></div>
        </div>

        <button onClick={() => navigate('/apply/form')}
          className="w-full sm:w-auto bg-[#FFD200] text-[#0d0c2c] px-8 py-3.5 rounded-xl font-bold text-lg hover:bg-[#E87C1E] hover:text-white transition-colors shadow-sm">
          Start Application →
        </button>
        <p className="text-sm text-gray-400 mt-4">Already applied? <a href="/apply/status" className="text-[#E87C1E] underline font-medium">Check your status</a></p>
      </div>
    </div>
  )
}

// ─── Routes ──────────────────────────────────────────────
export default function ApplicantPortal() {
  return (
    <Routes>
      <Route index element={<LandingPage />} />
      <Route path="form" element={<ApplyFlow />} />
      <Route path="status" element={<StatusCheck />} />
      <Route path="status/:email" element={<StatusCheck />} />
    </Routes>
  )
}
