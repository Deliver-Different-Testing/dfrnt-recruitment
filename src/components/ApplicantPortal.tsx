import { useState, useEffect, useRef } from 'react'
import { Routes, Route, useNavigate } from 'react-router-dom'
import * as api from '../lib/api'
import { Upload, CheckCircle, XCircle, Clock, FileText, AlertCircle, CreditCard, Car, Shield, FileCheck, Building, Hash, Camera, ChevronRight } from 'lucide-react'

// ─── Step definitions ────────────────────────────────────
const STEPS = [
  { key: 'details', label: 'Details' },
  { key: 'vehicle', label: 'Vehicle' },
  { key: 'drivers-license', label: "Driver's License" },
  { key: 'vehicle-rego', label: 'Vehicle Rego' },
  { key: 'vehicle-insurance', label: 'Vehicle Insurance' },
  { key: 'wof', label: 'WOF Certificate' },
  { key: 'tsl', label: 'TSL Certificate' },
  { key: 'review', label: 'Review' },
]

// ─── File Upload Zone ────────────────────────────────────
function UploadZone({ label, description, file, uploading, onFile, accept = '.pdf,.jpg,.jpeg,.png,.doc,.docx,.heic' }: {
  label: string; description?: string; file: File | null; uploading: boolean;
  onFile: (f: File) => void; accept?: string
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
        </div>
      ) : (
        <label className={`block border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors
          ${uploading ? 'border-gray-300 bg-gray-50' : 'border-[#3bc7f4]/40 hover:border-[#FFD200] hover:bg-yellow-50'}`}>
          {uploading ? (
            <p className="text-sm text-gray-500">Uploading...</p>
          ) : (
            <>
              <Camera size={32} className="mx-auto mb-3 text-[#3bc7f4]" />
              <p className="font-semibold text-sm text-[#3bc7f4]">{label}</p>
              {description && <p className="text-xs text-gray-500 mt-1">{description}</p>}
            </>
          )}
          <input ref={inputRef} type="file" className="hidden" accept={accept} capture="environment"
            onChange={e => { if (e.target.files?.[0]) onFile(e.target.files[0]) }} />
        </label>
      )}
      <input ref={inputRef} type="file" className="hidden" accept={accept}
        onChange={e => { if (e.target.files?.[0]) onFile(e.target.files[0]) }} />
    </div>
  )
}

