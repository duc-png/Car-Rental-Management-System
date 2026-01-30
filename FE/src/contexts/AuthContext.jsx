import { createContext, useState, useEffect } from 'react'
import { login as apiLogin, logout as apiLogout, register as apiRegister } from '../api/auth'

// Tạo Context để lưu thông tin authentication
export const AuthContext = createContext()


export function AuthProvider({ children }) {
    const [user, setUser] = useState(null) // Thông tin user đang đăng nhập
    const [token, setToken] = useState(null) // JWT token
    const [loading, setLoading] = useState(true) // Loading state khi check auth

    // Khi app khởi động, kiểm tra xem có token đã lưu không
    useEffect(() => {
        try {
            const savedToken = localStorage.getItem('token')
            const savedUser = localStorage.getItem('user')

            if (savedToken && savedUser) {
                setToken(savedToken)
                setUser(JSON.parse(savedUser))
            }
        } catch (error) {
            console.error('Error loading saved auth:', error)
            // Clear invalid data
            localStorage.removeItem('token')
            localStorage.removeItem('user')
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

            // Lưu token
            setToken(data.token)
            localStorage.setItem('token', data.token)

            // Lưu thông tin user (decode JWT để lấy thêm info nếu cần)
            const userInfo = {
                email,
                // Có thể thêm fields khác từ response hoặc decode JWT
            }
            setUser(userInfo)
            localStorage.setItem('user', JSON.stringify(userInfo))

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
     * Hàm đăng ký user mới
     * @param {Object} userData - { fullName, email, password, phone, licenseNumber }
     * @returns {Promise<{success: boolean, error?: string}>}
     */
    const register = async (userData) => {
        try {
            // Gọi API register
            const data = await apiRegister(userData)

            // Lưu token (auto-login sau khi đăng ký)
            setToken(data.result.token)
            localStorage.setItem('token', data.result.token)

            // Lưu thông tin user
            const userInfo = {
                email: userData.email,
                fullName: userData.fullName,
            }
            setUser(userInfo)
            localStorage.setItem('user', JSON.stringify(userInfo))

            return { success: true }
        } catch (error) {
            console.error('Registration failed:', error)
            return {
                success: false,
                error: error.message || 'Đăng ký thất bại. Vui lòng thử lại.'
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
        register,
        logout
    }

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    )
}
