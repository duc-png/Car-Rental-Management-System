'use client';
import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { getMyBookings, cancelBooking } from '../../api/bookings'
import { formatVndCurrency, getBookingStatusLabel } from '../../utils/bookingUtils'
import ReturnConfirmationModal from '../../components/ReturnConfirmationModal'
import DisputeChatModal from '../../components/DisputeChatModal'
import '../../styles/MyBookings.css'

function MyBookings() {
  const navigate = useNavigate()
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [cancellingId, setCancellingId] = useState(null)
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [showChatModal, setShowChatModal] = useState(false)
  const [selectedBooking, setSelectedBooking] = useState(null)

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
      // Refresh list
      fetchBookings()
    } catch (err) {
      toast.error(err.message || 'Không thể hủy đặt xe')
    } finally {
      setCancellingId(null)
    }
  }

  const formatDate = (dateString) => {
    if (!dateString) return ''
    const date = new Date(dateString)
    return date.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getStatusLabel = (status) => {
    const statusMap = {
      'PENDING': 'Chờ duyệt',
      'CONFIRMED': 'Đã duyệt',
      'ONGOING': 'Đang thuê',
      'COMPLETED': 'Hoàn thành',
      'CANCELLED': 'Đã hủy'
    }
    return statusMap[status] || status
  }

  const getReturnStatusLabel = (returnStatus) => {
    const labels = {
      'NOT_RETURNED': null,
      'PENDING_INSPECTION': 'Đang kiểm tra',
      'FEES_CALCULATED': 'Chờ xác nhận phí',
      'CUSTOMER_CONFIRMED': 'Đã xác nhận',
      'DISPUTED': 'Đang tranh chấp',
      'RESOLVED': 'Đã giải quyết'
    }
    return labels[returnStatus] || null
  }

  const getReturnStatusColor = (returnStatus) => {
    const colors = {
      'FEES_CALCULATED': '#f59e0b',
      'DISPUTED': '#ef4444',
      'RESOLVED': '#10b981',
      'CUSTOMER_CONFIRMED': '#10b981'
    }
    return colors[returnStatus] || '#6b7280'
  }

  const canCancel = (status) => {
    return status === 'PENDING' || status === 'CONFIRMED'
  }

  const handleReviewFees = (booking) => {
    setSelectedBooking(booking)
    setShowConfirmModal(true)
  }

  const handleOpenChat = (booking) => {
    setSelectedBooking(booking)
    setShowChatModal(true)
  }

  const handleDisputeCreated = () => {
    setShowConfirmModal(false)
    fetchBookings()
    if (selectedBooking) {
      setShowChatModal(true)
    }
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
          {bookings.map(booking => (
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
                  
                  {booking.totalAdditionalFees > 0 && (
                    <p>
                      <strong>Phí phát sinh:</strong>{' '}
                      <span style={{color: '#ef4444', fontWeight: 600}}>
                        {booking.totalAdditionalFees?.toLocaleString('vi-VN')} ₫
                      </span>
                    </p>
                  )}
                </div>
                <div className="booking-status">
                  <span className={`status-badge ${booking.status?.toLowerCase()}`}>
                    {getBookingStatusLabel(booking.status)}
                  </span>
                  {getReturnStatusLabel(booking.returnStatus) && (
                    <span 
                      className="status-badge" 
                      style={{ 
                        background: getReturnStatusColor(booking.returnStatus),
                        marginLeft: '8px',
                        color: 'white'
                      }}
                    >
                      {getReturnStatusLabel(booking.returnStatus)}
                    </span>
                  )}
                </div>
              </div>
              <div className="booking-actions">
                {booking.status !== 'CANCELLED' && booking.status !== 'COMPLETED'
                  && booking.paymentStatus === 'PENDING_DEPOSIT' && booking.checkoutUrl && (
                    <button
                      className="btn-pay"
                      onClick={() => window.open(booking.checkoutUrl, '_blank')}
                    >
                      Thanh toán cọc 15%
                    </button>
                  )}
                {booking.status !== 'CANCELLED' && booking.status !== 'COMPLETED'
                  && booking.paymentStatus === 'PENDING_FULL_PAYMENT' && booking.checkoutUrl && (
                    <button
                      className="btn-pay full-payment"
                      onClick={() => window.open(booking.checkoutUrl, '_blank')}
                    >
                      Thanh toán 85% còn lại
                    </button>
                  )}
                <button
                  className="btn-view"
                  onClick={() => navigate(`/cars/${booking.vehicleId}`)}
                >
                  Xem xe
                </button>
                
                {booking.returnStatus === 'FEES_CALCULATED' && (
                  <button
                    className="btn-view"
                    style={{ background: '#f59e0b', color: 'white' }}
                    onClick={() => handleReviewFees(booking)}
                  >
                    Xem phí trả xe
                  </button>
                )}

                {(booking.returnStatus === 'DISPUTED' || booking.returnStatus === 'RESOLVED') && (
                  <button
                    className="btn-view"
                    style={{ background: '#667eea', color: 'white' }}
                    onClick={() => handleOpenChat(booking)}
                  >
                    {booking.returnStatus === 'RESOLVED' ? 'Xem kết quả' : 'Mở chat'}
                  </button>
                )}
                
                {canCancel(booking.status) && (
                  <button
                    className="btn-cancel"
                    onClick={() => handleCancelBooking(booking.id)}
                    disabled={cancellingId === booking.id}
                  >
                    {cancellingId === booking.id ? 'Đang hủy...' : 'Hủy đặt xe'}
                  </button>
                )}
              </div>
            </div>
          ))}
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

      {showConfirmModal && selectedBooking && (
        <ReturnConfirmationModal
          booking={selectedBooking}
          onClose={() => {
            setShowConfirmModal(false)
            setSelectedBooking(null)
          }}
          onSuccess={() => {
            fetchBookings()
          }}
          onDispute={handleDisputeCreated}
        />
      )}

      {showChatModal && selectedBooking && (
        <DisputeChatModal
          booking={selectedBooking}
          isOwner={false}
          onClose={() => {
            setShowChatModal(false)
            setSelectedBooking(null)
          }}
          onResolved={() => {
            fetchBookings()
          }}
        />
      )}
    </div>
  )
}

export default MyBookings
