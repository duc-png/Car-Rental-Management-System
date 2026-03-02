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

export const listOwnerRegistrationsForAdmin = async (status) => {
    const url = new URL(`${API_BASE_URL}/owner-registrations`);
    if (status) url.searchParams.set('status', status);

    const data = await requestJson(url.toString(), {
        method: 'GET',
        headers: withAuthHeaders({ 'Content-Type': 'application/json' })
    });

    return data || [];
};

export const getOwnerRegistrationDetailForAdmin = async (requestId) => {
    if (!requestId) return null;
    const data = await requestJson(`${API_BASE_URL}/owner-registrations/${requestId}`, {
        method: 'GET',
        headers: withAuthHeaders({ 'Content-Type': 'application/json' })
    });

    return data || null;
};

export const approveOwnerRegistration = async (requestId, note) => {
    if (!requestId) throw new Error('Missing requestId');
    const body = note ? { note } : undefined;

    const data = await requestJson(`${API_BASE_URL}/owner-registrations/${requestId}/approve`, {
        method: 'PATCH',
        headers: withAuthHeaders({ 'Content-Type': 'application/json' }),
        body: body ? JSON.stringify(body) : undefined
    });

    return data || null;
};

export const cancelOwnerRegistration = async (requestId, note) => {
    if (!requestId) throw new Error('Missing requestId');
    const body = note ? { note } : undefined;

    const data = await requestJson(`${API_BASE_URL}/owner-registrations/${requestId}/cancel`, {
        method: 'PATCH',
        headers: withAuthHeaders({ 'Content-Type': 'application/json' }),
        body: body ? JSON.stringify(body) : undefined
    });

    return data || null;
};
