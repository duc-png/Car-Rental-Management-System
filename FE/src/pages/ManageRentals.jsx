import { useState, useEffect, useMemo } from 'react'
import { toast } from 'sonner'
import { getMyBookings, updateBookingStatus } from '../api/bookings'
import { useAuth } from '../hooks/useAuth'
import '../styles/MyBookings.css'
import '../styles/TripModal.css'

function ManageRentals() {
    const [rentals, setRentals] = useState([])
    const [loading, setLoading] = useState(true)
    const { user } = useAuth()

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

    useEffect(() => {
        if (user) {
            fetchRentals()
        }
    }, [user])

    const fetchRentals = async () => {
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
    }

    const handleStatusUpdate = async (bookingId, newStatus, extraData = {}) => {
        try {
            await updateBookingStatus(bookingId, newStatus, extraData)
            toast.success(`Booking updated to ${newStatus}`)
            fetchRentals()
        } catch (error) {
            console.error('Update failed:', error)
            toast.error('Failed to update booking status')
        }
    }

    // ========== Start Trip Modal ==========
    const openStartTripModal = (booking) => {
        setStartKm(booking.startKm || '')
        setStartFuelLevel(booking.startFuelLevel || 100)
        setStartTripModal(booking)
    }

    const submitStartTrip = async () => {
        if (!startKm || startKm <= 0) {
            toast.error('Vui lòng nhập số Km hợp lệ')
            return
        }
        if (!startFuelLevel || startFuelLevel < 0 || startFuelLevel > 100) {
            toast.error('Mức nhiên liệu phải từ 0% đến 100%')
            return
        }
        await handleStatusUpdate(startTripModal.id, 'ONGOING', {
            startKm: parseInt(startKm),
            startFuelLevel: parseInt(startFuelLevel),
        })
        setStartTripModal(null)
    }

    // ========== Complete Trip Modal ==========
    const openCompleteTripModal = (booking) => {
        setEndKm(booking.startKm || '')
        setEndFuelLevel(100)
        setOtherSurcharge('')
        setReturnNotes('')
        // Default actual return time = now (formatted for datetime-local input)
        const now = new Date()
        const pad = (n) => String(n).padStart(2, '0')
        const localNow = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}`
        setActualReturnTime(localNow)
        setCompleteTripModal(booking)
    }

    // Calculate surcharge in real-time
    const overKmInfo = useMemo(() => {
        if (!completeTripModal || !completeTripModal.startKm || !endKm) return null

        const startDate = new Date(completeTripModal.startDate)
        const endDate = new Date(completeTripModal.endDate)
        const rentalDays = Math.max(1, Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)))
        const allowedKm = rentalDays * 300
        const drivenKm = parseInt(endKm) - completeTripModal.startKm
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

    const submitCompleteTtrip = async () => {
        if (!endKm || endKm <= 0) {
            toast.error('Vui lòng nhập số Km lúc trả xe')
            return
        }
        if (completeTripModal.startKm && parseInt(endKm) < completeTripModal.startKm) {
            toast.error('Số Km trả xe không thể nhỏ hơn số Km lúc giao xe')
            return
        }
        if (!endFuelLevel || endFuelLevel < 0 || endFuelLevel > 100) {
            toast.error('Mức nhiên liệu phải từ 0% đến 100%')
            return
        }

        await handleStatusUpdate(completeTripModal.id, 'COMPLETED', {
            endKm: parseInt(endKm),
            endFuelLevel: parseInt(endFuelLevel),
            otherSurcharge: parseFloat(otherSurcharge) || 0,
            returnNotes: returnNotes || null,
            actualReturnTime: actualReturnTime ? new Date(actualReturnTime).toISOString().slice(0, 19) : null,
        })
        setCompleteTripModal(null)
    }

    const getStatusColor = (status) => {
        switch (status) {
            case 'PENDING': return 'pending'
            case 'CONFIRMED': return 'confirmed'
            case 'ONGOING': return 'ongoing'
            case 'COMPLETED': return 'completed'
            case 'CANCELLED': return 'cancelled'
            default: return ''
        }
    }

    const formatVND = (amount) => {
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount)
    }

    if (loading) {
        return (
            <div className="bookings-page">
                <div className="bookings-loading">
                    <div className="loading-spinner"></div>
                    <p>Loading your rentals...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="bookings-page">
            <div className="bookings-header">
                <h1>Rental Management</h1>
                <p>Manage incoming booking requests for your vehicles.</p>
            </div>

            <div className="bookings-list">
                {rentals.length === 0 ? (
                    <div className="empty-state">
                        <div className="empty-icon">📂</div>
                        <h3>No rental requests yet</h3>
                        <p>Once users book your cars, they will appear here.</p>
                    </div>
                ) : (
                    rentals.map((booking) => (
                        <div key={booking.id} className={`booking-card ${getStatusColor(booking.status)}`}>
                            {/* Left: Image */}
                            <div className="booking-image">
                                <img
                                    src={booking.vehicleImage || '/placeholder.svg'}
                                    alt={booking.vehicleName || `Vehicle #${booking.vehicleId}`}
                                />
                            </div>

                            {/* Middle: Info */}
                            <div className="booking-details">
                                <h3>{booking.vehicleName}</h3>
                                <div className="booking-info">
                                    <p><strong>Renter:</strong> {booking.renterName} ({booking.renterEmail})</p>
                                    <p><strong>Dates:</strong> {new Date(booking.startDate).toLocaleDateString()} - {new Date(booking.endDate).toLocaleDateString()}</p>
                                    <p><strong>Total:</strong> {formatVND(booking.totalPrice)}</p>
                                    {booking.paymentStatus && (
                                        <p><strong>Payment:</strong> {booking.paymentStatus}</p>
                                    )}
                                    {/* Show ODO/Fuel info if available */}
                                    {booking.startKm && (
                                        <p><strong>ODO giao:</strong> {booking.startKm.toLocaleString()} km | Xăng: {booking.startFuelLevel}%</p>
                                    )}
                                    {booking.endKm && (
                                        <p><strong>ODO trả:</strong> {booking.endKm.toLocaleString()} km | Xăng: {booking.endFuelLevel}%</p>
                                    )}
                                    {booking.surchargeAmount > 0 && (
                                        <p><strong>Phụ phí:</strong> {formatVND(booking.surchargeAmount)}</p>
                                    )}
                                    {booking.returnNotes && (
                                        <p><strong>Ghi chú:</strong> {booking.returnNotes}</p>
                                    )}
                                    <div className="booking-status">
                                        <span className={`status-badge ${getStatusColor(booking.status)}`}>
                                            {booking.status}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Right: Actions */}
                            <div className="booking-actions">
                                {booking.status === 'PENDING' && (
                                    <>
                                        <button
                                            className="btn-view"
                                            style={{ background: '#10b981', color: 'white' }}
                                            onClick={() => {
                                                if (confirm('Xác nhận duyệt đơn?')) handleStatusUpdate(booking.id, 'CONFIRMED')
                                            }}
                                        >
                                            ✅ Confirm
                                        </button>
                                        <button
                                            className="btn-cancel"
                                            onClick={() => {
                                                if (confirm('Từ chối đơn này?')) handleStatusUpdate(booking.id, 'CANCELLED')
                                            }}
                                        >
                                            ❌ Reject
                                        </button>
                                    </>
                                )}

                                {booking.status === 'CONFIRMED' && (
                                    <>
                                        <button
                                            className="btn-view"
                                            style={{ background: '#8b5cf6', color: 'white' }}
                                            onClick={() => openStartTripModal(booking)}
                                        >
                                            🚗 Start Trip
                                        </button>
                                        <button
                                            className="btn-cancel"
                                            onClick={() => {
                                                if (confirm('Huỷ đơn này?')) handleStatusUpdate(booking.id, 'CANCELLED')
                                            }}
                                        >
                                            Cancel
                                        </button>
                                    </>
                                )}

                                {booking.status === 'ONGOING' && (
                                    <button
                                        className="btn-view"
                                        style={{ background: '#3b82f6', color: 'white' }}
                                        onClick={() => openCompleteTripModal(booking)}
                                    >
                                        🏁 Complete Trip
                                    </button>
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* ========== START TRIP MODAL ========== */}
            {startTripModal && (
                <div className="trip-modal-overlay" onClick={() => setStartTripModal(null)}>
                    <div className="trip-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="trip-modal-header start">
                            <h2>🚗 Giao xe - Bắt đầu chuyến đi</h2>
                            <p>{startTripModal.vehicleName} → {startTripModal.renterName}</p>
                        </div>

                        <div className="trip-modal-body">
                            <div className="form-group">
                                <label>Số Km hiện tại (ODO)</label>
                                <input
                                    type="number"
                                    value={startKm}
                                    onChange={(e) => setStartKm(e.target.value)}
                                    placeholder="Ví dụ: 45000"
                                    min="0"
                                />
                            </div>

                            <div className="form-group">
                                <label>Mức nhiên liệu (%)</label>
                                <div className="fuel-input-row">
                                    <input
                                        type="range"
                                        min="0"
                                        max="100"
                                        step="5"
                                        value={startFuelLevel}
                                        onChange={(e) => setStartFuelLevel(e.target.value)}
                                    />
                                    <span className="fuel-value">{startFuelLevel}%</span>
                                </div>
                                <div className="fuel-bar">
                                    <div className="fuel-bar-fill" style={{ width: `${startFuelLevel}%` }}></div>
                                </div>
                            </div>
                        </div>

                        <div className="trip-modal-footer">
                            <button className="btn-modal-cancel" onClick={() => setStartTripModal(null)}>
                                Huỷ
                            </button>
                            <button className="btn-modal-confirm start" onClick={submitStartTrip}>
                                Xác nhận giao xe
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ========== COMPLETE TRIP MODAL ========== */}
            {completeTripModal && (
                <div className="trip-modal-overlay" onClick={() => setCompleteTripModal(null)}>
                    <div className="trip-modal complete" onClick={(e) => e.stopPropagation()}>
                        <div className="trip-modal-header complete">
                            <h2>🏁 Trả xe - Hoàn thành chuyến đi</h2>
                            <p>{completeTripModal.vehicleName} ← {completeTripModal.renterName}</p>
                        </div>

                        <div className="trip-modal-body">
                            {/* Info box */}
                            <div className="trip-info-box">
                                <div className="info-item">
                                    <span className="info-label">ODO lúc giao</span>
                                    <span className="info-value">{completeTripModal.startKm?.toLocaleString() || '—'} km</span>
                                </div>
                                <div className="info-item">
                                    <span className="info-label">Xăng lúc giao</span>
                                    <span className="info-value">{completeTripModal.startFuelLevel ?? '—'}%</span>
                                </div>
                                <div className="info-item">
                                    <span className="info-label">Định mức Km</span>
                                    <span className="info-value">{overKmInfo ? `${overKmInfo.allowedKm.toLocaleString()} km (${overKmInfo.rentalDays} ngày × 300km)` : '—'}</span>
                                </div>
                            </div>

                            <div className="form-group">
                                <label>Số Km lúc trả xe (ODO)</label>
                                <input
                                    type="number"
                                    value={endKm}
                                    onChange={(e) => setEndKm(e.target.value)}
                                    placeholder="Ví dụ: 45800"
                                    min={completeTripModal.startKm || 0}
                                />
                            </div>

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

                            {/* Over-KM calculation */}
                            {overKmInfo && (
                                <div className={`surcharge-box ${overKmInfo.overKm > 0 ? 'warning' : 'ok'}`}>
                                    <p><strong>Đã đi:</strong> {overKmInfo.drivenKm.toLocaleString()} km</p>
                                    <p><strong>Định mức:</strong> {overKmInfo.allowedKm.toLocaleString()} km</p>
                                    {overKmInfo.overKm > 0 ? (
                                        <p className="surcharge-amount">
                                            ⚠️ Lố <strong>{overKmInfo.overKm.toLocaleString()} km</strong> × 5.000đ = <strong>{formatVND(overKmInfo.overKmFee)}</strong>
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
                                            🕐 Trả muộn <strong>{lateReturnInfo.lateHours} giờ</strong> × 10% × {formatVND(completeTripModal.pricePerDay || 0)}/ngày = <strong>{formatVND(lateReturnInfo.fee)}</strong>
                                        </p>
                                    ) : (
                                        <p className="surcharge-amount">
                                            🕐 Trả muộn <strong>{lateReturnInfo.lateDays} ngày</strong> × 150% × {formatVND(completeTripModal.pricePerDay || 0)}/ngày = <strong>{formatVND(lateReturnInfo.fee)}</strong>
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
                                <span className="total-amount">{formatVND(totalSurcharge)}</span>
                            </div>
                        </div>

                        <div className="trip-modal-footer">
                            <button className="btn-modal-cancel" onClick={() => setCompleteTripModal(null)}>
                                Huỷ
                            </button>
                            <button className="btn-modal-confirm complete" onClick={submitCompleteTtrip}>
                                Xác nhận trả xe
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

export default ManageRentals