// ─── Step Indicator ──────────────────────────────────────
function StepIndicator({ current }: { current: number }) {
  return (
    <div className="bg-white border-b sticky top-0 z-20">
      <div className="max-w-3xl mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          {STEPS.map((s, i) => (
            <div key={s.key} className="flex items-center">
              <div className={`flex items-center gap-1.5 ${i <= current ? '' : 'opacity-40'}`}>
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold
                  ${i < current ? 'bg-green-500 text-white' : i === current ? 'bg-[#0d0c2c] text-white' : 'bg-gray-200 text-gray-600'}`}>
                  {i < current ? '✓' : i + 1}
                </div>
                <span className="text-xs font-medium text-gray-700 hidden sm:inline max-w-[60px] truncate">{s.label}</span>
              </div>
              {i < STEPS.length - 1 && <div className={`w-4 sm:w-6 h-0.5 mx-1 ${i < current ? 'bg-green-400' : 'bg-gray-200'}`} />}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── Main Apply Flow ─────────────────────────────────────
function ApplyFlow() {
  const [step, setStep] = useState(0)
  const [form, setForm] = useState({
    firstName: '', lastName: '', email: '', phone: '', dateOfBirth: '',
    address: '', city: '', region: '', postcode: '', source: '',
    vehicleType: '', hasOwnVehicle: false, vehicleMake: '', vehicleModel: '', vehicleYear: '',
    licenseType: '', licenseExpiry: '', licenseNumber: '',
  })
  const [applicantId, setApplicantId] = useState<number | null>(null)
  const [files, setFiles] = useState<Record<string, File | null>>({
    driversLicenseFront: null, driversLicenseBack: null,
    vehicleRego: null, vehicleInsurance: null, wof: null, tsl: null,
  })
  const [uploadedDocs, setUploadedDocs] = useState<Record<string, api.ApplicantDocument>>({})
  const [uploading, setUploading] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const update = (field: string, value: string | boolean) => setForm(f => ({ ...f, [field]: value }))
  const setFile = (key: string, file: File) => setFiles(f => ({ ...f, [key]: file }))

  // Save applicant (after step 1)
  const saveApplicant = async () => {
    setSaving(true); setError('')
    try {
      const result = await api.applyAsApplicant({
        firstName: form.firstName, lastName: form.lastName, email: form.email,
        phone: form.phone, address: form.address, city: form.city, region: form.region,
        vehicleType: form.vehicleType, hasOwnVehicle: form.hasOwnVehicle,
        licenseType: form.licenseType, licenseExpiry: form.licenseExpiry || undefined,
        source: form.source, notes: form.postcode ? `Postcode: ${form.postcode}` : undefined,
      } as any)
      setApplicantId(result.id)
      return result.id
    } catch (e: any) { setError(e.message || 'Error saving'); return null }
    finally { setSaving(false) }
  }

  // Upload a document
  const uploadDoc = async (docTypeId: number, file: File, key: string) => {
    let id = applicantId
    if (!id) { id = await saveApplicant(); if (!id) return }
    setUploading(key)
    try {
      const doc = await api.uploadDocument(id, docTypeId, file)
      setUploadedDocs(prev => ({ ...prev, [key]: doc }))
    } catch (e: any) { alert('Upload failed: ' + (e.message || 'Unknown error')) }
    finally { setUploading(null) }
  }

  const handleNext = async () => {
    if (step === 0) {
      // Save applicant on leaving step 1
      if (!applicantId) {
        const id = await saveApplicant()
        if (!id) return
      }
    }
    setStep(s => Math.min(s + 1, STEPS.length - 1))
    window.scrollTo(0, 0)
  }

  const handleBack = () => { setStep(s => Math.max(s - 1, 0)); window.scrollTo(0, 0) }

  const handleSubmit = () => {
    setSubmitted(true)
    setStep(STEPS.length - 1)
  }

  // Doc type IDs (match seed order): 1=License, 2=Rego, 3=Insurance, 4=PoA, 5=Passport, 6=WOF
  // We'll use names to look up dynamically if needed, but for now hardcode seed IDs

  const canAdvanceStep0 = form.firstName && form.lastName && form.email && form.phone
  const canAdvanceStep1 = form.vehicleType && form.licenseType

  return (
    <div className="min-h-screen bg-gray-50">
      <StepIndicator current={step} />

      <div className="max-w-2xl mx-auto py-8 px-4">
        {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 flex items-center gap-2"><AlertCircle size={18} />{error}</div>}

        {/* ── Step 1: Your Details ──────────────────── */}
        {step === 0 && (
          <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
            <h2 className="text-2xl font-bold text-[#0d0c2c] mb-1">Your Details</h2>
            <p className="text-gray-500 mb-6">Scan your driver's license to auto-fill, or enter details manually.</p>

            {/* License scan zone */}
            <div className="mb-8">
              <UploadZone label="📷 Scan Driver's License (front & back)"
                description="Upload or take photos of both front and back"
                file={files.driversLicenseFront} uploading={uploading === 'driversLicenseFront'}
                onFile={f => { setFile('driversLicenseFront', f) }} />
            </div>

            <div className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1.5">First Name *</label>
                  <input className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-[#FFD200] focus:border-[#FFD200] outline-none"
                    placeholder="John" value={form.firstName} onChange={e => update('firstName', e.target.value)} />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1.5">Last Name *</label>
                  <input className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-[#FFD200] focus:border-[#FFD200] outline-none"
                    placeholder="Smith" value={form.lastName} onChange={e => update('lastName', e.target.value)} />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1.5">Email *</label>
                <input className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-[#FFD200] focus:border-[#FFD200] outline-none"
                  type="email" placeholder="john@example.com" value={form.email} onChange={e => update('email', e.target.value)} />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1.5">Mobile Number *</label>
                <input className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-[#FFD200] focus:border-[#FFD200] outline-none"
                  placeholder="+64 21 123 4567" value={form.phone} onChange={e => update('phone', e.target.value)} />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1.5">Date of Birth</label>
                <input className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-[#FFD200] focus:border-[#FFD200] outline-none"
                  type="date" value={form.dateOfBirth} onChange={e => update('dateOfBirth', e.target.value)} />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1.5">Address</label>
                <input className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-[#FFD200] focus:border-[#FFD200] outline-none"
                  placeholder="Street address" value={form.address} onChange={e => update('address', e.target.value)} />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1.5">City</label>
                  <input className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-[#FFD200] focus:border-[#FFD200] outline-none"
                    placeholder="Auckland" value={form.city} onChange={e => update('city', e.target.value)} />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1.5">Region</label>
                  <select className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-[#FFD200] focus:border-[#FFD200] outline-none"
                    value={form.region} onChange={e => update('region', e.target.value)}>
                    <option value="">Select</option>
                    {['Auckland','Wellington','Canterbury','Waikato','Bay of Plenty','Otago','Manawatu-Whanganui',"Hawke's Bay",'Northland','Taranaki','Southland','Nelson','Marlborough','West Coast','Gisborne','Tasman'].map(r =>
                      <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1.5">Postcode</label>
                  <input className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-[#FFD200] focus:border-[#FFD200] outline-none"
                    placeholder="1010" value={form.postcode} onChange={e => update('postcode', e.target.value)} />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1.5">How did you hear about us?</label>
                <select className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-[#FFD200] focus:border-[#FFD200] outline-none"
                  value={form.source} onChange={e => update('source', e.target.value)}>
                  <option value="">Select...</option>
                  <option value="seek">Seek</option>
                  <option value="trademe">Trade Me Jobs</option>
                  <option value="website">Urgent Couriers Website</option>
                  <option value="referral">Referral from existing driver</option>
                  <option value="facebook">Facebook</option>
                  <option value="linkedin">LinkedIn</option>
                  <option value="walkin">Walk-in</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>

            <button onClick={handleNext} disabled={!canAdvanceStep0 || saving}
              className="mt-8 w-full bg-[#0d0c2c] text-white py-3.5 rounded-xl font-semibold hover:bg-[#1a1950] disabled:opacity-50 transition-colors flex items-center justify-center gap-2">
              {saving ? 'Saving...' : <>Next <ChevronRight size={18} /></>}
            </button>
          </div>
        )}

        {/* ── Step 2: Vehicle Details ──────────────── */}
        {step === 1 && (
          <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
            <h2 className="text-2xl font-bold text-[#0d0c2c] mb-1">Vehicle Details</h2>
            <p className="text-gray-500 mb-6">Tell us about the vehicle you'll use for deliveries.</p>

            <div className="space-y-5">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1.5">Vehicle Type *</label>
                <select className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-[#FFD200] focus:border-[#FFD200] outline-none"
                  value={form.vehicleType} onChange={e => update('vehicleType', e.target.value)}>
                  <option value="">Select vehicle type</option>
                  <option value="car">Car / Sedan</option>
                  <option value="suv">SUV / Station Wagon</option>
                  <option value="van">Van</option>
                  <option value="ute">Ute</option>
                  <option value="truck">Truck (Class 2+)</option>
                  <option value="bike">Motorbike</option>
                  <option value="ebike">E-Bike / Bicycle</option>
                  <option value="none">No vehicle — need company vehicle</option>
                </select>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1.5">Make</label>
                  <input className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-[#FFD200] focus:border-[#FFD200] outline-none"
                    placeholder="Toyota" value={form.vehicleMake} onChange={e => update('vehicleMake', e.target.value)} />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1.5">Model</label>
                  <input className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-[#FFD200] focus:border-[#FFD200] outline-none"
                    placeholder="Hiace" value={form.vehicleModel} onChange={e => update('vehicleModel', e.target.value)} />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1.5">Year</label>
                  <input className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-[#FFD200] focus:border-[#FFD200] outline-none"
                    placeholder="2020" value={form.vehicleYear} onChange={e => update('vehicleYear', e.target.value)} />
                </div>
              </div>

              <label className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl cursor-pointer border border-gray-200">
                <input type="checkbox" checked={form.hasOwnVehicle} onChange={e => update('hasOwnVehicle', e.target.checked)} className="w-5 h-5 accent-[#FFD200]" />
                <div>
                  <span className="font-medium text-sm">I own this vehicle</span>
                  <p className="text-xs text-gray-500">Available for courier work</p>
                </div>
              </label>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1.5">Driver's License Class *</label>
                <select className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-[#FFD200] focus:border-[#FFD200] outline-none"
                  value={form.licenseType} onChange={e => update('licenseType', e.target.value)}>
                  <option value="">Select license class</option>
                  <option value="Class 1 - Full">Class 1 — Full (Car)</option>
                  <option value="Class 1 - Restricted">Class 1 — Restricted</option>
                  <option value="Class 2 - Full">Class 2 — Full (Medium rigid)</option>
                  <option value="Class 2 - Restricted">Class 2 — Restricted</option>
                  <option value="Class 3 - Full">Class 3 — Full (Medium combination)</option>
                  <option value="Class 4 - Full">Class 4 — Full (Heavy rigid)</option>
                  <option value="Class 5 - Full">Class 5 — Full (Heavy combination)</option>
                  <option value="Overseas">Overseas License</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1.5">License Number</label>
                  <input className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-[#FFD200] focus:border-[#FFD200] outline-none"
                    placeholder="AB123456" value={form.licenseNumber} onChange={e => update('licenseNumber', e.target.value)} />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1.5">License Expiry *</label>
                  <input className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-[#FFD200] focus:border-[#FFD200] outline-none"
                    type="date" value={form.licenseExpiry} onChange={e => update('licenseExpiry', e.target.value)} />
                </div>
              </div>
            </div>

            <div className="flex gap-4 mt-8">
              <button onClick={handleBack} className="flex-1 border border-gray-300 py-3.5 rounded-xl font-medium hover:bg-gray-50 transition-colors">← Back</button>
              <button onClick={handleNext} disabled={!canAdvanceStep1}
                className="flex-1 bg-[#0d0c2c] text-white py-3.5 rounded-xl font-semibold hover:bg-[#1a1950] disabled:opacity-50 transition-colors flex items-center justify-center gap-2">
                Next <ChevronRight size={18} />
              </button>
            </div>
          </div>
        )}

        {/* ── Step 3: Driver's License Upload ──────── */}
        {step === 2 && (
          <DocUploadStep
            title="Driver's License"
            description="Upload clear photos of the front and back of your NZ driver's license."
            required
            uploads={[
              { key: 'driversLicenseFront', label: '📷 Upload License — Front', desc: 'Take a photo or upload an image', file: files.driversLicenseFront, uploading: uploading === 'driversLicenseFront' },
              { key: 'driversLicenseBack', label: '📷 Upload License — Back', desc: 'Take a photo or upload an image', file: files.driversLicenseBack, uploading: uploading === 'driversLicenseBack' },
            ]}
            onFile={(key, f) => { setFile(key, f); uploadDoc(1, f, key) }}
            onNext={handleNext} onBack={handleBack}
            canAdvance={!!files.driversLicenseFront}
          />
        )}

        {/* ── Step 4: Vehicle Registration ─────────── */}
        {step === 3 && (
          <DocUploadStep
            title="Vehicle Registration"
            description="Upload your current vehicle registration document."
            required
            uploads={[
              { key: 'vehicleRego', label: '📷 Upload Vehicle Registration', desc: 'Photo or PDF of your rego', file: files.vehicleRego, uploading: uploading === 'vehicleRego' },
            ]}
            onFile={(key, f) => { setFile(key, f); uploadDoc(2, f, key) }}
            onNext={handleNext} onBack={handleBack}
            canAdvance={!!files.vehicleRego}
          />
        )}

        {/* ── Step 5: Vehicle Insurance ────────────── */}
        {step === 4 && (
          <DocUploadStep
            title="Vehicle Insurance"
            description="Upload your vehicle insurance certificate. Third party or comprehensive."
            uploads={[
              { key: 'vehicleInsurance', label: '📷 Upload Insurance Document', desc: 'Photo or PDF', file: files.vehicleInsurance, uploading: uploading === 'vehicleInsurance' },
            ]}
            onFile={(key, f) => { setFile(key, f); uploadDoc(3, f, key) }}
            onNext={handleNext} onBack={handleBack} canAdvance skipLabel="Skip — I'll add this later"
          />
        )}

        {/* ── Step 6: WOF Certificate ─────────────── */}
        {step === 5 && (
          <DocUploadStep
            title="WOF Certificate"
            description="Upload your current Warrant of Fitness certificate."
            required
            uploads={[
              { key: 'wof', label: '📷 Upload WOF Certificate', desc: 'Photo or PDF', file: files.wof, uploading: uploading === 'wof' },
            ]}
            onFile={(key, f) => { setFile(key, f); uploadDoc(6, f, key) }}
            onNext={handleNext} onBack={handleBack}
            canAdvance={!!files.wof}
          />
        )}

        {/* ── Step 7: TSL Certificate ─────────────── */}
        {step === 6 && (
          <DocUploadStep
            title="TSL Certificate"
            description="Upload your Transport Service License (if applicable). You can skip this if you don't have one."
            uploads={[
              { key: 'tsl', label: '📷 Upload TSL Certificate', desc: 'Photo or PDF', file: files.tsl, uploading: uploading === 'tsl' },
            ]}
            onFile={(key, f) => setFile(key, f)}
            onNext={handleNext} onBack={handleBack} canAdvance skipLabel="Skip — not applicable"
          />
        )}

        {/* ── Step 8: Review & Submit ─────────────── */}
        {step === 7 && !submitted && (
          <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
            <h2 className="text-2xl font-bold text-[#0d0c2c] mb-1">Review Your Application</h2>
            <p className="text-gray-500 mb-6">Please check everything looks correct before submitting.</p>

            {/* Personal */}
            <Section title="Personal Details">
              <Row label="Name" value={`${form.firstName} ${form.lastName}`} />
              <Row label="Email" value={form.email} />
              <Row label="Phone" value={form.phone} />
              {form.dateOfBirth && <Row label="Date of Birth" value={form.dateOfBirth} />}
              {form.address && <Row label="Address" value={[form.address, form.city, form.region, form.postcode].filter(Boolean).join(', ')} />}
            </Section>

            {/* Vehicle */}
            <Section title="Vehicle & License">
              <Row label="Vehicle" value={[form.vehicleMake, form.vehicleModel, form.vehicleYear].filter(Boolean).join(' ') || form.vehicleType} />
              <Row label="Own Vehicle" value={form.hasOwnVehicle ? 'Yes' : 'No'} />
              <Row label="License" value={form.licenseType} />
              {form.licenseNumber && <Row label="License #" value={form.licenseNumber} />}
              {form.licenseExpiry && <Row label="Expiry" value={form.licenseExpiry} />}
            </Section>

            {/* Documents */}
            <Section title="Documents Uploaded">
              <DocRow label="Driver's License (Front)" uploaded={!!files.driversLicenseFront} />
              <DocRow label="Driver's License (Back)" uploaded={!!files.driversLicenseBack} />
              <DocRow label="Vehicle Registration" uploaded={!!files.vehicleRego} />
              <DocRow label="Vehicle Insurance" uploaded={!!files.vehicleInsurance} />
              <DocRow label="WOF Certificate" uploaded={!!files.wof} />
              <DocRow label="TSL Certificate" uploaded={!!files.tsl} />
            </Section>

            <div className="flex gap-4 mt-8">
              <button onClick={handleBack} className="flex-1 border border-gray-300 py-3.5 rounded-xl font-medium hover:bg-gray-50">← Back</button>
              <button onClick={handleSubmit}
                className="flex-1 bg-[#FFD200] text-[#0d0c2c] py-3.5 rounded-xl font-bold text-lg hover:bg-[#E87C1E] hover:text-white transition-colors">
                Submit Application ✓
              </button>
            </div>
          </div>
        )}

        {/* ── Confirmation ────────────────────────── */}
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
                <li className="flex items-start gap-2"><span className="bg-[#FFD200] text-[#0d0c2c] rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold shrink-0">1</span> Our team reviews your details & documents</li>
                <li className="flex items-start gap-2"><span className="bg-[#FFD200] text-[#0d0c2c] rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold shrink-0">2</span> We verify your documents</li>
                <li className="flex items-start gap-2"><span className="bg-[#FFD200] text-[#0d0c2c] rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold shrink-0">3</span> If selected, we'll contact you for next steps</li>
              </ol>
            </div>
            <p className="text-sm text-gray-500">
              Check your status: <a href={`/apply/status?email=${form.email}`} className="text-[#E87C1E] underline font-medium">Check Status</a>
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Reusable Document Upload Step ───────────────────────
function DocUploadStep({ title, description, required, uploads, onFile, onNext, onBack, canAdvance, skipLabel }: {
  title: string; description: string; required?: boolean;
  uploads: { key: string; label: string; desc: string; file: File | null; uploading: boolean }[];
  onFile: (key: string, f: File) => void; onNext: () => void; onBack: () => void;
  canAdvance?: boolean; skipLabel?: string
}) {
  return (
    <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
      <div className="flex items-center gap-2 mb-1">
        <h2 className="text-2xl font-bold text-[#0d0c2c]">{title}</h2>
        {required && <span className="text-xs text-red-500 font-semibold bg-red-50 px-2 py-0.5 rounded-full">Required</span>}
      </div>
      <p className="text-gray-500 mb-6">{description}</p>

      <div className="space-y-4">
        {uploads.map(u => (
          <UploadZone key={u.key} label={u.label} description={u.desc}
            file={u.file} uploading={u.uploading} onFile={f => onFile(u.key, f)} />
        ))}
      </div>

      <div className="flex gap-4 mt-8">
        <button onClick={onBack} className="flex-1 border border-gray-300 py-3.5 rounded-xl font-medium hover:bg-gray-50 transition-colors">← Back</button>
        {canAdvance !== undefined && !canAdvance && skipLabel ? (
          <button onClick={onNext}
            className="flex-1 bg-gray-100 text-gray-700 py-3.5 rounded-xl font-medium hover:bg-gray-200 transition-colors">
            {skipLabel}
          </button>
        ) : null}
        <button onClick={onNext} disabled={required && !canAdvance}
          className="flex-1 bg-[#0d0c2c] text-white py-3.5 rounded-xl font-semibold hover:bg-[#1a1950] disabled:opacity-50 transition-colors flex items-center justify-center gap-2">
          Next <ChevronRight size={18} />
        </button>
      </div>
    </div>
  )
}

// ─── Review helpers ──────────────────────────────────────
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-6">
      <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3 border-b pb-2">{title}</h3>
      <div className="space-y-1.5">{children}</div>
    </div>
  )
}
function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between text-sm">
      <span className="text-gray-500">{label}</span>
      <span className="font-medium text-[#0d0c2c]">{value || '—'}</span>
    </div>
  )
}
function DocRow({ label, uploaded }: { label: string; uploaded: boolean }) {
  return (
    <div className="flex items-center justify-between text-sm py-1">
      <span className="text-gray-500">{label}</span>
      {uploaded ? (
        <span className="flex items-center gap-1 text-green-600 text-xs font-medium"><CheckCircle size={14} /> Uploaded</span>
      ) : (
        <span className="flex items-center gap-1 text-gray-400 text-xs"><Clock size={14} /> Not uploaded</span>
      )}
    </div>
  )
}

// ─── Status Check Page ───────────────────────────────────
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
    QuizPending: 'bg-indigo-100 text-indigo-800', Approved: 'bg-green-100 text-green-800',
    Rejected: 'bg-red-100 text-red-800',
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
                      {d.status === 'Verified' ? <CheckCircle size={14} className="text-green-600" /> :
                       d.status === 'Rejected' ? <XCircle size={14} className="text-red-600" /> :
                       <Clock size={14} className="text-yellow-600" />}
                      <span className="font-medium">{d.documentType?.name || 'Document'}</span>
                      <span className={`ml-auto text-xs px-2 py-0.5 rounded-full ${
                        d.status === 'Verified' ? 'bg-green-100 text-green-700' :
                        d.status === 'Rejected' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>{d.status}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Landing Page ────────────────────────────────────────
const docRequirements = [
  { icon: CreditCard, title: "Driver's License", required: true, desc: "Upload a clear photo of front and back." },
  { icon: Car, title: "Vehicle Registration", required: true, desc: "Current registration document." },
  { icon: Shield, title: "Vehicle Insurance", required: false, desc: "Basic vehicle insurance — third party or comprehensive." },
  { icon: FileCheck, title: "WOF Certificate", required: true, desc: "Current Warrant of Fitness." },
  { icon: Building, title: "TSL Certificate", required: false, desc: "Transport Service License (if applicable)." },
  { icon: Hash, title: "IRD Number", required: false, desc: "For tax and payment setup." },
]

function LandingPage() {
  const navigate = useNavigate()
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto py-8 px-4">
        <div className="bg-[#0d0c2c] rounded-2xl p-8 mb-8">
          <img src="/urgent-logo.png" alt="Urgent Couriers" className="h-12 mb-6" />
          <h1 className="text-3xl font-bold text-white mb-2">Join Our Team</h1>
          <p className="text-gray-400">We're looking for reliable courier drivers across New Zealand.</p>
        </div>
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-[#0d0c2c] mb-4">What you'll need to apply</h2>
          <div className="grid grid-cols-2 gap-3">
            {docRequirements.map((doc, i) => (
              <div key={i} className="bg-white rounded-xl p-4 border border-gray-100 flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
                  <doc.icon size={20} className="text-[#0d0c2c]" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-sm text-[#0d0c2c]">{doc.title}</span>
                    {doc.required && <span className="text-xs text-red-500 font-medium">Required</span>}
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">{doc.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="bg-green-50 border border-green-100 rounded-xl p-4 flex items-start gap-3 mb-6">
          <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center shrink-0">
            <Clock size={20} className="text-green-600" />
          </div>
          <div>
            <p className="font-semibold text-sm text-[#0d0c2c]">Quick & Easy — About 5 minutes</p>
            <p className="text-xs text-green-700 mt-0.5">Take photos of your documents with your phone camera. Upload them directly.</p>
          </div>
        </div>
        <button onClick={() => navigate('/apply/form')}
          className="w-full sm:w-auto bg-[#FFD200] text-[#0d0c2c] px-8 py-3.5 rounded-xl font-bold text-lg hover:bg-[#E87C1E] hover:text-white transition-colors shadow-sm">
          Start Application →
        </button>
        <p className="text-sm text-gray-400 mt-4">
          Already applied? <a href="/apply/status" className="text-[#E87C1E] underline font-medium">Check your status</a>
        </p>
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
