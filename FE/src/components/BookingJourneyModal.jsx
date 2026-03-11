import { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { getBookingJourney } from '../api/bookings'
import { formatVndCurrency, getBookingStatusLabel } from '../utils/bookingUtils'
import '../styles/BookingJourneyModal.css'

const formatDateTime = (value) => {
    if (!value) return '—'
    return new Date(value).toLocaleString('vi-VN')
}

function BookingJourneyModal({ bookingId, onClose }) {
    const [loading, setLoading] = useState(true)
    const [journey, setJourney] = useState(null)

    useEffect(() => {
        const fetchJourney = async () => {
            try {
                setLoading(true)
                const data = await getBookingJourney(bookingId)
                setJourney(data)
            } catch (error) {
                toast.error(error.message || 'Không tải được chi tiết booking')
            } finally {
                setLoading(false)
            }
        }
        if (bookingId) {
            fetchJourney()
        }
    }, [bookingId])

    const timeline = useMemo(() => {
        return (journey?.timeline || []).slice().sort((a, b) => new Date(a.time) - new Date(b.time))
    }, [journey])

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="booking-journey-modal" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>Chi tiết hành trình booking</h2>
                    <button className="close-btn" onClick={onClose}>&times;</button>
                </div>

                {loading ? (
                    <div className="journey-loading">Đang tải chi tiết booking...</div>
                ) : !journey ? (
                    <div className="journey-loading">Không có dữ liệu.</div>
                ) : (
                    <div className="journey-body">
                        <section className="journey-card">
                            <h3>Tổng quan</h3>
                            <div className="journey-grid">
                                <p><strong>Mã booking:</strong> #{journey.bookingId}</p>
                                <p><strong>Xe:</strong> {journey.vehicleName || '—'} ({journey.vehiclePlate || '—'})</p>
                                <p><strong>Khách thuê:</strong> {journey.customerName || '—'}</p>
                                <p><strong>Chủ xe:</strong> {journey.ownerName || '—'}</p>
                                <p><strong>Trạng thái booking:</strong> {getBookingStatusLabel(journey.bookingStatus)}</p>
                                <p><strong>Trạng thái thanh toán:</strong> {journey.paymentStatus || '—'}</p>
                                <p><strong>Trạng thái trả xe:</strong> {journey.returnStatus || '—'}</p>
                                <p><strong>Tổng tiền thuê:</strong> {formatVndCurrency(journey.totalPrice)}</p>
                                <p><strong>Tiền cọc:</strong> {formatVndCurrency(journey.depositAmount)}</p>
                                <p><strong>Từ ngày:</strong> {formatDateTime(journey.startDate)}</p>
                                <p><strong>Đến ngày:</strong> {formatDateTime(journey.endDate)}</p>
                                <p><strong>Tạo lúc:</strong> {formatDateTime(journey.createdAt)}</p>
                            </div>
                        </section>

                        {journey.inspection && (
                            <section className="journey-card">
                                <h3>Kiểm tra trả xe</h3>
                                <div className="journey-grid">
                                    <p><strong>Thời điểm trả thực tế:</strong> {formatDateTime(journey.inspection.actualReturnDate)}</p>
                                    <p><strong>Quãng đường đi:</strong> {journey.inspection.distanceTraveled?.toLocaleString('vi-VN') || 0} km</p>
                                    <p><strong>Số km cho phép:</strong> {journey.inspection.allowedKm?.toLocaleString('vi-VN') || 0} km</p>
                                    <p><strong>Km vượt mức:</strong> {journey.inspection.overKm?.toLocaleString('vi-VN') || 0} km</p>
                                    <p><strong>Phí trả muộn:</strong> {formatVndCurrency(journey.inspection.lateFee)}</p>
                                    <p><strong>Phí nhiên liệu:</strong> {formatVndCurrency(journey.inspection.fuelFee)}</p>
                                    <p><strong>Phí vượt km:</strong> {formatVndCurrency(journey.inspection.overKmFee)}</p>
                                    <p><strong>Phí hư hỏng:</strong> {formatVndCurrency(journey.inspection.damageFee)}</p>
                                    <p><strong>Tổng phí phát sinh:</strong> {formatVndCurrency(journey.inspection.totalAdditionalFees)}</p>
                                    <p><strong>Tổng tiền cuối cùng:</strong> {formatVndCurrency(journey.inspection.finalTotal)}</p>
                                </div>
                            </section>
                        )}

                        {journey.dispute && (
                            <section className="journey-card">
                                <h3>Tranh chấp</h3>
                                <div className="journey-grid">
                                    <p><strong>Mã tranh chấp:</strong> #{journey.dispute.disputeId}</p>
                                    <p><strong>Trạng thái:</strong> {journey.dispute.status}</p>
                                    <p><strong>Số tiền tranh chấp:</strong> {formatVndCurrency(journey.dispute.disputedAmount)}</p>
                                    <p><strong>Khách đề xuất:</strong> {formatVndCurrency(journey.dispute.customerProposedAmount)}</p>
                                    <p><strong>Số tiền chốt:</strong> {formatVndCurrency(journey.dispute.finalAmount)}</p>
                                    <p><strong>Tạo lúc:</strong> {formatDateTime(journey.dispute.createdAt)}</p>
                                </div>
                                <p><strong>Lý do:</strong> {journey.dispute.reason || '—'}</p>
                                <p><strong>Ghi chú xử lý:</strong> {journey.dispute.resolutionNotes || '—'}</p>
                            </section>
                        )}

                        <section className="journey-card">
                            <h3>Lịch sử thanh toán</h3>
                            {journey.payments?.length ? (
                                <div className="journey-table">
                                    {journey.payments.map((p) => (
                                        <div key={p.paymentId} className="journey-row">
                                            <span>{p.paymentType || 'KHÔNG_XÁC_ĐỊNH'}</span>
                                            <span>{formatVndCurrency(p.amount)}</span>
                                            <span>{p.status}</span>
                                            <span>{formatDateTime(p.paymentDate)}</span>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p>Chưa có dữ liệu thanh toán.</p>
                            )}
                        </section>

                        <section className="journey-card">
                            <h3>Dòng thời gian (Đặt xe tới phạt)</h3>
                            {timeline.length ? (
                                <div className="journey-timeline">
                                    {timeline.map((event, idx) => (
                                        <div key={`${event.type}-${idx}`} className="timeline-item">
                                            <p className="timeline-title">{event.title}</p>
                                            <p className="timeline-detail">{event.detail}</p>
                                            <p className="timeline-time">{formatDateTime(event.time)}</p>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p>Chưa có mốc thời gian.</p>
                            )}
                        </section>
                    </div>
                )}
            </div>
        </div>
    )
}

export default BookingJourneyModal
