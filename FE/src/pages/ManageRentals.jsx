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
    const navigate = useNavigate()
>>>>>>> duong

    const handleLogout = async () => {
        await logout()
        navigate('/login')
    }

    // Modal states
    const [startTripModal, setStartTripModal] = useState(null) // booking object or null
    const [completeTripModal, setCompleteTripModal] = useState(null) // booking object or null

    // Start Trip form
    const [startKm, setStartKm] = useState('')
    const [startFuelLevel, setStartFuelLevel] = useState('')

    // Complete Trip form
    const [endKm, setEndKm] = useState('')
    const [endFuelLevel, setEndFuelLevel] = useState('')
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

    const confirmAndUpdate = (message, bookingId, status) => {
        if (window.confirm(message)) {
            handleStatusUpdate(bookingId, status)
        }
    }

    // ========== Start Trip Modal ==========
    const openStartTripModal = (booking) => {
        setStartKm(booking.startKm || '')
        setStartFuelLevel(booking.startFuelLevel || FUEL_MAX)
        setStartTripModal(booking)
    }

    const submitStartTrip = async () => {
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
        setEndKm(booking.startKm || '')
        setEndFuelLevel(FUEL_MAX)
        setOtherSurcharge('')
        setReturnNotes('')
        setActualReturnTime(getCurrentDateTimeLocal())
        setCompleteTripModal(booking)
    }

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
            otherSurcharge: parsedOtherSurcharge,
            returnNotes: returnNotes || null,
            actualReturnTime: actualReturnTime ? new Date(actualReturnTime).toISOString().slice(0, 19) : null,
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
                                    <p><strong>Renter:</strong> {booking.renterName || 'N/A'} {booking.renterEmail && `(${booking.renterEmail})`}</p>
                                    <p><strong>Dates:</strong> {booking.startDate ? new Date(booking.startDate).toLocaleDateString() : 'N/A'} - {booking.endDate ? new Date(booking.endDate).toLocaleDateString() : 'N/A'}</p>
                                    <p><strong>Total:</strong> ${(booking.totalPrice || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                                    
                                    {booking.totalAdditionalFees > 0 && (
                                        <p><strong>Extra Fees:</strong> <span style={{color: '#f87171', fontWeight: 600}}>+${booking.totalAdditionalFees.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span></p>
                                    )}
                                    
                                    <div className="booking-status">
                                        <span className={`status-badge ${getStatusColor(booking.status)}`}>
                                            {booking.status}
                                        </span>
                                        {getReturnStatusLabel(booking.returnStatus) && (
                                            <span 
                                                className="status-badge" 
                                                style={{ 
                                                    background: getReturnStatusColor(booking.returnStatus)
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
                                            style={{ background: '#10b981', color: 'white' }}
                                            onClick={() => handleStatusUpdate(booking.id, 'CONFIRMED')}
                                        >
                                            Confirm
                                        </button>
                                        <button
                                            className="btn-cancel"
                                            onClick={() => handleStatusUpdate(booking.id, 'CANCELLED')}
                                        >
                                            Reject
                                        </button>
                                    </>
                                )}

                            <div className="form-group">
                                <label>Mức nhiên liệu lúc trả (%)</label>
                                <div className="fuel-input-row">
                                    <input
                                        type="range"
                                        min="0"
                                        max="100"
                                        step="5"
                                        value={endFuelLevel}
                                        onChange={(e) => setEndFuelLevel(e.target.value)}
                                    />
                                    <span className="fuel-value">{endFuelLevel}%</span>
                                </div>
                                <div className="fuel-bar">
                                    <div className="fuel-bar-fill" style={{ width: `${endFuelLevel}%` }}></div>
                                </div>
                            </div>

<<<<<<< HEAD
                            {/* Over-KM calculation */}
                            {overKmInfo && (
                                <div className={`surcharge-box ${overKmInfo.overKm > 0 ? 'warning' : 'ok'}`}>
                                    <p><strong>Đã đi:</strong> {overKmInfo.drivenKm.toLocaleString()} km</p>
                                    <p><strong>Định mức:</strong> {overKmInfo.allowedKm.toLocaleString()} km</p>
                                    {overKmInfo.overKm > 0 ? (
                                        <p className="surcharge-amount">
                                            ⚠️ Lố <strong>{overKmInfo.overKm.toLocaleString()} km</strong> × 5.000đ = <strong>{formatVndCurrency(overKmInfo.overKmFee)}</strong>
                                        </p>
                                    ) : (
                                        <p className="surcharge-ok">✅ Trong giới hạn cho phép</p>
                                    )}
                                </div>
                            )}

                            <div className="form-group">
                                <label>⏰ Thời gian trả xe thực tế</label>
                                <div style={{ fontSize: '0.8rem', color: '#888', marginBottom: '4px' }}>
                                    Dự kiến: {completeTripModal && new Date(completeTripModal.endDate).toLocaleString('vi-VN')}
                                </div>
                                <input
                                    type="datetime-local"
                                    value={actualReturnTime}
                                    onChange={(e) => setActualReturnTime(e.target.value)}
                                />
                            </div>

                            {/* Late return warning */}
                            {lateReturnInfo && (
                                <div className="surcharge-box warning">
                                    {lateReturnInfo.type === 'hourly' ? (
                                        <p className="surcharge-amount">
                                            🕐 Trả muộn <strong>{lateReturnInfo.lateHours} giờ</strong> × 10% × {formatVndCurrency(completeTripModal.pricePerDay || 0)}/ngày = <strong>{formatVndCurrency(lateReturnInfo.fee)}</strong>
                                        </p>
                                    ) : (
                                        <p className="surcharge-amount">
                                            🕐 Trả muộn <strong>{lateReturnInfo.lateDays} ngày</strong> × 150% × {formatVndCurrency(completeTripModal.pricePerDay || 0)}/ngày = <strong>{formatVndCurrency(lateReturnInfo.fee)}</strong>
                                        </p>
                                    )}
                                </div>
                            )}

                            <div className="form-group">
                                <label>Phụ phí khác (VNĐ) - trầy xước, dọn vệ sinh...</label>
                                <input
                                    type="number"
                                    value={otherSurcharge}
                                    onChange={(e) => setOtherSurcharge(e.target.value)}
                                    placeholder="0"
                                    min="0"
                                />
                            </div>

                            <div className="form-group">
                                <label>Ghi chú tình trạng xe</label>
                                <textarea
                                    value={returnNotes}
                                    onChange={(e) => setReturnNotes(e.target.value)}
                                    placeholder="Ví dụ: Xe bình thường, không trầy xước..."
                                    rows={3}
                                />
                            </div>

                            {/* Total surcharge */}
                            <div className="total-surcharge-box">
                                <span>Tổng phụ phí</span>
                                <span className="total-amount">{formatVndCurrency(totalSurcharge)}</span>
                            </div>
                        </div>

                        <div className="trip-modal-footer">
                            <button className="btn-modal-cancel" onClick={() => setCompleteTripModal(null)}>
                                Huỷ
                            </button>
                            <button className="btn-modal-confirm complete" onClick={submitCompleteTrip}>
                                Xác nhận trả xe
                            </button>
                        </div>
                    </div>
                </div>
=======
                                {booking.status === 'ONGOING' && booking.returnStatus === 'NOT_RETURNED' && (
                                    <button
                                        className="btn-view"
                                        style={{ background: '#3b82f6', color: 'white' }}
                                        onClick={() => handleReturnInspection(booking)}
                                    >
                                        Return Inspection
                                    </button>
                                )}

                                {booking.returnStatus === 'DISPUTED' && (
                                    <button
                                        className="btn-view"
                                        style={{ background: '#f59e0b', color: 'white' }}
                                        onClick={() => handleOpenChat(booking)}
                                    >
                                        Open Chat
                                    </button>
                                )}

                                {['PENDING', 'CONFIRMED'].includes(booking.status) && (
                                    <button
                                        className="btn-cancel"
                                        onClick={() => handleStatusUpdate(booking.id, 'CANCELLED')}
                                    >
                                        Cancel
                                    </button>
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>

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
>>>>>>> duong
            )}
        </div>
    )
}

export default ManageRentals
