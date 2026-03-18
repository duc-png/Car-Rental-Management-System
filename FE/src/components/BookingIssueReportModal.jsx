import { useState } from 'react'
import '../styles/BookingIssueReportModal.css'

const CATEGORY_OPTIONS = [
    { value: 'VEHICLE_NOT_AS_DESCRIBED', label: 'Xe khong dung mo ta' },
    { value: 'VEHICLE_UNSAFE_OR_DAMAGED', label: 'Xe hong / khong an toan' },
    { value: 'LATE_OR_NO_DELIVERY', label: 'Giao xe tre / khong giao' },
    { value: 'OWNER_MISCONDUCT', label: 'Chu xe thai do khong phu hop' },
    { value: 'DEPOSIT_OR_EXTRA_FEE_DISPUTE', label: 'Tranh chap tien coc / phi' },
    { value: 'PREEXISTING_DAMAGE_UNDECLARED', label: 'Hu hong truoc chua ghi nhan' },
    { value: 'SUSPECTED_FRAUD', label: 'Nghi ngo gian lan' },
    { value: 'OTHER', label: 'Khac' },
]

function BookingIssueReportModal({ booking, onClose, onSubmit, submitting }) {
    const [category, setCategory] = useState('VEHICLE_NOT_AS_DESCRIBED')
    const [description, setDescription] = useState('')
    const [evidenceInput, setEvidenceInput] = useState('')

    const handleSubmit = () => {
        const trimmed = description.trim()
        if (trimmed.length < 10) return
        const evidenceUrls = evidenceInput
            .split('\n')
            .map((item) => item.trim())
            .filter(Boolean)
        onSubmit({
            bookingId: booking.id,
            category,
            description: trimmed,
            evidenceUrls,
        })
    }

    return (
        <div className="issue-report-overlay" onClick={onClose}>
            <div className="issue-report-modal" onClick={(e) => e.stopPropagation()}>
                <header className="issue-report-header">
                    <h2>Gui report cho booking #{booking.id}</h2>
                    <button type="button" className="issue-report-close" onClick={onClose}>
                        x
                    </button>
                </header>
                <div className="issue-report-body">
                    <label className="issue-report-field">
                        <span>Loai van de</span>
                        <select value={category} onChange={(e) => setCategory(e.target.value)}>
                            {CATEGORY_OPTIONS.map((option) => (
                                <option key={option.value} value={option.value}>
                                    {option.label}
                                </option>
                            ))}
                        </select>
                    </label>
                    <label className="issue-report-field">
                        <span>Noi dung report</span>
                        <textarea
                            rows={5}
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Mo ta chi tiet van de (toi thieu 10 ky tu)"
                        />
                    </label>
                    <label className="issue-report-field">
                        <span>Bang chung (moi dong 1 URL, tuy chon)</span>
                        <textarea
                            rows={3}
                            value={evidenceInput}
                            onChange={(e) => setEvidenceInput(e.target.value)}
                            placeholder="https://.../evidence1"
                        />
                    </label>
                </div>
                <footer className="issue-report-footer">
                    <button type="button" className="issue-report-btn secondary" onClick={onClose} disabled={submitting}>
                        Huy
                    </button>
                    <button
                        type="button"
                        className="issue-report-btn primary"
                        disabled={submitting || description.trim().length < 10}
                        onClick={handleSubmit}
                    >
                        {submitting ? 'Dang gui...' : 'Gui report'}
                    </button>
                </footer>
            </div>
        </div>
    )
}

export default BookingIssueReportModal
