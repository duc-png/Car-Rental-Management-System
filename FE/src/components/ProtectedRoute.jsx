import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

/**
 * ProtectedRoute - Component bảo vệ các route yêu cầu authentication
 * Chỉ cho phép user đã đăng nhập mới được access
 * 
 * @param {React.ReactNode} children - Component con muốn bảo vệ
 */
export default function ProtectedRoute({ children }) {
    const { isAuthenticated, loading } = useAuth()
    const location = useLocation()

    // Đang kiểm tra auth status
    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <svg className="animate-spin h-12 w-12 text-blue-600 mx-auto mb-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <p className="text-xl text-gray-600">Đang tải...</p>
                </div>
            </div>
        )
    }

    // Chưa đăng nhập -> Redirect về login page
    // Lưu location hiện tại để sau khi login có thể quay lại
    if (!isAuthenticated) {
        return <Navigate to="/login" state={{ from: location }} replace />
    }

    // Đã đăng nhập -> Cho phép access
    return children
}
