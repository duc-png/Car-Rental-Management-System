import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { register, resendRegistrationEmailOtp, verifyRegistrationEmailOtp } from '../../api/auth'
import '../../styles/Auth.css'

function Register() {
    const [formData, setFormData] = useState({
        fullName: '',
        email: '',
        password: '',
        confirmPassword: '',
        phone: '',
        avatar: '',
        agreeToTerms: false
    })
    const [showPassword, setShowPassword] = useState(false)
    const [showConfirmPassword, setShowConfirmPassword] = useState(false)
    const [errors, setErrors] = useState({})
    const [otpModalOpen, setOtpModalOpen] = useState(false)
    const [otpCode, setOtpCode] = useState('')
    const [registerToken, setRegisterToken] = useState('')
    const [otpLoading, setOtpLoading] = useState(false)
    const [resendLoading, setResendLoading] = useState(false)
    const [registeredEmail, setRegisteredEmail] = useState('')
    const navigate = useNavigate()

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }))
        // Xóa lỗi khi người dùng bắt đầu nhập
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: '' }))
        }
    }

    const [loading, setLoading] = useState(false)

    // ... handleChange ...

    const validateForm = () => {
        // ... (existing validation)
        const newErrors = {}

        if (formData.fullName.trim().length < 2) {
            newErrors.fullName = 'Full name must be at least 2 characters'
        }

        if (!/\S+@\S+\.\S+/.test(formData.email)) {
            newErrors.email = 'Please enter a valid email address'
        }

        if (formData.password.length < 6) {
            newErrors.password = 'Password must be at least 6 characters'
        }

        if (formData.password !== formData.confirmPassword) {
            newErrors.confirmPassword = 'Passwords do not match'
        }

        // Validate VN Phone number: 10 digits, start with 0
        if (formData.phone && !/(03|05|07|08|09|01[2|6|8|9])+([0-9]{8})\b/.test(formData.phone)) {
            newErrors.phone = 'Please enter a valid Vietnamese phone number (10 digits)'
        } else if (formData.phone && !/^\d{10}$/.test(formData.phone)) {
            newErrors.phone = 'Phone number must be exactly 10 digits'
        }

        if (!formData.agreeToTerms) {
            newErrors.agreeToTerms = 'You must agree to the terms and conditions'
        }

        setErrors(newErrors)
        return Object.keys(newErrors).length === 0
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setErrors({})

        if (validateForm()) {
            setLoading(true)
            try {
                // 1. Gọi API đăng ký
                const registerResult = await register({
                    fullName: formData.fullName,
                    email: formData.email,
                    password: formData.password,
                    phone: formData.phone,
                    licenseNumber: '', // Optional
                    avatar: formData.avatar?.trim() || null
                })

                const token = registerResult?.result?.token || registerResult?.token || ''
                if (!token) {
                    throw new Error('Không nhận được token đăng ký để xác minh OTP')
                }

                setRegisterToken(token)
                setRegisteredEmail(formData.email)
                setOtpCode('')
                setOtpModalOpen(true)

            } catch (error) {
                setErrors({ submit: error.message || 'Registration failed' })
            } finally {
                setLoading(false)
            }
        }
    }

    const handleVerifyOtp = async (e) => {
        e.preventDefault()
        setErrors({})

        const normalizedOtp = String(otpCode || '').trim()
        if (normalizedOtp.length !== 6 || !/^\d{6}$/.test(normalizedOtp)) {
            setErrors({ otp: 'OTP phải gồm đúng 6 chữ số' })
            return
        }

        if (!registerToken) {
            setErrors({ otp: 'Phiên xác minh không hợp lệ, vui lòng đăng ký lại' })
            return
        }

        setOtpLoading(true)
        try {
            await verifyRegistrationEmailOtp(registerToken, normalizedOtp)
            setOtpModalOpen(false)
            navigate('/login')
        } catch (error) {
            setErrors({ otp: error.message || 'OTP không hợp lệ' })
        } finally {
            setOtpLoading(false)
        }
    }

    const handleResendOtp = async () => {
        setErrors({})
        if (!registerToken) {
            setErrors({ otp: 'Phiên xác minh không hợp lệ, vui lòng đăng ký lại' })
            return
        }

        setResendLoading(true)
        try {
            await resendRegistrationEmailOtp(registerToken)
        } catch (error) {
            setErrors({ otp: error.message || 'Không thể gửi lại OTP' })
        } finally {
            setResendLoading(false)
        }
    }

    return (
        <div className="auth-container">
            <div className="auth-background">
                <div className="auth-shape shape-1"></div>
                <div className="auth-shape shape-2"></div>
                <div className="auth-shape shape-3"></div>
            </div>

            <div className="auth-content">
                <div className="auth-card register-card">
                    <div className="auth-header">
                        <div className="auth-logo">
                            <img src="/favicon.svg" alt="CarRental Logo" />
                        </div>
                        <h1>Create Account</h1>
                        <p>Join us and start your journey today</p>
                    </div>

                    <form className="auth-form" onSubmit={handleSubmit}>
                        <div className="form-group">
                            <label htmlFor="fullName">Full Name</label>
                            <div className="input-wrapper">
                                <span className="input-icon">👤</span>
                                <input
                                    type="text"
                                    id="fullName"
                                    name="fullName"
                                    value={formData.fullName}
                                    onChange={handleChange}
                                    placeholder="Enter your full name"
                                    required
                                />
                            </div>
                            {errors.fullName && <span className="error-message">{errors.fullName}</span>}
                        </div>

                        <div className="form-group">
                            <label htmlFor="email">Email Address</label>
                            <div className="input-wrapper">
                                <span className="input-icon">✉️</span>
                                <input
                                    type="email"
                                    id="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    placeholder="Enter your email"
                                    required
                                />
                            </div>
                            {errors.email && <span className="error-message">{errors.email}</span>}
                        </div>

                        <div className="form-group">
                            <label htmlFor="phone">Phone Number (Optional)</label>
                            <div className="input-wrapper">
                                <span className="input-icon">📱</span>
                                <input
                                    type="tel"
                                    id="phone"
                                    name="phone"
                                    value={formData.phone}
                                    onChange={handleChange}
                                    placeholder="Enter your phone number"
                                />
                            </div>
                            {errors.phone && <span className="error-message">{errors.phone}</span>}
                        </div>

                        <div className="form-group">
                            <label htmlFor="avatar">Avatar URL (Optional)</label>
                            <div className="input-wrapper">
                                <span className="input-icon">🖼️</span>
                                <input
                                    type="url"
                                    id="avatar"
                                    name="avatar"
                                    value={formData.avatar}
                                    onChange={handleChange}
                                    placeholder="https://..."
                                />
                            </div>
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label htmlFor="password">Password</label>
                                <div className="input-wrapper">
                                    <span className="input-icon">🔒</span>
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        id="password"
                                        name="password"
                                        value={formData.password}
                                        onChange={handleChange}
                                        placeholder="Create password"
                                        required
                                    />
                                    <button
                                        type="button"
                                        className="toggle-password"
                                        onClick={() => setShowPassword(!showPassword)}
                                    >
                                        {showPassword ? '👁️' : '👁️‍🗨️'}
                                    </button>
                                </div>
                                {errors.password && <span className="error-message">{errors.password}</span>}
                            </div>

                            <div className="form-group">
                                <label htmlFor="confirmPassword">Confirm Password</label>
                                <div className="input-wrapper">
                                    <span className="input-icon">🔒</span>
                                    <input
                                        type={showConfirmPassword ? 'text' : 'password'}
                                        id="confirmPassword"
                                        name="confirmPassword"
                                        value={formData.confirmPassword}
                                        onChange={handleChange}
                                        placeholder="Confirm password"
                                        required
                                    />
                                    <button
                                        type="button"
                                        className="toggle-password"
                                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    >
                                        {showConfirmPassword ? '👁️' : '👁️‍🗨️'}
                                    </button>
                                </div>
                                {errors.confirmPassword && <span className="error-message">{errors.confirmPassword}</span>}
                            </div>
                        </div>

                        <div className="form-group">
                            <label className="checkbox-label terms-label">
                                <input
                                    type="checkbox"
                                    name="agreeToTerms"
                                    checked={formData.agreeToTerms}
                                    onChange={handleChange}
                                />
                                <span>
                                    I agree to the{' '}
                                    <Link to="/terms" className="inline-link">
                                        Terms of Service
                                    </Link>
                                    {' '}and{' '}
                                    <Link to="/privacy" className="inline-link">
                                        Privacy Policy
                                    </Link>
                                </span>
                            </label>
                            {errors.agreeToTerms && <span className="error-message">{errors.agreeToTerms}</span>}
                        </div>

                        <button type="submit" className="btn-submit" disabled={loading}>
                            {loading ? 'Creating Account...' : 'Create Account'}
                        </button>
                        {errors.submit && <div className="error-message" style={{ textAlign: 'center', marginTop: '10px' }}>{errors.submit}</div>}
                    </form>

                    <div className="auth-divider">
                        <span>OR</span>
                    </div>

                    <div className="social-login">
                        <button className="btn-social btn-google">
                            <svg width="20" height="20" viewBox="0 0 20 20">
                                <path fill="#4285F4" d="M19.6 10.23c0-.82-.1-1.42-.25-2.05H10v3.72h5.5c-.15.96-.74 2.31-2.04 3.22v2.45h3.16c1.89-1.73 2.98-4.3 2.98-7.34z" />
                                <path fill="#34A853" d="M13.46 15.13c-.83.59-1.96 1-3.46 1-2.64 0-4.88-1.74-5.68-4.15H1.07v2.52C2.72 17.75 6.09 20 10 20c2.7 0 4.96-.89 6.62-2.42l-3.16-2.45z" />
                                <path fill="#FBBC05" d="M3.99 10c0-.69.12-1.35.32-1.97V5.51H1.07A9.973 9.973 0 000 10c0 1.61.39 3.14 1.07 4.49l3.24-2.52c-.2-.62-.32-1.28-.32-1.97z" />
                                <path fill="#EA4335" d="M10 3.88c1.88 0 3.13.81 3.85 1.48l2.84-2.76C14.96.99 12.7 0 10 0 6.09 0 2.72 2.25 1.07 5.51l3.24 2.52C5.12 5.62 7.36 3.88 10 3.88z" />
                            </svg>
                            Sign up with Google
                        </button>
                        <button className="btn-social btn-facebook">
                            <svg width="20" height="20" viewBox="0 0 20 20" fill="#1877F2">
                                <path d="M20 10c0-5.523-4.477-10-10-10S0 4.477 0 10c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V10h2.54V7.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V10h2.773l-.443 2.89h-2.33v6.988C16.343 19.128 20 14.991 20 10z" />
                            </svg>
                            Sign up with Facebook
                        </button>
                    </div>

                    <div className="auth-footer">
                        <p>
                            Already have an account?{' '}
                            <Link to="/login" className="auth-link">
                                Sign in
                            </Link>
                        </p>
                    </div>
                </div>
            </div>

            {otpModalOpen ? (
                <div className="auth-otp-modal-overlay" role="dialog" aria-modal="true" aria-label="Xác minh OTP email">
                    <div className="auth-otp-modal-card" onClick={(event) => event.stopPropagation()}>
                        <h3>Xác minh email</h3>
                        <p>
                            Mã OTP đã được gửi tới <b>{registeredEmail || 'email của bạn'}</b>.
                            Vui lòng nhập mã để hoàn tất đăng ký.
                        </p>

                        <form className="auth-form" onSubmit={handleVerifyOtp}>
                            <div className="form-group">
                                <label htmlFor="registerOtp">Mã OTP</label>
                                <div className="input-wrapper">
                                    <span className="input-icon">🔐</span>
                                    <input
                                        id="registerOtp"
                                        type="text"
                                        inputMode="numeric"
                                        maxLength={6}
                                        value={otpCode}
                                        onChange={(event) => setOtpCode(event.target.value.replace(/\D/g, '').slice(0, 6))}
                                        placeholder="Nhập 6 số OTP"
                                        required
                                    />
                                </div>
                                {errors.otp && <span className="error-message">{errors.otp}</span>}
                            </div>

                            <button type="submit" className="btn-submit" disabled={otpLoading}>
                                {otpLoading ? 'Đang xác minh...' : 'Xác minh OTP'}
                            </button>
                            <button
                                type="button"
                                className="btn-social btn-google"
                                style={{ marginTop: '10px' }}
                                onClick={handleResendOtp}
                                disabled={resendLoading}
                            >
                                {resendLoading ? 'Đang gửi lại...' : 'Gửi lại OTP'}
                            </button>
                            <button
                                type="button"
                                className="btn-secondary"
                                style={{ marginTop: '10px' }}
                                onClick={() => {
                                    setOtpModalOpen(false)
                                    setOtpCode('')
                                    setErrors({})
                                }}
                            >
                                Đóng
                            </button>
                        </form>
                    </div>
                </div>
            ) : null}
        </div>
    )
}

export default Register
