const API_BASE_URL = import.meta.env.VITE_API_V1_URL || 'http://localhost:8080/api/v1';

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
