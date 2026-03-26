import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { CarFront, Eye, EyeOff, ShieldCheck, Sparkles, Users } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import '../../styles/OwnerLogin.css'

const OwnerLogin = () => {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [showPassword, setShowPassword] = useState(false)
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)
    const navigate = useNavigate()
    const { login } = useAuth()

    const features = useMemo(
        () => [
            {
                icon: ShieldCheck,
                title: 'Kiểm duyệt minh bạch',
                desc: 'Theo dõi trạng thái xe và hồ sơ theo thời gian thực.'
            },
            {
                icon: CarFront,
                title: 'Quản lý đội xe nhanh',
                desc: 'Tạo xe, chỉnh sửa thông tin và xử lý lịch đặt trong một màn hình.'
            },
            {
                icon: Users,
                title: 'Kết nối khách hàng',
                desc: 'Nhận thông báo và phản hồi ngay khi khách cần hỗ trợ.'
            }
        ],
        []
    )

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError('')
        setLoading(true)

        try {
            const result = await login(email, password, { mode: 'owner' })
            if (!result.success) {
                setError(result.error || 'Đăng nhập thất bại')
                return
            }
            navigate('/owner/fleet')
        } catch (err) {
            console.error(err)
            setError('Đăng nhập thất bại')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="owner-login-page">
            <div className="owner-login-background" aria-hidden="true">
                <div className="owner-login-orb orb-1" />
                <div className="owner-login-orb orb-2" />
                <div className="owner-login-orb orb-3" />
            </div>

            <div className="owner-login-shell">
                <aside className="owner-login-intro">
                    <span className="owner-login-badge">
                        <Sparkles size={14} />
                        Cổng chủ xe CarRental
                    </span>
                    <h1>Đăng nhập để vận hành đội xe hiệu quả hơn mỗi ngày.</h1>
                    <p>
                        Quản lý xe, lịch đặt và doanh thu trong một không gian làm việc thống nhất.
                    </p>

                    <div className="owner-login-feature-list">
                        {features.map((item) => {
                            const Icon = item.icon
                            return (
                                <div className="owner-login-feature" key={item.title}>
                                    <span className="owner-login-feature-icon" aria-hidden="true">
                                        <Icon size={18} />
                                    </span>
                                    <div>
                                        <h3>{item.title}</h3>
                                        <p>{item.desc}</p>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </aside>

                <section className="owner-login-card" aria-label="Form đăng nhập chủ xe">
                    <div className="owner-login-card-header">
                        <h2>Đăng nhập chủ xe</h2>
                        <p>Dùng tài khoản chủ xe để truy cập bảng điều khiển.</p>
                    </div>

                    <form className="owner-login-form" onSubmit={handleSubmit}>
                        <label htmlFor="owner-email">Email</label>
                        <input
                            id="owner-email"
                            type="email"
                            placeholder="owner@email.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />

                        <label htmlFor="owner-password">Mật khẩu</label>
                        <div className="owner-password-wrap">
                            <input
                                id="owner-password"
                                type={showPassword ? 'text' : 'password'}
                                placeholder="Nhập mật khẩu"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                            <button
                                type="button"
                                className="owner-password-toggle"
                                onClick={() => setShowPassword((prev) => !prev)}
                                aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                            >
                                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>

                        {error ? <div className="owner-login-error">{error}</div> : null}

                        <button type="submit" disabled={loading} className="owner-login-submit">
                            {loading ? 'Đang đăng nhập...' : 'Vào bảng điều khiển'}
                        </button>
                    </form>

                    <div className="owner-login-footer-links">
                        <Link to="/forgot-password">Quên mật khẩu?</Link>
                        <Link to="/become-owner">Đăng ký tài khoản chủ xe</Link>
                        <Link to="/login">Đăng nhập tài khoản khách hàng</Link>
                    </div>
                </section>
            </div>
        </div>
    )
}

export default OwnerLogin
