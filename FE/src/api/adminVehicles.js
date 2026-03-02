const API_BASE_URL = import.meta.env.VITE_API_V1_URL || 'http://localhost:8080/api/v1';

const parseJson = async (response) => {
    const text = await response.text();
    if (!text) return null;
    try {
        return JSON.parse(text);
    } catch {
        return text;
    }
};

const unwrapApiResponse = (data) => {
    if (data == null) return null;
    if (Array.isArray(data)) return data;
    if (typeof data === 'object' && 'result' in data) return data.result;
    return data;
};

const withAuthHeaders = (headers = {}) => {
    const token = localStorage.getItem('token');
    if (!token) return headers;
    return { ...headers, Authorization: `Bearer ${token}` };
};

const requireAuthToken = () => {
    const token = localStorage.getItem('token');
    if (!token) {
        throw new Error('Bạn cần đăng nhập tài khoản admin để duyệt xe.');
    }
    return token;
};

const requestJson = async (url, options) => {
    const response = await fetch(url, options);
    const data = await parseJson(response);
    if (!response.ok) {
        const message =
            (data && typeof data === 'object' && (data.message || data.error))
                ? (data.message || data.error)
                : `API Error: ${response.status}`;
        throw new Error(message);
    }
    return unwrapApiResponse(data);
};

export const listAllVehicles = async () => {
    const data = await requestJson(`${API_BASE_URL}/vehicles`, {
        method: 'GET',
        headers: withAuthHeaders({ 'Content-Type': 'application/json' })
    });

    return data || [];
};

export const getVehicleById = async (vehicleId) => {
    if (!vehicleId) throw new Error('Missing vehicleId');

    const data = await requestJson(`${API_BASE_URL}/vehicles/${vehicleId}`, {
        method: 'GET',
        headers: withAuthHeaders({ 'Content-Type': 'application/json' })
    });

    return data || null;
};

export const approveVehicle = async (vehicleId) => {
    if (!vehicleId) throw new Error('Missing vehicleId');
    requireAuthToken();
    const data = await requestJson(`${API_BASE_URL}/vehicles/${vehicleId}/approve`, {
        method: 'PATCH',
        headers: withAuthHeaders({ 'Content-Type': 'application/json' })
    });

    return data || null;
};

export const rejectVehicle = async (vehicleId, reason) => {
    if (!vehicleId) throw new Error('Missing vehicleId');
    requireAuthToken();
    const url = new URL(`${API_BASE_URL}/vehicles/${vehicleId}/reject`);
    if (reason) url.searchParams.set('reason', reason);

    const data = await requestJson(url.toString(), {
        method: 'PATCH',
        headers: withAuthHeaders({ 'Content-Type': 'application/json' })
    });

    return data || null;
};
