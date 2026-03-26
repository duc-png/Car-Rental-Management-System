import { Link, useLocation } from 'react-router-dom'
import {
    BarChart3,
    CalendarDays,
    Car,
    LayoutGrid,
    LogOut,
    MessageSquareText,
    ReceiptText,
    Settings,
    ShieldAlert,
    ShieldCheck,
    UsersRound,
    Wallet,
    Wrench
} from 'lucide-react'
import '../../../styles/FleetSidebar.css'

function FleetSidebar({ user, onLogout }) {
    const location = useLocation()
    const ownerId = user?.userId || user?.id
    const ownerQuery = ownerId ? `?ownerId=${ownerId}` : ''

    const isOverviewRoute = location.pathname === '/owner/fleet'
    const isVehiclesRoute = location.pathname.startsWith('/owner/fleet') || location.pathname.startsWith('/owner/vehicles')
    const isRentalRoute = location.pathname.startsWith('/manage-rentals')
    const isMaintenanceRoute = location.pathname.startsWith('/owner/maintenance')
    const isFeedbackRoute = location.pathname.startsWith('/owner/feedback')
    const isCalendarRoute = location.pathname.startsWith('/owner/booking-calendar')
    const isWalletRoute = location.pathname.startsWith('/owner/wallet')
    const isAnalyticsRoute = location.pathname.startsWith('/owner/analytics')
    const isIncidentRoute = location.pathname.startsWith('/owner/incident-reports')

    const navItems = [
        {
            key: 'overview',
            to: `/owner/fleet${ownerQuery}`,
            icon: LayoutGrid,
            label: 'Tổng quan',
            active: isOverviewRoute,
        },
        {
            key: 'vehicles',
            to: `/owner/fleet/vehicles${ownerQuery}`,
            icon: Car,
            label: 'Xe của tôi',
            active: isVehiclesRoute,
        },
        {
            key: 'maintenance',
            to: `/owner/maintenance${ownerQuery}`,
            icon: Wrench,
            label: 'Bảo dưỡng xe',
            active: isMaintenanceRoute,
        },
        {
            key: 'rentals',
            to: '/manage-rentals',
            icon: ReceiptText,
            label: 'Đơn thuê',
            active: isRentalRoute,
        },
        {
            key: 'calendar',
            to: `/owner/booking-calendar${ownerQuery}`,
            icon: CalendarDays,
            label: 'Lịch booking',
            active: isCalendarRoute,
        },
        {
            key: 'security',
            to: '/owner/maintenance',
            icon: ShieldCheck,
            label: 'Bảo dưỡng',
            active: isMaintenanceRoute,
        },
        {
            key: 'feedback',
            to: `/owner/feedback${ownerQuery}`,
            icon: MessageSquareText,
            label: 'Phản hồi khách',
            active: isFeedbackRoute,
        },
        {
            key: 'incident-reports',
            to: `/owner/incident-reports${ownerQuery}`,
            icon: ShieldAlert,
            label: 'Report sự cố',
            active: isIncidentRoute,
        },
        {
            key: 'customers',
            to: `/customers${ownerQuery}`,
            icon: UsersRound,
            label: 'Khách hàng',
            active: location.pathname.startsWith('/customers'),
        },
        {
            key: 'wallet',
            to: `/owner/wallet${ownerQuery}`,
            icon: Wallet,
            label: 'Ví của tôi',
            active: isWalletRoute,
        },
        {
            key: 'analytics',
            to: `/owner/analytics${ownerQuery}`,
            icon: BarChart3,
            label: 'Báo cáo',
            active: isAnalyticsRoute,
        },
    ]

    return (
        <aside className="fleet-sidebar">
            <Link to="/" className="fleet-brand">
                <div className="brand-icon">
                    <img src="/favicon.svg" alt="CarRental" />
                </div>
                <div>
                    <h3>Thuê xe</h3>
                    <p>QUẢN LÝ</p>
                </div>
            </Link>

            <div className="fleet-sidebar-content">
                <div className="fleet-nav">
                    <p className="nav-section">Điều hướng</p>
                    {navItems.map((item) => {
                        const Icon = item.icon
                        return (
                            <Link key={item.key} to={item.to} className={`nav-item ${item.active ? 'active' : ''}`.trim()}>
                                <span className="nav-item-icon" aria-hidden="true">
                                    <Icon size={20} strokeWidth={2.2} />
                                </span>
                                <span>{item.label}</span>
                            </Link>
                        )
                    })}
                </div>

                <div className="fleet-system">
                    <p className="nav-section">Hệ thống</p>
                    <Link to={`/owner/fleet${ownerQuery}`} className="nav-item">
                        <span className="nav-item-icon" aria-hidden="true">
                            <Settings size={20} strokeWidth={2.2} />
                        </span>
                        <span>Cài đặt</span>
                    </Link>
                </div>
            </div>

            <div className="fleet-sidebar-bottom">
                <div className="fleet-user">
                    <div className="user-avatar">{(user?.fullName || 'CO').slice(0, 2).toUpperCase()}</div>
                    <div className="user-info">
                        <p className="user-name">{user?.fullName || 'Chủ xe'}</p>
                        <p className="user-email">{user?.email || 'owner@example.com'}</p>
                    </div>
                </div>

                <button type="button" className="fleet-logout-btn" onClick={onLogout}>
                    <span className="fleet-logout-icon" aria-hidden="true">
                        <LogOut size={16} strokeWidth={2.2} />
                    </span>
                    <span>Đăng xuất</span>
                </button>
            </div>
        </aside>
    )
}

export default FleetSidebar
