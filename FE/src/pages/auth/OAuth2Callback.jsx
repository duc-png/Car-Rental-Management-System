import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { jwtDecode } from 'jwt-decode'

function OAuth2Callback() {
    const navigate = useNavigate()

    useEffect(() => {
        const params = new URLSearchParams(window.location.search)
        const token = params.get('token')

        if (!token) {
            navigate('/login')
            return
        }

        // Lưu token vào localStorage
        localStorage.setItem('token', token)

        // Full page reload để AuthProvider đọc token từ localStorage
        try {
            const decoded = jwtDecode(token)
            const scope = String(decoded?.scope || '')

            if (scope.includes('ROLE_ADMIN')) {
                window.location.href = '/admin/dashboard'
            } else if (scope.includes('ROLE_CAR_OWNER')) {
                window.location.href = '/owner/fleet'
            } else {
                window.location.href = '/'
            }
        } catch {
            window.location.href = '/'
        }
    }, [])

    return (
        <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            height: '100vh',
            fontSize: '1.2rem',
            color: '#888'
        }}>
            <div>
                <div style={{ textAlign: 'center', marginBottom: '12px' }}>⏳</div>
                Đang đăng nhập...
            </div>
        </div>
    )
}

export default OAuth2Callback
