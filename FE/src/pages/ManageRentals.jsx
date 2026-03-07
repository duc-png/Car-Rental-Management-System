import { useState, useEffect, useMemo, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { getMyBookings, updateBookingStatus } from '../api/bookings'
import { useAuth } from '../hooks/useAuth'
import FleetSidebar from '../components/owner/fleet/FleetSidebar'
import DashboardNotificationBell from '../components/layout/DashboardNotificationBell'
import { BOOKING_STATUS_LABELS, formatVndCurrency, getBookingStatusLabel } from '../utils/bookingUtils'
import ReturnInspectionModal from '../components/ReturnInspectionModal'
import DisputeChatModal from '../components/DisputeChatModal'
import '../styles/MyBookings.css'
import '../styles/TripModal.css'
import '../styles/OwnerManageRentals.css'

const STATUS_COLORS = {
    PENDING: 'pending',
    CONFIRMED: 'confirmed',
    ONGOING: 'ongoing',
    COMPLETED: 'completed',
    CANCELLED: 'cancelled',
}

const ACTION_BUTTON_STYLES = {
    confirm: { background: '#10b981', color: 'white' },
    startTrip: { background: '#8b5cf6', color: 'white' },
    completeTrip: { background: '#3b82f6', color: 'white' },
}

const FUEL_MIN = 0
const FUEL_MAX = 100

const toNumber = (value) => Number(value)

const isFuelLevelValid = (fuelLevel) => {
    const value = toNumber(fuelLevel)
    return Number.isFinite(value) && value >= FUEL_MIN && value <= FUEL_MAX
}

const getCurrentDateTimeLocal = () => {
    const now = new Date()
    const pad = (n) => String(n).padStart(2, '0')
    return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}`
}

function ManageRentals() {
    const navigate = useNavigate()
    const [rentals, setRentals] = useState([])
    const [loading, setLoading] = useState(true)
    const [showReturnModal, setShowReturnModal] = useState(false)
    const [showChatModal, setShowChatModal] = useState(false)
    const [selectedBooking, setSelectedBooking] = useState(null)
    const { user, isAuthenticated, logout } = useAuth()
    const canManage = Boolean(user?.role?.includes('ROLE_CAR_OWNER') || user?.role?.includes('ROLE_ADMIN'))

    const handleLogout = async () => {
        await logout()
        navigate('/login')
    }

    // Modal states
    const [startTripModal, setStartTripModal] = useState(null)
    const [completeTripModal, setCompleteTripModal] = useState(null)

    // Start Trip form
    const [startKm, setStartKm] = useState('')
    const [startFuelLevel, setStartFuelLevel] = useState(FUEL_MAX)

    // Complete Trip form
    const [endKm, setEndKm] = useState('')
    const [endFuelLevel, setEndFuelLevel] = useState(FUEL_MAX)
    const [otherSurcharge, setOtherSurcharge] = useState('')
    const [returnNotes, setReturnNotes] = useState('')
    const [actualReturnTime, setActualReturnTime] = useState('')

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
            toast.error('Failed to load rental requests')
        } finally {
            setLoading(false)
        }
    }, [user?.id, user?.userId])

    useEffect(() => {
        if (user) {
            fetchRentals()
        }
    }, [user, fetchRentals])

    const handleStatusUpdate = useCallback(async (bookingId, newStatus, extraData = {}) => {
        try {
            await updateBookingStatus(bookingId, newStatus, extraData)
            toast.success(`Cập nhật trạng thái thành công: ${BOOKING_STATUS_LABELS[newStatus] || newStatus}`)
            await fetchRentals()
        } catch (error) {
            console.error('Update failed:', error)
            toast.error('Không thể cập nhật trạng thái đơn thuê')
        }
    }, [fetchRentals])

    const confirmAndUpdate = (message, bookingId, status, booking = null) => {
        // Check payment status before allowing certain actions
        if (status === 'ONGOING' && booking) {
            if (booking.paymentStatus !== 'DEPOSIT_PAID' && booking.paymentStatus !== 'FULLY_PAID') {
                toast.error('❌ Không thể bắt đầu chuyến! Khách hàng chưa thanh toán cọc 15%', {
                    duration: 5000,
                    style: {
                        background: '#ef4444',
                        color: 'white',
                        fontWeight: 600
                    }
                })
                return
            }
        }

        if (window.confirm(message)) {
            handleStatusUpdate(bookingId, status)
        }
    }

    // ========== Start Trip Modal ==========
    const openStartTripModal = (booking) => {
        // Check payment status before opening modal
        if (booking.paymentStatus !== 'DEPOSIT_PAID' && booking.paymentStatus !== 'FULLY_PAID') {
            toast.error('❌ Không thể bắt đầu chuyến! Khách hàng chưa thanh toán cọc 15%', {
                duration: 5000,
                style: {
                    background: '#ef4444',
                    color: 'white',
                    fontWeight: 600
                }
            })
            return
        }
        
        setStartKm(booking.startKm || '')
        setStartFuelLevel(booking.startFuelLevel || FUEL_MAX)
        setStartTripModal(booking)
    }

    const closeStartTripModal = () => setStartTripModal(null)

    const handleStartTripConfirm = async () => {
        const parsedStartKm = parseInt(startKm, 10)
        const parsedStartFuelLevel = parseInt(startFuelLevel, 10)

        if (!Number.isFinite(parsedStartKm) || parsedStartKm <= 0) {
            toast.error('Vui lòng nhập số Km hợp lệ')
            return
        }
        if (!isFuelLevelValid(parsedStartFuelLevel)) {
            toast.error('Mức nhiên liệu phải từ 0% đến 100%')
            return
        }

        await handleStatusUpdate(startTripModal.id, 'ONGOING', {
            startKm: parsedStartKm,
            startFuelLevel: parsedStartFuelLevel,
        })
        setStartTripModal(null)
    }

    // ========== Complete Trip Modal ==========
    const openCompleteTripModal = (booking) => {
        // Check payment status before opening modal
        if (booking.paymentStatus !== 'FULLY_PAID') {
            toast.error('❌ Không thể hoàn thành chuyến! Khách hàng chưa thanh toán đủ 100%', {
                duration: 5000,
                style: {
                    background: '#ef4444',
                    color: 'white',
                    fontWeight: 600
                }
            })
            return
        }
        
        setEndKm(booking.startKm || '')
        setEndFuelLevel(FUEL_MAX)
        setOtherSurcharge('')
        setReturnNotes('')
        setActualReturnTime(getCurrentDateTimeLocal())
        setCompleteTripModal(booking)
    }

    const closeCompleteTripModal = () => setCompleteTripModal(null)

    // Calculate surcharge in real-time
    const overKmInfo = useMemo(() => {
        if (!completeTripModal || completeTripModal.startKm == null || !endKm) return null

        const startDate = new Date(completeTripModal.startDate)
        const endDate = new Date(completeTripModal.endDate)
        const rentalDays = Math.max(1, Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)))
        const allowedKm = rentalDays * 300
        const drivenKm = parseInt(endKm, 10) - completeTripModal.startKm
        const overKm = Math.max(0, drivenKm - allowedKm)
        const overKmFee = overKm * 5000

        return { rentalDays, allowedKm, drivenKm, overKm, overKmFee }
    }, [completeTripModal, endKm])

    // Calculate late return fee in real-time
    const lateReturnInfo = useMemo(() => {
        if (!completeTripModal || !actualReturnTime) return null
        const endDate = new Date(completeTripModal.endDate)
        const returnDate = new Date(actualReturnTime)
        if (returnDate <= endDate) return null

        const lateMs = returnDate - endDate
        const lateMinutes = Math.floor(lateMs / 60000)
        const lateHours = Math.ceil(lateMinutes / 60)
        const pricePerDay = completeTripModal.pricePerDay || 0

        if (lateHours < 24) {
            const fee = pricePerDay * 0.10 * lateHours
            return { lateHours, lateDays: null, fee, type: 'hourly' }
        } else {
            const lateDays = Math.ceil(lateHours / 24)
            const fee = pricePerDay * 1.50 * lateDays
            return { lateHours, lateDays, fee, type: 'daily' }
        }
    }, [completeTripModal, actualReturnTime])

    const totalSurcharge = useMemo(() => {
        const overFee = overKmInfo?.overKmFee || 0
        const lateFee = lateReturnInfo?.fee || 0
        const otherFee = parseFloat(otherSurcharge) || 0
        return overFee + lateFee + otherFee
    }, [overKmInfo, lateReturnInfo, otherSurcharge])

    const submitCompleteTrip = async () => {
        const parsedEndKm = parseInt(endKm, 10)
        const parsedEndFuelLevel = parseInt(endFuelLevel, 10)
        const parsedOtherSurcharge = parseFloat(otherSurcharge) || 0

        if (!Number.isFinite(parsedEndKm) || parsedEndKm <= 0) {
            toast.error('Vui lòng nhập số Km lúc trả xe')
            return
        }
        if (completeTripModal.startKm != null && parsedEndKm < completeTripModal.startKm) {
            toast.error('Số Km trả xe không thể nhỏ hơn số Km lúc giao xe')
            return
        }
        if (!isFuelLevelValid(parsedEndFuelLevel)) {
            toast.error('Mức nhiên liệu phải từ 0% đến 100%')
            return
        }

        await handleStatusUpdate(completeTripModal.id, 'COMPLETED', {
            endKm: parsedEndKm,
            endFuelLevel: parsedEndFuelLevel,
            surchargeAmount: totalSurcharge,
            returnNotes: returnNotes || null,
        })
        setCompleteTripModal(null)
    }

    const handleReturnInspection = (booking) => {
        setSelectedBooking(booking)
        setShowReturnModal(true)
    }

    const handleOpenChat = (booking) => {
        setSelectedBooking(booking)
        setShowChatModal(true)
    }

    const getStatusColor = (status) => {
        return STATUS_COLORS[status] || ''
    }

    const getReturnStatusLabel = (returnStatus) => {
        const labels = {
            'NOT_RETURNED': null,
            'PENDING_INSPECTION': 'Pending Inspection',
            'FEES_CALCULATED': 'Awaiting Customer Confirm',
            'CUSTOMER_CONFIRMED': 'Customer Confirmed',
            'DISPUTED': 'Disputed',
            'RESOLVED': 'Resolved'
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
                                        
                                        {/* Payment Status Display */}
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
                                        
                                        {booking.totalAdditionalFees > 0 && (
                                            <p><strong>Phí phát sinh:</strong> <span style={{color: '#f87171', fontWeight: 600}}>+{formatVndCurrency(booking.totalAdditionalFees)}</span></p>
                                        )}
                                        
                                        <div className="booking-status">
                                            <span className={`status-badge ${getStatusColor(booking.status)}`}>
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
                                </div>

                                <div className="booking-actions">
                                    {booking.status === 'PENDING' && (
                                        <>
                                            <button
                                                className="btn-view"
                                                style={ACTION_BUTTON_STYLES.confirm}
                                                onClick={() => confirmAndUpdate(
                                                    '✅ Xác nhận đơn thuê này?\n\nSau khi xác nhận, khách hàng sẽ cần thanh toán cọc 15% để tiếp tục.', 
                                                    booking.id, 
                                                    'CONFIRMED'
                                                )}
                                            >
                                                Xác nhận
                                            </button>
                                            <button
                                                className="btn-cancel"
                                                onClick={() => confirmAndUpdate(
                                                    '❌ Từ chối đơn thuê này?\n\nKhách hàng sẽ nhận được thông báo từ chối.', 
                                                    booking.id, 
                                                    'CANCELLED'
                                                )}
                                            >
                                                Từ chối
                                            </button>
                                        </>
                                    )}

                                    {booking.status === 'CONFIRMED' && (
                                        <>
                                            <button
                                                className="btn-view"
                                                style={ACTION_BUTTON_STYLES.startTrip}
                                                onClick={() => openStartTripModal(booking)}
                                            >
                                                Bắt đầu chuyến
                                            </button>
                                            
                                            {/* Warning if deposit not paid */}
                                            {booking.paymentStatus !== 'DEPOSIT_PAID' && booking.paymentStatus !== 'FULLY_PAID' && (
                                                <div style={{
                                                    marginTop: '8px',
                                                    padding: '10px 12px',
                                                    background: '#fef3c7',
                                                    border: '1px solid #fbbf24',
                                                    borderRadius: '8px',
                                                    fontSize: '0.85rem',
                                                    color: '#92400e',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '6px'
                                                }}>
                                                    ⚠️ <strong>Khách chưa thanh toán cọc 15%</strong>
                                                </div>
                                            )}
                                            
                                            {/* Show checkout URL if payment pending */}
                                            {booking.paymentStatus === 'PENDING_DEPOSIT' && booking.checkoutUrl && (
                                                <button
                                                    className="btn-view"
                                                    style={{ background: '#f59e0b', color: 'white', marginTop: '8px' }}
                                                    onClick={() => {
                                                        window.open(booking.checkoutUrl, '_blank')
                                                        toast.info('Đã mở link thanh toán cho khách hàng')
                                                    }}
                                                >
                                                    📧 Gửi link thanh toán
                                                </button>
                                            )}
                                        </>
                                    )}

                                    {booking.status === 'ONGOING' && !booking.returnStatus && (
                                        <>
                                            <button
                                                className="btn-view"
                                                style={ACTION_BUTTON_STYLES.completeTrip}
                                                onClick={() => openCompleteTripModal(booking)}
                                            >
                                                Hoàn thành chuyến
                                            </button>
                                            
                                            {/* Warning if full payment not completed */}
                                            {booking.paymentStatus !== 'FULLY_PAID' && (
                                                <div style={{
                                                    marginTop: '8px',
                                                    padding: '10px 12px',
                                                    background: '#fee2e2',
                                                    border: '1px solid #ef4444',
                                                    borderRadius: '8px',
                                                    fontSize: '0.85rem',
                                                    color: '#991b1b',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '6px'
                                                }}>
                                                    🚫 <strong>Khách chưa thanh toán đủ 100%</strong>
                                                </div>
                                            )}
                                            
                                            {/* Show checkout URL if full payment pending */}
                                            {booking.paymentStatus === 'PENDING_FULL_PAYMENT' && booking.checkoutUrl && (
                                                <button
                                                    className="btn-view"
                                                    style={{ background: '#f59e0b', color: 'white', marginTop: '8px' }}
                                                    onClick={() => {
                                                        window.open(booking.checkoutUrl, '_blank')
                                                        toast.info('Đã mở link thanh toán 85% còn lại')
                                                    }}
                                                >
                                                    📧 Gửi link thanh toán 85%
                                                </button>
                                            )}
                                        </>
                                    )}

                                    {booking.status === 'ONGOING' && booking.returnStatus === 'NOT_RETURNED' && (
                                        <button
                                            className="btn-view"
                                            style={{ background: '#3b82f6', color: 'white' }}
                                            onClick={() => handleReturnInspection(booking)}
                                        >
                                            Kiểm tra trả xe
                                        </button>
                                    )}

                                    {booking.returnStatus === 'DISPUTED' && (
                                        <button
                                            className="btn-view"
                                            style={{ background: '#f59e0b', color: 'white' }}
                                            onClick={() => handleOpenChat(booking)}
                                        >
                                            Mở cuộc trò chuyện
                                        </button>
                                    )}

                                    {['PENDING', 'CONFIRMED'].includes(booking.status) && (
                                        <button
                                            className="btn-cancel"
                                            onClick={() => confirmAndUpdate(
                                                'Bạn có chắc chắn muốn hủy đơn thuê này không?\n\nHành động này không thể hoàn tác!', 
                                                booking.id, 
                                                'CANCELLED'
                                            )}
                                        >
                                            Hủy đơn
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </section>

            {/* ========== Modal: Start Trip ========== */}
            {startTripModal && (
                <div className="trip-modal-overlay" onClick={closeStartTripModal}>
                    <div className="trip-modal-content modern-popup" onClick={(e) => e.stopPropagation()}>
                        <button className="trip-modal-close" onClick={closeStartTripModal} aria-label="Đóng">×</button>
                        
                        <div className="modal-header-section">
                            <h2 className="trip-modal-title">Bắt đầu chuyến đi</h2>
                            <p className="trip-modal-subtitle">
                                Ghi lại số km và mức nhiên liệu khi giao xe cho khách hàng
                            </p>
                        </div>

                        <div className="trip-modal-body">
                            <div className="trip-modal-booking-info">
                                <div>
                                    <h3>{startTripModal.vehicleName}</h3>
                                    <p className="info-renter">{startTripModal.renterName}</p>
                                    <p className="info-dates">
                                        <span>{new Date(startTripModal.startDate).toLocaleDateString('vi-VN')}</span>
                                        <span className="date-separator">→</span>
                                        <span>{new Date(startTripModal.endDate).toLocaleDateString('vi-VN')}</span>
                                    </p>
                                </div>
                            </div>

                            <div className="form-group">
                                <label className="form-label">
                                    Số km hiện tại (ODO) <span className="required">*</span>
                                </label>
                                <input
                                    type="number"
                                    className="form-input"
                                    value={startKm}
                                    onChange={(e) => setStartKm(e.target.value)}
                                    placeholder="Ví dụ: 43500"
                                />
                                <small className="form-hint">Ghi chính xác số km hiện tại trên đồng hồ xe</small>
                            </div>

                            <div className="form-group">
                                <label className="form-label">
                                    Mức nhiên liệu: <strong>{startFuelLevel}%</strong>
                                </label>
                                <input
                                    type="range"
                                    className="fuel-slider"
                                    min={FUEL_MIN}
                                    max={FUEL_MAX}
                                    value={startFuelLevel}
                                    onChange={(e) => setStartFuelLevel(toNumber(e.target.value))}
                                />
                                <div className="fuel-level-bar">
                                    <div
                                        className="fuel-level-fill"
                                        style={{ 
                                            width: `${startFuelLevel}%`,
                                            background: startFuelLevel > 50 ? '#10b981' : startFuelLevel > 25 ? '#f59e0b' : '#ef4444'
                                        }}
                                    />
                                </div>
                                <div className="fuel-level-labels">
                                    <span>0%</span>
                                    <span>25%</span>
                                    <span>50%</span>
                                    <span>75%</span>
                                    <span>100%</span>
                                </div>
                                <small className="form-hint">Điều chỉnh thanh trượt theo mức nhiên liệu thực tế</small>
                            </div>
                        </div>

                        <div className="trip-modal-footer">
                            <button className="btn-modal-cancel" onClick={closeStartTripModal}>
                                Hủy
                            </button>
                            <button
                                className="btn-modal-confirm"
                                onClick={handleStartTripConfirm}
                                disabled={!startKm || !isFuelLevelValid(startFuelLevel)}
                            >
                                Xác nhận giao xe
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ========== Modal: Complete Trip ========== */}
            {completeTripModal && (
                <div className="trip-modal-overlay" onClick={closeCompleteTripModal}>
                    <div className="trip-modal-content modern-popup large" onClick={(e) => e.stopPropagation()}>
                        <button className="trip-modal-close" onClick={closeCompleteTripModal} aria-label="Đóng">×</button>
                        
                        <div className="modal-header-section">
                            <h2 className="trip-modal-title">Hoàn thành chuyến đi</h2>
                            <p className="trip-modal-subtitle">
                                Ghi lại số km, mức nhiên liệu và tính toán các phụ phí (nếu có)
                            </p>
                        </div>

                        <div className="trip-modal-body">
                            <div className="trip-modal-booking-info">
                                <div>
                                    <h3>{completeTripModal.vehicleName}</h3>
                                    <p className="info-renter">{completeTripModal.renterName}</p>
                                    <p className="info-dates">
                                        <span>{new Date(completeTripModal.startDate).toLocaleDateString('vi-VN')}</span>
                                        <span className="date-separator">→</span>
                                        <span>{new Date(completeTripModal.endDate).toLocaleDateString('vi-VN')}</span>
                                    </p>
                                </div>
                            </div>

                            <div className="info-badge">
                                Số km lúc giao xe: <strong>{completeTripModal.startKm?.toLocaleString('vi-VN') || 'N/A'} km</strong>
                            </div>

                            <div className="form-group">
                                <label className="form-label">
                                    Số km lúc trả xe (ODO) <span className="required">*</span>
                                </label>
                                <input
                                    type="number"
                                    className="form-input"
                                    value={endKm}
                                    onChange={(e) => setEndKm(e.target.value)}
                                    placeholder="Ví dụ: 45800"
                                    min={completeTripModal.startKm || 0}
                                />
                                <small className="form-hint">Nhập số km hiện tại khi khách trả xe</small>
                            </div>

                            <div className="form-group">
                                <label className="form-label">
                                    Mức nhiên liệu lúc trả: <strong>{endFuelLevel}%</strong>
                                </label>
                                <input
                                    type="range"
                                    className="fuel-slider"
                                    min={FUEL_MIN}
                                    max={FUEL_MAX}
                                    value={endFuelLevel}
                                    onChange={(e) => setEndFuelLevel(toNumber(e.target.value))}
                                />
                                <div className="fuel-level-bar">
                                    <div
                                        className="fuel-level-fill"
                                        style={{ 
                                            width: `${endFuelLevel}%`,
                                            background: endFuelLevel > 50 ? '#10b981' : endFuelLevel > 25 ? '#f59e0b' : '#ef4444'
                                        }}
                                    />
                                </div>
                                <div className="fuel-level-labels">
                                    <span>0%</span>
                                    <span>25%</span>
                                    <span>50%</span>
                                    <span>75%</span>
                                    <span>100%</span>
                                </div>
                                <small className="form-hint">Ghi lại mức nhiên liệu còn lại khi trả xe</small>
                            </div>

                            {/* Over-KM calculation */}
                            {overKmInfo && (
                                <div className={`surcharge-box ${overKmInfo.overKm > 0 ? 'warning' : 'ok'}`}>
                                    <div className="surcharge-header">
                                        <span>Tính toán quãng đường đã đi</span>
                                    </div>
                                    <div className="surcharge-details">
                                        <p><span>Đã đi:</span> <strong>{overKmInfo.drivenKm.toLocaleString('vi-VN')} km</strong></p>
                                        <p><span>Định mức cho phép:</span> <strong>{overKmInfo.allowedKm.toLocaleString('vi-VN')} km</strong> <small>({overKmInfo.rentalDays} ngày × 300km)</small></p>
                                        {overKmInfo.overKm > 0 ? (
                                            <p className="surcharge-amount">
                                                Vượt quá <strong>{overKmInfo.overKm.toLocaleString('vi-VN')} km</strong> × 5.000 VNĐ/km = <strong>{formatVndCurrency(overKmInfo.overKmFee)}</strong>
                                            </p>
                                        ) : (
                                            <p className="surcharge-ok">Trong giới hạn cho phép - Không phụ phí</p>
                                        )}
                                    </div>
                                </div>
                            )}

                            <div className="form-group">
                                <label className="form-label">
                                    Phụ phí khác (VNĐ)
                                </label>
                                <input
                                    type="number"
                                    className="form-input"
                                    value={otherSurcharge}
                                    onChange={(e) => setOtherSurcharge(e.target.value)}
                                    placeholder="Ví dụ: 200000"
                                    min="0"
                                />
                                <small className="form-hint">Nhập 0 hoặc để trống nếu không có phụ phí bổ sung (đơn vị: VNĐ)</small>
                            </div>

                            <div className="form-group">
                                <label className="form-label">
                                    Ghi chú tình trạng xe
                                </label>
                                <textarea
                                    className="form-textarea"
                                    value={returnNotes}
                                    onChange={(e) => setReturnNotes(e.target.value)}
                                    placeholder="Ví dụ: Xe trả về trong tình trạng tốt, không có vấn đề gì..."
                                    rows={3}
                                />
                                <small className="form-hint">Ghi chú chi tiết về tình trạng xe khi trả (nếu có)</small>
                            </div>

                            {/* Total surcharge */}
                            <div className="total-surcharge-box">
                                <div className="total-info">
                                    <span className="total-label">Tổng phụ phí cần thu</span>
                                    <span className="total-amount">{formatVndCurrency(totalSurcharge)}</span>
                                </div>
                            </div>
                        </div>

                        <div className="trip-modal-footer">
                            <button className="btn-modal-cancel" onClick={closeCompleteTripModal}>
                                Huỷ
                            </button>
                            <button 
                                className="btn-modal-confirm complete" 
                                onClick={submitCompleteTrip}
                                disabled={!endKm || !isFuelLevelValid(endFuelLevel)}
                            >
                                Xác nhận trả xe
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {showReturnModal && selectedBooking && (
                <ReturnInspectionModal
                    booking={selectedBooking}
                    onClose={() => {
                        setShowReturnModal(false)
                        setSelectedBooking(null)
                    }}
                    onSuccess={() => {
                        fetchRentals()
                    }}
                />
            )}

            {showChatModal && selectedBooking && (
                <DisputeChatModal
                    booking={selectedBooking}
                    isOwner={true}
                    onClose={() => {
                        setShowChatModal(false)
                        setSelectedBooking(null)
                    }}
                    onResolved={() => {
                        fetchRentals()
                    }}
                />
            )}
        </div>
    )
}

export default ManageRentals
