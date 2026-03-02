'use client';

import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useTheme } from '../contexts/ThemeContext'
import { useAuth } from '../hooks/useAuth'
import '../styles/Navbar.css'

const looksLikeEmail = (value) => /.+@.+\..+/.test(String(value || '').trim())

const getDisplayName = (user) => {
  const candidates = [
    user?.fullName,
    user?.name,
    user?.full_name,
    user?.preferred_username,
    user?.username
  ]

  const firstValid = candidates
    .map((item) => String(item || '').trim())
    .find((item) => item && !looksLikeEmail(item))

  return firstValid || 'User'
}

const isOwner = (user) => {
  const scope = String(user?.role || user?.scope || '')
  return scope.includes('EXPERT') || scope.includes('OWNER')
}

function Navbar({ sticky = true }) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)
  const { theme, toggleTheme } = useTheme()
  const { isAuthenticated, user, logout } = useAuth()
  const displayName = getDisplayName(user)

  const closeMenus = () => {
    setIsMobileMenuOpen(false)
    setIsUserMenuOpen(false)
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
            <div className="nav-user-menu">
              <button
                className="user-name"
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
              >
                Hi, {displayName} ▾
              </button>

              {isUserMenuOpen && (
                <div className="user-dropdown">
                  <Link to="/my-bookings" className="dropdown-item" onClick={closeMenus}>
                    🚗 Đặt xe của tôi
                  </Link>
                  {isOwner(user) && (
                    <Link to="/manage-rentals" className="dropdown-item" onClick={closeMenus}>
                      📋 Quản lý cho thuê
                    </Link>
                  )}
                  <hr className="dropdown-divider" />
                  <button
                    className="dropdown-item dropdown-logout"
                    onClick={() => { logout(); closeMenus(); }}
                  >
                    🚪 Đăng xuất
                  </button>
                </div>
              )}
            </div>
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

