import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { getOwnerIncidentReports, submitIncidentReportAppeal } from '../../api/incidentReports'
import FleetSidebar from '../../components/owner/fleet/FleetSidebar'
import { useAuth } from '../../hooks/useAuth'
import '../../styles/OwnerResponseDashboard.css'
import '../../styles/OwnerIncidentReports.css'

export default function OwnerIncidentReports() {
    const navigate = useNavigate()
    const { user, isAuthenticated, logout } = useAuth()
    const canManage = Boolean(user?.role?.includes('ROLE_CAR_OWNER') || user?.role?.includes('ROLE_ADMIN'))
    const [reports, setReports] = useState([])
    const [loading, setLoading] = useState(true)
    const [submittingId, setSubmittingId] = useState(null)
    const [appealContentById, setAppealContentById] = useState({})
    const [appealEvidenceById, setAppealEvidenceById] = useState({})

    const handleLogout = async () => {
        await logout()
        navigate('/login')
    }

    const loadReports = async () => {
        try {
            setLoading(true)
            const data = await getOwnerIncidentReports()
            setReports(data)
        } catch (err) {
            toast.error(err.message || 'Khong the tai report')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        if (!isAuthenticated || !canManage) return
        loadReports()
    }, [isAuthenticated, canManage])

    const handleSubmitAppeal = async (reportId) => {
        const content = String(appealContentById[reportId] || '').trim()
        if (content.length < 10) {
            toast.error('Noi dung khang cao toi thieu 10 ky tu')
            return
        }
        const evidenceUrls = String(appealEvidenceById[reportId] || '')
            .split('\n')
            .map((item) => item.trim())
            .filter(Boolean)
        try {
            setSubmittingId(reportId)
            await submitIncidentReportAppeal(reportId, content, evidenceUrls)
            toast.success('Da gui khang cao')
            await loadReports()
        } catch (err) {
            toast.error(err.message || 'Khong the gui khang cao')
        } finally {
            setSubmittingId(null)
        }
    }

    if (!isAuthenticated) {
        return (
            <div className="fleet-guard">
                <h2>Vui long dang nhap</h2>
                <p>Chi tai khoan chu xe moi co the truy cap trang nay.</p>
                <Link to="/login" className="add-vehicle">Dang nhap ngay</Link>
            </div>
        )
    }

    if (!canManage) {
        return (
            <div className="fleet-guard">
                <h2>Khong du quyen truy cap</h2>
                <p>Vui long dang nhap bang tai khoan chu xe.</p>
                <Link to="/" className="add-vehicle">Quay lai trang chu</Link>
            </div>
        )
    }

    return (
        <div className="fleet-dashboard owner-feedback-page">
            <FleetSidebar user={user} onLogout={handleLogout} />
            <section className="fleet-main">
                <header className="fleet-header">
                    <div>
                        <p className="fleet-breadcrumb">Chu xe</p>
                        <h1>Incident reports</h1>
                        <p>Ban chi thay report sau khi admin da duyet.</p>
                    </div>
                </header>

                {loading ? (
                    <div className="owner-feedback-empty">
                        <p>Dang tai...</p>
                    </div>
                ) : reports.length === 0 ? (
                    <div className="owner-feedback-empty">
                        <p>Chua co report nao duoc duyet.</p>
                    </div>
                ) : (
                    <div className="owner-feedback-layout" style={{ gridTemplateColumns: '1fr' }}>
                        {reports.map((report) => (
                            <article key={report.id} className="owner-feedback-main owner-incident-card" style={{ marginBottom: 16 }}>
                                <header className="owner-feedback-main-header">
                                    <h3>Report #{report.id} - {report.status}</h3>
                                    <p>Booking #{report.bookingId} | {report.vehicleName}</p>
                                </header>
                                <div className="owner-incident-body">
                                    <p><strong>Ly do report:</strong> {report.description}</p>
                                    <p><strong>Quyet dinh admin:</strong> {report.decisionNote || '-'}</p>
                                    <p><strong>Trang thai appeal:</strong> {report.appealStatus}</p>
                                    {report.appealStatus !== 'PENDING' && report.appealStatus !== 'ACCEPTED' && (
                                        <div className="owner-incident-appeal-form">
                                            <textarea
                                                className="owner-incident-textarea"
                                                rows={3}
                                                placeholder="Noi dung khang cao"
                                                value={appealContentById[report.id] || ''}
                                                onChange={(e) => setAppealContentById((prev) => ({ ...prev, [report.id]: e.target.value }))}
                                            />
                                            <textarea
                                                className="owner-incident-textarea"
                                                rows={2}
                                                placeholder="Bang chung moi (moi dong 1 URL)"
                                                value={appealEvidenceById[report.id] || ''}
                                                onChange={(e) => setAppealEvidenceById((prev) => ({ ...prev, [report.id]: e.target.value }))}
                                            />
                                            <button
                                                type="button"
                                                className="owner-incident-submit-btn"
                                                onClick={() => handleSubmitAppeal(report.id)}
                                                disabled={submittingId === report.id}
                                            >
                                                {submittingId === report.id ? 'Dang gui...' : 'Gui khang cao'}
                                            </button>
                                        </div>
                                    )}
                                    {report.appealDecisionNote && (
                                        <p className="owner-incident-appeal-result">
                                            <strong>Ket qua appeal:</strong> {report.appealDecisionNote}
                                        </p>
                                    )}
                                </div>
                            </article>
                        ))}
                    </div>
                )}
            </section>
        </div>
    )
}
