const API_BASE_URL = import.meta.env.VITE_API_V1_URL || 'http://localhost:8080/api/v1';

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

export const getOwnerById = async (id) => {
    if (!id) return null;

    try {
        const response = await fetch(`${API_BASE_URL}/owners/${id}`);
        if (!response.ok) {
            throw new Error(`API Error: ${response.status}`);
        }
        const data = await response.json();
        return data.result || null;
    } catch (error) {
        console.error('[v0] Error fetching owner:', error);
        return null;
    }
};

export const getOwnerPublicProfile = async (ownerId) => {
    if (!ownerId) return null;

    try {
        const response = await fetch(`${API_BASE_URL}/owners/${ownerId}/public-profile`);
        if (!response.ok) {
            throw new Error(`API Error: ${response.status}`);
        }
        const data = await response.json();
        return data.result || null;
    } catch (error) {
        console.error('[v0] Error fetching owner public profile:', error);
        return null;
    }
};

export const getOwnerPerformance = async (ownerId) => {
    if (!ownerId) return null;

    try {
        const response = await fetch(`${API_BASE_URL}/owners/${ownerId}/performance`);
        if (!response.ok) {
            throw new Error(`API Error: ${response.status}`);
        }
        const data = await response.json();
        return data.result || null;
    } catch (error) {
        console.error('[v0] Error fetching owner performance:', error);
        return null;
    }
};

export const getOwnersForAdmin = async (token, query = '') => {
    const params = new URLSearchParams()
    if (query) params.append('q', query)

    const response = await fetch(`${API_BASE_URL}/owners?${params.toString()}`, {
        method: 'GET',
        headers: buildHeaders(token)
    })

    if (!response.ok) {
        throw new Error(await parseApiError(response, 'Khong the tai danh sach chu xe'))
    }

    return response.json()
}

export const updateOwnerStatus = async (token, ownerId, isActive) => {
    const response = await fetch(`${API_BASE_URL}/owners/${ownerId}/status`, {
        method: 'PATCH',
        headers: buildHeaders(token),
        body: JSON.stringify({ isActive })
    })

    if (!response.ok) {
        throw new Error(await parseApiError(response, 'Khong the cap nhat trang thai chu xe'))
    }

    return response.json()
}
