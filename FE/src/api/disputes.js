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

export const createDispute = async (bookingId, reason, disputedAmount = null, customerProposedAmount = null) => {
    const data = await authFetch(`${API_BASE_URL}/disputes`, {
        method: 'POST',
        body: JSON.stringify({ bookingId, reason, disputedAmount, customerProposedAmount }),
    });
    return data.result;
};

export const getDispute = async (disputeId) => {
    const data = await authFetch(`${API_BASE_URL}/disputes/${disputeId}`);
    return data.result;
};

export const getDisputeByBooking = async (bookingId) => {
    const data = await authFetch(`${API_BASE_URL}/disputes/booking/${bookingId}`);
    return data.result;
};

export const getMyDisputes = async () => {
    const data = await authFetch(`${API_BASE_URL}/disputes/my`);
    return data.result || [];
};

export const startDiscussion = async (disputeId) => {
    const data = await authFetch(`${API_BASE_URL}/disputes/${disputeId}/start-discussion`, {
        method: 'POST',
    });
    return data.result;
};

export const resolveDispute = async (disputeId, finalAmount, resolutionNotes) => {
    const data = await authFetch(`${API_BASE_URL}/disputes/${disputeId}/resolve`, {
        method: 'POST',
        body: JSON.stringify({ finalAmount, resolutionNotes }),
    });
    return data.result;
};

export const acceptResolution = async (disputeId) => {
    const data = await authFetch(`${API_BASE_URL}/disputes/${disputeId}/accept`, {
        method: 'POST',
    });
    return data.result;
};

export const submitCounterOffer = async (disputeId, counterAmount, counterReason) => {
    const data = await authFetch(`${API_BASE_URL}/disputes/${disputeId}/counter-offer`, {
        method: 'POST',
        body: JSON.stringify({ counterAmount, counterReason }),
    });
    return data.result;
};
