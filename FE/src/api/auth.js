// Base URL của backend API
const API_URL = 'http://localhost:8080'

/**
 * Hàm đăng nhập
 * @param {string} email - Email của user
 * @param {string} password - Mật khẩu
 * @returns {Promise<{token: string, authenticated: boolean}>}
 */
export const login = async (email, password) => {
    try {
        const response = await fetch(`${API_URL}/auth/token`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email, password })
        })

        if (!response.ok) {
            const errorData = await response.json()
            throw new Error(errorData.message || 'Email hoặc mật khẩu không đúng!')
        }

        const data = await response.json()
        return data
    } catch (error) {
        console.error('Login error:', error)
        throw error
    }
}



/**
 * Hàm đăng ký user mới
 * @param {Object} userData - Thông tin đăng ký { fullName, email, password, phone, licenseNumber }
 * @returns {Promise<{token: string, authenticated: boolean}>}
 */
export const register = async (userData) => {
    try {
        const response = await fetch(`${API_URL}/auth/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(userData)
        })

        if (!response.ok) {
            const errorData = await response.json()
            // Xử lý error message từ backend
            if (errorData.code === 1011) {
                throw new Error('Email đã tồn tại!')
            }
            throw new Error(errorData.message || 'Đăng ký thất bại!')
        }

        const data = await response.json()
        return data
    } catch (error) {
        console.error('Register error:', error)
        throw error
    }
}

/**
 * Hàm đăng xuất
 * @param {string} token - JWT token hiện tại
 */
export const logout = async (token) => {
    try {
        await fetch(`${API_URL}/auth/logout`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ token })
        })
    } catch (error) {
        console.error('Logout error:', error)
        // Vẫn logout ở client dù API fail
    }
}

/**
 * Hàm refresh token (làm mới token khi sắp hết hạn)
 * @param {string} oldToken - Token cũ
 * @returns {Promise<{token: string, authenticated: boolean}>}
 */
export const refreshToken = async (oldToken) => {
    try {
        const response = await fetch(`${API_URL}/auth/refresh`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ token: oldToken })
        })

        if (!response.ok) {
            throw new Error('Không thể refresh token')
        }

        const data = await response.json()
        return data
    } catch (error) {
        console.error('Refresh token error:', error)
        throw error
    }
}

/**
 * Hàm kiểm tra token còn hợp lệ không
 * @param {string} token - JWT token
 * @returns {Promise<{valid: boolean}>}
 */
export const introspectToken = async (token) => {
    try {
        const response = await fetch(`${API_URL}/auth/introspect`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ token })
        })

        const data = await response.json()
        return data
    } catch (error) {
        console.error('Introspect error:', error)
        return { valid: false }
    }
}
