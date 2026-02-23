import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
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
import { getRevenueReport, getBookingStats } from '../api/reports'
import '../styles/Customers.css'
import '../styles/AdminReports.css'

const formatCurrency = (value) => {
    const amount = Number(value || 0)
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount)
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

export default function AdminReports() {
    const navigate = useNavigate()
    const { token, user, logout } = useAuth()
    const defaultDates = getDefaultDates()
    const [fromDate, setFromDate] = useState(defaultDates.fromDate)
    const [toDate, setToDate] = useState(defaultDates.toDate)
    const [tab, setTab] = useState('revenue')
    const [loading, setLoading] = useState(false)
    const [revenue, setRevenue] = useState(null)
    const [stats, setStats] = useState(null)
    const [granularity, setGranularity] = useState('DAILY')

    useEffect(() => {
        if (!token) {
            navigate('/login')
            return
        }
        if (!user?.role?.includes('ROLE_ADMIN')) {
            navigate('/')
            return
        }
    }, [token, user, navigate])

    const loadRevenue = useCallback(async () => {
        try {
            const res = await getRevenueReport(token, { fromDate, toDate })
            setRevenue(res.result || null)
        } catch (e) {
            toast.error(e.message || 'Lỗi tải báo cáo doanh thu')
            setRevenue(null)
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
        if (!token || !user?.role?.includes('ROLE_ADMIN')) return
        setLoading(true)
        if (tab === 'revenue') {
            loadRevenue().finally(() => setLoading(false))
        } else {
            loadStats().finally(() => setLoading(false))
        }
    }, [tab, fromDate, toDate, granularity, token, user, loadRevenue, loadStats])

    const handleLogout = async () => {
        await logout()
        navigate('/login')
    }

    return (
        <div className="customers-page">
            <div className="admin-shell">
                <aside className="admin-sidebar">
                    <div className="brand-block">
                        <div className="brand-icon">C</div>
                        <div>
                            <p className="brand-title">CarRental Pro</p>
                            <p className="brand-subtitle">Management System</p>
                        </div>
                    </div>

                    <nav className="admin-nav">
                        <p className="nav-section">Navigation</p>
                        <button type="button" className="nav-item">Dashboard</button>
                        <button type="button" className="nav-item">Fleet</button>
                        <button type="button" className="nav-item">Bookings</button>
                        <Link to="/admin/customers" className="nav-item">Customers</Link>
                        <button type="button" className="nav-item active">Reports</button>
                    </nav>

                    <nav className="admin-nav">
                        <p className="nav-section">System</p>
                        <button type="button" className="nav-item">Settings</button>
                    </nav>

                    <div className="admin-profile">
                        <div className="profile-avatar">AD</div>
                        <div>
                            <p className="profile-name">Admin User</p>
                            <p className="profile-email">{user?.email || 'admin@carrental.com'}</p>
                        </div>
                        <button type="button" className="btn-outline" onClick={handleLogout}>
                            Log out
                        </button>
                    </div>
                </aside>

                <section className="admin-content">
                <header className="reports-header">
                    <div>
                        <p className="reports-breadcrumb">Admin / Báo cáo</p>
                        <h1>Báo cáo toàn hệ thống</h1>
                        <p>Doanh thu và thống kê đặt chỗ toàn hệ thống</p>
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
                            <h2>Báo cáo doanh thu (toàn hệ thống)</h2>
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
                    {!loading && tab === 'stats' && (
                        <div className="report-card">
                            <h2>Thống kê đặt chỗ (toàn hệ thống)</h2>
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
        </div>
    )
}
