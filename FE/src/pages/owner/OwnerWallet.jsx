import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { getMyBookings } from '../../api/bookings'
import FleetSidebar from '../../components/owner/fleet/FleetSidebar'
import DashboardNotificationBell from '../../components/layout/DashboardNotificationBell'
import { useAuth } from '../../hooks/useAuth'
import { getBookingStatusLabel } from '../../utils/bookingUtils'
import '../../styles/OwnerWallet.css'

const PAID_STATUSES = new Set(['FULLY_PAID'])
const DEPOSIT_STATUSES = new Set(['DEPOSIT_PAID', 'PENDING_FULL_PAYMENT'])
const SERVICE_FEE_RATE = 0.1

const PERIOD_OPTIONS = [
    { value: 'thisMonth', label: 'Tháng này' },
    { value: 'lastMonth', label: 'Tháng trước' },
    { value: 'thisQuarter', label: 'Quý này' },
]

const sortByCreatedAtDesc = (a, b) => {
    const aTime = new Date(a?.createdAt || 0).getTime()
    const bTime = new Date(b?.createdAt || 0).getTime()
    return bTime - aTime
}

const toNumber = (value) => {
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : 0
}

const formatCompactCurrency = (value) => {
    const amount = toNumber(value)
    return `${new Intl.NumberFormat('vi-VN').format(amount)}đ`
}

const getPeriodLabel = (period, currentDate) => {
    if (period === 'thisMonth') {
        return `Tháng này (${currentDate.toLocaleDateString('vi-VN', { month: '2-digit', year: 'numeric' })})`
    }
    if (period === 'lastMonth') {
        const lastMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1)
        return `Tháng trước (${lastMonth.toLocaleDateString('vi-VN', { month: '2-digit', year: 'numeric' })})`
    }
    return `Quý này (Q${Math.floor(currentDate.getMonth() / 3) + 1}/${currentDate.getFullYear()})`
}

const isInPeriod = (dateInput, period, now) => {
    const date = new Date(dateInput)
    if (Number.isNaN(date.getTime())) return false

    if (period === 'thisMonth') {
        return date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth()
    }

    if (period === 'lastMonth') {
        const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
        return date.getFullYear() === lastMonth.getFullYear() && date.getMonth() === lastMonth.getMonth()
    }

    const currentQuarter = Math.floor(now.getMonth() / 3)
    const dateQuarter = Math.floor(date.getMonth() / 3)
    return date.getFullYear() === now.getFullYear() && dateQuarter === currentQuarter
}

const paymentMethodLabel = (paymentStatus) => {
    const status = String(paymentStatus || '').toUpperCase()
    if (status === 'FULLY_PAID' || status === 'PENDING_FULL_PAYMENT') return 'Thanh toán đầy đủ'
    if (status === 'DEPOSIT_PAID' || status === 'PENDING_DEPOSIT') return 'Thanh toán cọc'
    return 'Chưa thanh toán'
}

const resolveReceivedAmount = (booking) => {
    const totalPrice = toNumber(booking?.totalPrice)
    const surcharge = toNumber(booking?.surchargeAmount)
    const deposit = toNumber(booking?.depositAmount)
    const paymentStatus = String(booking?.paymentStatus || '').toUpperCase()

    if (PAID_STATUSES.has(paymentStatus)) {
        return totalPrice + surcharge
    }

    if (DEPOSIT_STATUSES.has(paymentStatus)) {
        return deposit
    }

    return 0
}

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

