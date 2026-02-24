import { createContext, useState, useEffect } from 'react'
import { jwtDecode } from 'jwt-decode'
import { login as apiLogin, logout as apiLogout } from '../api/auth'

// Tạo Context để lưu thông tin authentication
export const AuthContext = createContext()

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null) // Thông tin user đang đăng nhập
    const [token, setToken] = useState(null) // JWT token
    const [loading, setLoading] = useState(true) // Loading state khi check auth

    // Helper to decode token safely
    const decodeToken = (token) => {
        try {
            const decoded = jwtDecode(token)
            return {
                email: decoded.sub,
                userId: decoded.userId,
                role: decoded.scope, // "ROLE_USER ROLE_EXPERT" string
                ...decoded
            }
        } catch (e) {
            console.error("Invalid token", e)
            return null
        }
    }

    // Khi app khởi động, kiểm tra xem có token đã lưu không
    useEffect(() => {
        try {
            const savedToken = localStorage.getItem('token')

            if (savedToken) {
                const decodedUser = decodeToken(savedToken)
                if (decodedUser) {
                    setToken(savedToken)
                    setUser(decodedUser)
                } else {
                    localStorage.removeItem('token')
                }
            }
        } catch (error) {
            console.error('Error loading saved auth:', error)
            localStorage.removeItem('token')
        } finally {
            setLoading(false)
        }
    }, [])

    /**
     * Hàm đăng nhập
     * @param {string} email 
     * @param {string} password 
     * @returns {Promise<{success: boolean, error?: string}>}
     */
    const login = async (email, password) => {
        try {
            // Gọi API login
            const data = await apiLogin(email, password)

            const accessToken = data.result.token

            // Lưu token
            setToken(accessToken)
            localStorage.setItem('token', accessToken)

            // Decode token để lấy info
            const userInfo = decodeToken(accessToken)
            setUser(userInfo)

            return { success: true }
        } catch (error) {
            console.error('Login failed:', error)
            return {
                success: false,
                error: error.message || 'Đăng nhập thất bại. Vui lòng thử lại.'
            }
        }
    }



    /**
     * Hàm đăng xuất
     */
    const logout = async () => {
        try {
            // Gọi API logout nếu có token
            if (token) {
                await apiLogout(token)
            }
        } catch (error) {
            console.error('Logout API error:', error)
            // Vẫn logout ở client dù API fail
        } finally {
            // Xóa token và user khỏi state và localStorage
            setToken(null)
            setUser(null)
            localStorage.removeItem('token')
            localStorage.removeItem('user')
        }
    }

    // Giá trị được chia sẻ cho toàn bộ app
    const value = {
        user,
        token,
        isAuthenticated: !!user, // true nếu có user
        loading,
        login,
        logout
    }

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    )
}
