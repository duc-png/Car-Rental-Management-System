'use client';

import { useState } from 'react'
<<<<<<< HEAD
import { Link } from 'react-router-dom'
=======
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
>>>>>>> ducmito
import '../styles/Navbar.css'

function Navbar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
<<<<<<< HEAD
=======
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)

  const { user, isAuthenticated, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = async () => {
    await logout()
    setIsUserMenuOpen(false)
    navigate('/login')
  }
>>>>>>> ducmito

  return (
    <nav className="navbar">
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
<<<<<<< HEAD
              Home
=======
              Trang chủ
>>>>>>> ducmito
            </Link>
          </li>
          <li>
            <Link to="/cars" onClick={() => setIsMobileMenuOpen(false)}>
<<<<<<< HEAD
              Cars
            </Link>
          </li>
          {/* <li>
            <Link to="/my-bookings" onClick={() => setIsMobileMenuOpen(false)}>
              My Bookings
            </Link>
          </li> */}
          <li>
            <a href="#search" onClick={() => setIsMobileMenuOpen(false)}>
              About us
=======
              Danh sách xe
            </Link>
          </li>
          {isAuthenticated && (
            <li>
              <Link to="/my-bookings" onClick={() => setIsMobileMenuOpen(false)}>
                Đơn của tôi
              </Link>
            </li>
          )}
          <li>
            <a href="#about" onClick={() => setIsMobileMenuOpen(false)}>
              Về chúng tôi
>>>>>>> ducmito
            </a>
          </li>
        </ul>

<<<<<<< HEAD
        <button className="btn-login">Login</button>
=======
        {/* Auth UI */}
        <div className="auth-section">
          {isAuthenticated ? (
            // Đã đăng nhập - Hiển thị user menu
            <div className="user-menu-container">
              <button
                className="user-menu-btn"
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
              >
                <div className="user-avatar">
                  {user?.email?.charAt(0).toUpperCase() || 'U'}
                </div>
                <span className="user-email">{user?.email || 'User'}</span>
                <svg className="chevron-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {/* Dropdown Menu */}
              {isUserMenuOpen && (
                <div className="user-dropdown">
                  <Link
                    to="/my-bookings"
                    className="dropdown-item"
                    onClick={() => setIsUserMenuOpen(false)}
                  >
                    <svg className="dropdown-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                    Đơn đặt xe
                  </Link>
                  <Link
                    to="/profile"
                    className="dropdown-item"
                    onClick={() => setIsUserMenuOpen(false)}
                  >
                    <svg className="dropdown-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    Thông tin cá nhân
                  </Link>
                  <hr className="dropdown-divider" />
                  <button
                    onClick={handleLogout}
                    className="dropdown-item logout-item"
                  >
                    <svg className="dropdown-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    Đăng xuất
                  </button>
                </div>
              )}
            </div>
          ) : (
            // Chưa đăng nhập - Hiển thị nút Login
            <Link to="/login" className="btn-login">
              Đăng nhập
            </Link>
          )}
        </div>
>>>>>>> ducmito
      </div>
    </nav>
  )
}

export default Navbar
