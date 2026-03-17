import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { cancelBooking, confirmHandover } from '../../../api/bookings'
import { formatVndCurrency, getBookingStatusLabel } from '../../../utils/bookingUtils'
import { TRIP_TAB } from '../../../utils/customerProfile/constants'
import ReturnConfirmationModal from '../../ReturnConfirmationModal'
import DisputeChatModal from '../../DisputeChatModal'

const STEPS = [
    { key: 'PENDING', label: 'Đặt xe', icon: '📋' },
    { key: 'CONFIRMED', label: 'Chủ xe duyệt', icon: '✅' },
    { key: 'DEPOSIT_PAID', label: 'Đã đặt cọc', icon: '💰' },
    { key: 'ONGOING', label: 'Đang thuê', icon: '🚗' },
    { key: 'COMPLETED', label: 'Hoàn thành', icon: '🏁' },
]

const getActiveStep = (status, paymentStatus) => {
    if (status === 'CANCELLED') return -1
    if (status === 'COMPLETED') return 4
    if (status === 'ONGOING') return 3
    if (paymentStatus === 'DEPOSIT_PAID' || paymentStatus === 'PENDING_FULL_PAYMENT' || paymentStatus === 'FULLY_PAID') return 2
    if (status === 'CONFIRMED') return 1
    return 0
}

const BookingSteps = ({ status, paymentStatus }) => {
    const isCancelled = status === 'CANCELLED'
    const activeStep = getActiveStep(status, paymentStatus)
    return (
        <div className={`booking-steps ${isCancelled ? 'cancelled' : ''}`}>
            {STEPS.map((step, idx) => {
                const isDone = !isCancelled && idx < activeStep
                const isActive = !isCancelled && idx === activeStep
                return (
                    <div key={step.key} className={`step-item ${isDone ? 'done' : ''} ${isActive ? 'active' : ''} ${isCancelled ? 'cancelled' : ''}`}>
                        <div className="step-circle">{isDone ? '✓' : step.icon}</div>
                        <span className="step-label">{step.label}</span>
                        {idx < STEPS.length - 1 && <div className={`step-line ${isDone ? 'done' : ''}`} />}
                    </div>
                )
            })}
            {isCancelled && <div className="step-cancelled-badge">❌ Đã hủy</div>}
        </div>
    )
}

