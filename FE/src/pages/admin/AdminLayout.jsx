import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useEffect } from 'react'
import { CarFront, LayoutDashboard, LogOut, UserCheck, Users } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import '../../styles/AdminLayout.css'

export default function AdminLayout() {
    const navigate = useNavigate()
    const location = useLocation()
    const { token, user, logout, loading } = useAuth()

    useEffect(() => {
        if (loading) return

        if (!token) {
            navigate('/login', { replace: true, state: { from: location.pathname } })
            return
        }

        if (!user?.role?.includes('ROLE_ADMIN')) {
            navigate('/', { replace: true })
        }
    }, [token, user, loading, navigate, location.pathname])

    const handleLogout = async () => {
        await logout()
        navigate('/login')
    }

    const displayName = user?.fullName || user?.email || 'Admin'
    const initials = String(displayName).slice(0, 2).toUpperCase()

    return (
        <div className="admin-layout-page">
            <div className="admin-layout-shell">
                <aside className="admin-layout-sidebar">
                    <NavLink to="/" className="admin-layout-brand-block">
                        <div className="admin-layout-brand-icon">C</div>
                        <div>
                            <p className="admin-layout-brand-title">CarRental Pro</p>
                            <p className="admin-layout-brand-subtitle">Bảng điều khiển quản trị</p>
                        </div>
                    </NavLink>

                    <nav className="admin-layout-nav">
                        <p className="admin-layout-nav-section">Điều hướng</p>
                        <NavLink
                            to="/admin/dashboard"
                            className={({ isActive }) => `admin-layout-nav-item ${isActive ? 'active' : ''}`}
                            state={{ from: location.pathname }}
                        >
                            <LayoutDashboard size={18} strokeWidth={2.2} aria-hidden="true" />
                            <span>Tổng quan</span>
                        </NavLink>
                        <NavLink
                            to="/admin/vehicles"
                            className={({ isActive }) => `admin-layout-nav-item ${isActive ? 'active' : ''}`}
                        >
                            <CarFront size={18} strokeWidth={2.2} aria-hidden="true" />
                            <span>Xe</span>
                        </NavLink>
                        <NavLink
                            to="/admin/owner-registrations"
                            className={({ isActive }) => `admin-layout-nav-item ${isActive ? 'active' : ''}`}
                        >
                            <UserCheck size={18} strokeWidth={2.2} aria-hidden="true" />
                            <span>Đăng ký chủ xe</span>
                        </NavLink>
                        <NavLink
                            to="/admin/customers"
                            className={({ isActive }) => `admin-layout-nav-item ${isActive ? 'active' : ''}`}
                        >
                            <Users size={18} strokeWidth={2.2} aria-hidden="true" />
                            <span>Khách hàng</span>
                        </NavLink>
                    </nav>

                    <nav className="admin-layout-nav">
                        <p className="admin-layout-nav-section">Hệ thống</p>
                        <button type="button" className="admin-layout-nav-item admin-layout-nav-logout" onClick={handleLogout}>
                            <LogOut size={18} strokeWidth={2.2} aria-hidden="true" />
                            Đăng xuất
                        </button>
                    </nav>

                    <div className="admin-layout-profile">
                        <div className="admin-layout-profile-avatar">{initials}</div>
                        <div className="admin-layout-profile-meta">
                            <p className="admin-layout-profile-name">{displayName}</p>
                            <p className="admin-layout-profile-email">{user?.email || 'admin@carrental.com'}</p>
                        </div>
                    </div>
                </aside>

                <section className="admin-layout-content">
                    <Outlet />
                </section>
            </div>
        </div>
    )
}
