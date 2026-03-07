const API_URL = import.meta.env.VITE_API_ORIGIN || 'http://localhost:8080'

const parseApiError = async (response, fallback) => {
    try {
        const errorData = await response.json()
        return errorData.message || fallback
    } catch {
        return fallback
    }
}

const buildHeaders = (token) => ({
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {})
})

export const getCustomers = async (token, query = '') => {
    const params = new URLSearchParams()
    if (query) {
        params.append('q', query)
    }

    const response = await fetch(`${API_URL}/api/v1/customers?${params.toString()}`, {
        method: 'GET',
        headers: buildHeaders(token)
    })

    if (!response.ok) {
        throw new Error(await parseApiError(response, 'Không thể tải danh sách khách hàng'))
    }

    return response.json()
}

export const createCustomer = async (token, payload) => {
    const response = await fetch(`${API_URL}/api/v1/customers`, {
        method: 'POST',
        headers: buildHeaders(token),
        body: JSON.stringify(payload)
    })

    if (!response.ok) {
        throw new Error(await parseApiError(response, 'Không thể tạo khách hàng'))
    }

    return response.json()
}

export const updateCustomer = async (token, id, payload) => {
    const response = await fetch(`${API_URL}/api/v1/customers/${id}`, {
        method: 'PUT',
        headers: buildHeaders(token),
        body: JSON.stringify(payload)
    })

    if (!response.ok) {
        throw new Error(await parseApiError(response, 'Không thể cập nhật khách hàng'))
    }

    return response.json()
}

export const updateCustomerStatus = async (token, id, isActive) => {
    const response = await fetch(`${API_URL}/api/v1/customers/${id}/status`, {
        method: 'PATCH',
        headers: buildHeaders(token),
        body: JSON.stringify({ isActive })
    })

    if (!response.ok) {
        throw new Error(await parseApiError(response, 'Không thể cập nhật trạng thái'))
    }

    return response.json()
}

export const updateCustomerLicenseVerification = async (token, id, payload) => {
    const response = await fetch(`${API_URL}/api/v1/customers/${id}/license-verification`, {
        method: 'PATCH',
        headers: buildHeaders(token),
        body: JSON.stringify(payload)
    })

    if (!response.ok) {
        throw new Error(await parseApiError(response, 'Khong the cap nhat xac minh GPLX'))
    }

    return response.json()
}

export const getMyCustomerProfile = async (token) => {
    const response = await fetch(`${API_URL}/api/v1/customers/profile`, {
        method: 'GET',
        headers: buildHeaders(token)
    })

    if (!response.ok) {
        throw new Error(await parseApiError(response, 'Không thể tải hồ sơ người dùng'))
    }

    return response.json()
}

export const updateMyCustomerProfile = async (token, payload) => {
    const response = await fetch(`${API_URL}/api/v1/customers/profile`, {
        method: 'PUT',
        headers: buildHeaders(token),
        body: JSON.stringify(payload)
    })

    if (!response.ok) {
        throw new Error(await parseApiError(response, 'Không thể cập nhật hồ sơ người dùng'))
    }

    return response.json()
}

export const updateMyCustomerBasicInfo = async (token, payload) => {
    const response = await fetch(`${API_URL}/api/v1/customers/profile/basic-info`, {
        method: 'PATCH',
        headers: buildHeaders(token),
        body: JSON.stringify(payload)
    })

    if (!response.ok) {
        throw new Error(await parseApiError(response, 'Khong the cap nhat thong tin ca nhan'))
    }

    return response.json()
}

export const updateMyCustomerLicenseInfo = async (token, payload) => {
    const response = await fetch(`${API_URL}/api/v1/customers/profile/license-info`, {
        method: 'PATCH',
        headers: buildHeaders(token),
        body: JSON.stringify(payload)
    })

    if (!response.ok) {
        throw new Error(await parseApiError(response, 'Khong the cap nhat thong tin GPLX'))
    }

    return response.json()
}

export const scanMyCustomerLicenseOcr = async (token, file) => {
    const formData = new FormData()
    formData.append('file', file)

    const response = await fetch(`${API_URL}/api/v1/customers/profile/license-ocr`, {
        method: 'POST',
        headers: {
            ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: formData
    })

    if (!response.ok) {
        throw new Error(await parseApiError(response, 'Khong the quet OCR GPLX'))
    }

    return response.json()
}

export const getMyFavoriteVehicles = async (token) => {
    const response = await fetch(`${API_URL}/api/v1/customers/profile/favorites`, {
        method: 'GET',
        headers: buildHeaders(token)
    })

    if (!response.ok) {
        throw new Error(await parseApiError(response, 'Khong the tai danh sach yeu thich'))
    }

    return response.json()
}

export const addMyFavoriteVehicle = async (token, vehicleId) => {
    const response = await fetch(`${API_URL}/api/v1/customers/profile/favorites/${vehicleId}`, {
        method: 'POST',
        headers: buildHeaders(token)
    })

    if (!response.ok) {
        throw new Error(await parseApiError(response, 'Khong the them xe yeu thich'))
    }

    return response.json()
}

export const removeMyFavoriteVehicle = async (token, vehicleId) => {
    const response = await fetch(`${API_URL}/api/v1/customers/profile/favorites/${vehicleId}`, {
        method: 'DELETE',
        headers: buildHeaders(token)
    })

    if (!response.ok) {
        throw new Error(await parseApiError(response, 'Khong the xoa xe yeu thich'))
    }

    return response.json()
}

export const changeMyCustomerPassword = async (token, payload) => {
    const response = await fetch(`${API_URL}/api/v1/customers/profile/password`, {
        method: 'PUT',
        headers: buildHeaders(token),
        body: JSON.stringify(payload)
    })

    if (!response.ok) {
        throw new Error(await parseApiError(response, 'Khong the doi mat khau'))
    }

    return response.json()
}

export const updateMyCustomerPhone = async (token, phone) => {
    const response = await fetch(`${API_URL}/api/v1/customers/profile/phone`, {
        method: 'PATCH',
        headers: buildHeaders(token),
        body: JSON.stringify({ phone })
    })

    if (!response.ok) {
        throw new Error(await parseApiError(response, 'Khong the cap nhat so dien thoai'))
    }

    return response.json()
}

export const sendEmailOtpForProfileUpdate = async (token, newEmail) => {
    const response = await fetch(`${API_URL}/api/v1/customers/profile/email-otp/send`, {
        method: 'POST',
        headers: buildHeaders(token),
        body: JSON.stringify({ newEmail })
    })

    if (!response.ok) {
        throw new Error(await parseApiError(response, 'Khong the gui OTP'))
    }

    return response.json()
}

export const verifyEmailOtpForProfileUpdate = async (token, payload) => {
    const response = await fetch(`${API_URL}/api/v1/customers/profile/email-otp/verify`, {
        method: 'POST',
        headers: buildHeaders(token),
        body: JSON.stringify(payload)
    })

    if (!response.ok) {
        throw new Error(await parseApiError(response, 'OTP khong hop le'))
    }

    return response.json()
}

export const uploadMyCustomerAvatar = async (token, file) => {
    const formData = new FormData()
    formData.append('file', file)

    const response = await fetch(`${API_URL}/api/v1/customers/profile/avatar`, {
        method: 'POST',
        headers: {
            ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: formData
    })

    if (!response.ok) {
        throw new Error(await parseApiError(response, 'Khong the tai anh dai dien'))
    }

    return response.json()
}
