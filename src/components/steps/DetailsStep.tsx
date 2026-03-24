import { Field, NavButtons, StepWrapper } from './shared'

interface Props {
  form: Record<string, any>
  update: (field: string, value: string | boolean) => void
  onNext: () => void
  saving: boolean
  title: string
  description?: string
}

export default function DetailsStep({ form, update, onNext, saving, title, description }: Props) {
  return (
    <StepWrapper title={title} description={description}>
      <div className="space-y-5">
        <div className="grid grid-cols-2 gap-4">
          <Field label="First Name *" placeholder="John" value={form.firstName || ''} onChange={v => update('firstName', v)} />
          <Field label="Last Name *" placeholder="Smith" value={form.lastName || ''} onChange={v => update('lastName', v)} />
        </div>
        <Field label="Email *" placeholder="john@example.com" type="email" value={form.email || ''} onChange={v => update('email', v)} />
        <Field label="Mobile Number *" placeholder="+64 21 123 4567" value={form.phone || ''} onChange={v => update('phone', v)} />
        <Field label="Date of Birth" type="date" value={form.dateOfBirth || ''} onChange={v => update('dateOfBirth', v)} />
        <Field label="Address" placeholder="Street address" value={form.address || ''} onChange={v => update('address', v)} />
        <div className="grid grid-cols-3 gap-4">
          <Field label="City" placeholder="Auckland" value={form.city || ''} onChange={v => update('city', v)} />
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1.5">Region</label>
            <select className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-[#FFD200] focus:border-[#FFD200] outline-none"
              value={form.region || ''} onChange={e => update('region', e.target.value)}>
              <option value="">Select</option>
              {['Auckland','Wellington','Canterbury','Waikato','Bay of Plenty','Otago','Manawatu-Whanganui',"Hawke's Bay",'Northland','Taranaki','Southland','Nelson','Marlborough','West Coast','Gisborne','Tasman'].map(r =>
                <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
          <Field label="Postcode" placeholder="1010" value={form.postcode || ''} onChange={v => update('postcode', v)} />
        </div>
        <div>
          <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1.5">How did you hear about us?</label>
          <select className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-[#FFD200] focus:border-[#FFD200] outline-none"
            value={form.source || ''} onChange={e => update('source', e.target.value)}>
            <option value="">Select...</option>
            <option value="seek">Seek</option><option value="trademe">Trade Me Jobs</option><option value="website">Urgent Couriers Website</option>
            <option value="referral">Referral from existing driver</option><option value="facebook">Facebook</option>
            <option value="linkedin">LinkedIn</option><option value="walkin">Walk-in</option><option value="other">Other</option>
          </select>
        </div>
      </div>
      <NavButtons onNext={onNext} disabled={!form.firstName || !form.lastName || !form.email || !form.phone || saving} nextLabel={saving ? 'Saving...' : undefined} />
    </StepWrapper>
  )
}
