import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { toast } from 'sonner'
import { approveVehicle, getVehicleById, rejectVehicle } from '../../api/adminVehicles'
import { getOwnerById } from '../../api/owners'
import '../../styles/AdminVehicleRequestDetails.css'

const APPROVED_STATUSES = new Set(['AVAILABLE', 'RENTED', 'MAINTENANCE'])

const vehicleName = (vehicle) => {
    const combined = `${vehicle?.brandName || ''} ${vehicle?.modelName || ''}`.trim()
    return combined || `Vehicle #${vehicle?.id ?? ''}`
}

const statusBucket = (status) => {
    const value = String(status || '')
    if (value === 'PENDING_APPROVAL') return 'pending'
    if (value === 'REJECTED') return 'rejected'
    if (APPROVED_STATUSES.has(value)) return 'approved'
    return 'approved'
}

const statusLabel = (status) => {
    const bucket = statusBucket(status)
    if (bucket === 'pending') return 'Pending Review'
    if (bucket === 'rejected') return 'Rejected'
    return 'Approved'
}

const formatEnum = (value) => {
    if (!value) return '—'
    return String(value)
        .toLowerCase()
        .split('_')
        .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
        .join(' ')
}

const formatSeats = (value) => {
    if (value == null) return '—'
    const seats = Number(value)
    if (!Number.isFinite(seats)) return String(value)
    return `${seats} Adults`
}

const initialsFrom = (value) => {
    if (!value) return '—'
    const text = String(value).trim()
    if (!text) return '—'
    const parts = text.split(/\s+/).filter(Boolean)
    const first = parts[0]?.[0] || ''
    const second = parts.length > 1 ? parts[parts.length - 1]?.[0] : (parts[0]?.[1] || '')
    return `${first}${second}`.toUpperCase() || '—'
}

const pickMainImage = (vehicle) => {
    const images = Array.isArray(vehicle?.images) ? vehicle.images : []
    const main = images.find((img) => Boolean(img?.isMain))
    return main?.imageUrl || images[0]?.imageUrl || ''
}

