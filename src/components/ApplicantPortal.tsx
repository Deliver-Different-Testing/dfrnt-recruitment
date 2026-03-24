import { useState, useEffect, useRef } from 'react'
import { Routes, Route } from 'react-router-dom'
import * as api from '../lib/api'
import { Upload, CheckCircle, XCircle, Clock, FileText, AlertCircle } from 'lucide-react'

const steps = ['Personal Details', 'Vehicle & License', 'Documents', 'Quiz', 'Confirmation']

function ApplyFlow() {
  const [step, setStep] = useState(0)
  const [form, setForm] = useState({
    firstName: '', lastName: '', email: '', phone: '', address: '', city: '', region: '', source: '',
    vehicleType: '', hasOwnVehicle: false, licenseType: '', licenseExpiry: ''
  })
  const [applicantId, setApplicantId] = useState<number | null>(null)
  const [applicant, setApplicant] = useState<api.Applicant | null>(null)
  const [docTypes, setDocTypes] = useState<api.DocumentType[]>([])
  const [uploadedDocs, setUploadedDocs] = useState<api.ApplicantDocument[]>([])
  const [uploading, setUploading] = useState<number | null>(null)
  const [quiz, setQuiz] = useState<api.Quiz | null>(null)
  const [answers, setAnswers] = useState<Record<number, string>>({})
  const [quizResult, setQuizResult] = useState<{ score: number; passed: boolean; totalQuestions: number } | null>(null)
  const [quizStarted, setQuizStarted] = useState<Date | null>(null)
  const [timeLeft, setTimeLeft] = useState<number | null>(null)
  const [submittingQuiz, setSubmittingQuiz] = useState(false)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const update = (field: string, value: string | boolean) => setForm(f => ({ ...f, [field]: value }))

  // Save applicant after step 2 and move to documents
  const handleSaveAndContinue = async () => {
    setSaving(true)
    setError('')
    try {
      const result = await api.applyAsApplicant(form)
      setApplicantId(result.id)
      setApplicant(result)
      // Load document types and quiz
      const [types, activeQuiz] = await Promise.allSettled([
        api.getDocumentTypes(),
        api.getActiveQuiz()
      ])
      if (types.status === 'fulfilled') setDocTypes(types.value.filter((t: api.DocumentType) => t.isActive))
      if (activeQuiz.status === 'fulfilled') setQuiz(activeQuiz.value)
      setStep(2)
    } catch (e: any) {
      setError(e.message || 'Error saving application')
    } finally {
      setSaving(false)
    }
  }

  // File upload handler
  const handleFileUpload = async (docTypeId: number, file: File) => {
    if (!applicantId) return
    setUploading(docTypeId)
    try {
      const doc = await api.uploadDocument(applicantId, docTypeId, file)
      setUploadedDocs(prev => [...prev, doc])
    } catch (e: any) {
      alert('Upload failed: ' + (e.message || 'Unknown error'))
    } finally {
      setUploading(null)
    }
  }

  // Quiz timer
  useEffect(() => {
    if (quizStarted && quiz?.timeLimit && timeLeft !== null && timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev !== null && prev <= 1) {
            clearInterval(timerRef.current!)
            handleSubmitQuiz()
            return 0
          }
          return prev !== null ? prev - 1 : null
        })
      }, 1000)
      return () => { if (timerRef.current) clearInterval(timerRef.current) }
    }
  }, [quizStarted])

  const startQuiz = () => {
    setQuizStarted(new Date())
    if (quiz?.timeLimit) setTimeLeft(quiz.timeLimit * 60)
  }

  const handleSubmitQuiz = async () => {
    if (!applicantId || !quiz) return
    setSubmittingQuiz(true)
    if (timerRef.current) clearInterval(timerRef.current)
    try {
      const answerList = Object.entries(answers).map(([qId, answer]) => ({
        questionId: parseInt(qId), answer
      }))
      const result = await api.submitQuiz({
        applicantId, quizId: quiz.id,
        startedDate: quizStarted?.toISOString(),
        timeTaken: quizStarted ? Math.round((Date.now() - quizStarted.getTime()) / 1000) : undefined,
        answers: answerList
      })
      setQuizResult(result)
    } catch (e: any) {
      alert('Error submitting quiz: ' + (e.message || 'Unknown error'))
    } finally {
      setSubmittingQuiz(false)
    }
  }

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60)
    const s = secs % 60
    return `${m}:${s.toString().padStart(2, '0')}`
  }

  const requiredUploaded = docTypes.filter(dt => dt.isRequired).every(dt =>
    uploadedDocs.some(ud => ud.documentTypeId === dt.id)
  )

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
        <div className="flex gap-2 mb-2">
          {steps.map((s, i) => (
            <div key={s} className={`flex-1 h-2 rounded-full transition-colors ${i <= step ? 'bg-[#FFD200]' : 'bg-gray-200'}`} />
          ))}
        </div>
        <div className="flex justify-between mb-8 text-xs text-gray-500">
          {steps.map((s, i) => (
            <span key={s} className={i <= step ? 'text-[#0d0c2c] font-medium' : ''}>{s}</span>
          ))}
        </div>

        {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 flex items-center gap-2"><AlertCircle size={18} />{error}</div>}

        {/* Step 1: Personal Details */}
        {step === 0 && (
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <h2 className="text-xl font-semibold mb-6">Personal Details</h2>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">First Name *</label>
                  <input className="w-full border rounded-lg p-3" placeholder="John" value={form.firstName} onChange={e => update('firstName', e.target.value)} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Last Name *</label>
                  <input className="w-full border rounded-lg p-3" placeholder="Smith" value={form.lastName} onChange={e => update('lastName', e.target.value)} />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                <input className="w-full border rounded-lg p-3" placeholder="john@example.com" type="email" value={form.email} onChange={e => update('email', e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                <input className="w-full border rounded-lg p-3" placeholder="021 123 4567" value={form.phone} onChange={e => update('phone', e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                <input className="w-full border rounded-lg p-3" placeholder="123 Main Street" value={form.address} onChange={e => update('address', e.target.value)} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                  <input className="w-full border rounded-lg p-3" placeholder="Auckland" value={form.city} onChange={e => update('city', e.target.value)} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Region</label>
                  <select className="w-full border rounded-lg p-3" value={form.region} onChange={e => update('region', e.target.value)}>
                    <option value="">Select region</option>
                    <option value="Auckland">Auckland</option>
                    <option value="Wellington">Wellington</option>
                    <option value="Canterbury">Canterbury</option>
                    <option value="Waikato">Waikato</option>
                    <option value="Bay of Plenty">Bay of Plenty</option>
                    <option value="Otago">Otago</option>
                    <option value="Manawatu-Whanganui">Manawatu-Whanganui</option>
                    <option value="Hawkes Bay">Hawke's Bay</option>
                    <option value="Northland">Northland</option>
                    <option value="Taranaki">Taranaki</option>
                    <option value="Southland">Southland</option>
                    <option value="Nelson">Nelson</option>
                    <option value="Marlborough">Marlborough</option>
                    <option value="West Coast">West Coast</option>
                    <option value="Gisborne">Gisborne</option>
                    <option value="Tasman">Tasman</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">How did you find us?</label>
                <select className="w-full border rounded-lg p-3" value={form.source} onChange={e => update('source', e.target.value)}>
                  <option value="">Select...</option>
                  <option value="website">Website</option>
                  <option value="seek">Seek</option>
                  <option value="trademe">Trade Me Jobs</option>
                  <option value="referral">Referral from existing driver</option>
                  <option value="facebook">Facebook</option>
                  <option value="linkedin">LinkedIn</option>
                  <option value="walkin">Walk-in</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <button onClick={() => setStep(1)} disabled={!form.firstName || !form.lastName || !form.email}
                className="w-full bg-[#FFD200] text-[#0d0c2c] py-3 rounded-lg font-semibold hover:bg-[#E87C1E] hover:text-white disabled:opacity-50 transition-colors">
                Next →
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Vehicle & License */}
        {step === 1 && (
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <h2 className="text-xl font-semibold mb-6">Vehicle & License Details</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Vehicle Type *</label>
                <select className="w-full border rounded-lg p-3" value={form.vehicleType} onChange={e => update('vehicleType', e.target.value)}>
                  <option value="">Select vehicle type</option>
                  <option value="car">Car / Sedan</option>
                  <option value="suv">SUV / Station Wagon</option>
                  <option value="van">Van</option>
                  <option value="ute">Ute</option>
                  <option value="truck">Truck (Class 2+)</option>
                  <option value="bike">Motorbike</option>
                  <option value="ebike">E-Bike / Bicycle</option>
                  <option value="none">No vehicle (company vehicle needed)</option>
                </select>
              </div>
              <label className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg cursor-pointer">
                <input type="checkbox" checked={form.hasOwnVehicle} onChange={e => update('hasOwnVehicle', e.target.checked)} className="w-5 h-5 accent-[#FFD200]" />
                <div>
                  <span className="font-medium">I have my own vehicle</span>
                  <p className="text-sm text-gray-500">Available for courier work</p>
                </div>
              </label>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Driver's License Class *</label>
                <select className="w-full border rounded-lg p-3" value={form.licenseType} onChange={e => update('licenseType', e.target.value)}>
                  <option value="">Select license class</option>
                  <option value="Class 1 - Full">Class 1 — Full (Car)</option>
                  <option value="Class 1 - Restricted">Class 1 — Restricted</option>
                  <option value="Class 1 - Learner">Class 1 — Learner</option>
                  <option value="Class 2 - Full">Class 2 — Full (Medium rigid)</option>
                  <option value="Class 2 - Restricted">Class 2 — Restricted</option>
                  <option value="Class 3 - Full">Class 3 — Full (Medium combination)</option>
                  <option value="Class 4 - Full">Class 4 — Full (Heavy rigid)</option>
                  <option value="Class 5 - Full">Class 5 — Full (Heavy combination)</option>
                  <option value="Overseas">Overseas License</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">License Expiry Date *</label>
                <input className="w-full border rounded-lg p-3" type="date" value={form.licenseExpiry} onChange={e => update('licenseExpiry', e.target.value)} />
              </div>
              <div className="flex gap-4 pt-2">
                <button onClick={() => setStep(0)} className="flex-1 border border-gray-300 py-3 rounded-lg font-medium hover:bg-gray-50">← Back</button>
                <button onClick={handleSaveAndContinue} disabled={saving}
                  className="flex-1 bg-[#FFD200] text-[#0d0c2c] py-3 rounded-lg font-semibold hover:bg-[#E87C1E] hover:text-white disabled:opacity-50 transition-colors">
                  {saving ? 'Saving...' : 'Save & Continue →'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Document Uploads */}
        {step === 2 && (
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <h2 className="text-xl font-semibold mb-2">Upload Documents</h2>
            <p className="text-gray-500 mb-6">Please upload the following documents. Items marked with * are required.</p>

            {docTypes.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <FileText size={40} className="mx-auto mb-3 text-gray-300" />
                <p>No document requirements have been set up yet.</p>
                <p className="text-sm mt-1">You can skip this step and upload later.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {docTypes.map(dt => {
                  const uploaded = uploadedDocs.find(d => d.documentTypeId === dt.id)
                  return (
                    <div key={dt.id} className={`border-2 rounded-xl p-4 transition-colors ${uploaded ? 'border-green-200 bg-green-50' : dt.isRequired ? 'border-orange-200' : 'border-gray-200'}`}>
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-medium flex items-center gap-2">
                            {uploaded ? <CheckCircle size={18} className="text-green-600" /> : <Upload size={18} className="text-gray-400" />}
                            {dt.name} {dt.isRequired && <span className="text-red-500">*</span>}
                          </h3>
                          {dt.description && <p className="text-sm text-gray-500 mt-1">{dt.description}</p>}
                          {dt.validityMonths && <p className="text-xs text-gray-400 mt-1">Valid for {dt.validityMonths} months</p>}
                        </div>
                        {uploaded && <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">Uploaded</span>}
                      </div>

                      {uploaded ? (
                        <div className="mt-3 flex items-center gap-2 text-sm text-green-700">
                          <FileText size={14} />
                          <span>{uploaded.fileName}</span>
                          <span className="text-gray-400">({(uploaded.fileSize / 1024).toFixed(0)} KB)</span>
                        </div>
                      ) : (
                        <div className="mt-3">
                          <label className="flex items-center justify-center gap-2 border-2 border-dashed border-gray-300 rounded-lg p-4 cursor-pointer hover:border-[#FFD200] hover:bg-yellow-50 transition-colors">
                            {uploading === dt.id ? (
                              <span className="text-sm text-gray-500">Uploading...</span>
                            ) : (
                              <>
                                <Upload size={18} className="text-gray-400" />
                                <span className="text-sm text-gray-600">Click to upload or drag & drop</span>
                              </>
                            )}
                            <input type="file" className="hidden" disabled={uploading === dt.id}
                              accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                              onChange={e => { if (e.target.files?.[0]) handleFileUpload(dt.id, e.target.files[0]) }} />
                          </label>
                          <p className="text-xs text-gray-400 mt-1">PDF, JPG, PNG, DOC — max 10MB</p>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}

            <div className="flex gap-4 pt-6">
              <button onClick={() => setStep(1)} className="flex-1 border border-gray-300 py-3 rounded-lg font-medium hover:bg-gray-50">← Back</button>
              <button onClick={() => setStep(3)} disabled={!requiredUploaded && docTypes.some(d => d.isRequired)}
                className="flex-1 bg-[#FFD200] text-[#0d0c2c] py-3 rounded-lg font-semibold hover:bg-[#E87C1E] hover:text-white disabled:opacity-50 transition-colors">
                {docTypes.length === 0 || requiredUploaded ? 'Next →' : 'Upload required docs to continue'}
              </button>
            </div>
          </div>
        )}

        {/* Step 4: Quiz */}
        {step === 3 && (
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <h2 className="text-xl font-semibold mb-2">Assessment Quiz</h2>

            {!quiz ? (
              <div className="text-center py-8">
                <CheckCircle size={40} className="mx-auto mb-3 text-green-500" />
                <p className="text-gray-600">No quiz is required at this time.</p>
                <p className="text-sm text-gray-400 mt-1">You're almost done!</p>
                <button onClick={() => setStep(4)} className="mt-6 bg-[#FFD200] text-[#0d0c2c] px-8 py-3 rounded-lg font-semibold hover:bg-[#E87C1E] hover:text-white transition-colors">
                  Complete Application →
                </button>
              </div>
            ) : quizResult ? (
              <div className="text-center py-8">
                {quizResult.passed ? (
                  <>
                    <CheckCircle size={48} className="mx-auto mb-3 text-green-500" />
                    <h3 className="text-2xl font-bold text-green-700">Passed!</h3>
                  </>
                ) : (
                  <>
                    <XCircle size={48} className="mx-auto mb-3 text-red-500" />
                    <h3 className="text-2xl font-bold text-red-700">Not Passed</h3>
                  </>
                )}
                <p className="text-gray-600 mt-2">Score: {quizResult.score} / {quiz.questions?.reduce((sum, q) => sum + q.points, 0) || 0} points</p>
                <p className="text-sm text-gray-400 mt-1">({quizResult.totalQuestions} questions)</p>
                <button onClick={() => setStep(4)} className="mt-6 bg-[#FFD200] text-[#0d0c2c] px-8 py-3 rounded-lg font-semibold hover:bg-[#E87C1E] hover:text-white transition-colors">
                  Complete Application →
                </button>
              </div>
            ) : !quizStarted ? (
              <div className="text-center py-8">
                <h3 className="text-lg font-semibold">{quiz.title}</h3>
                {quiz.description && <p className="text-gray-500 mt-2">{quiz.description}</p>}
                <div className="flex justify-center gap-6 mt-4 text-sm text-gray-600">
                  <span>{quiz.questions?.length || 0} questions</span>
                  <span>Pass mark: {quiz.passingScore}%</span>
                  {quiz.timeLimit && <span>Time limit: {quiz.timeLimit} minutes</span>}
                </div>
                <button onClick={startQuiz} className="mt-6 bg-[#FFD200] text-[#0d0c2c] px-8 py-3 rounded-lg font-semibold hover:bg-[#E87C1E] hover:text-white transition-colors">
                  Start Quiz
                </button>
              </div>
            ) : (
              <div>
                {/* Timer */}
                {timeLeft !== null && (
                  <div className={`flex items-center justify-end gap-2 mb-4 text-sm font-mono ${timeLeft < 60 ? 'text-red-600 animate-pulse' : 'text-gray-600'}`}>
                    <Clock size={16} />
                    {formatTime(timeLeft)}
                  </div>
                )}

                {/* Questions */}
                <div className="space-y-6">
                  {quiz.questions?.map((q, i) => {
                    const options = q.options ? JSON.parse(q.options) as string[] : []
                    return (
                      <div key={q.id} className="border rounded-xl p-5">
                        <p className="font-medium mb-3">
                          <span className="text-[#FFD200] font-bold mr-2">Q{i + 1}.</span>
                          {q.questionText}
                          <span className="text-xs text-gray-400 ml-2">({q.points} pt{q.points > 1 ? 's' : ''})</span>
                        </p>

                        {q.questionType === 'MultiChoice' && options.length > 0 && (
                          <div className="space-y-2">
                            {options.map((opt, oi) => (
                              <label key={oi} className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer border transition-colors
                                ${answers[q.id] === opt ? 'border-[#FFD200] bg-yellow-50' : 'border-gray-200 hover:bg-gray-50'}`}>
                                <input type="radio" name={`q-${q.id}`} checked={answers[q.id] === opt}
                                  onChange={() => setAnswers(a => ({ ...a, [q.id]: opt }))}
                                  className="w-4 h-4 accent-[#FFD200]" />
                                <span>{opt}</span>
                              </label>
                            ))}
                          </div>
                        )}

                        {q.questionType === 'TrueFalse' && (
                          <div className="flex gap-4">
                            {['True', 'False'].map(opt => (
                              <label key={opt} className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-lg cursor-pointer border transition-colors
                                ${answers[q.id] === opt ? 'border-[#FFD200] bg-yellow-50' : 'border-gray-200 hover:bg-gray-50'}`}>
                                <input type="radio" name={`q-${q.id}`} checked={answers[q.id] === opt}
                                  onChange={() => setAnswers(a => ({ ...a, [q.id]: opt }))}
                                  className="w-4 h-4 accent-[#FFD200]" />
                                <span className="font-medium">{opt}</span>
                              </label>
                            ))}
                          </div>
                        )}

                        {q.questionType === 'Text' && (
                          <textarea className="w-full border rounded-lg p-3 mt-1" rows={3} placeholder="Type your answer..."
                            value={answers[q.id] || ''} onChange={e => setAnswers(a => ({ ...a, [q.id]: e.target.value }))} />
                        )}
                      </div>
                    )
                  })}
                </div>

                <div className="flex gap-4 pt-6">
                  <div className="flex-1 text-sm text-gray-500 flex items-center">
                    {Object.keys(answers).length} / {quiz.questions?.length || 0} answered
                  </div>
                  <button onClick={handleSubmitQuiz} disabled={submittingQuiz || Object.keys(answers).length === 0}
                    className="bg-[#FFD200] text-[#0d0c2c] px-8 py-3 rounded-lg font-semibold hover:bg-[#E87C1E] hover:text-white disabled:opacity-50 transition-colors">
                    {submittingQuiz ? 'Submitting...' : 'Submit Quiz'}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Step 5: Confirmation */}
        {step === 4 && (
          <div className="bg-white rounded-xl p-8 shadow-sm text-center">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle size={40} className="text-green-600" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Application Submitted!</h2>
            <p className="text-gray-600 mb-6">
              Thank you, <strong>{form.firstName}</strong>. We've received your application and will review it shortly.
            </p>
            <div className="bg-gray-50 rounded-xl p-4 text-left max-w-sm mx-auto mb-6">
              <h3 className="font-semibold text-sm mb-2">What happens next?</h3>
              <ol className="text-sm text-gray-600 space-y-2">
                <li className="flex items-start gap-2"><span className="bg-[#FFD200] text-[#0d0c2c] rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold shrink-0">1</span> Our team reviews your application</li>
                <li className="flex items-start gap-2"><span className="bg-[#FFD200] text-[#0d0c2c] rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold shrink-0">2</span> We verify your documents</li>
                <li className="flex items-start gap-2"><span className="bg-[#FFD200] text-[#0d0c2c] rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold shrink-0">3</span> If selected, we'll contact you for an interview</li>
              </ol>
            </div>
            <p className="text-sm text-gray-500">
              Check your status anytime: <a href={`/apply/status?email=${form.email}`} className="text-[#E87C1E] underline font-medium">Check Status</a>
            </p>
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
  const [docs, setDocs] = useState<api.ApplicantDocument[]>([])
  const [loading, setLoading] = useState(false)

  const check = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await api.getApplicantByEmail(email)
      setApplicant(res)
      if (res.id) {
        const d = await api.getApplicantDocuments(res.id)
        setDocs(d)
      }
    } catch { setError('No application found for this email address.') }
    finally { setLoading(false) }
  }

  const statusColors: Record<string, string> = {
    Applied: 'bg-blue-100 text-blue-800',
    Screening: 'bg-yellow-100 text-yellow-800',
    Interview: 'bg-purple-100 text-purple-800',
    DocumentCheck: 'bg-orange-100 text-orange-800',
    QuizPending: 'bg-indigo-100 text-indigo-800',
    Approved: 'bg-green-100 text-green-800',
    Rejected: 'bg-red-100 text-red-800',
  }

  const docStatusIcon = (status: string) => {
    if (status === 'Verified') return <CheckCircle size={14} className="text-green-600" />
    if (status === 'Rejected') return <XCircle size={14} className="text-red-600" />
    return <Clock size={14} className="text-yellow-600" />
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-[#0d0c2c] text-white py-6 px-8 flex items-center gap-4">
        <img src="/urgent-logo.png" alt="Urgent Couriers" className="h-14" />
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
                <div>
                  <h3 className="font-bold text-lg">{applicant.firstName} {applicant.lastName}</h3>
                  <p className="text-gray-600">{applicant.email}</p>
                </div>
                <span className={`px-3 py-1 rounded-full text-sm font-semibold ${statusColors[applicant.status] || 'bg-gray-100'}`}>
                  {applicant.status}
                </span>
              </div>
              <p className="text-sm text-gray-500 mt-3">Applied: {new Date(applicant.appliedDate).toLocaleDateString('en-NZ')}</p>
            </div>

            {docs.length > 0 && (
              <div className="bg-white rounded-xl p-6 shadow-sm">
                <h3 className="font-semibold mb-3">Documents</h3>
                <div className="space-y-2">
                  {docs.map(d => (
                    <div key={d.id} className="flex items-center gap-3 text-sm p-2 rounded-lg bg-gray-50">
                      {docStatusIcon(d.status)}
                      <span className="font-medium">{d.documentType?.name || 'Document'}</span>
                      <span className="text-gray-400">—</span>
                      <span className="text-gray-600">{d.fileName}</span>
                      <span className={`ml-auto text-xs px-2 py-0.5 rounded-full ${
                        d.status === 'Verified' ? 'bg-green-100 text-green-700' :
                        d.status === 'Rejected' ? 'bg-red-100 text-red-700' :
                        'bg-yellow-100 text-yellow-700'
                      }`}>{d.status}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {applicant.quizAttempts && applicant.quizAttempts.length > 0 && (
              <div className="bg-white rounded-xl p-6 shadow-sm">
                <h3 className="font-semibold mb-3">Quiz Results</h3>
                {applicant.quizAttempts.map(qa => (
                  <div key={qa.id} className="flex items-center gap-3 text-sm p-2 rounded-lg bg-gray-50">
                    {qa.passed ? <CheckCircle size={14} className="text-green-600" /> : <XCircle size={14} className="text-red-600" />}
                    <span>Score: {qa.score}</span>
                    <span className={`ml-auto text-xs px-2 py-0.5 rounded-full ${qa.passed ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {qa.passed ? 'Passed' : 'Not Passed'}
                    </span>
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

export default function ApplicantPortal() {
  return (
    <Routes>
      <Route index element={<ApplyFlow />} />
      <Route path="status" element={<StatusCheck />} />
      <Route path="status/:email" element={<StatusCheck />} />
    </Routes>
  )
}
