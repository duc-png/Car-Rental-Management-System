import { useCallback, useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Cell
} from 'recharts'
import { useAuth } from '../hooks/useAuth'
import { getRevenueReport, getUsageReport, getBookingStats } from '../api/reports'
import '../styles/CarOwnerFleet.css'
import '../styles/OwnerAnalytics.css'

const formatCurrency = (value) => {
    const amount = Number(value || 0)
    return `${Math.round(amount).toLocaleString('vi-VN')} VNĐ`
}

function getDefaultDates() {
    const now = new Date()
    const y = now.getFullYear()
    const m = String(now.getMonth() + 1).padStart(2, '0')
    const first = `${y}-${m}-01`
    const last = new Date(y, now.getMonth() + 1, 0)
    const lastStr = last.getFullYear() + '-' + String(last.getMonth() + 1).padStart(2, '0') + '-' + String(last.getDate()).padStart(2, '0')
    return { fromDate: first, toDate: lastStr }
}

function toYMD(d) {
    const y = d.getFullYear()
    const m = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    return `${y}-${m}-${day}`
}

const DATE_PRESETS = [
    { id: 'month', label: 'Tháng này', getRange: () => {
        const now = new Date()
        const first = new Date(now.getFullYear(), now.getMonth(), 1)
        const last = new Date(now.getFullYear(), now.getMonth() + 1, 0)
        return { fromDate: toYMD(first), toDate: toYMD(last) }
    }},
    { id: 'lastMonth', label: 'Tháng trước', getRange: () => {
        const now = new Date()
        const first = new Date(now.getFullYear(), now.getMonth() - 1, 1)
        const last = new Date(now.getFullYear(), now.getMonth(), 0)
        return { fromDate: toYMD(first), toDate: toYMD(last) }
    }},
    { id: '3months', label: '3 tháng', getRange: () => {
        const now = new Date()
        const from = new Date(now.getFullYear(), now.getMonth() - 2, 1)
        return { fromDate: toYMD(from), toDate: toYMD(now) }
    }},
    { id: '6months', label: '6 tháng', getRange: () => {
        const now = new Date()
        const from = new Date(now.getFullYear(), now.getMonth() - 5, 1)
        return { fromDate: toYMD(from), toDate: toYMD(now) }
    }},
    { id: 'year', label: 'Năm nay', getRange: () => {
        const now = new Date()
        const first = new Date(now.getFullYear(), 0, 1)
        return { fromDate: toYMD(first), toDate: toYMD(now) }
    }}
]

const CHART_COLORS = ['#0f172a', '#334155', '#475569', '#64748b', '#94a3b8']

