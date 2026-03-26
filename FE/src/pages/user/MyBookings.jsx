'use client';
import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { getMyBookings, cancelBooking, confirmHandover } from '../../api/bookings'
import { createIncidentReport, getMyIncidentReports } from '../../api/incidentReports'
import { formatVndCurrency, getBookingStatusLabel } from '../../utils/bookingUtils'
import '../../styles/MyBookings.css'
import ReturnConfirmationModal from '../../components/ReturnConfirmationModal'
import DisputeChatModal from '../../components/DisputeChatModal'
import BookingJourneyModal from '../../components/BookingJourneyModal'
import BookingIssueReportModal from '../../components/BookingIssueReportModal'

function MyBookings() {
  const navigate = useNavigate()
  const [bookings, setBookings] = useState([])
  const [incidentReports, setIncidentReports] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [cancellingId, setCancellingId] = useState(null)
  const [confirmingHandoverId, setConfirmingHandoverId] = useState(null)
  const [selectedForReturnFees, setSelectedForReturnFees] = useState(null)
  const [selectedForDisputeChat, setSelectedForDisputeChat] = useState(null)
  const [selectedForJourney, setSelectedForJourney] = useState(null)
  const [selectedForIssueReport, setSelectedForIssueReport] = useState(null)
  const [submittingReport, setSubmittingReport] = useState(false)

  const fetchBookings = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const [bookingData, reportData] = await Promise.all([
        getMyBookings(),
        getMyIncidentReports().catch(() => [])
      ])
      setBookings(bookingData)
      setIncidentReports(reportData)
    } catch (err) {
      if (err.message === 'Chua dang nhap!') {
        toast.error('Vui long dang nhap de xem dat xe!')
        navigate('/login')
        return
      }
      setError(err.message || 'Khong the tai danh sach dat xe')
    } finally {
      setLoading(false)
    }
  }, [navigate])

  useEffect(() => {
    fetchBookings()
  }, [fetchBookings])

  const handleCancelBooking = async (id) => {
    if (!confirm('Ban co chac muon huy dat xe nay?')) return
    try {
      setCancellingId(id)
      await cancelBooking(id)
      toast.success('Da huy dat xe thanh cong!')
      fetchBookings()
    } catch (err) {
      toast.error(err.message || 'Khong the huy dat xe')
    } finally {
      setCancellingId(null)
    }
  }

  const handleConfirmHandover = async (id) => {
    if (!confirm('Xac nhan da nhan xe tu chu xe?')) return
    try {
      setConfirmingHandoverId(id)
      await confirmHandover(id)
      toast.success('Da xac nhan nhan xe!')
      fetchBookings()
    } catch (err) {
      toast.error(err.message || 'Khong the xac nhan luc nay')
    } finally {
      setConfirmingHandoverId(null)
    }
  }

  const handleSubmitIssueReport = async (payload) => {
    try {
      setSubmittingReport(true)
      await createIncidentReport(payload)
      toast.success('Da gui report, trang thai ban dau la Pending')
      setSelectedForIssueReport(null)
      const reports = await getMyIncidentReports()
      setIncidentReports(reports)
    } catch (err) {
      toast.error(err.message || 'Khong the gui report luc nay')
    } finally {
      setSubmittingReport(false)
    }
  }

  const formatDate = (dateString) => {
    if (!dateString) return ''
    return new Date(dateString).toLocaleDateString('vi-VN', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    })
  }

  const REPORT_STATUS_LABELS = {
    PENDING: 'Dang cho admin duyet',
    APPROVED: 'Da duyet',
    REJECTED: 'Tu choi',
    RESOLVED: 'Da xu ly',
    PENALIZED: 'Owner bi xu ly',
    REFUNDED: 'Da hoan tien'
  }

  const getLatestReportByBookingId = (bookingId) => {
    const reports = incidentReports
      .filter((report) => Number(report.bookingId) === Number(bookingId))
      .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())
    return reports[0] || null
  }

  const canCancel = (status) => status === 'PENDING' || status === 'CONFIRMED'
  const STEPS = [
    { key: 'PENDING', label: 'Dat xe', icon: '1' },
    { key: 'CONFIRMED', label: 'Chu xe duyet', icon: '2' },
    { key: 'DEPOSIT_PAID', label: 'Da dat coc', icon: '3' },
    { key: 'ONGOING', label: 'Dang thue', icon: '4' },
    { key: 'COMPLETED', label: 'Hoan thanh', icon: '5' },
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
              <div className="step-circle">{isDone ? 'ok' : step.icon}</div>
              <span className="step-label">{step.label}</span>
              {idx < STEPS.length - 1 && <div className={`step-line ${isDone ? 'done' : ''}`} />}
            </div>
          )
        })}
      </div>
    )
  }

  if (loading) {
    return (
      <div className="bookings-page">
        <div className="bookings-loading">
          <div className="loading-spinner"></div>
          <p>Dang tai danh sach dat xe...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bookings-page">
        <div className="bookings-error">
          <p>{error}</p>
          <button onClick={fetchBookings} className="btn-retry">Thu lai</button>
        </div>
      </div>
    )
  }

  return (
    <div className="bookings-page">
      <div className="bookings-header">
        <h1>Đơn Đặt Xe Của Tôi</h1>
        <p>Quản lý các chuyến đi của bạn</p>
      </div>
      {bookings.length > 0 ? (
        <div className="bookings-list">
          {bookings.map((booking) => {
            const latestReport = getLatestReportByBookingId(booking.id)
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
                    <p><strong>Nhan xe:</strong> {formatDate(booking.startDate)}</p>
                    <p><strong>Tra xe:</strong> {formatDate(booking.endDate)}</p>
                    <p><strong>Tong tien:</strong> {formatVndCurrency(booking.totalPrice)}</p>
                    {booking.depositAmount && (
                      <p><strong>Tien coc (15%):</strong> {formatVndCurrency(booking.depositAmount)}</p>
                    )}
                  </div>
                  <div className="booking-status">
                    <span className={`status-badge ${booking.status?.toLowerCase()}`}>
                      {getBookingStatusLabel(booking.status)}
                    </span>
                    {latestReport && (
                      <span className="status-badge return-status">
                        Report: {REPORT_STATUS_LABELS[latestReport.status] || latestReport.status}
                      </span>
                    )}
                    {booking.returnStatus && (
                      <span className="status-badge return-status">
                        {booking.returnStatus}
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
                      Thanh toan coc 15%
                    </button>
                  )}
                  {shouldShowFullPaymentButton && (
                    <button
                      className="btn-pay full-payment"
                      onClick={() => window.open(booking.checkoutUrl, '_blank')}
                    >
                      Thanh toan 85% con lai
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

                  {booking.returnStatus === 'FEES_CALCULATED' && (
                    <button
                      className="btn-pay"
                      style={{ background: '#0ea5e9', border: 'none' }}
                      onClick={() => setSelectedForReturnFees(booking)}
                    >
                      Xem va xac nhan phi tra xe
                    </button>
                  )}

                  {booking.returnStatus === 'DISPUTED' && (
                    <button
                      className="btn-view"
                      onClick={() => setSelectedForDisputeChat(booking)}
                    >
                      Thao luan phi voi chu xe
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
                    Xem chi tiet booking
                  </button>
                  <button
                    className="btn-view"
                    onClick={() => setSelectedForIssueReport(booking)}
                  >
                    Gui report
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
            )
          })}
        </div>
      ) : (
        <div className="empty-state">
          <div className="empty-icon">xe</div>
          <p>Ban chua co chuyen di nao.</p>
          <button onClick={() => navigate('/cars')} className="btn-browse">
            Kham pha xe ngay
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

      {selectedForIssueReport && (
        <BookingIssueReportModal
          booking={selectedForIssueReport}
          submitting={submittingReport}
          onClose={() => setSelectedForIssueReport(null)}
          onSubmit={handleSubmitIssueReport}
        />
      )}
    </div>
  )
}

export default MyBookings
