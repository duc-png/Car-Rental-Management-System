import { useEffect, useMemo, useState } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import { AlertCircle, Mail, Phone, UserCircle2 } from 'lucide-react'
import { toast } from 'sonner'
import { getCustomers, updateCustomerLicenseVerification } from '../../api/customers'
import { useAuth } from '../../hooks/useAuth'
import DashboardNotificationBell from '../../components/layout/DashboardNotificationBell'
import '../../styles/AdminCustomerLicenseReview.css'

const formatDate = (value) => {
    if (!value) return '--/--/----'
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return '--/--/----'
    return date.toLocaleDateString('vi-VN')
}

const statusMeta = (statusValue) => {
    const status = String(statusValue || '').trim().toUpperCase()
    if (status === 'APPROVED') return { text: 'Đã duyệt', className: 'approved' }
    if (status === 'REJECTED') return { text: 'Từ chối', className: 'rejected' }
    if (status === 'PENDING') return { text: 'Chờ duyệt', className: 'pending' }
    return { text: 'Chưa gửi', className: 'draft' }
}

export default function AdminCustomerLicenseReview() {
    const { id } = useParams()
    const navigate = useNavigate()
    const location = useLocation()
    const { token } = useAuth()

    const [customer, setCustomer] = useState(location.state?.customer || null)
    const [loading, setLoading] = useState(!location.state?.customer)
    const [note, setNote] = useState('')
    const [submitting, setSubmitting] = useState(false)

    useEffect(() => {
        if (customer || !token) return

        let cancelled = false

        const run = async () => {
            setLoading(true)
            try {
                const payload = await getCustomers(token)
                const items = Array.isArray(payload?.result) ? payload.result : []
                const found = items.find((item) => String(item.id) === String(id)) || null
                if (!cancelled) {
                    setCustomer(found)
                }
            } catch (error) {
                if (!cancelled) {
                    toast.error(error.message || 'Không thể tải chi tiết khách hàng')
                }
            } finally {
                if (!cancelled) {
                    setLoading(false)
                }
            }
        }

        run()
        return () => {
            cancelled = true
        }
    }, [customer, id, token])

    const licenseStatus = useMemo(
        () => statusMeta(customer?.licenseVerificationStatus),
        [customer?.licenseVerificationStatus]
    )

    const submitDecision = async (status, fallbackNote = '') => {
        if (!customer || submitting) return

        const finalNote = String(note || '').trim() || fallbackNote
        if (status === 'REJECTED' && !finalNote) {
            toast.error('Vui lòng nhập ghi chú trước khi từ chối')
            return
        }

        try {
            setSubmitting(true)
            const payload = await updateCustomerLicenseVerification(token, customer.id, {
                status,
                note: finalNote
            })
            const updated = payload?.result || customer
            setCustomer(updated)
            toast.success(status === 'APPROVED' ? 'Đã duyệt bằng lái' : 'Đã cập nhật kết quả duyệt')

            navigate('/admin/customers', {
                replace: true,
                state: { activeView: status === 'APPROVED' ? 'ALL' : 'PENDING_LICENSE' }
            })
        } catch (error) {
            toast.error(error.message || 'Không thể cập nhật xác minh GPLX')
        } finally {
            setSubmitting(false)
        }
    }

    return (
        <div className="admin-license-review-page">
            <header className="admin-license-review-header">
                <div className="admin-license-review-breadcrumb">
                    <Link to="/admin/customers">Khách hàng</Link>
                    <span>/</span>
                    <span>Duyệt GPLX</span>
                </div>
                <div className="admin-license-review-header-actions">
                    <DashboardNotificationBell />
                    <span className={`admin-license-review-status ${licenseStatus.className}`}>
                        {licenseStatus.text}
                    </span>
                </div>
            </header>

            {loading ? (
                <div className="admin-license-review-state">Đang tải dữ liệu...</div>
            ) : !customer ? (
                <div className="admin-license-review-state">Không tìm thấy khách hàng.</div>
            ) : (
                <div className="admin-license-review-grid">
                    <section className="admin-license-review-main-card">
                        <div className="admin-license-review-main-header">
                            <h2>Tài liệu bằng lái</h2>
                        </div>
                        <div className="admin-license-review-image-wrap">
                            {String(customer.licenseImageUrl || '').trim() ? (
                                <img src={customer.licenseImageUrl} alt={customer.fullName || 'GPLX'} />
                            ) : (
                                <div className="admin-license-review-image-empty">
                                    Chưa có ảnh GPLX từ hồ sơ.
                                </div>
                            )}
                        </div>
                    </section>

                    <aside className="admin-license-review-side">
                        <section className="admin-license-review-card">
                            <h3>Thông tin khách hàng</h3>
                            <div className="admin-license-review-user-row">
                                <div className="admin-license-review-user-avatar">
                                    {(customer.fullName || 'U').slice(0, 2).toUpperCase()}
                                </div>
                                <div>
                                    <p className="name">{customer.fullName || '—'}</p>
                                    <p className="sub">ID: #CUS-{customer.id}</p>
                                </div>
                            </div>
                            <p className="admin-license-review-line"><Mail size={14} /> {customer.email || '—'}</p>
                            <p className="admin-license-review-line"><Phone size={14} /> {customer.phone || '—'}</p>
                            <p className="admin-license-review-line"><UserCircle2 size={14} /> Tham gia: {formatDate(customer.createdAt)}</p>
                        </section>

                        <section className="admin-license-review-card">
                            <h3>Dữ liệu trích xuất (OCR)</h3>

                            <label className="admin-license-ocr-field">
                                Số bằng lái
                                <input value={customer.licenseNumber || ''} readOnly />
                            </label>

                            <label className="admin-license-ocr-field">
                                Họ và tên GPLX
                                <input value={customer.licenseFullName || ''} readOnly />
                            </label>

                            <div className="admin-license-ocr-row">
                                <label className="admin-license-ocr-field">
                                    Ngày cấp
                                    <input value={customer.issueDate || ''} readOnly />
                                </label>

                                <label className="admin-license-ocr-field">
                                    Hạng xe
                                    <select value={customer.licenseClass || ''} disabled>
                                        <option value={customer.licenseClass || ''}>{customer.licenseClass || '--'}</option>
                                    </select>
                                </label>
                            </div>

                            <label className="admin-license-ocr-field">
                                Ngày hết hạn
                                <input value={customer.expiryDate || ''} readOnly />
                            </label>

                            <div className="admin-license-ocr-divider" />

                            <label className="admin-license-ocr-field admin-license-admin-note">
                                Ghi chú admin
                                <textarea
                                    value={note}
                                    onChange={(event) => setNote(event.target.value)}
                                    placeholder="Nhập lý do từ chối hoặc yêu cầu bổ sung..."
                                    rows={3}
                                />
                            </label>

                            <div className="admin-license-review-actions">
                                <button
                                    type="button"
                                    className="approve"
                                    onClick={() => submitDecision('APPROVED')}
                                    disabled={submitting}
                                >
                                    Duyệt bằng lái
                                </button>
                                <button
                                    type="button"
                                    className="request"
                                    onClick={() => submitDecision('REJECTED', 'Vui lòng bổ sung lại ảnh GPLX rõ nét và thông tin chính xác.')}
                                    disabled={submitting}
                                >
                                    Yêu cầu bổ sung
                                </button>
                                <button
                                    type="button"
                                    className="reject"
                                    onClick={() => submitDecision('REJECTED')}
                                    disabled={submitting}
                                >
                                    Hủy bằng lái
                                </button>
                            </div>

                            <div className="admin-license-review-warning">
                                <AlertCircle size={14} />
                                <span>Quy trình xác minh bảo mật cao. Tất cả thao tác đều được ghi nhật ký hệ thống.</span>
                            </div>
                        </section>
                    </aside>
                </div>
            )}
        </div>
    )
}
