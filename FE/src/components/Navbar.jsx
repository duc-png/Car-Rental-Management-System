'use client';

import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTheme } from '../contexts/ThemeContext'
import { useAuth } from '../hooks/useAuth'
import { getDashboardPathByRole, getDisplayName } from '../utils/authUser'
import '../styles/Navbar.css'

const isOwner = (user) => {
  const scope = String(user?.role || user?.scope || '')
  return scope.includes('CAR_OWNER') || scope.includes('ROLE_CAR_OWNER')
}

function Navbar({ sticky = true }) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)
  const userMenuRef = useRef(null)
  const { theme, toggleTheme } = useTheme()
  const { isAuthenticated, user, logout } = useAuth()
  const displayName = getDisplayName(user)
  const dashboardPath = getDashboardPathByRole(user)

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (!userMenuRef.current || userMenuRef.current.contains(event.target)) return
      setIsUserMenuOpen(false)
    }
    document.addEventListener('mousedown', handleOutsideClick)
    return () => document.removeEventListener('mousedown', handleOutsideClick)
  }, [])

  const closeMenus = () => {
    setIsMobileMenuOpen(false)
    setIsUserMenuOpen(false)
  }

  const handleLogout = async () => {
    setIsUserMenuOpen(false)
    await logout()
    setIsMobileMenuOpen(false)
  }

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
          ☰
        </button>

        <ul className={`nav-menu ${isMobileMenuOpen ? 'active' : ''}`}>
          <li>
            <Link to="/" onClick={() => setIsMobileMenuOpen(false)}>
              Home
            </Link>
          </li>
          <li>
            <Link to="/cars" onClick={() => setIsMobileMenuOpen(false)}>
              Cars
            </Link>
          </li>
          <li>
            <Link to="/become-owner" onClick={() => setIsMobileMenuOpen(false)}>
              Trở thành chủ xe
            </Link>
          </li>
        </ul>

        <div className="nav-actions">
          <button
            className="theme-toggle"
            onClick={toggleTheme}
            aria-label="Toggle theme"
          >
            {theme === 'light' ? '🌙' : '☀️'}
          </button>

          {isAuthenticated ? (
            dashboardPath === '/my-bookings' ? (
              // Customer: dropdown with bookings + logout
              <div className="nav-user-menu" ref={userMenuRef}>
                <button
                  type="button"
                  className="user-name user-name-button"
                  onClick={() => setIsUserMenuOpen((prev) => !prev)}
                  aria-haspopup="menu"
                  aria-expanded={isUserMenuOpen}
                >
                  Hi, {displayName} ▾
                </button>

                {isUserMenuOpen && (
                  <div className="user-dropdown" role="menu">
                    <Link to="/my-bookings" className="dropdown-item" onClick={closeMenus} role="menuitem">
                      🚗 Đặt xe của tôi
                    </Link>
                    <hr className="dropdown-divider" />
                    <button
                      type="button"
                      className="dropdown-item dropdown-logout"
                      onClick={handleLogout}
                      role="menuitem"
                    >
                      � Đăng xuất
                    </button>
                  </div>
                )}
              </div>
            ) : (
              // Owner / Admin: direct link to their dashboard + logout
              <div className="nav-user-menu">
                <Link to={dashboardPath} className="user-name user-name-link">
                  Hi, {displayName}
                </Link>
                <button className="btn-logout" onClick={handleLogout}>
                  Logout
                </button>
              </div>
            )
          ) : (
            <>
              <Link to="/login" className="btn-login">
                Login
              </Link>
              <Link to="/register" className="btn-register">
                Sign Up
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  )
}

export default Navbar
