'use client';
import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { getMyBookings, cancelBooking, confirmHandover } from '../../api/bookings'
import { formatVndCurrency, getBookingStatusLabel } from '../../utils/bookingUtils'
import '../../styles/MyBookings.css'
import ReturnConfirmationModal from '../../components/ReturnConfirmationModal'
import DisputeChatModal from '../../components/DisputeChatModal'
import BookingJourneyModal from '../../components/BookingJourneyModal'

function MyBookings() {
  const navigate = useNavigate()
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [cancellingId, setCancellingId] = useState(null)
  const [confirmingHandoverId, setConfirmingHandoverId] = useState(null)
  const [selectedForReturnFees, setSelectedForReturnFees] = useState(null)
  const [selectedForDisputeChat, setSelectedForDisputeChat] = useState(null)
  const [selectedForJourney, setSelectedForJourney] = useState(null)

  const fetchBookings = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await getMyBookings()
      setBookings(data)
    } catch (err) {
      if (err.message === 'Chưa đăng nhập!') {
        toast.error('Vui lòng đăng nhập để xem đặt xe!')
        navigate('/login')
        return
      }
      setError(err.message || 'Không thể tải danh sách đặt xe')
    } finally {
      setLoading(false)
    }
  }, [navigate])
  useEffect(() => {
    fetchBookings()
  }, [fetchBookings])
  const handleCancelBooking = async (id) => {
    if (!confirm('Bạn có chắc muốn hủy đặt xe này?')) return
    try {
      setCancellingId(id)
      await cancelBooking(id)
      toast.success('Đã hủy đặt xe thành công!')
      fetchBookings()
    } catch (err) {
      toast.error(err.message || 'Không thể hủy đặt xe')
    } finally {
      setCancellingId(null)
    }
  }
  const handleConfirmHandover = async (id) => {
    if (!confirm('Xac nhan da nhan xe tu chu xe?')) return
    try {
      setConfirmingHandoverId(id)
      await confirmHandover(id)
      toast.success('Da xac nhan nhan xe! Chuc ban co chuyen di vui ve!')
      fetchBookings()
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
    if (status === 'ONGOING' || status === 'PENALTY_PAYMENT_PENDING') return 3
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
  if (loading) {
    return (
      <div className="bookings-page">
        <div className="bookings-loading">
          <div className="loading-spinner"></div>
          <p>Đang tải danh sách đặt xe...</p>
        </div>
      </div>
    )
  }
  if (error) {
    return (
      <div className="bookings-page">
        <div className="bookings-error">
          <p>{error}</p>
          <button onClick={fetchBookings} className="btn-retry">Thử lại</button>
        </div>
      </div>
    )
  }
  return (
    <div className="bookings-page">
      <div className="bookings-header">
        <h1>Đặt xe của tôi</h1>
        <p>Quản lý các chuyến đi của bạn</p>
      </div>
      {bookings.length > 0 ? (
        <div className="bookings-list">
          {bookings.map(booking => {
            const isReturnFlowActive = [
              'PENDING_INSPECTION',
              'FEES_CALCULATED',
              'DISPUTED',
              'CUSTOMER_CONFIRMED',
              'RESOLVED'
            ].includes(booking.returnStatus)

            const shouldShowDepositButton =
              booking.status !== 'CANCELLED' &&
              booking.status !== 'COMPLETED' &&
              booking.status !== 'PENALTY_PAYMENT_PENDING' &&
              !isReturnFlowActive &&
              booking.paymentStatus === 'PENDING_DEPOSIT' &&
              !!booking.checkoutUrl

            const shouldShowFullPaymentButton =
              booking.status !== 'CANCELLED' &&
              booking.status !== 'COMPLETED' &&
              booking.status !== 'PENALTY_PAYMENT_PENDING' &&
              !isReturnFlowActive &&
              booking.paymentStatus === 'PENDING_FULL_PAYMENT' &&
              !!booking.checkoutUrl

            return (
            <div key={booking.id} className={`booking-card ${booking.status?.toLowerCase()}`}>
              <div className="booking-image">
                <img
                  src={booking.vehicleImage || '/placeholder.svg'}
                  alt={booking.vehicleName || 'Xe'}
                />
              </div>
              <div className="booking-details">
                <h3>{booking.vehicleName || `Xe #${booking.vehicleId}`}</h3>
                <div className="booking-info">
                  <p><strong>Nhận xe:</strong> {formatDate(booking.startDate)}</p>
                  <p><strong>Trả xe:</strong> {formatDate(booking.endDate)}</p>
                  <p><strong>Tổng tiền:</strong> {formatVndCurrency(booking.totalPrice)}</p>
                  {booking.depositAmount && (
                    <p><strong>Tiền cọc (15%):</strong> {formatVndCurrency(booking.depositAmount)}</p>
                  )}
                </div>
                <div className="booking-status">
                  <span className={`status-badge ${booking.status?.toLowerCase()}`}>
                    {getBookingStatusLabel(booking.status)}
                  </span>
                  {booking.returnStatus && (
                    <span className="status-badge return-status">
                      {booking.returnStatus === 'NOT_RETURNED' && 'Chưa trả xe'}
                      {booking.returnStatus === 'PENDING_INSPECTION' && 'Chờ chủ xe kiểm tra'}
                      {booking.returnStatus === 'FEES_CALCULATED' && 'Đã có phí trả xe'}
                      {booking.returnStatus === 'CUSTOMER_CONFIRMED' && 'Đã xác nhận phí trả xe'}
                      {booking.returnStatus === 'DISPUTED' && 'Đang tranh chấp phí'}
                      {booking.returnStatus === 'RESOLVED' && 'Phí đã được giải quyết'}
                    </span>
                  )}
                </div>
              </div>
              <BookingSteps status={booking.status} paymentStatus={booking.paymentStatus} />
              <div className="booking-actions">
                {shouldShowDepositButton && (
                    <button
                      className="btn-pay"
                      onClick={() => window.open(booking.checkoutUrl, '_blank')}
                    >
                      Thanh toán cọc 15%
                    </button>
                  )}
                {shouldShowFullPaymentButton && (
                    <button
                      className="btn-pay full-payment"
                      onClick={() => window.open(booking.checkoutUrl, '_blank')}
                    >
                      Thanh toán 85% còn lại
                    </button>
                  )}
                {booking.status === 'ONGOING' && !booking.customerConfirmedHandover && (
                  <button
                    className="btn-pay"
                    style={{ background: 'linear-gradient(135deg, #8b5cf6, #6d28d9)', border: 'none' }}
                    onClick={() => handleConfirmHandover(booking.id)}
                    disabled={confirmingHandoverId === booking.id}
                  >
                    {confirmingHandoverId === booking.id ? 'Dang xac nhan...' : 'Nhan xe'}
                  </button>
                )}
                {booking.status === 'ONGOING' && booking.customerConfirmedHandover && (
                  <div style={{ padding: '8px 12px', background: 'rgba(16,185,129,0.15)', borderRadius: '8px', color: '#10b981', fontSize: '0.85rem', fontWeight: 600 }}>
                    Da nhan xe
                  </div>
                )}

                {booking.returnStatus === 'FEES_CALCULATED' && (
                  <button
                    className="btn-pay"
                    style={{ background: '#0ea5e9', border: 'none' }}
                    onClick={() => setSelectedForReturnFees(booking)}
                  >
                    Xem & xác nhận phí trả xe
                  </button>
                )}

                {booking.returnStatus === 'DISPUTED' && (
                  <button
                    className="btn-view"
                    onClick={() => setSelectedForDisputeChat(booking)}
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
                    onClick={() => window.open(booking.checkoutUrl, '_blank')}
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
                    onClick={() => window.open(booking.checkoutUrl, '_blank')}
                  >
                    Thanh toán phí phạt
                  </button>
                )}

                <button
                  className="btn-view"
                  onClick={() => navigate(`/cars/${booking.vehicleId}`)}
                >
                  Xem xe
                </button>
                <button
                  className="btn-view"
                  onClick={() => setSelectedForJourney(booking.id)}
                >
                  Xem chi tiết booking
                </button>
                {canCancel(booking.status) && (
                  <button
                    className="btn-cancel"
                    onClick={() => handleCancelBooking(booking.id)}
                    disabled={cancellingId === booking.id}
                  >
                    {cancellingId === booking.id ? 'Dang huy...' : 'Huy dat xe'}
                  </button>
                )}
              </div>
            </div>
          )})}
        </div>
      ) : (
        <div className="empty-state">
          <div className="empty-icon">🚗</div>
          <p>Bạn chưa có chuyến đi nào.</p>
          <button onClick={() => navigate('/cars')} className="btn-browse">
            Khám phá xe ngay
          </button>
        </div>
      )}

      {selectedForReturnFees && (
        <ReturnConfirmationModal
          booking={selectedForReturnFees}
          onClose={() => setSelectedForReturnFees(null)}
          onSuccess={fetchBookings}
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
          onResolved={() => {
            fetchBookings()
          }}
        />
      )}

      {selectedForJourney && (
        <BookingJourneyModal
          bookingId={selectedForJourney}
          onClose={() => setSelectedForJourney(null)}
        />
      )}
    </div>
  )
}
export default MyBookings
