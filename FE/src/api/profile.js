const API_URL = import.meta.env.VITE_API_ORIGIN || 'http://localhost:8080'

const buildHeaders = (token) => ({
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {})
})

/**
 * Lấy thông tin profile của user hiện tại
 * @param {string} token - JWT token
 * @param {number} userId - ID của user
 */
export const getMyProfile = async (token, userId) => {
    const response = await fetch(`${API_URL}/api/v1/customers/${userId}`, {
        method: 'GET',
        headers: buildHeaders(token)
    })

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || 'Không thể tải thông tin hồ sơ')
    }

    const data = await response.json()
    return data.result
}

/**
 * Cập nhật thông tin profile
 * @param {string} token - JWT token
 * @param {number} userId - ID của user
 * @param {Object} payload - { fullName, email, phone, licenseNumber, address }
 */
export const updateMyProfile = async (token, userId, payload) => {
    const response = await fetch(`${API_URL}/api/v1/customers/${userId}`, {
        method: 'PUT',
        headers: buildHeaders(token),
        body: JSON.stringify(payload)
    })

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || 'Không thể cập nhật thông tin hồ sơ')
    }

    const data = await response.json()
    return data.result
}

/**
 * Lấy danh sách booking của user hiện tại
 * @param {string} token - JWT token
 */
export const getMyBookings = async (token) => {
    const response = await fetch(`${API_URL}/api/v1/bookings`, {
        method: 'GET',
        headers: buildHeaders(token)
    })

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || 'Không thể tải lịch sử thuê xe')
    }

    const data = await response.json()
    return data.result || []
}
