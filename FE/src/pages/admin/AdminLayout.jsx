import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useEffect } from 'react'
import { useAuth } from '../../hooks/useAuth'
import '../../styles/AdminShell.css'

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
        <div className="admin-page">
            <div className="admin-shell">
                <aside className="admin-sidebar">
                    <NavLink to="/" className="brand-block">
                        <div className="brand-icon">C</div>
                        <div>
                            <p className="brand-title">CarRental Pro</p>
                            <p className="brand-subtitle">Admin Dashboard</p>
                        </div>
                    </NavLink>

                    <nav className="admin-nav">
                        <p className="nav-section">Navigation</p>
                        <NavLink
                            to="/admin/dashboard"
                            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                            state={{ from: location.pathname }}
                        >
                            Dashboard
                        </NavLink>
                        <NavLink
                            to="/admin/vehicles"
                            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                        >
                            Vehicles
                        </NavLink>
                        <NavLink
                            to="/admin/owner-registrations"
                            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                        >
                            Owner Registrations
                        </NavLink>
                        <NavLink
                            to="/admin/customers"
                            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                        >
                            Customers
                        </NavLink>
                    </nav>

                    <nav className="admin-nav">
                        <p className="nav-section">System</p>
                        <button type="button" className="nav-item admin-nav-logout" onClick={handleLogout}>
                            <span className="admin-nav-logout-icon" aria-hidden="true">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path
                                        d="M10 17L5 12L10 7"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                    />
                                    <path
                                        d="M5 12H19"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                    />
                                </svg>
                            </span>
                            Đăng xuất
                        </button>
                    </nav>

                    <div className="admin-profile">
                        <div className="profile-avatar">{initials}</div>
                        <div className="profile-meta">
                            <p className="profile-name">{displayName}</p>
                            <p className="profile-email">{user?.email || 'admin@carrental.com'}</p>
                        </div>
                    </div>
                </aside>

                <section className="admin-content">
                    <Outlet />
                </section>
            </div>
        </div>
    )
}
