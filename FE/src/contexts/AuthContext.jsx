import { createContext, useCallback, useEffect, useRef, useState } from 'react'
import { jwtDecode } from 'jwt-decode'
import { login as apiLogin, logout as apiLogout, refreshToken as apiRefreshToken } from '../api/auth'

// Tạo Context để lưu thông tin authentication
export const AuthContext = createContext()

const REFRESH_BEFORE_EXPIRE_MS = 60 * 1000
const EXPIRY_SKEW_SECONDS = 30

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null) // Thông tin user đang đăng nhập
    const [token, setToken] = useState(null) // JWT token
    const [loading, setLoading] = useState(true) // Loading state khi check auth
    const refreshTimeoutRef = useRef(null)
    const refreshingPromiseRef = useRef(null)

    // Helper to decode token safely
    const decodeToken = (token) => {
        try {
            const decoded = jwtDecode(token)
            return {
                email: decoded.sub,
                userId: decoded.userId,
                role: decoded.scope, // "ROLE_USER ROLE_CAR_OWNER" string
                ...decoded
            }
        } catch (e) {
            console.error("Invalid token", e)
            return null
        }
    }

    const clearRefreshTimer = useCallback(() => {
        if (refreshTimeoutRef.current) {
            clearTimeout(refreshTimeoutRef.current)
            refreshTimeoutRef.current = null
        }
    }, [])

    const clearAuthData = useCallback(() => {
        clearRefreshTimer()
        setToken(null)
        setUser(null)
        localStorage.removeItem('token')
        localStorage.removeItem('user')
    }, [clearRefreshTimer])

    const extractTokenValue = (payload) => {
        if (!payload) return null
        if (typeof payload === 'string') return payload
        if (payload.result?.token) return payload.result.token
        if (payload.token) return payload.token
        return null
    }

    const getTokenExpiryMs = (rawToken) => {
        try {
            const decoded = jwtDecode(rawToken)
            if (!decoded?.exp) return null
            return decoded.exp * 1000
        } catch {
            return null
        }
    }

    const isTokenExpired = (rawToken, skewSeconds = EXPIRY_SKEW_SECONDS) => {
        const expiryMs = getTokenExpiryMs(rawToken)
        if (!expiryMs) return true
        return expiryMs <= Date.now() + (skewSeconds * 1000)
    }

    const applyToken = useCallback((nextToken) => {
        const decodedUser = decodeToken(nextToken)
        if (!decodedUser) {
            clearAuthData()
            return false
        }

        setToken(nextToken)
        setUser(decodedUser)
        localStorage.setItem('token', nextToken)
        return true
    }, [clearAuthData])

    const scheduleRefresh = useCallback((rawToken) => {
        clearRefreshTimer()
        const expiryMs = getTokenExpiryMs(rawToken)
        if (!expiryMs) return

        const delay = expiryMs - Date.now() - REFRESH_BEFORE_EXPIRE_MS
        const nextDelay = Math.max(1000, delay)

        refreshTimeoutRef.current = setTimeout(async () => {
            try {
                if (refreshingPromiseRef.current) {
                    await refreshingPromiseRef.current
                    return
                }

                const currentToken = localStorage.getItem('token')
                if (!currentToken) {
                    clearAuthData()
                    return
                }

                const refreshed = await apiRefreshToken(currentToken)
                const refreshedToken = extractTokenValue(refreshed)

                if (!refreshedToken || !applyToken(refreshedToken)) {
                    clearAuthData()
                    return
                }

                scheduleRefresh(refreshedToken)
            } catch {
                clearAuthData()
            }
        }, nextDelay)
    }, [applyToken, clearAuthData, clearRefreshTimer])

    const tryRefreshToken = useCallback(async (oldToken) => {
        if (!oldToken) return null

        if (refreshingPromiseRef.current) {
            return refreshingPromiseRef.current
        }

        refreshingPromiseRef.current = (async () => {
            try {
                const refreshed = await apiRefreshToken(oldToken)
                const refreshedToken = extractTokenValue(refreshed)
                if (!refreshedToken || !applyToken(refreshedToken)) {
                    clearAuthData()
                    return null
                }

                scheduleRefresh(refreshedToken)
                return refreshedToken
            } catch {
                clearAuthData()
                return null
            } finally {
                refreshingPromiseRef.current = null
            }
        })()

        return refreshingPromiseRef.current
    }, [applyToken, clearAuthData, scheduleRefresh])

    // Khi app khởi động, kiểm tra xem có token đã lưu không
    useEffect(() => {
        const bootstrapAuth = async () => {
            try {
                const savedToken = localStorage.getItem('token')

                if (!savedToken) {
                    return
                }

                const decodedUser = decodeToken(savedToken)
                if (!decodedUser) {
                    clearAuthData()
                    return
                }

                if (isTokenExpired(savedToken)) {
                    await tryRefreshToken(savedToken)
                    return
                }

                applyToken(savedToken)
                scheduleRefresh(savedToken)
            } catch (error) {
                console.error('Error loading saved auth:', error)
                clearAuthData()
            } finally {
                setLoading(false)
            }
        }

        bootstrapAuth()

        return () => {
            clearRefreshTimer()
        }
    }, [applyToken, clearAuthData, clearRefreshTimer, scheduleRefresh, tryRefreshToken])

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
            if (!applyToken(accessToken)) {
                return {
                    success: false,
                    error: 'Token không hợp lệ. Vui lòng đăng nhập lại.'
                }
            }

            scheduleRefresh(accessToken)

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
            clearAuthData()
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
