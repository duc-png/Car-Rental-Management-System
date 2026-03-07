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
    if (typeof data === 'object' && 'result' in data) return data.result;
    return data;
};

const withAuthHeaders = (headers = {}) => {
    const token = localStorage.getItem('token');
    if (!token) return headers;
    return {
        ...headers,
        Authorization: `Bearer ${token}`
    };
};

const requestJson = async (url, options = {}) => {
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

export const getMyNotifications = async ({ unreadOnly, limit } = {}) => {
    const url = new URL(`${API_BASE_URL}/notifications`);
    if (typeof unreadOnly === 'boolean') {
        url.searchParams.set('unreadOnly', String(unreadOnly));
    }
    if (Number.isInteger(limit) && limit > 0) {
        url.searchParams.set('limit', String(limit));
    }

    const data = await requestJson(url.toString(), {
        method: 'GET',
        headers: withAuthHeaders()
    });
    return Array.isArray(data) ? data : [];
};

export const getUnreadNotificationCount = async () => {
    const data = await requestJson(`${API_BASE_URL}/notifications/unread-count`, {
        method: 'GET',
        headers: withAuthHeaders()
    });

    if (data && typeof data === 'object' && typeof data.count === 'number') {
        return data.count;
    }
    return 0;
};

export const markNotificationAsRead = async (id) => {
    if (!id) throw new Error('Missing notification id');
    await requestJson(`${API_BASE_URL}/notifications/${id}/read`, {
        method: 'PATCH',
        headers: withAuthHeaders()
    });
    return true;
};

export const markAllNotificationsAsRead = async () => {
    await requestJson(`${API_BASE_URL}/notifications/read-all`, {
        method: 'PATCH',
        headers: withAuthHeaders()
    });
    return true;
};
