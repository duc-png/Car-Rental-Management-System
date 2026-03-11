import { useState, useEffect, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { getMyBookings, updateBookingStatus } from '../api/bookings'
import ReturnInspectionModal from '../components/ReturnInspectionModal'
import DisputeChatModal from '../components/DisputeChatModal'
import { useAuth } from '../hooks/useAuth'
import FleetSidebar from '../components/owner/fleet/FleetSidebar'
import DashboardNotificationBell from '../components/layout/DashboardNotificationBell'
import { BOOKING_STATUS_LABELS, formatVndCurrency, getBookingStatusLabel } from '../utils/bookingUtils'
import '../styles/MyBookings.css'
import '../styles/OwnerManageRentals.css'

const STATUS_COLORS = {
    PENDING: 'pending',
    CONFIRMED: 'confirmed',
    ONGOING: 'ongoing',
    PENALTY_PAYMENT_PENDING: 'ongoing',
    COMPLETED: 'completed',
    CANCELLED: 'cancelled',
}

const ACTION_BUTTON_STYLES = {
    confirm: { background: '#10b981', color: 'white' },
    startTrip: { background: '#8b5cf6', color: 'white' },
    completeTrip: { background: '#3b82f6', color: 'white' },
}

function ManageRentals() {
    const navigate = useNavigate()
    const [rentals, setRentals] = useState([])
    const [loading, setLoading] = useState(true)
    const [selectedForInspection, setSelectedForInspection] = useState(null)
    const [selectedForDisputeChat, setSelectedForDisputeChat] = useState(null)
    const { user, isAuthenticated, logout } = useAuth()
    const canManage = Boolean(user?.role?.includes('ROLE_CAR_OWNER') || user?.role?.includes('ROLE_ADMIN'))

    const handleLogout = async () => {
        await logout()
        navigate('/login')
    }

    const fetchRentals = useCallback(async () => {
        try {
            const data = await getMyBookings()
            const myRentals = data.filter(booking =>
                Number(booking.ownerId) === Number(user?.userId) || Number(booking.ownerId) === Number(user?.id)
            )
            myRentals.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
            setRentals(myRentals)
        } catch (error) {
            console.error('Failed to fetch rentals:', error)
            toast.error('Không thể tải danh sách đơn thuê')
        } finally {
            setLoading(false)
        }
    }, [user?.id, user?.userId])

    useEffect(() => {
        if (user) {
            fetchRentals()
        }
    }, [user, fetchRentals])

    const handleStatusUpdate = useCallback(async (bookingId, newStatus) => {
        try {
            await updateBookingStatus(bookingId, newStatus)
            toast.success(`Cập nhật thành công: ${BOOKING_STATUS_LABELS[newStatus] || newStatus}`)
            await fetchRentals()
        } catch (error) {
            console.error('Update failed:', error)
            toast.error(error.message || 'Không thể cập nhật trạng thái đơn thuê')
        }
    }, [fetchRentals])

    const handleConfirm = (booking) => {
        if (!window.confirm('✅ Xác nhận đơn thuê này?\n\nSau khi xác nhận, khách hàng sẽ nhận link thanh toán cọc 15%.')) return
        handleStatusUpdate(booking.id, 'CONFIRMED')
    }

    const handleStartTrip = (booking) => {
        if (booking.paymentStatus !== 'FULLY_PAID') {
            toast.error('❌ Khách hàng chưa thanh toán đủ 100%! Vui lòng chờ khách hoàn tất thanh toán.', {
                duration: 5000,
                style: { background: '#ef4444', color: 'white', fontWeight: 600 }
            })
            return
        }
        if (!window.confirm('🚗 Xác nhận giao xe cho khách?\n\nHành động này sẽ bắt đầu chuyến thuê.')) return
        handleStatusUpdate(booking.id, 'ONGOING')
    }

    const handleOpenInspection = (booking) => {
        setSelectedForInspection(booking)
    }

    const handleInspectionSuccess = () => {
        fetchRentals()
        setSelectedForInspection(null)
    }

    const handleCancel = (booking) => {
        if (!window.confirm('❌ Hủy đơn thuê này?\n\nHành động này không thể hoàn tác!')) return
        handleStatusUpdate(booking.id, 'CANCELLED')
    }

    const getStatusColor = (status) => STATUS_COLORS[status] || ''

    if (!isAuthenticated) {
        return (
            <div className="fleet-guard">
                <h2>Cần đăng nhập để tiếp tục</h2>
                <p>Vui lòng đăng nhập bằng tài khoản chủ xe để quản lý đơn thuê.</p>
                <Link to="/login" className="add-vehicle">Đăng nhập ngay</Link>
            </div>
        )
    }

    if (!canManage) {
        return (
            <div className="fleet-guard">
                <h2>Không đủ quyền truy cập</h2>
                <p>Tài khoản hiện tại không có quyền quản lý đơn thuê.</p>
                <Link to="/" className="add-vehicle">Quay lại trang chủ</Link>
            </div>
        )
    }

    if (loading) {
        return (
            <div className="fleet-dashboard owner-rentals-page">
                <FleetSidebar user={user} onLogout={handleLogout} />
                <section className="fleet-main">
                    <header className="fleet-header">
                        <div>
                            <p className="fleet-breadcrumb">Chủ xe</p>
                            <h1>Đơn thuê</h1>
                            <p>Quản lý các yêu cầu đặt xe của bạn.</p>
                        </div>
                        <div className="fleet-header-actions">
                            <DashboardNotificationBell />
                        </div>
                    </header>
                    <div className="owner-rentals-loading">
                        <div className="loading-spinner"></div>
                        <p>Đang tải danh sách đơn thuê...</p>
                    </div>
                </section>
            </div>
        )
    }

    return (
        <div className="fleet-dashboard owner-rentals-page">
            <FleetSidebar user={user} onLogout={handleLogout} />

            <section className="fleet-main">
                <header className="fleet-header">
                    <div>
                        <p className="fleet-breadcrumb">Chủ xe</p>
                        <h1>Đơn thuê</h1>
                        <p>Quản lý các yêu cầu đặt xe của bạn.</p>
                    </div>
                    <div className="fleet-header-actions">
                        <DashboardNotificationBell />
                    </div>
                </header>

                <div className="bookings-grid">
                    {rentals.length === 0 ? (
                        <div className="no-bookings">
                            <p>Chưa có đơn thuê nào.</p>
                        </div>
                    ) : (
                        rentals.map((booking) => (
                            <div key={booking.id} className={`booking-card ${getStatusColor(booking.status)}`}>
                                <div className="booking-image">
                                    <img
                                        src={booking.vehicleImage || '/placeholder.svg'}
                                        alt={booking.vehicleName || `Vehicle #${booking.vehicleId}`}
                                    />
                                </div>

                                <div className="booking-details">
                                    <h3>{booking.vehicleName || `Vehicle #${booking.vehicleId}`}</h3>
                                    <div className="booking-info">
                                        <p><strong>Khách thuê:</strong> {booking.renterName || 'N/A'} {booking.renterEmail && `(${booking.renterEmail})`}</p>
                                        <p><strong>Thời gian:</strong> {booking.startDate ? new Date(booking.startDate).toLocaleDateString('vi-VN') : 'N/A'} - {booking.endDate ? new Date(booking.endDate).toLocaleDateString('vi-VN') : 'N/A'}</p>
                                        <p><strong>Tổng tiền:</strong> {formatVndCurrency(booking.totalPrice)}</p>
                                        {booking.depositAmount && (
                                            <p><strong>Cọc 15%:</strong> {formatVndCurrency(booking.depositAmount)}</p>
                                        )}

                                        {/* Payment Status */}
                                        {booking.paymentStatus && (
                                            <p>
                                                <strong>Thanh toán:</strong>
                                                <span style={{
                                                    marginLeft: '8px',
                                                    padding: '4px 10px',
                                                    borderRadius: '6px',
                                                    fontSize: '0.85rem',
                                                    fontWeight: 600,
                                                    background:
                                                        booking.paymentStatus === 'FULLY_PAID' ? '#10b98144' :
                                                            booking.paymentStatus === 'DEPOSIT_PAID' ? '#f59e0b44' :
                                                                booking.paymentStatus === 'PENDING_DEPOSIT' ? '#ef444444' :
                                                                    booking.paymentStatus === 'PENDING_FULL_PAYMENT' ? '#f59e0b44' :
                                                                        '#64748b44',
                                                    color:
                                                        booking.paymentStatus === 'FULLY_PAID' ? '#10b981' :
                                                            booking.paymentStatus === 'DEPOSIT_PAID' ? '#f59e0b' :
                                                                booking.paymentStatus === 'PENDING_DEPOSIT' ? '#ef4444' :
                                                                    booking.paymentStatus === 'PENDING_FULL_PAYMENT' ? '#f59e0b' :
                                                                        '#64748b'
                                                }}>
                                                    {booking.paymentStatus === 'FULLY_PAID' ? '✅ Đã thanh toán đủ' :
                                                        booking.paymentStatus === 'DEPOSIT_PAID' ? '⏳ Đã cọc 15%' :
                                                            booking.paymentStatus === 'PENDING_DEPOSIT' ? '❌ Chưa cọc' :
                                                                booking.paymentStatus === 'PENDING_FULL_PAYMENT' ? '⏳ Chờ thanh toán 85%' :
                                                                    booking.paymentStatus}
                                                </span>
                                            </p>
                                        )}

                                        <div className="booking-status">
                                            <span className={`status-badge ${getStatusColor(booking.status)}`}>
                                                {getBookingStatusLabel(booking.status)}
                                            </span>
                                            {booking.returnStatus && (
                                                <span className="status-badge return-status">
                                                    {booking.returnStatus === 'NOT_RETURNED' && 'Chưa trả xe'}
                                                    {booking.returnStatus === 'PENDING_INSPECTION' && 'Chờ kiểm tra trả xe'}
                                                    {booking.returnStatus === 'FEES_CALCULATED' && 'Đã tính phí, chờ khách'}
                                                    {booking.returnStatus === 'CUSTOMER_CONFIRMED' && 'Khách đã xác nhận phí'}
                                                    {booking.returnStatus === 'DISPUTED' && 'Đang tranh chấp phí'}
                                                    {booking.returnStatus === 'RESOLVED' && 'Phí đã giải quyết'}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="booking-actions">
                                    {/* PENDING: Confirm or Cancel */}
                                    {booking.status === 'PENDING' && (
                                        <>
                                            <button
                                                className="btn-view"
                                                style={ACTION_BUTTON_STYLES.confirm}
                                                onClick={() => handleConfirm(booking)}
                                            >
                                                Xác nhận
                                            </button>
                                            <button
                                                className="btn-cancel"
                                                onClick={() => handleCancel(booking)}
                                            >
                                                Từ chối
                                            </button>
                                        </>
                                    )}

                                    {/* CONFIRMED: Waiting for payment, show Start Trip when fully paid */}
                                    {booking.status === 'CONFIRMED' && (
                                        <>
                                            {/* Show payment link if deposit not yet paid */}
                                            {booking.paymentStatus === 'PENDING_DEPOSIT' && booking.checkoutUrl && (
                                                <button
                                                    className="btn-view"
                                                    style={{ background: '#f59e0b', color: 'white' }}
                                                    onClick={() => {
                                                        window.open(booking.checkoutUrl, '_blank')
                                                        toast.info('Đã mở link thanh toán cọc cho khách hàng')
                                                    }}
                                                >
                                                    📧 Gửi link cọc 15%
                                                </button>
                                            )}

                                            {/* Show 85% payment link */}
                                            {booking.paymentStatus === 'PENDING_FULL_PAYMENT' && booking.checkoutUrl && (
                                                <button
                                                    className="btn-view"
                                                    style={{ background: '#f59e0b', color: 'white' }}
                                                    onClick={() => {
                                                        window.open(booking.checkoutUrl, '_blank')
                                                        toast.info('Đã mở link thanh toán 85% còn lại')
                                                    }}
                                                >
                                                    📧 Gửi link 85%
                                                </button>
                                            )}

                                            {/* Warning if not fully paid */}
                                            {booking.paymentStatus !== 'FULLY_PAID' && (
                                                <div style={{
                                                    marginTop: '8px',
                                                    padding: '10px 12px',
                                                    background: '#fef3c7',
                                                    border: '1px solid #fbbf24',
                                                    borderRadius: '8px',
                                                    fontSize: '0.85rem',
                                                    color: '#92400e',
                                                }}>
                                                    ⚠️ <strong>Chờ khách thanh toán đủ 100% để giao xe</strong>
                                                </div>
                                            )}

                                            {/* Start Trip — only when fully paid */}
                                            <button
                                                className="btn-view"
                                                style={ACTION_BUTTON_STYLES.startTrip}
                                                onClick={() => handleStartTrip(booking)}
                                            >
                                                Xác nhận giao xe
                                            </button>

                                            <button
                                                className="btn-cancel"
                                                onClick={() => handleCancel(booking)}
                                            >
                                                Hủy đơn
                                            </button>
                                        </>
                                    )}

                                    {/* ONGOING: Return inspection / fee calculation */}
                                    {booking.status === 'ONGOING' && booking.returnStatus !== 'FEES_CALCULATED' && (
                                        <button
                                            className="btn-view"
                                            style={ACTION_BUTTON_STYLES.completeTrip}
                                            onClick={() => handleOpenInspection(booking)}
                                        >
                                            Kiểm tra trả xe & tính phí
                                        </button>
                                    )}

                                    {booking.status === 'ONGOING' && booking.returnStatus === 'FEES_CALCULATED' && (
                                        <div style={{
                                            marginTop: '8px',
                                            padding: '8px 10px',
                                            borderRadius: '8px',
                                            background: '#e0f2fe',
                                            color: '#0369a1',
                                            fontSize: '0.85rem'
                                        }}>
                                            Đã kiểm tra trả xe, chờ khách xác nhận phí.
                                        </div>
                                    )}

                                    {booking.returnStatus === 'DISPUTED' && (
                                        <button
                                            className="btn-view"
                                            onClick={() => setSelectedForDisputeChat(booking)}
                                        >
                                            Xem chat tranh chấp phí
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {selectedForInspection && (
                    <ReturnInspectionModal
                        booking={selectedForInspection}
                        onClose={() => setSelectedForInspection(null)}
                        onSuccess={handleInspectionSuccess}
                    />
                )}
                {selectedForDisputeChat && (
                    <DisputeChatModal
                        booking={selectedForDisputeChat}
                        isOwner={true}
                        onClose={() => setSelectedForDisputeChat(null)}
                        onResolved={fetchRentals}
                    />
                )}
            </section>
        </div>
    )
}

export default ManageRentals
