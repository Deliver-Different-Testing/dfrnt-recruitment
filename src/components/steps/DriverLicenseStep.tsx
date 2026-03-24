import { Field, NavButtons, StepWrapper, UploadZone } from './shared'

interface Props {
  title: string; description?: string; isRequired: boolean
  form: Record<string, any>; update: (field: string, value: string) => void
  files: Record<string, File | null>; onFile: (key: string, f: File) => void
  uploading: boolean
  onNext: () => void; onBack: () => void
  onUpload?: (f: File) => void
}

export default function DriverLicenseStep({ title, description, isRequired, form, update, files, onFile, uploading, onNext, onBack, onUpload }: Props) {
  const hasFile = files['license_front'] || files['license_back']
  return (
    <StepWrapper title={title} description={description} isRequired={isRequired}>
      <div className="space-y-5">
        <div className="grid grid-cols-2 gap-4">
          <UploadZone label="📷 License Front" description="Front of your license"
            file={files['license_front'] || null} uploading={uploading}
            onFile={f => { onFile('license_front', f); if (onUpload) onUpload(f) }} />
          <UploadZone label="📷 License Back" description="Back of your license"
            file={files['license_back'] || null} uploading={false}
            onFile={f => onFile('license_back', f)} />
        </div>
        <Field label="License Number *" placeholder="AB123456" value={form.licenseNumber || ''} onChange={v => update('licenseNumber', v)} />
        <Field label="Expiry Date *" type="date" value={form.licenseExpiry || ''} onChange={v => update('licenseExpiry', v)} />
        <Field label="License Class" placeholder="Class 1 Full" value={form.licenseClass || ''} onChange={v => update('licenseClass', v)} />
        <Field label="Endorsements" placeholder="e.g. P, D, I" value={form.endorsements || ''} onChange={v => update('endorsements', v)} />
      </div>
      <NavButtons onBack={onBack} onNext={onNext}
        disabled={isRequired && (!form.licenseNumber || !form.licenseExpiry)}
        onSkip={!isRequired ? onNext : undefined} />
    </StepWrapper>
  )
}
