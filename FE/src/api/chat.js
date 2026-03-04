const API_BASE_URL = import.meta.env.VITE_API_V1_URL || 'http://localhost:8080/api/v1';

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
            Authorization: `Bearer ${token}`,
            ...options.headers
        }
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `API Error: ${response.status}`);
    }

    return response.json();
};

export const startConversationByVehicle = async (vehicleId) => {
    const data = await authFetch(`${API_BASE_URL}/chats/conversations/by-vehicle`, {
        method: 'POST',
        body: JSON.stringify({ vehicleId })
    });
    return data.result;
};

export const getMyConversations = async () => {
    const data = await authFetch(`${API_BASE_URL}/chats/conversations`);
    return data.result || [];
};

export const getConversationMessages = async (conversationId) => {
    const data = await authFetch(`${API_BASE_URL}/chats/conversations/${conversationId}/messages`);
    return data.result || [];
};

export const sendMessage = async (conversationId, content) => {
    const data = await authFetch(`${API_BASE_URL}/chats/conversations/${conversationId}/messages`, {
        method: 'POST',
        body: JSON.stringify({ content })
    });
    return data.result;
};
