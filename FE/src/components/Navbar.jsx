'use client';

import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTheme } from '../contexts/ThemeContext'
import { useAuth } from '../hooks/useAuth'
import { getDashboardPathByRole, getDisplayName } from '../utils/authUser'
import '../styles/Navbar.css'

function Navbar({ sticky = true }) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isCustomerMenuOpen, setIsCustomerMenuOpen] = useState(false)
  const customerMenuRef = useRef(null)
  const { theme, toggleTheme } = useTheme()
  const { isAuthenticated, user, logout } = useAuth()
  const displayName = getDisplayName(user)
  const dashboardPath = getDashboardPathByRole(user)
  const isCustomerAccount = isAuthenticated && dashboardPath === '/my-bookings'

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (!customerMenuRef.current || customerMenuRef.current.contains(event.target)) {
        return
      }

      setIsCustomerMenuOpen(false)
    }

    document.addEventListener('mousedown', handleOutsideClick)
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick)
    }
  }, [])

  const handleCustomerLogout = async () => {
    setIsCustomerMenuOpen(false)
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

          {isCustomerAccount ? (
            <div className="nav-user-menu customer-menu" ref={customerMenuRef}>
              <button
                type="button"
                className="user-name user-name-button"
                onClick={() => setIsCustomerMenuOpen((prev) => !prev)}
                aria-haspopup="menu"
                aria-expanded={isCustomerMenuOpen}
              >
                Hi, {displayName}
              </button>

              {isCustomerMenuOpen ? (
                <div className="customer-dropdown" role="menu">
                  <Link
                    to={dashboardPath}
                    className="customer-dropdown-item"
                    onClick={() => setIsCustomerMenuOpen(false)}
                    role="menuitem"
                  >
                    My bookings
                  </Link>
                  <button
                    type="button"
                    className="customer-dropdown-item"
                    onClick={handleCustomerLogout}
                    role="menuitem"
                  >
                    Logout
                  </button>
                </div>
              ) : null}
            </div>
          ) : isAuthenticated ? (
            <div className="nav-user-menu">
              <Link to={dashboardPath} className="user-name user-name-link">
                Hi, {displayName}
              </Link>
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