export default function TripsSection({
    bookingLoading,
    activeTripTab,
    currentTrips,
    tripHistory,
    displayedTrips,
    onTripTabChange,
    onRefresh
}) {
    const navigate = useNavigate()
    const [cancellingId, setCancellingId] = useState(null)
    const [confirmingHandoverId, setConfirmingHandoverId] = useState(null)
    const [expandedBookingId, setExpandedBookingId] = useState(null)
    const [selectedForReturnFees, setSelectedForReturnFees] = useState(null)
    const [selectedForDisputeChat, setSelectedForDisputeChat] = useState(null)

    const toggleExpand = (id) => {
        setExpandedBookingId(prev => prev === id ? null : id)
    }

    const handleCancelBooking = async (id) => {
        if (!window.confirm('Bạn có chắc muốn hủy đặt xe này?')) return
        try {
            setCancellingId(id)
            await cancelBooking(id)
            toast.success('Đã hủy đặt xe thành công!')
            if (onRefresh) onRefresh()
        } catch (err) {
            toast.error(err.message || 'Không thể hủy đặt xe')
        } finally {
            setCancellingId(null)
        }
    }

    const handleConfirmHandover = async (id) => {
        if (!window.confirm('Xac nhan da nhan xe tu chu xe?')) return
        try {
            setConfirmingHandoverId(id)
            await confirmHandover(id)
            toast.success('Da xac nhan nhan xe! Chuc ban co chuyen di vui ve!')
            if (onRefresh) onRefresh()
        } catch (err) {
            toast.error(err.message || 'Khong the xac nhan luc nay')
        } finally {
            setConfirmingHandoverId(null)
        }
    }

    const formatDate = (dateString) => {
        if (!dateString) return ''
        return new Date(dateString).toLocaleDateString('vi-VN', {
            day: '2-digit', month: '2-digit', year: 'numeric',
            hour: '2-digit', minute: '2-digit'
        })
    }

    const canCancel = (status) => status === 'PENDING' || status === 'CONFIRMED'

    return (
        <div className="customer-profile-card">
            <h3>Chuyen di cua toi</h3>
            {bookingLoading ? <p>Dang tai...</p> : null}
            {!bookingLoading ? (
                <>
                    <div className="trip-tabs" role="tablist" aria-label="Trip tabs">
                        <button
                            type="button"
                            className={`trip-tab ${activeTripTab === TRIP_TAB.CURRENT ? 'active' : ''}`}
                            onClick={() => onTripTabChange(TRIP_TAB.CURRENT)}
                        >
                            Hien tai ({currentTrips.length})
                        </button>
                        <button
                            type="button"
                            className={`trip-tab ${activeTripTab === TRIP_TAB.HISTORY ? 'active' : ''}`}
                            onClick={() => onTripTabChange(TRIP_TAB.HISTORY)}
                        >
                            Lich su ({tripHistory.length})
                        </button>
                    </div>

                    <div className="trip-group" style={{ marginTop: '20px' }}>
                        <h4 style={{ marginBottom: '16px' }}>{activeTripTab === TRIP_TAB.CURRENT ? 'Chuyen di hien tai' : 'Lich su chuyen di'}</h4>
                        {displayedTrips.length === 0 ? (
                            <p>{activeTripTab === TRIP_TAB.CURRENT ? 'Khong co chuyen di hien tai.' : 'Chua co lich su chuyen di.'}</p>
                        ) : null}

                        <div className="bookings-list collapsible-bookings" style={{ padding: 0, maxWidth: '100%' }}>
                            {displayedTrips.map(booking => {
                                const isExpanded = expandedBookingId === booking.id

                                return (
                                    <div key={booking.id} className={`booking-card ${booking.status?.toLowerCase()} ${isExpanded ? 'expanded' : 'collapsed'}`}>
                                        {/* Header (Always Visible) */}
                                        <div
                                            className="booking-card-header"
                                            onClick={() => toggleExpand(booking.id)}
                                        >
                                            <div className="header-info">
                                                <h3>{booking.vehicleName || `Xe #${booking.vehicleId}`}</h3>
                                                <div className="header-meta">
                                                    <span>{formatDate(booking.startDate)} - {formatDate(booking.endDate)}</span>
                                                    <span className="dot">•</span>
                                                    <span className="price">{formatVndCurrency(booking.totalPrice)}</span>
                                                </div>
                                            </div>

                                            <div className="header-right">
                                                <span className={`status-badge ${booking.status?.toLowerCase()}`}>
                                                    {getBookingStatusLabel(booking.status)}
                                                </span>
                                                <button className="expand-btn" aria-label={isExpanded ? "Thu gọn" : "Mở rộng"}>
                                                    <svg
                                                        viewBox="0 0 24 24"
                                                        width="24"
                                                        height="24"
                                                        stroke="currentColor"
                                                        strokeWidth="2"
                                                        fill="none"
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                        style={{ transform: isExpanded ? 'rotate(180deg)' : 'rotate(0)' }}
                                                    >
                                                        <polyline points="6 9 12 15 18 9"></polyline>
                                                    </svg>
                                                </button>
                                            </div>
                                        </div>

                                        {/* Body (Collapsible) */}
                                        {isExpanded && (
                                            <div className="booking-card-body">
                                                <div className="booking-content-top">
                                                    <div className="booking-image">
                                                        <img
                                                            src={booking.vehicleImage || '/placeholder.svg'}
                                                            alt={booking.vehicleName || 'Xe'}
                                                        />
                                                    </div>
                                                    <div className="booking-details">
                                                        <div className="booking-info">
                                                            <p><strong>Nhận xe:</strong> {formatDate(booking.startDate)}</p>
                                                            <p><strong>Trả xe:</strong> {formatDate(booking.endDate)}</p>
                                                            <p><strong>Tổng tiền:</strong> {formatVndCurrency(booking.totalPrice)}</p>
                                                            {booking.depositAmount && (
                                                                <p><strong>Tiền cọc (15%):</strong> {formatVndCurrency(booking.depositAmount)}</p>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>

                                                <BookingSteps status={booking.status} paymentStatus={booking.paymentStatus} />

                                                <div className="booking-actions">
                                                    {booking.status !== 'CANCELLED' && booking.status !== 'COMPLETED'
                                                        && booking.paymentStatus === 'PENDING_DEPOSIT' && booking.checkoutUrl && (
                                                            <button
                                                                className="btn-pay"
                                                                onClick={(e) => { e.stopPropagation(); window.open(booking.checkoutUrl, '_blank'); }}
                                                            >
                                                                Thanh toán cọc 15%
                                                            </button>
                                                        )}
                                                    {booking.status !== 'CANCELLED' && booking.status !== 'COMPLETED'
                                                        && booking.paymentStatus === 'PENDING_FULL_PAYMENT' && booking.checkoutUrl && (
                                                            <button
                                                                className="btn-pay full-payment"
                                                                onClick={(e) => { e.stopPropagation(); window.open(booking.checkoutUrl, '_blank'); }}
                                                            >
                                                                Thanh toán 85% còn lại
                                                            </button>
                                                        )}

                                                    {booking.status === 'ONGOING' && !booking.customerConfirmedHandover && (
                                                        <button
                                                            className="btn-pay"
                                                            style={{ background: 'linear-gradient(135deg, #8b5cf6, #6d28d9)', border: 'none' }}
                                                            onClick={(e) => { e.stopPropagation(); handleConfirmHandover(booking.id); }}
                                                            disabled={confirmingHandoverId === booking.id}
                                                        >
                                                            {confirmingHandoverId === booking.id ? 'Dang xac nhan...' : 'Nhan xe'}
                                                        </button>
                                                    )}
                                                    {booking.status === 'ONGOING' && booking.customerConfirmedHandover && (
                                                        <div className="received-badge">
                                                            Da nhan xe
                                                        </div>
                                                    )}

                                                    {booking.returnStatus === 'FEES_CALCULATED' && (
                                                        <button
                                                            className="btn-pay"
                                                            style={{ background: '#0ea5e9', border: 'none' }}
                                                            onClick={(e) => { e.stopPropagation(); setSelectedForReturnFees(booking) }}
                                                        >
                                                            Xem & xác nhận phí trả xe
                                                        </button>
                                                    )}

                                                    {booking.returnStatus === 'DISPUTED' && (
                                                        <button
                                                            className="btn-view"
                                                            onClick={(e) => { e.stopPropagation(); setSelectedForDisputeChat(booking) }}
                                                        >
                                                            Thảo luận phí với chủ xe
                                                        </button>
                                                    )}

                                                    {booking.returnStatus === 'RESOLVED'
                                                        && booking.status !== 'COMPLETED'
                                                        && booking.status !== 'CANCELLED'
                                                        && booking.checkoutUrl && (
                                                            <button
                                                                className="btn-pay"
                                                                style={{ background: '#ef4444', border: 'none' }}
                                                                onClick={(e) => { e.stopPropagation(); window.open(booking.checkoutUrl, '_blank') }}
                                                            >
                                                                Thanh toán phí phạt
                                                            </button>
                                                        )}

                                                    {booking.returnStatus === 'CUSTOMER_CONFIRMED'
                                                        && booking.status !== 'COMPLETED'
                                                        && booking.status !== 'CANCELLED'
                                                        && booking.checkoutUrl && (
                                                            <button
                                                                className="btn-pay"
                                                                style={{ background: '#ef4444', border: 'none' }}
                                                                onClick={(e) => { e.stopPropagation(); window.open(booking.checkoutUrl, '_blank') }}
                                                            >
                                                                Thanh toán phí phạt
                                                            </button>
                                                        )}

                                                    <button
                                                        className="btn-view"
                                                        onClick={(e) => { e.stopPropagation(); navigate(`/cars/${booking.vehicleId}`); }}
                                                    >
                                                        Xem xe
                                                    </button>
                                                    {canCancel(booking.status) && (
                                                        <button
                                                            className="btn-cancel"
                                                            onClick={(e) => { e.stopPropagation(); handleCancelBooking(booking.id); }}
                                                            disabled={cancellingId === booking.id}
                                                        >
                                                            {cancellingId === booking.id ? 'Dang huy...' : 'Huy dat xe'}
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                </>
            ) : null}

            {selectedForReturnFees && (
                <ReturnConfirmationModal
                    booking={selectedForReturnFees}
                    onClose={() => setSelectedForReturnFees(null)}
                    onSuccess={() => onRefresh?.()}
                    onDispute={() => {
                        setSelectedForDisputeChat(selectedForReturnFees)
                        setSelectedForReturnFees(null)
                    }}
                />
            )}

            {selectedForDisputeChat && (
                <DisputeChatModal
                    booking={selectedForDisputeChat}
                    isOwner={false}
                    onClose={() => setSelectedForDisputeChat(null)}
                    onResolved={() => onRefresh?.()}
                />
            )}
        </div>
    )
}
