'use client';

import { useState } from 'react'
import { Link } from 'react-router-dom'
import '../styles/Navbar.css'

function Navbar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

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
              Home
            </Link>
          </li>
          <li>
            <Link to="/cars" onClick={() => setIsMobileMenuOpen(false)}>
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
            </a>
          </li>
        </ul>

        <button className="btn-login">Login</button>
      </div>
    </nav>
  )
}

export default Navbar
