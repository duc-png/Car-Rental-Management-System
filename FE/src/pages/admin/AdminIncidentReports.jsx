import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { decideIncidentReport, getAdminIncidentReports, reviewIncidentReportAppeal } from '../../api/incidentReports'
import '../../styles/Customers.css'
import '../../styles/AdminIncidentReports.css'

const DECISION_OPTIONS = ['APPROVED', 'REJECTED', 'RESOLVED', 'PENALIZED', 'REFUNDED']

const getSelectedDecision = (report, decisionById) => {
    if (decisionById[report.id]) return decisionById[report.id]
    if (DECISION_OPTIONS.includes(report.status)) return report.status
    return 'APPROVED'
}

const getAppealApproveStatus = (report, decisionById) => {
    const candidate = decisionById[report.id]
    if (candidate && candidate !== 'PENDING' && candidate !== 'REJECTED') {
        return candidate
    }
    if (report.status && report.status !== 'PENDING' && report.status !== 'REJECTED') {
        return report.status
    }
    return 'RESOLVED'
}

export default function AdminIncidentReports() {
    const [reports, setReports] = useState([])
    const [loading, setLoading] = useState(true)
    const [updatingId, setUpdatingId] = useState(null)
    const [decisionById, setDecisionById] = useState({})
    const [noteById, setNoteById] = useState({})

    const loadReports = async () => {
        try {
            setLoading(true)
            const data = await getAdminIncidentReports()
            setReports(data)
        } catch (err) {
            toast.error(err.message || 'Khong the tai report')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        loadReports()
    }, [])

    const handleDecision = async (report) => {
        const nextStatus = getSelectedDecision(report, decisionById)
        try {
            setUpdatingId(report.id)
            await decideIncidentReport(report.id, nextStatus, noteById[report.id] || '')
            toast.success('Cap nhat report thanh cong')
            await loadReports()
        } catch (err) {
            toast.error(err.message || 'Khong the cap nhat report')
        } finally {
            setUpdatingId(null)
        }
    }

    const handleAppealReview = async (report, approve) => {
        try {
            setUpdatingId(report.id)
            await reviewIncidentReportAppeal(
                report.id,
                approve,
                approve ? getAppealApproveStatus(report, decisionById) : null,
                noteById[report.id] || ''
            )
            toast.success('Da review appeal')
            await loadReports()
        } catch (err) {
            toast.error(err.message || 'Khong the review appeal')
        } finally {
            setUpdatingId(null)
        }
    }

    return (
        <section className="customers-page">
            <header className="customers-header admin-incident-header">
                <div>
                    <p className="customers-breadcrumb">Quan tri / Incident reports</p>
                    <h1>Duyet report tu customer</h1>
                    <p>Report moi luon o trang thai Pending den khi admin ra quyet dinh.</p>
                </div>
            </header>

            {loading ? (
                <div className="customers-empty">Dang tai...</div>
            ) : reports.length === 0 ? (
                <div className="customers-empty">Chua co report nao.</div>
            ) : (
                <div className="customers-list admin-incident-list">
                    {reports.map((report) => (
                        <article key={report.id} className="customer-card admin-incident-card">
                            <div className="customer-card-header">
                                <div>
                                    <h3>Report #{report.id} - Booking #{report.bookingId}</h3>
                                    <p>{report.vehicleName}</p>
                                </div>
                                <span className={`customer-status ${report.status?.toLowerCase() || ''}`}>
                                    {report.status}
                                </span>
                            </div>
                            <div className="customer-meta">
                                <div>Customer: {report.customerName}</div>
                                <div>Owner: {report.ownerName}</div>
                                <div>Category: {report.category}</div>
                                <div>Appeal: {report.appealStatus}</div>
                            </div>
                            <p style={{ marginTop: 10 }}>{report.description}</p>
                            {report.evidenceUrls?.length > 0 && (
                                <p style={{ marginTop: 8 }}>
                                    Evidence: {report.evidenceUrls.join(' | ')}
                                </p>
                            )}
                            {report.appealStatus === 'PENDING' && (
                                <div style={{ marginTop: 8 }}>
                                    <strong>Appeal content:</strong> {report.appealContent || '-'}
                                </div>
                            )}

                            <div style={{ display: 'grid', gap: 8, marginTop: 12 }}>
                                <select
                                    className="admin-incident-select"
                                    value={getSelectedDecision(report, decisionById)}
                                    onChange={(e) => setDecisionById((prev) => ({ ...prev, [report.id]: e.target.value }))}
                                >
                                    {DECISION_OPTIONS.map((option) => (
                                        <option key={option} value={option}>{option}</option>
                                    ))}
                                </select>
                                <textarea
                                    className="admin-incident-note"
                                    rows={3}
                                    placeholder="Ghi chu cho report/appeal"
                                    value={noteById[report.id] || ''}
                                    onChange={(e) => setNoteById((prev) => ({ ...prev, [report.id]: e.target.value }))}
                                />
                                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                                    <button type="button" className="customer-action" onClick={() => handleDecision(report)} disabled={updatingId === report.id}>
                                        {updatingId === report.id ? 'Dang xu ly...' : 'Cap nhat quyet dinh'}
                                    </button>
                                    {report.appealStatus === 'PENDING' && (
                                        <>
                                            <button type="button" className="customer-action" onClick={() => handleAppealReview(report, true)} disabled={updatingId === report.id}>
                                                Chap nhan appeal
                                            </button>
                                            <button type="button" className="customer-action" onClick={() => handleAppealReview(report, false)} disabled={updatingId === report.id}>
                                                Tu choi appeal
                                            </button>
                                        </>
                                    )}
                                </div>
                            </div>
                        </article>
                    ))}
                </div>
            )}
        </section>
    )
}
