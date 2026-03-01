import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { toast } from 'sonner'
import {
    approveOwnerRegistration,
    cancelOwnerRegistration,
    getOwnerRegistrationDetailForAdmin
} from '../../api/adminOwnerRegistrations'
import '../../styles/AdminOwnerRegistrationDetails.css'

const statusBucket = (status) => {
    const value = String(status || '')
    if (value === 'PENDING') return 'pending'
    if (value === 'CANCELLED') return 'cancelled'
    return 'approved'
}

const statusLabel = (status) => {
    const value = String(status || '')
    if (value === 'PENDING') return 'Pending Review'
    if (value === 'CANCELLED') return 'Cancelled'
    if (value === 'APPROVED') return 'Approved'
    return value || '—'
}

const formatEnum = (value) => {
    if (!value) return '—'
    return String(value)
        .toLowerCase()
        .split('_')
        .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
        .join(' ')
}

const formatTransmissionVi = (value) => {
    if (!value) return '—'
    const v = String(value).toUpperCase()
    if (v === 'AUTOMATIC') return 'Tự động'
    if (v === 'MANUAL') return 'Số sàn'
    if (v === 'SEMI_AUTOMATIC') return 'Bán tự động'
    return formatEnum(value)
}

const formatFuelTypeVi = (value) => {
    if (!value) return '—'
    const v = String(value).toUpperCase()
    if (v === 'GASOLINE') return 'Xăng'
    if (v === 'DIESEL') return 'Dầu'
    if (v === 'ELECTRIC') return 'Điện'
    if (v === 'HYBRID') return 'Hybrid'
    return formatEnum(value)
}

const formatSeats = (value) => {
    if (value == null) return '—'
    const seats = Number(value)
    if (!Number.isFinite(seats)) return String(value)
    return `${seats} chỗ`
}

const formatFuelConsumption = (value) => {
    if (value == null || value === '') return '—'
    const raw = String(value).trim()
    if (!raw) return '—'
    if (/[a-zA-Z]/.test(raw) || raw.includes('/')) return raw
    return `${raw} L/100km`
}

const formatDateTime = (value) => {
    if (!value) return '—'
    try {
        return new Date(value).toLocaleString('vi-VN')
    } catch {
        return '—'
    }
}

const registrationTitle = (item) => {
    const combined = `${item?.brandName || ''} ${item?.modelName || ''}`.trim()
    return combined || `Request #${item?.requestId ?? ''}`
}

