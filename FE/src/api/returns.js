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

export const submitReturnInspection = async (bookingId, inspectionData) => {
    const data = await authFetch(`${API_BASE_URL}/returns/${bookingId}/inspection`, {
        method: 'POST',
        body: JSON.stringify(inspectionData),
    });
    return data.result;
};

export const getReturnInspection = async (bookingId) => {
    const data = await authFetch(`${API_BASE_URL}/returns/${bookingId}`);
    return data.result;
};

export const confirmReturnFees = async (bookingId) => {
    const data = await authFetch(`${API_BASE_URL}/returns/${bookingId}/confirm`, {
        method: 'POST',
    });
    return data.result;
};

export const FUEL_LEVELS = [
    { value: 'EMPTY', label: 'Empty (0%)', percentage: 0 },
    { value: 'QUARTER', label: '1/4 (25%)', percentage: 25 },
    { value: 'HALF', label: '1/2 (50%)', percentage: 50 },
    { value: 'THREE_QUARTERS', label: '3/4 (75%)', percentage: 75 },
    { value: 'FULL', label: 'Full (100%)', percentage: 100 },
];
