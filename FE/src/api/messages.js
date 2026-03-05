const API_BASE_URL = 'http://localhost:8080/api';

const getAuthToken = () => localStorage.getItem('token');

const authFetch = async (url, options = {}) => {
    const token = getAuthToken();
    if (!token) {
        throw new Error('Chưa đăng nhập!');
    }

    const response = await fetch(url, {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
            ...options.headers,
        },
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `API Error: ${response.status}`);
    }

    return response.json();
};

export const sendMessage = async (disputeId, content) => {
    const data = await authFetch(`${API_BASE_URL}/messages`, {
        method: 'POST',
        body: JSON.stringify({ disputeId, content }),
    });
    return data.result;
};

export const getMessagesByDispute = async (disputeId) => {
    const data = await authFetch(`${API_BASE_URL}/messages/dispute/${disputeId}`);
    return data.result || [];
};

export const markMessagesAsRead = async (disputeId) => {
    const data = await authFetch(`${API_BASE_URL}/messages/dispute/${disputeId}/read`, {
        method: 'POST',
    });
    return data.result;
};

export const getUnreadCount = async () => {
    const data = await authFetch(`${API_BASE_URL}/messages/unread-count`);
    return data.result || 0;
};