export default function AdminOwnerRegistrationDetails() {
    const { id } = useParams()
    const navigate = useNavigate()

    const [data, setData] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')

    const [selectedImage, setSelectedImage] = useState('')
    const [note, setNote] = useState('')
    const [actionLoading, setActionLoading] = useState(false)

    useEffect(() => {
        let cancelled = false

        const load = async () => {
            setLoading(true)
            setError('')
            try {
                const detail = await getOwnerRegistrationDetailForAdmin(id)
                if (cancelled) return
                setData(detail)

                const urls = Array.isArray(detail?.vehicleImageUrls) ? detail.vehicleImageUrls : []
                setSelectedImage(urls[0] || '')
            } catch (e) {
                if (!cancelled) setError(e.message || 'Không thể tải chi tiết yêu cầu')
            } finally {
                if (!cancelled) setLoading(false)
            }
        }

        load()
        return () => {
            cancelled = true
        }
    }, [id])

    const images = useMemo(() => (Array.isArray(data?.vehicleImageUrls) ? data.vehicleImageUrls : []), [data])
    const bucket = statusBucket(data?.status)
    const canAct = String(data?.status) === 'PENDING'

    const onApprove = async () => {
        if (!data?.requestId || actionLoading) return
        const ok = window.confirm('Approve this owner registration?')
        if (!ok) return

        setActionLoading(true)
        try {
            const updated = await approveOwnerRegistration(data.requestId, note.trim() || undefined)
            if (updated) setData(updated)
            toast.success('Approved')
        } catch (e) {
            toast.error(e.message || 'Cannot approve')
        } finally {
            setActionLoading(false)
        }
    }

    const onCancel = async () => {
        if (!data?.requestId || actionLoading) return
        const ok = window.confirm('Cancel this request?')
        if (!ok) return

        setActionLoading(true)
        try {
            const updated = await cancelOwnerRegistration(data.requestId, note.trim() || undefined)
            if (updated) setData(updated)
            toast.success('Cancelled')
        } catch (e) {
            toast.error(e.message || 'Cannot cancel')
        } finally {
            setActionLoading(false)
        }
    }

    return (
        <div className="owner-reg-details-page">
            <div className="owner-reg-details-header">
                <div className="owner-reg-breadcrumb">
                    <Link to="/admin/owner-registrations">Owner Registrations</Link>
                    <span className="sep">›</span>
                    <span>Request Details</span>
                    <span className="sep">›</span>
                    <span className="current">{data ? registrationTitle(data) : '—'}</span>
                </div>

                <div className="owner-reg-header-actions">
                    <span className={`owner-reg-status status-${bucket}`}>{statusLabel(data?.status)}</span>
                    <button type="button" className="owner-reg-more" aria-label="More">
                        <span aria-hidden="true">⋯</span>
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="owner-reg-loading">Loading...</div>
            ) : error ? (
                <div className="owner-reg-error">{error}</div>
            ) : !data ? (
                <div className="owner-reg-error">Request not found.</div>
            ) : (
                <div className="owner-reg-details-grid">
                    <div className="owner-reg-left">
                        <div className="owner-reg-card owner-reg-media-card">
                            <div className={`owner-reg-main-image ${selectedImage ? '' : 'empty'}`.trim()}>
                                {selectedImage ? (
                                    <img src={selectedImage} alt={registrationTitle(data)} />
                                ) : (
                                    <div className="owner-reg-empty-media" aria-label="No image">
                                        <svg width="44" height="44" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                                            <path d="M4 7C4 5.89543 4.89543 5 6 5H18C19.1046 5 20 5.89543 20 7V17C20 18.1046 19.1046 19 18 19H6C4.89543 19 4 18.1046 4 17V7Z" stroke="currentColor" strokeWidth="2" />
                                            <path d="M8 11C8.55228 11 9 10.5523 9 10C9 9.44772 8.55228 9 8 9C7.44772 9 7 9.44772 7 10C7 10.5523 7.44772 11 8 11Z" fill="currentColor" />
                                            <path d="M20 15L16.5 11.5C16.1022 11.1022 15.8978 11.1022 15.5 11.5L12 15L10.5 13.5C10.1022 13.1022 9.89779 13.1022 9.5 13.5L4 19" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
                                        </svg>
                                        <div>Chưa có ảnh</div>
                                    </div>
                                )}
                            </div>
                            <div className="owner-reg-thumbs">
                                {images.slice(0, 4).map((url) => (
                                    <button
                                        key={url}
                                        type="button"
                                        className={`thumb ${url === selectedImage ? 'active' : ''}`}
                                        onClick={() => setSelectedImage(url)}
                                        aria-label="Select image"
                                    >
                                        <img src={url} alt="Thumbnail" loading="lazy" />
                                    </button>
                                ))}

                                {images.length < 4
                                    ? Array.from({ length: 4 - images.length }).map((_, index) => (
                                        <div className="thumb placeholder" key={`empty-${index}`} aria-hidden="true" />
                                    ))
                                    : null}

                                <div className="thumb placeholder" aria-hidden="true">
                                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M14 2H8C6.89543 2 6 2.89543 6 4V20C6 21.1046 6.89543 22 8 22H16C17.1046 22 18 21.1046 18 20V6L14 2Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
                                        <path d="M14 2V6H18" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
                                    </svg>
                                </div>

                                <div className="thumb placeholder" aria-hidden="true">
                                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M12 5V19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                                        <path d="M5 12H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                                    </svg>
                                </div>
                            </div>
                        </div>

                        <div className="owner-reg-card">
                            <div className="owner-reg-card-title">Vehicle Specifications</div>
                            <div className="owner-reg-spec-table">
                                <div className="spec-cell">
                                    <div className="spec-label">Brand</div>
                                    <div className="spec-value">{data.brandName || '—'}</div>
                                </div>
                                <div className="spec-cell">
                                    <div className="spec-label">Model</div>
                                    <div className="spec-value">{data.modelName || '—'}</div>
                                </div>
                                <div className="spec-cell">
                                    <div className="spec-label">Year</div>
                                    <div className="spec-value">{data.manufacturingYear ?? '—'}</div>
                                </div>
                                <div className="spec-cell">
                                    <div className="spec-label">Fuel type</div>
                                    <div className="spec-value">{formatFuelTypeVi(data.fuelType)}</div>
                                </div>
                                <div className="spec-cell">
                                    <div className="spec-label">Transmission</div>
                                    <div className="spec-value">{formatTransmissionVi(data.transmission)}</div>
                                </div>
                                <div className="spec-cell">
                                    <div className="spec-label">Seats</div>
                                    <div className="spec-value">{formatSeats(data.seatCount)}</div>
                                </div>
                                <div className="spec-cell">
                                    <div className="spec-label">Fuel consumption</div>
                                    <div className="spec-value">{formatFuelConsumption(data.fuelConsumption)}</div>
                                </div>
                                <div className="spec-cell">
                                    <div className="spec-label">License plate</div>
                                    <div className="spec-value">{data.licensePlate || '—'}</div>
                                </div>
                            </div>
                        </div>

                        <div className="owner-reg-card">
                            <div className="owner-reg-card-title">Owner Description</div>
                            <div className="owner-reg-desc">
                                {data.description?.trim() ? data.description : 'Not provided.'}
                            </div>
                        </div>
                    </div>

                    <div className="owner-reg-right">
                        <div className="owner-reg-card">
                            <div className="owner-reg-card-title">Applicant</div>
                            <div className="owner-reg-applicant">
                                <div className="line">
                                    <span className="label">Full name</span>
                                    <span className="value">{data.fullName || '—'}</span>
                                </div>
                                <div className="line">
                                    <span className="label">Email</span>
                                    <span className="value">{data.email || '—'}</span>
                                </div>
                                <div className="line">
                                    <span className="label">Phone</span>
                                    <span className="value">{data.phone || '—'}</span>
                                </div>
                            </div>
                        </div>

                        <div className="owner-reg-card">
                            <div className="owner-reg-card-title">Request Info</div>
                            <div className="owner-reg-applicant">
                                <div className="line">
                                    <span className="label">Submitted</span>
                                    <span className="value">{formatDateTime(data.createdAt)}</span>
                                </div>
                                <div className="line">
                                    <span className="label">Reviewed</span>
                                    <span className="value">{formatDateTime(data.reviewedAt)}</span>
                                </div>
                                <div className="line">
                                    <span className="label">Reviewer</span>
                                    <span className="value">{data.reviewedByName || '—'}</span>
                                </div>
                                <div className="line">
                                    <span className="label">Admin note</span>
                                    <span className="value">{data.adminNote || '—'}</span>
                                </div>
                            </div>
                        </div>

                        <div className="owner-reg-card">
                            <div className="owner-reg-card-title">Reviewer Action</div>
                            <div className="owner-reg-reviewer-sub">Admin note</div>
                            <textarea
                                className="owner-reg-textarea"
                                placeholder="Enter approval/cancel note..."
                                value={note}
                                onChange={(e) => setNote(e.target.value)}
                                rows={4}
                            />

                            <button
                                type="button"
                                className="owner-reg-btn approve"
                                onClick={onApprove}
                                disabled={!canAct || actionLoading}
                            >
                                Approve
                            </button>

                            <button
                                type="button"
                                className="owner-reg-btn cancel"
                                onClick={onCancel}
                                disabled={!canAct || actionLoading}
                            >
                                Cancel
                            </button>

                            <button
                                type="button"
                                className="owner-reg-back"
                                onClick={() => navigate('/admin/owner-registrations')}
                            >
                                Back to list
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
