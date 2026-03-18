const API_BASE_URL = 'http://localhost:8080/api/v1';

const getAuthToken = () => localStorage.getItem('token');

const authFetch = async (url, options = {}) => {
    const token = getAuthToken();
    const response = await fetch(url, {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
            ...options.headers,
        },
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `API Error: ${response.status}`);
    }

    return response.json();
};

/**
 * Acquire a 10-minute viewing lock on a vehicle.
 */
export const acquireViewingLock = async (vehicleId) => {
    const data = await authFetch(`${API_BASE_URL}/vehicles/${vehicleId}/viewing-lock`, {
        method: 'POST',
    });
    return data?.result;
};

/**
 * Release the viewing lock on a vehicle.
 */
export const releaseViewingLock = async (vehicleId) => {
    const data = await authFetch(`${API_BASE_URL}/vehicles/${vehicleId}/viewing-lock`, {
        method: 'DELETE',
    });
    return data?.result;
};

/**
 * Get current lock status for a vehicle (public, no auth required).
 */
export const getViewingLockStatus = async (vehicleId) => {
    const data = await authFetch(`${API_BASE_URL}/vehicles/${vehicleId}/viewing-lock`);
    return data?.result;
};

