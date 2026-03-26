'use client';

import { useState } from 'react'
import { Link } from 'react-router-dom'
import { MoonStar, SunMedium } from 'lucide-react'
import { useTheme } from '../../contexts/ThemeContext'
import { useAuth } from '../../hooks/useAuth'
import { getDashboardPathByRole, getDisplayName } from '../../utils/authUser'
import '../../styles/Navbar.css'

function Navbar({ sticky = true }) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const { theme, toggleTheme } = useTheme()
  const { isAuthenticated, user } = useAuth()
  const displayName = getDisplayName(user)
  const avatarUrl = String(user?.avatar || '').trim()
  const avatarInitial = (displayName || 'U').charAt(0).toUpperCase()
  const dashboardPath = getDashboardPathByRole(user)
  const isCustomerAccount = isAuthenticated && dashboardPath === '/my-bookings'

  return (
    <nav className={`navbar ${sticky ? '' : 'non-sticky'}`.trim()}>
      <div className="navbar-container">
        <div className="navbar-brand">
          <img src="/favicon.svg" alt="CarRental Logo" className="logo-icon" />
          <Link to="/" className="logo-text">CarRental</Link>
        </div>

        <button
          className="mobile-menu-btn"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          menu
        </button>

        <ul className={`nav-menu ${isMobileMenuOpen ? 'active' : ''}`}>
          <li>
            <Link to="/" onClick={() => setIsMobileMenuOpen(false)}>
              Trang chủ
            </Link>
          </li>
          <li>
            <Link to="/cars" onClick={() => setIsMobileMenuOpen(false)}>
              Xe
            </Link>
          </li>
          <li>
            <Link to="/become-owner" onClick={() => setIsMobileMenuOpen(false)}>
              Trở Thành Chủ Xe
            </Link>
          </li>
          {isCustomerAccount && (
            <li>
              <Link to="/my-bookings" onClick={() => setIsMobileMenuOpen(false)}>
                Đơn đặt xe của tôi
              </Link>
            </li>
          )}
          {isCustomerAccount && (
            <li>
              <Link to="/my-reports" onClick={() => setIsMobileMenuOpen(false)}>
                Báo cáo của tôi
              </Link>
            </li>
          )}
        </ul>

        <div className="nav-actions">
          <button
            className="theme-toggle"
            onClick={toggleTheme}
            aria-label="Đổi giao diện"
            title={theme === 'light' ? 'Bật chế độ tối' : 'Bật chế độ sáng'}
          >
            {theme === 'light' ? <MoonStar size={19} aria-hidden="true" /> : <SunMedium size={19} aria-hidden="true" />}
          </button>

          {isCustomerAccount ? (
            <div className="nav-user-menu">
              <Link to="/profile" className="user-name user-name-link">
                <span className="user-avatar" aria-hidden="true">
                  {avatarUrl ? <img src={avatarUrl} alt={displayName} /> : avatarInitial}
                </span>
                Xin chào, {displayName}
              </Link>
            </div>
          ) : isAuthenticated ? (
            <div className="nav-user-menu">
              <Link to={dashboardPath} className="user-name user-name-link">
                <span className="user-avatar" aria-hidden="true">
                  {avatarUrl ? <img src={avatarUrl} alt={displayName} /> : avatarInitial}
                </span>
                Xin chào, {displayName}
              </Link>
            </div>
          ) : (
            <>
              <Link to="/login" className="btn-login">
                Đăng nhập
              </Link>
              <Link to="/register" className="btn-register">
                Đăng ký
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  )
}

export default Navbar
