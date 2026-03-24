import { Field, NavButtons, StepWrapper, UploadZone } from './shared'

interface Props {
  stepType: string; title: string; description?: string; isRequired: boolean
  file: File | null; uploading: boolean; uploaded: boolean
  onFile: (f: File) => void
  fields: Record<string, any>; updateField: (key: string, value: string) => void
  onNext: () => void; onBack: () => void
}

const STEP_FIELDS: Record<string, { key: string; label: string; type?: string; placeholder?: string; required?: boolean }[]> = {
  vehicle_registration: [
    { key: 'plateNumber', label: 'Plate Number *', placeholder: 'ABC123', required: true },
    { key: 'regoExpiry', label: 'Registration Expiry *', type: 'date', required: true },
  ],
  vehicle_insurance: [
    { key: 'policyNumber', label: 'Policy Number *', placeholder: 'POL-12345', required: true },
    { key: 'insurerName', label: 'Insurer Name *', placeholder: 'e.g. AA Insurance', required: true },
    { key: 'coverageAmount', label: 'Coverage Amount', placeholder: '$10,000' },
    { key: 'expiryDate', label: 'Expiry Date *', type: 'date', required: true },
  ],
  wof_certificate: [
    { key: 'wofExpiry', label: 'WOF Expiry *', type: 'date', required: true },
  ],
  tsl_certificate: [
    { key: 'tslNumber', label: 'TSL Number', placeholder: 'TSL-12345' },
    { key: 'tslExpiry', label: 'TSL Expiry *', type: 'date', required: true },
  ],
}

export default function DocumentUploadStep({ stepType, title, description, isRequired, file, uploading, uploaded, onFile, fields, updateField, onNext, onBack }: Props) {
  const stepFields = STEP_FIELDS[stepType] || []
  const requiredFieldsFilled = stepFields.filter(f => f.required).every(f => fields[f.key])
  const canProceed = isRequired ? (uploaded || !!file) && (stepFields.length === 0 || requiredFieldsFilled) : true

  return (
    <StepWrapper title={title} description={description} isRequired={isRequired}>
      <div className="space-y-5">
        <UploadZone
          label={`📷 Upload ${title}`}
          description="Take a photo or upload a file"
          file={file}
          uploading={uploading}
          onFile={onFile}
        />
        {stepFields.map(f => (
          <Field key={f.key} label={f.label} placeholder={f.placeholder} type={f.type}
            value={fields[f.key] || ''} onChange={v => updateField(f.key, v)} />
        ))}
      </div>
      <NavButtons onBack={onBack} onNext={onNext} disabled={!canProceed}
        onSkip={!isRequired ? onNext : undefined} />
    </StepWrapper>
  )
}
