const API_URL = 'http://localhost:8080'

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
        const errorData = await response.json()
        throw new Error(errorData.message || 'Không thể tải danh sách khách hàng')
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
        const errorData = await response.json()
        throw new Error(errorData.message || 'Không thể tạo khách hàng')
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
        const errorData = await response.json()
        throw new Error(errorData.message || 'Không thể cập nhật khách hàng')
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
        const errorData = await response.json()
        throw new Error(errorData.message || 'Không thể cập nhật trạng thái')
    }

    return response.json()
}
