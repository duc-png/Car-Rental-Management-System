import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { getMyIncidentReports } from '../../api/incidentReports'
import '../../styles/MyIncidentReports.css'

const STATUS_LABELS = {
    PENDING: 'Dang cho admin duyet',
    APPROVED: 'Da duyet',
    REJECTED: 'Tu choi',
    RESOLVED: 'Da xu ly',
    PENALIZED: 'Da xu ly chu xe',
    REFUNDED: 'Da hoan tien',
}

const APPEAL_LABELS = {
    NONE: 'Chua co',
    PENDING: 'Dang cho duyet',
    ACCEPTED: 'Da chap nhan',
    REJECTED: 'Da tu choi',
}

export default function MyIncidentReports() {
    const navigate = useNavigate()
    const [reports, setReports] = useState([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        let mounted = true
        const load = async () => {
            try {
                setLoading(true)
                const data = await getMyIncidentReports()
                if (!mounted) return
                setReports(Array.isArray(data) ? data : [])
            } catch (err) {
                if (!mounted) return
                if (String(err?.message || '').includes('Chua dang nhap')) {
                    toast.error('Vui long dang nhap de xem report')
                    navigate('/login')
                    return
                }
                toast.error(err?.message || 'Khong the tai danh sach report')
            } finally {
                if (mounted) {
                    setLoading(false)
                }
            }
        }
        load()
        return () => {
            mounted = false
        }
    }, [navigate])

    return (
        <section className="my-reports-page">
            <header className="my-reports-header">
                <h1>My Reports</h1>
                <p>Xem toan bo don report ban da gui cho cac booking.</p>
            </header>

            {loading ? (
                <div className="my-reports-empty">Dang tai...</div>
            ) : reports.length === 0 ? (
                <div className="my-reports-empty">Ban chua gui report nao.</div>
            ) : (
                <div className="my-reports-list">
                    {reports.map((report) => (
                        <article key={report.id} className="my-report-card">
                            <div className="my-report-head">
                                <div>
                                    <h3>Report #{report.id}</h3>
                                    <p>Booking #{report.bookingId} | {report.vehicleName}</p>
                                </div>
                                <span className={`my-report-status ${String(report.status || '').toLowerCase()}`}>
                                    {STATUS_LABELS[report.status] || report.status}
                                </span>
                            </div>

                            <div className="my-report-body">
                                <p><strong>Loai:</strong> {report.category}</p>
                                <p><strong>Noi dung:</strong> {report.description}</p>
                                <p><strong>Quyet dinh admin:</strong> {report.decisionNote || '-'}</p>
                                <p><strong>Trang thai khang cao:</strong> {APPEAL_LABELS[report.appealStatus] || report.appealStatus}</p>
                                {Array.isArray(report.evidenceUrls) && report.evidenceUrls.length > 0 && (
                                    <p><strong>Bang chung:</strong> {report.evidenceUrls.join(' | ')}</p>
                                )}
                                {report.appealContent && (
                                    <p><strong>Noi dung khang cao:</strong> {report.appealContent}</p>
                                )}
                                {report.appealDecisionNote && (
                                    <p><strong>Ket qua khang cao:</strong> {report.appealDecisionNote}</p>
                                )}
                            </div>
                        </article>
                    ))}
                </div>
            )}
        </section>
    )
}
