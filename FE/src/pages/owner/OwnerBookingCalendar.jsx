import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { DayPicker } from 'react-day-picker'
import { toast } from 'sonner'
import FleetSidebar from '../../components/owner/fleet/FleetSidebar'
import DashboardNotificationBell from '../../components/layout/DashboardNotificationBell'
import { useAuth } from '../../hooks/useAuth'
import { listOwnerVehicles } from '../../api/ownerVehicles'
import { getOwnerBookingCalendar } from '../../api/bookings'
import { getBookingStatusLabel } from '../../utils/bookingUtils'
import 'react-day-picker/dist/style.css'
import '../../styles/OwnerBookingCalendar.css'
const startOfMonth = (date) => new Date(date.getFullYear(), date.getMonth(), 1, 0, 0, 0)
const endOfMonth = (date) => new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59)
const formatDateTime = (value) => {
    if (!value) return '--'
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return '--'
    return date.toLocaleString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    })
}
const expandDateRange = (startDate, endDate) => {
    const dates = []
    const current = new Date(startDate)
    current.setHours(0, 0, 0, 0)
    const end = new Date(endDate)
    end.setHours(0, 0, 0, 0)
    while (current <= end) {
        dates.push(new Date(current))
        current.setDate(current.getDate() + 1)
    }
    return dates
}
function OwnerBookingCalendar() {
    const navigate = useNavigate()
    const { user, isAuthenticated, logout } = useAuth()
    const canManage = Boolean(user?.role?.includes('ROLE_CAR_OWNER') || user?.role?.includes('ROLE_ADMIN'))
    const ownerId = Number(user?.userId || user?.id)
    const [loading, setLoading] = useState(true)
    const [month, setMonth] = useState(new Date())
    const [vehicles, setVehicles] = useState([])
    const [selectedVehicleId, setSelectedVehicleId] = useState('all')
    const [calendarEvents, setCalendarEvents] = useState([])
    const monthLabel = useMemo(() => month.toLocaleDateString('vi-VN', {
        month: 'long',
        year: 'numeric',
    }), [month])
    const fetchCalendar = useCallback(async () => {
        if (!ownerId) return
        setLoading(true)
        try {
            const vehicleList = await listOwnerVehicles(ownerId)
            const approvedVehicles = Array.isArray(vehicleList)
                ? vehicleList.filter((vehicle) => String(vehicle?.status || '').toUpperCase() !== 'REJECTED')
                : []
            setVehicles(approvedVehicles)
            const filteredVehicles = selectedVehicleId === 'all'
                ? approvedVehicles
                : approvedVehicles.filter((vehicle) => Number(vehicle.id) === Number(selectedVehicleId))
            if (filteredVehicles.length === 0) {
                setCalendarEvents([])
                return
            }
            const from = startOfMonth(month)
            const to = endOfMonth(month)
            const selectedId = selectedVehicleId === 'all' ? null : Number(selectedVehicleId)
            const merged = await getOwnerBookingCalendar(from, to, selectedId)
            merged.sort((a, b) => {
                const aTime = new Date(a.startDate).getTime()
                const bTime = new Date(b.startDate).getTime()
                return aTime - bTime
            })
            setCalendarEvents(merged)
        } catch (error) {
            console.error('Failed to load owner booking calendar:', error)
            toast.error(error?.message || 'Không thể tải lịch booking')
            setCalendarEvents([])
        } finally {
            setLoading(false)
        }
    }, [month, ownerId, selectedVehicleId])
    useEffect(() => {
        if (!user) return
        fetchCalendar()
    }, [user, fetchCalendar])
    const dateModifiers = useMemo(() => {
        const byStatus = {
            confirmed: [],
            ongoing: [],
            completed: [],
        }
        calendarEvents.forEach((event) => {
            const expanded = expandDateRange(event.startDate, event.endDate)
            if (event.status === 'CONFIRMED') {
                byStatus.confirmed.push(...expanded)
            }
            if (event.status === 'ONGOING') {
                byStatus.ongoing.push(...expanded)
            }
            if (event.status === 'COMPLETED') {
                byStatus.completed.push(...expanded)
            }
        })
        return byStatus
    }, [calendarEvents])
    const handleLogout = async () => {
        await logout()
        navigate('/login')
    }
    const goPrevMonth = () => {
        setMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1))
    }
    const goNextMonth = () => {
        setMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1))
    }
    if (!isAuthenticated) {
        return (
            <div className="fleet-guard">
                <h2>Cần đăng nhập để tiếp tục</h2>
                <p>Vui lòng đăng nhập bằng tài khoản chủ xe để xem lịch booking.</p>
                <Link to="/login" className="add-vehicle">Đăng nhập ngay</Link>
            </div>
        )
    }
    if (!canManage) {
        return (
            <div className="fleet-guard">
                <h2>Không đủ quyền truy cập</h2>
                <p>Tài khoản hiện tại không có quyền xem lịch booking của chủ xe.</p>
                <Link to="/" className="add-vehicle">Quay lại trang chủ</Link>
            </div>
        )
    }
    return (
        <div className="fleet-dashboard owner-calendar-page">
            <FleetSidebar user={user} onLogout={handleLogout} />
            <section className="fleet-main">
                <header className="fleet-header">
                    <div>
                        <p className="fleet-breadcrumb">Chủ xe</p>
                        <h1>Lịch xe đã đặt thành công</h1>
                        <p>Theo dõi các mốc thời gian xe đã được xác nhận thuê.</p>
                    </div>
                    <div className="fleet-header-actions">
                        <DashboardNotificationBell />
                    </div>
                </header>
                <section className="owner-calendar-toolbar">
                    <div className="toolbar-group">
                        <label htmlFor="vehicle-filter">Xe</label>
                        <select
                            id="vehicle-filter"
                            value={selectedVehicleId}
                            onChange={(event) => setSelectedVehicleId(event.target.value)}
                        >
                            <option value="all">Tất cả xe</option>
                            {vehicles.map((vehicle) => (
                                <option key={vehicle.id} value={vehicle.id}>
                                    {`${vehicle.brandName || ''} ${vehicle.modelName || ''}`.trim() || `Xe #${vehicle.id}`}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="toolbar-group month-switcher">
                        <button type="button" onClick={goPrevMonth}>Tháng trước</button>
                        <strong>{monthLabel}</strong>
                        <button type="button" onClick={goNextMonth}>Tháng sau</button>
                    </div>
                </section>
                {loading ? (
                    <div className="owner-calendar-loading">
                        <div className="loading-spinner"></div>
                        <p>Đang tải lịch booking...</p>
                    </div>
                ) : (
                    <div className="owner-calendar-grid">
                        <div className="owner-calendar-card">
                            <DayPicker
                                month={month}
                                onMonthChange={setMonth}
                                className="owner-booking-calendar"
                                modifiers={{
                                    confirmed: dateModifiers.confirmed,
                                    ongoing: dateModifiers.ongoing,
                                    completed: dateModifiers.completed,
                                }}
                                modifiersClassNames={{
                                    confirmed: 'calendar-day-confirmed',
                                    ongoing: 'calendar-day-ongoing',
                                    completed: 'calendar-day-completed',
                                }}
                                showOutsideDays
                            />
                            <div className="calendar-legend">
                                <span className="dot confirmed"></span>
                                <span>Đã duyệt</span>
                                <span className="dot ongoing"></span>
                                <span>Đang thuê</span>
                                <span className="dot completed"></span>
                                <span>Hoàn tất</span>
                            </div>
                        </div>
                        <div className="owner-calendar-events">
                            <h3>Danh sách booking trong tháng</h3>
                            {calendarEvents.length === 0 ? (
                                <p className="empty-events">Không có booking thành công trong tháng này.</p>
                            ) : (
                                <div className="events-list">
                                    {calendarEvents.map((event) => (
                                        <article key={`${event.vehicleId}-${event.bookingId}`} className="event-card">
                                            <header>
                                                <strong>{event.vehicleName}</strong>
                                                <span className={`status-pill ${String(event.status || '').toLowerCase()}`}>
                                                    {getBookingStatusLabel(event.status)}
                                                </span>
                                            </header>
                                            <p>
                                                <b>Nhận xe:</b> {formatDateTime(event.startDate)}
                                            </p>
                                            <p>
                                                <b>Trả xe:</b> {formatDateTime(event.endDate)}
                                            </p>
                                            <p>
                                                <b>Mã đơn:</b> #{event.bookingId}
                                            </p>
                                            <div className="event-actions">
                                                <button type="button" onClick={() => navigate('/manage-rentals')}>
                                                    Mở trang Đơn thuê
                                                </button>
                                            </div>
                                        </article>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </section>
        </div>
    )
}
export default OwnerBookingCalendar