export default function OwnerAnalytics() {
    const navigate = useNavigate()
    const location = useLocation()
    const { token, user, logout } = useAuth()
    const defaultDates = getDefaultDates()
    const [fromDate, setFromDate] = useState(defaultDates.fromDate)
    const [toDate, setToDate] = useState(defaultDates.toDate)
    const [tab, setTab] = useState('revenue')
    const [loading, setLoading] = useState(false)
    const [revenue, setRevenue] = useState(null)
    const [usage, setUsage] = useState(null)
    const [stats, setStats] = useState(null)
    const [granularity, setGranularity] = useState('DAILY')

    useEffect(() => {
        if (!token) {
            navigate('/login')
            return
        }
        if (!user?.role?.includes('ROLE_EXPERT')) {
            navigate('/')
            return
        }
    }, [token, user, navigate])

    const loadRevenue = useCallback(async () => {
        try {
            const res = await getRevenueReport(token, { fromDate, toDate })
            setRevenue(res.result || null)
        } catch (e) {
            toast.error(e.message || 'Lỗi tải doanh thu')
            setRevenue(null)
        }
    }, [token, fromDate, toDate])

    const loadUsage = useCallback(async () => {
        try {
            const res = await getUsageReport(token, { fromDate, toDate })
            setUsage(res.result || null)
        } catch (e) {
            toast.error(e.message || 'Lỗi tải sử dụng xe')
            setUsage(null)
        }
    }, [token, fromDate, toDate])

    const loadStats = useCallback(async () => {
        try {
            const res = await getBookingStats(token, { fromDate, toDate, granularity })
            setStats(res.result || null)
        } catch (e) {
            toast.error(e.message || 'Lỗi tải thống kê')
            setStats(null)
        }
    }, [token, fromDate, toDate, granularity])

    useEffect(() => {
        if (!token || !user?.role?.includes('ROLE_EXPERT')) return
        setLoading(true)
        if (tab === 'revenue') {
            loadRevenue().finally(() => setLoading(false))
        } else if (tab === 'usage') {
            loadUsage().finally(() => setLoading(false))
        } else {
            loadStats().finally(() => setLoading(false))
        }
    }, [tab, fromDate, toDate, granularity, token, user, loadRevenue, loadUsage, loadStats])

    const handleLogout = async () => {
        await logout()
        navigate('/login')
    }

    return (
        <div className="fleet-dashboard owner-analytics-page">
            <aside className="fleet-sidebar">
                <Link to="/" className="fleet-brand">
                    <div className="brand-icon">
                        CR
                    </div>
                    <div>
                        <h3>CarRental System</h3>
                        <p>Owner Portal</p>
                    </div>
                </Link>

                <div className="fleet-nav">
                    <p className="nav-section">Navigation</p>
                    <Link to="/owner/fleet" className={`nav-item ${location.pathname === '/owner/fleet' ? 'active' : ''}`}>Fleet</Link>
                    <Link to="/owner/analytics" className={`nav-item ${location.pathname === '/owner/analytics' ? 'active' : ''}`}>Analytics</Link>
                </div>

                <div className="fleet-system">
                    <p className="nav-section">System</p>
                    <button type="button" className="nav-item">Settings</button>
                </div>

                <div className="fleet-user">
                    <div className="fleet-user-row">
                        <div className="user-avatar">CO</div>
                        <div className="user-info">
                            <p className="user-name">Car Owner</p>
                            <p className="user-email">{user?.email || '—'}</p>
                        </div>
                    </div>
                    <button type="button" className="fleet-logout-btn" onClick={handleLogout}>Đăng xuất</button>
                </div>
            </aside>

            <section className="fleet-main owner-analytics-main">
                <header className="reports-header">
                    <div>
                        <p className="reports-breadcrumb">Car Owner / Analytics</p>
                        <h1>Báo cáo & Thống kê</h1>
                        <p>Doanh thu, sử dụng xe và thống kê đặt chỗ</p>
                    </div>
                </header>

                <div className="reports-filters">
                    <div className="reports-presets">
                        <span className="presets-label">Xem nhanh:</span>
                        {DATE_PRESETS.map((preset) => (
                            <button
                                key={preset.id}
                                type="button"
                                className="preset-btn"
                                onClick={() => {
                                    const { fromDate: f, toDate: t } = preset.getRange()
                                    setFromDate(f)
                                    setToDate(t)
                                }}
                            >
                                {preset.label}
                            </button>
                        ))}
                    </div>
                    <label>
                        <span>Từ ngày</span>
                        <input
                            type="date"
                            value={fromDate}
                            onChange={(e) => setFromDate(e.target.value)}
                        />
                    </label>
                    <label>
                        <span>Đến ngày</span>
                        <input
                            type="date"
                            value={toDate}
                            onChange={(e) => setToDate(e.target.value)}
                        />
                    </label>
                    {tab === 'stats' && (
                        <label>
                            <span>Nhóm theo</span>
                            <select value={granularity} onChange={(e) => setGranularity(e.target.value)}>
                                <option value="DAILY">Theo ngày</option>
                                <option value="WEEKLY">Theo tuần</option>
                                <option value="MONTHLY">Theo tháng</option>
                            </select>
                        </label>
                    )}
                </div>

                <div className="reports-tabs">
                    <button
                        type="button"
                        className={tab === 'revenue' ? 'active' : ''}
                        onClick={() => setTab('revenue')}
                    >
                        Doanh thu
                    </button>
                    <button
                        type="button"
                        className={tab === 'usage' ? 'active' : ''}
                        onClick={() => setTab('usage')}
                    >
                        Sử dụng xe
                    </button>
                    <button
                        type="button"
                        className={tab === 'stats' ? 'active' : ''}
                        onClick={() => setTab('stats')}
                    >
                        Thống kê đặt chỗ
                    </button>
                </div>

                <div className="reports-content">
                    {loading && <div className="reports-loading">Đang tải...</div>}
                    {!loading && tab === 'revenue' && (
                        <div className="report-card">
                            <h2>Báo cáo doanh thu (xe của bạn)</h2>
                            {revenue && (
                                <>
                                    <div className="revenue-summary">
                                        <p>Tổng doanh thu</p>
                                        <h3>{formatCurrency(revenue.totalRevenue)}</h3>
                                        <p className="period">{revenue.periodFrom} → {revenue.periodTo}</p>
                                    </div>
                                    {revenue.breakdown?.length > 0 && (
                                        <div className="report-chart-wrap">
                                            <ResponsiveContainer width="100%" height={320}>
                                                <BarChart
                                                    data={revenue.breakdown.map((r) => ({ name: r.periodLabel, value: Number(r.totalRevenue || 0) }))}
                                                    margin={{ top: 16, right: 16, left: 16, bottom: 16 }}
                                                >
                                                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                                                    <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                                                    <YAxis tickFormatter={(v) => `${(v / 1e6).toFixed(0)}M`} tick={{ fontSize: 12 }} />
                                                    <Tooltip formatter={(v) => [formatCurrency(v), 'Doanh thu']} labelFormatter={(l) => `Kỳ ${l}`} />
                                                    <Bar dataKey="value" name="Doanh thu" radius={[4, 4, 0, 0]}>
                                                        {revenue.breakdown.map((_, i) => (
                                                            <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                                                        ))}
                                                    </Bar>
                                                </BarChart>
                                            </ResponsiveContainer>
                                        </div>
                                    )}
                                    {revenue.breakdown?.length > 0 && (
                                        <table className="report-table">
                                            <thead>
                                                <tr>
                                                    <th>Kỳ</th>
                                                    <th>Doanh thu</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {revenue.breakdown.map((row) => (
                                                    <tr key={row.periodLabel}>
                                                        <td>{row.periodLabel}</td>
                                                        <td>{formatCurrency(row.totalRevenue)}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    )}
                                </>
                            )}
                            {revenue && !revenue.breakdown?.length && revenue.breakdown !== undefined && (
                                <p className="report-empty">Không có dữ liệu theo kỳ.</p>
                            )}
                        </div>
                    )}
                    {!loading && tab === 'usage' && (
                        <div className="report-card">
                            <h2>Báo cáo sử dụng xe</h2>
                            {usage && (
                                <>
                                    <div className="usage-summary">
                                        <div className="usage-stat">
                                            <p>Tổng số đặt chỗ</p>
                                            <h3>{usage.totalBookingCount}</h3>
                                        </div>
                                        <div className="usage-stat">
                                            <p>Tổng số ngày thuê</p>
                                            <h3>{usage.totalRentalDays}</h3>
                                        </div>
                                    </div>
                                    {usage.vehicleBreakdown?.length > 0 && (
                                        <div className="report-chart-wrap">
                                            <ResponsiveContainer width="100%" height={320}>
                                                <BarChart
                                                    data={usage.vehicleBreakdown.map((v, i) => ({
                                                        name: v.licensePlate || v.vehicleDisplayName?.slice(0, 12) || `#${v.vehicleId}`,
                                                        count: v.bookingCount,
                                                        days: v.totalRentalDays
                                                    }))}
                                                    margin={{ top: 16, right: 16, left: 16, bottom: 16 }}
                                                >
                                                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                                                    <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                                                    <YAxis tick={{ fontSize: 12 }} />
                                                    <Tooltip formatter={(v, name) => [v, name === 'count' ? 'Số đặt chỗ' : 'Ngày thuê']} />
                                                    <Bar dataKey="count" name="count" radius={[4, 4, 0, 0]}>
                                                        {usage.vehicleBreakdown.map((_, i) => (
                                                            <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                                                        ))}
                                                    </Bar>
                                                </BarChart>
                                            </ResponsiveContainer>
                                        </div>
                                    )}
                                    {usage.vehicleBreakdown?.length > 0 ? (
                                        <table className="report-table">
                                            <thead>
                                                <tr>
                                                    <th>Xe</th>
                                                    <th>Biển số</th>
                                                    <th>Số đặt chỗ</th>
                                                    <th>Tổng ngày thuê</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {usage.vehicleBreakdown.map((row) => (
                                                    <tr key={row.vehicleId}>
                                                        <td>{row.vehicleDisplayName}</td>
                                                        <td>{row.licensePlate}</td>
                                                        <td>{row.bookingCount}</td>
                                                        <td>{row.totalRentalDays}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    ) : (
                                        <p className="report-empty">Không có dữ liệu sử dụng trong kỳ.</p>
                                    )}
                                </>
                            )}
                        </div>
                    )}
                    {!loading && tab === 'stats' && (
                        <div className="report-card">
                            <h2>Thống kê đặt chỗ (xe của bạn)</h2>
                            {stats && (
                                <>
                                    <p className="period">{stats.periodFrom} → {stats.periodTo} (theo {stats.granularity === 'DAILY' ? 'ngày' : stats.granularity === 'WEEKLY' ? 'tuần' : 'tháng'})</p>
                                    {stats.items?.length > 0 && (
                                        <div className="report-chart-wrap">
                                            <ResponsiveContainer width="100%" height={320}>
                                                <BarChart
                                                    data={stats.items.map((r) => ({ name: r.periodLabel, count: r.count }))}
                                                    margin={{ top: 16, right: 16, left: 16, bottom: 16 }}
                                                >
                                                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                                                    <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                                                    <YAxis tick={{ fontSize: 12 }} />
                                                    <Tooltip formatter={(v) => [v, 'Số đặt chỗ']} labelFormatter={(l) => `Kỳ ${l}`} />
                                                    <Bar dataKey="count" name="Số đặt chỗ" radius={[4, 4, 0, 0]}>
                                                        {stats.items.map((_, i) => (
                                                            <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                                                        ))}
                                                    </Bar>
                                                </BarChart>
                                            </ResponsiveContainer>
                                        </div>
                                    )}
                                    {stats.items?.length > 0 ? (
                                        <table className="report-table">
                                            <thead>
                                                <tr>
                                                    <th>Kỳ</th>
                                                    <th>Số đặt chỗ</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {stats.items.map((row) => (
                                                    <tr key={row.periodLabel}>
                                                        <td>{row.periodLabel}</td>
                                                        <td>{row.count}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    ) : (
                                        <p className="report-empty">Không có dữ liệu trong kỳ.</p>
                                    )}
                                </>
                            )}
                        </div>
                    )}
                </div>
            </section>
        </div>
    )
}