export default function AdminVehicleRequestDetails() {
    const { id } = useParams()
    const navigate = useNavigate()

    const [vehicle, setVehicle] = useState(null)
    const [owner, setOwner] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')

    const [selectedImage, setSelectedImage] = useState('')
    const [reviewComment, setReviewComment] = useState('')
    const [actionLoading, setActionLoading] = useState(false)

    useEffect(() => {
        let cancelled = false

        const load = async () => {
            setLoading(true)
            setError('')
            try {
                const data = await getVehicleById(id)
                if (cancelled) return

                setVehicle(data)
                setSelectedImage(pickMainImage(data))

                if (data?.ownerId) {
                    try {
                        const ownerData = await getOwnerById(data.ownerId)
                        if (!cancelled) setOwner(ownerData)
                    } catch {
                        if (!cancelled) setOwner(null)
                    }
                }
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

    const images = useMemo(() => (Array.isArray(vehicle?.images) ? vehicle.images : []), [vehicle])
    const bucket = statusBucket(vehicle?.status)
    const canAct = String(vehicle?.status) === 'PENDING_APPROVAL'

    const ownerName = owner?.fullName || (vehicle?.ownerId ? `Owner #${vehicle.ownerId}` : '—')
    const ownerEmail = owner?.email || '—'
    const ownerPhone = owner?.phone || '—'
    const ownerLocation = [vehicle?.city, vehicle?.district].filter(Boolean).join(', ') || '—'

    const onApprove = async () => {
        if (!vehicle?.id || actionLoading) return
        const ok = window.confirm('Approve this vehicle?')
        if (!ok) return

        setActionLoading(true)
        try {
            const updated = await approveVehicle(vehicle.id)
            if (updated) setVehicle(updated)
            toast.success('Approved')
        } catch (e) {
            toast.error(e.message || 'Cannot approve')
        } finally {
            setActionLoading(false)
        }
    }

    const onReject = async () => {
        if (!vehicle?.id || actionLoading) return
        const ok = window.confirm('Reject this request?')
        if (!ok) return

        setActionLoading(true)
        try {
            const updated = await rejectVehicle(vehicle.id, reviewComment.trim() || undefined)
            if (updated) setVehicle(updated)
            toast.success('Rejected')
        } catch (e) {
            toast.error(e.message || 'Cannot reject')
        } finally {
            setActionLoading(false)
        }
    }

    return (
        <div className="request-details-page">
            <div className="request-details-header">
                <div className="request-breadcrumb">
                    <Link to="/admin/vehicles">Vehicle Approval</Link>
                    <span className="sep">›</span>
                    <span>Request Details</span>
                    <span className="sep">›</span>
                    <span className="current">{vehicle ? vehicleName(vehicle) : '—'}</span>
                </div>

                <div className="request-header-actions">
                    <span className={`request-status status-${bucket}`}>{statusLabel(vehicle?.status)}</span>
                    <button type="button" className="request-more" aria-label="More">
                        <span aria-hidden="true">⋯</span>
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="request-loading">Loading...</div>
            ) : error ? (
                <div className="request-error">{error}</div>
            ) : !vehicle ? (
                <div className="request-error">Vehicle not found.</div>
            ) : (
                <div className="request-details-grid">
                    <div className="request-left">
                        <div className="request-card request-media-card">
                            <div className="request-main-image">
                                {selectedImage ? <img src={selectedImage} alt={vehicleName(vehicle)} /> : null}
                            </div>
                            <div className="request-thumbs">
                                {images.slice(0, 4).map((img) => (
                                    <button
                                        key={img.id || img.imageUrl}
                                        type="button"
                                        className={`thumb ${img.imageUrl === selectedImage ? 'active' : ''}`}
                                        onClick={() => setSelectedImage(img.imageUrl)}
                                        aria-label="Select image"
                                    >
                                        <img src={img.imageUrl} alt="Thumbnail" loading="lazy" />
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

                        <div className="request-card">
                            <div className="request-card-title">Vehicle Specifications</div>
                            <div className="spec-table">
                                <div className="spec-cell">
                                    <div className="spec-label">Brand</div>
                                    <div className="spec-value">{vehicle.brandName || '—'}</div>
                                </div>
                                <div className="spec-cell">
                                    <div className="spec-label">Model</div>
                                    <div className="spec-value">{vehicle.modelName || '—'}</div>
                                </div>
                                <div className="spec-cell">
                                    <div className="spec-label">Year</div>
                                    <div className="spec-value">—</div>
                                </div>
                                <div className="spec-cell">
                                    <div className="spec-label">Fuel type</div>
                                    <div className="spec-value">{formatEnum(vehicle.fuelType)}</div>
                                </div>
                                <div className="spec-cell">
                                    <div className="spec-label">Transmission</div>
                                    <div className="spec-value">{formatEnum(vehicle.transmission)}</div>
                                </div>
                                <div className="spec-cell">
                                    <div className="spec-label">Seats</div>
                                    <div className="spec-value">{formatSeats(vehicle.seatCount)}</div>
                                </div>
                                <div className="spec-cell">
                                    <div className="spec-label">VIN</div>
                                    <div className="spec-value">—</div>
                                </div>
                                <div className="spec-cell">
                                    <div className="spec-label">License plate</div>
                                    <div className="spec-value">{vehicle.licensePlate || '—'}</div>
                                </div>
                            </div>
                        </div>

                        <div className="request-card">
                            <div className="request-card-title">Features &amp; Description</div>
                            <div className="feature-block">
                                <div className="feature-subtitle">Amenities</div>
                                <div className="amenities-row">
                                    <div className="amenities-empty">—</div>
                                </div>
                            </div>
                            <div className="feature-block">
                                <div className="feature-subtitle">Owner Description</div>
                                <div className="feature-description">Not provided.</div>
                            </div>
                        </div>
                    </div>

                    <div className="request-right">
                        <div className="request-card request-owner-card">
                            <div className="owner-top">
                                <div className="owner-avatar">{initialsFrom(ownerName)}</div>
                                <div className="owner-meta">
                                    <div className="owner-name">
                                        {ownerName}
                                        {owner?.isVerified ? <span className="owner-verified" title="Verified">✓</span> : null}
                                    </div>
                                    <div className="owner-sub">Member since: —</div>
                                </div>
                            </div>

                            <div className="owner-lines">
                                <div className="owner-line">
                                    <span className="owner-line-icon" aria-hidden="true">✉</span>
                                    <span>{ownerEmail}</span>
                                </div>
                                <div className="owner-line">
                                    <span className="owner-line-icon" aria-hidden="true">☎</span>
                                    <span>{ownerPhone}</span>
                                </div>
                                <div className="owner-line">
                                    <span className="owner-line-icon" aria-hidden="true">⌂</span>
                                    <span>{ownerLocation}</span>
                                </div>
                            </div>

                            <Link className="owner-profile-btn" to={vehicle?.ownerId ? `/owners/${vehicle.ownerId}` : '/owners/0'}>
                                View Full Profile
                            </Link>
                        </div>

                        <div className="request-card">
                            <div className="request-card-title">Reviewer Action</div>
                            <div className="reviewer-sub">Reviewer comments</div>
                            <textarea
                                className="reviewer-textarea"
                                placeholder="Enter reason for approval or rejection..."
                                value={reviewComment}
                                onChange={(e) => setReviewComment(e.target.value)}
                                rows={4}
                            />

                            <button
                                type="button"
                                className="reviewer-btn approve"
                                onClick={onApprove}
                                disabled={!canAct || actionLoading}
                            >
                                Approve Vehicle
                            </button>
                            <button
                                type="button"
                                className="reviewer-btn reject"
                                onClick={onReject}
                                disabled={!canAct || actionLoading}
                            >
                                Reject Request
                            </button>

                            <div className="reviewer-hint">This action will be logged and the owner will be notified via email.</div>

                            <button
                                type="button"
                                className="reviewer-back"
                                onClick={() => navigate('/admin/vehicles')}
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
