import { useState } from 'react'
import { Link } from 'react-router-dom'
import '../styles/Auth.css'

function ForgotPassword() {
    const [email, setEmail] = useState('')
    const [isSubmitted, setIsSubmitted] = useState(false)
    const [error, setError] = useState('')

    const handleSubmit = (e) => {
        e.preventDefault()

        // Validate email
        if (!/\S+@\S+\.\S+/.test(email)) {
            setError('Please enter a valid email address')
            return
        }

        // Xử lý gửi email reset password ở đây
        console.log('Reset password for:', email)
        setIsSubmitted(true)
    }

    const handleChange = (e) => {
        setEmail(e.target.value)
        if (error) setError('')
    }

    if (isSubmitted) {
        return (
            <div className="auth-container">
                <div className="auth-background">
                    <div className="auth-shape shape-1"></div>
                    <div className="auth-shape shape-2"></div>
                    <div className="auth-shape shape-3"></div>
                </div>

                <div className="auth-content">
                    <div className="auth-card success-card">
                        <div className="success-icon">
                            <svg width="80" height="80" viewBox="0 0 80 80" fill="none">
                                <circle cx="40" cy="40" r="38" stroke="#10b981" strokeWidth="4" fill="#f0fdf4" />
                                <path d="M25 40L35 50L55 30" stroke="#10b981" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        </div>

                        <h1 className="success-title">Check Your Email</h1>
                        <p className="success-message">
                            We've sent a password reset link to <strong>{email}</strong>
                        </p>
                        <p className="success-description">
                            Please check your inbox and click on the link to reset your password.
                            The link will expire in 24 hours.
                        </p>

                        <div className="success-actions">
                            <Link to="/login" className="btn-submit">
                                Back to Sign In
                            </Link>
                            <button
                                className="btn-secondary"
                                onClick={() => setIsSubmitted(false)}
                            >
                                Try Another Email
                            </button>
                        </div>

                        <div className="auth-footer">
                            <p>
                                Didn't receive the email?{' '}
                                <button
                                    className="inline-link resend-link"
                                    onClick={(e) => {
                                        e.preventDefault()
                                        console.log('Resend email to:', email)
                                        alert('Email sent again!')
                                    }}
                                >
                                    Resend
                                </button>
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="auth-container">
            <div className="auth-background">
                <div className="auth-shape shape-1"></div>
                <div className="auth-shape shape-2"></div>
                <div className="auth-shape shape-3"></div>
            </div>

            <div className="auth-content">
                <div className="auth-card">
                    <div className="auth-header">
                        <div className="auth-logo">
                            <img src="/favicon.svg" alt="CarRental Logo" />
                        </div>
                        <h1>Forgot Password?</h1>
                        <p>No worries, we'll send you reset instructions</p>
                    </div>

                    <form className="auth-form" onSubmit={handleSubmit}>
                        <div className="form-group">
                            <label htmlFor="email">Email Address</label>
                            <div className="input-wrapper">
                                <span className="input-icon">✉️</span>
                                <input
                                    type="email"
                                    id="email"
                                    name="email"
                                    value={email}
                                    onChange={handleChange}
                                    placeholder="Enter your email"
                                    required
                                />
                            </div>
                            {error && <span className="error-message">{error}</span>}
                        </div>

                        <button type="submit" className="btn-submit">
                            Send Reset Link
                        </button>
                    </form>

                    <div className="auth-footer">
                        <Link to="/login" className="back-link">
                            <span className="back-arrow">←</span> Back to Sign In
                        </Link>
                    </div>

                    <div className="help-section">
                        <p className="help-title">Need more help?</p>
                        <div className="help-options">
                            <a href="mailto:support@carrental.com" className="help-option">
                                <span className="help-icon">📧</span>
                                <span>Email Support</span>
                            </a>
                            <a href="tel:+14155552671" className="help-option">
                                <span className="help-icon">📞</span>
                                <span>Call Us</span>
                            </a>
                            <Link to="/faq" className="help-option">
                                <span className="help-icon">❓</span>
                                <span>Visit FAQ</span>
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default ForgotPassword
