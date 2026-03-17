import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import { useAuth } from '../../hooks/useAuth';
import '../../styles/Auth.css';

const OwnerLogin = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const { login } = useAuth();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const result = await login(email, password);
            if (!result.success) {
                setError(result.error || 'Đăng nhập thất bại');
                return;
            }

            const token = localStorage.getItem('token');
            if (!token) {
                setError('Không nhận được token đăng nhập');
                return;
            }

            const decoded = jwtDecode(token);
            const scope = String(decoded?.scope || '').replace(/\bROLE_EXPERT\b/g, 'ROLE_CAR_OWNER');
            const isOwner = scope.includes('ROLE_CAR_OWNER') || scope.includes('CAR_OWNER');

            if (isOwner) {
                navigate('/owner/fleet');
            } else {
                setError('Tài khoản không có quyền chủ xe');
            }
        } catch (err) {
            console.error(err);
            setError('Đăng nhập thất bại');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-container">
            <h2>Đăng nhập Chủ xe</h2>
            <form onSubmit={handleSubmit}>
                <input
                    type="email"
                    placeholder="Email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                />
                <input
                    type="password"
                    placeholder="Mật khẩu"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                />
                <button type="submit" disabled={loading}>
                    {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
                </button>
                {error && <div className="error">{error}</div>}
            </form>
        </div>
    );
};

export default OwnerLogin;