function OwnerWallet() {
    const navigate = useNavigate()
    const { user, isAuthenticated, logout } = useAuth()

    const [loading, setLoading] = useState(true)
    const [bookings, setBookings] = useState([])
    const [period, setPeriod] = useState('thisMonth')
    const [searchTerm, setSearchTerm] = useState('')

    const canManage = Boolean(user?.role?.includes('ROLE_CAR_OWNER') || user?.role?.includes('ROLE_ADMIN'))
    const ownerId = Number(user?.userId || user?.id)

    const handleLogout = async () => {
        await logout()
        navigate('/login')
    }

    useEffect(() => {
        if (!user || !canManage) return

        let mounted = true
        const run = async () => {
            setLoading(true)
            try {
                const allBookings = await getMyBookings()
                const ownerBookings = (Array.isArray(allBookings) ? allBookings : [])
                    .filter((booking) => Number(booking?.ownerId) === ownerId)
                    .sort(sortByCreatedAtDesc)

                if (!mounted) return
                setBookings(ownerBookings)
            } catch (error) {
                if (!mounted) return
                toast.error(error?.message || 'Không thể tải dữ liệu ví chủ xe')
                setBookings([])
            } finally {
                if (mounted) {
                    setLoading(false)
                }
            }
        }

        run()

        return () => {
            mounted = false
        }
    }, [canManage, ownerId, user])

    const walletSummary = useMemo(() => {
        const now = new Date()
        const periodBookings = bookings.filter((booking) => isInPeriod(booking.updatedAt || booking.createdAt, period, now))

        const totalReceived = periodBookings.reduce((sum, booking) => sum + resolveReceivedAmount(booking), 0)

        const totalPending = periodBookings.reduce((sum, booking) => {
            const paymentStatus = String(booking?.paymentStatus || '').toUpperCase()
            if (paymentStatus === 'UNPAID' || paymentStatus === 'PENDING_DEPOSIT') {
                return sum + toNumber(booking?.depositAmount || booking?.totalPrice)
            }
            return sum
        }, 0)

        const serviceFee = Math.round(totalReceived * SERVICE_FEE_RATE)
        const walletBalance = Math.max(0, totalReceived - serviceFee)

        const completedTrips = periodBookings.filter((booking) => String(booking?.status || '').toUpperCase() === 'COMPLETED').length
        const successfulTrips = periodBookings.filter((booking) => ['CONFIRMED', 'ONGOING', 'COMPLETED'].includes(String(booking?.status || '').toUpperCase())).length
        const responseRate = periodBookings.length > 0 ? Math.round((successfulTrips / periodBookings.length) * 100) : 0
        const approvalRate = periodBookings.length > 0
            ? Math.round((periodBookings.filter((booking) => String(booking?.status || '').toUpperCase() !== 'CANCELLED').length / periodBookings.length) * 100)
            : 0

        const filteredBySearch = periodBookings.filter((booking) => {
            if (!searchTerm.trim()) return true
            const keyword = searchTerm.trim().toLowerCase()
            const bookingId = String(booking?.id || '').toLowerCase()
            const vehicleName = String(booking?.vehicleName || '').toLowerCase()
            const paymentStatus = String(booking?.paymentStatus || '').toLowerCase()
            return bookingId.includes(keyword) || vehicleName.includes(keyword) || paymentStatus.includes(keyword)
        })

        const rows = filteredBySearch.map((booking) => {
            const received = resolveReceivedAmount(booking)
            const fee = Math.round(received * SERVICE_FEE_RATE)
            const balanceChange = received - fee
            return {
                id: booking.id,
                method: paymentMethodLabel(booking.paymentStatus),
                startDate: booking.startDate,
                endDate: booking.endDate,
                unitPrice: booking.pricePerDay || booking.totalPrice,
                revenue: booking.totalPrice,
                received,
                fee,
                balanceChange,
                status: booking.status,
            }
        })

        const totalBalanceChange = rows.reduce((sum, row) => sum + row.balanceChange, 0)
        const totalRevenue = rows.reduce((sum, row) => sum + toNumber(row.revenue), 0)
        const totalReceivedInRows = rows.reduce((sum, row) => sum + row.received, 0)
        const totalFeeInRows = rows.reduce((sum, row) => sum + row.fee, 0)

        return {
            periodLabel: getPeriodLabel(period, now),
            periodBookings,
            totalReceived,
            totalPending,
            serviceFee,
            walletBalance,
            completedTrips,
            responseRate,
            approvalRate,
            rows,
            totalBalanceChange,
            totalRevenue,
            totalReceivedInRows,
            totalFeeInRows,
        }
    }, [bookings, period, searchTerm])

    if (!isAuthenticated) {
        return (
            <div className="fleet-guard">
                <h2>Cần đăng nhập để tiếp tục</h2>
                <p>Vui lòng đăng nhập bằng tài khoản chủ xe để quản lý ví.</p>
                <Link to="/login" className="add-vehicle">Đăng nhập ngay</Link>
            </div>
        )
    }

    if (!canManage) {
        return (
            <div className="fleet-guard">
                <h2>Không đủ quyền truy cập</h2>
                <p>Tài khoản hiện tại không có quyền quản lý ví chủ xe.</p>
                <Link to="/" className="add-vehicle">Quay lại trang chủ</Link>
            </div>
        )
    }

    return (
        <div className="fleet-dashboard owner-wallet-page">
            <FleetSidebar user={user} onLogout={handleLogout} />

            <section className="fleet-main">
                <header className="fleet-header">
                    <div className="owner-wallet-header-left">
                        <p className="fleet-breadcrumb">Chủ xe</p>
                        <h1>Ví của tôi</h1>
                        <p>Quản lý thu nhập và giao dịch của bạn</p>
                    </div>
                    <div className="owner-wallet-header-actions">
                        <div className="owner-wallet-search">
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={(event) => setSearchTerm(event.target.value)}
                                placeholder="Tìm kiếm giao dịch..."
                            />
                        </div>
                        <DashboardNotificationBell />
                    </div>
                </header>

                <section className="owner-wallet-top-grid">
                    <article className="wallet-hero-card">
                        <p className="wallet-hero-label">Số dư ví hiện tại</p>
                        <h2>{formatCompactCurrency(walletSummary.walletBalance)}</h2>
                        <p className="wallet-hero-note">Số dư có thể rút về tài khoản ngân hàng của bạn.</p>
                        <div className="wallet-hero-actions">
                            <button type="button" onClick={() => toast.info('Tính năng rút tiền đang được phát triển')}>
                                Gửi yêu cầu rút tiền
                            </button>
                            <button type="button" className="secondary" onClick={() => toast.info('Sao kê chi tiết sẽ sớm khả dụng')}>
                                Xem Sao kê chi tiết
                            </button>
                        </div>
                    </article>

                    <article className="wallet-report-card">
                        <h3>Thời gian báo cáo</h3>
                        <select value={period} onChange={(event) => setPeriod(event.target.value)}>
                            {PERIOD_OPTIONS.map((option) => (
                                <option key={option.value} value={option.value}>{getPeriodLabel(option.value, new Date())}</option>
                            ))}
                        </select>

                        <div className="wallet-period-pills">
                            {PERIOD_OPTIONS.map((option) => (
                                <button
                                    key={option.value}
                                    type="button"
                                    className={period === option.value ? 'active' : ''}
                                    onClick={() => setPeriod(option.value)}
                                >
                                    {option.label}
                                </button>
                            ))}
                        </div>

                        <div className="wallet-report-line">
                            <span>Thu nhập ước tính</span>
                            <strong className="positive">+{formatCompactCurrency(walletSummary.totalReceived)}</strong>
                        </div>
                        <div className="wallet-report-line">
                            <span>Phí dịch vụ</span>
                            <strong className="negative">-{formatCompactCurrency(walletSummary.serviceFee)}</strong>
                        </div>
                    </article>
                </section>

                <section className="owner-wallet-kpi-grid">
                    <article className="wallet-kpi-card">
                        <p>Đánh giá</p>
                        <h4>4.9 <span>★</span></h4>
                    </article>
                    <article className="wallet-kpi-card">
                        <p>Chuyến đi thành công</p>
                        <h4>{walletSummary.completedTrips}</h4>
                    </article>
                    <article className="wallet-kpi-card accent">
                        <p>Tỷ lệ phản hồi</p>
                        <h4>{walletSummary.responseRate}%</h4>
                    </article>
                    <article className="wallet-kpi-card">
                        <p>Phản hồi trung bình</p>
                        <h4>5 phút</h4>
                    </article>
                    <article className="wallet-kpi-card accent">
                        <p>Tỷ lệ đồng ý</p>
                        <h4>{walletSummary.approvalRate}%</h4>
                    </article>
                </section>

                <section className="owner-wallet-table-wrap">
                    <div className="owner-wallet-table-header">
                        <h3>Bảng tổng hợp giao dịch</h3>
                        <button type="button" onClick={() => toast.info('Bộ lọc nâng cao sẽ sớm khả dụng')}>Lọc nâng cao</button>
                    </div>

                    {loading ? (
                        <div className="owner-wallet-empty">Đang tải dữ liệu ví...</div>
                    ) : walletSummary.rows.length === 0 ? (
                        <div className="owner-wallet-empty">Chưa có giao dịch nào trong kỳ này</div>
                    ) : (
                        <div className="owner-wallet-table-scroll">
                            <table className="owner-wallet-table">
                                <thead>
                                    <tr>
                                        <th>Mã chuyến đi</th>
                                        <th>Hình thức</th>
                                        <th>Ngày đi</th>
                                        <th>Ngày về</th>
                                        <th>Đơn giá thuê</th>
                                        <th>Doanh thu</th>
                                        <th>Tiền đã nhận</th>
                                        <th>Thuế KD</th>
                                        <th>Thay đổi số dư</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {walletSummary.rows.map((row) => (
                                        <tr key={row.id}>
                                            <td>#{row.id}</td>
                                            <td>
                                                <div>{row.method}</div>
                                                <small>{getBookingStatusLabel(row.status)}</small>
                                            </td>
                                            <td>{formatDateTime(row.startDate)}</td>
                                            <td>{formatDateTime(row.endDate)}</td>
                                            <td>{formatCompactCurrency(row.unitPrice)}</td>
                                            <td>{formatCompactCurrency(row.revenue)}</td>
                                            <td className="received">{formatCompactCurrency(row.received)}</td>
                                            <td>{formatCompactCurrency(row.fee)}</td>
                                            <td className={row.balanceChange >= 0 ? 'change-positive' : 'change-negative'}>
                                                {row.balanceChange >= 0 ? '+' : '-'}{formatCompactCurrency(Math.abs(row.balanceChange))}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    <div className="owner-wallet-table-summary">
                        <p><span>Tổng cộng thay đổi trong kỳ</span><b>{formatCompactCurrency(walletSummary.totalBalanceChange)}</b></p>
                        <p><span>Tiền đầu kỳ</span><b>{formatCompactCurrency(0)}</b></p>
                        <p><span>Tiền cuối kỳ</span><b>{formatCompactCurrency(walletSummary.walletBalance)}</b></p>
                        <p><span>Thuế kinh doanh đã khấu trừ (1)</span><b>{formatCompactCurrency(walletSummary.totalFeeInRows)}</b></p>
                        <p className="income"><span>Thu nhập chủ xe</span><b>{formatCompactCurrency(walletSummary.totalReceivedInRows)}</b></p>
                    </div>
                </section>
            </section>
        </div>
    )
}

export default OwnerWallet
