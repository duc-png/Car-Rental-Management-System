import { buildInvalidImageFilesMessage, splitImageFiles } from '../utils/imageFileValidation';

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
    // Some endpoints return raw arrays (e.g. uploadImages)
    if (Array.isArray(data)) return data;
    if (typeof data === 'object' && 'result' in data) return data.result;
    return data;
};

const getAuthToken = () => localStorage.getItem('token');

const withAuthHeaders = (headers = {}) => {
    const token = getAuthToken();
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

export const listOwnerVehicles = async (ownerId) => {
    if (!ownerId) return [];
    const data = await requestJson(`${API_BASE_URL}/vehicles?ownerId=${ownerId}`);
    return data || [];
};

export const getVehicleDetail = async (vehicleId) => {
    if (!vehicleId) return null;
    const data = await requestJson(`${API_BASE_URL}/vehicles/${vehicleId}`);
    return data || null;
};

const formatLocalDateTime = (date) => {
    const pad = (value) => String(value).padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
};

export const getVehicleCalendar = async (vehicleId, from, to) => {
    if (!vehicleId) return null;
    if (!(from instanceof Date) || Number.isNaN(from.getTime())) {
        throw new Error('Invalid from date');
    }
    if (!(to instanceof Date) || Number.isNaN(to.getTime())) {
        throw new Error('Invalid to date');
    }

    const query = new URLSearchParams({
        from: formatLocalDateTime(from),
        to: formatLocalDateTime(to),
    });

    const data = await requestJson(`${API_BASE_URL}/vehicles/${vehicleId}/calendar?${query.toString()}`);
    return data || null;
};

export const createOwnerVehicle = async (payload) => {
    if (!payload?.ownerId) throw new Error('Missing ownerId');
    const data = await requestJson(`${API_BASE_URL}/vehicles`, {
        method: 'POST',
        headers: withAuthHeaders({
            'Content-Type': 'application/json'
        }),
        body: JSON.stringify(payload)
    });
    return data || null;
};

export const updateOwnerVehicle = async (vehicleId, ownerId, payload) => {
    if (!vehicleId || !ownerId) throw new Error('Missing vehicleId/ownerId');
    const data = await requestJson(`${API_BASE_URL}/vehicles/${vehicleId}?ownerId=${ownerId}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            ...withAuthHeaders()
        },
        body: JSON.stringify(payload)
    });
    return data || null;
};

export const updateOwnerVehicleStatus = async (vehicleId, ownerId, status) => {
    if (!vehicleId || !ownerId) throw new Error('Missing vehicleId/ownerId');
    const data = await requestJson(`${API_BASE_URL}/vehicles/${vehicleId}/status?ownerId=${ownerId}`, {
        method: 'PATCH',
        headers: {
            'Content-Type': 'application/json',
            ...withAuthHeaders()
        },
        body: JSON.stringify({ status })
    });
    return data || null;
};

export const deleteOwnerVehicle = async (vehicleId, ownerId) => {
    if (!vehicleId || !ownerId) throw new Error('Missing vehicleId/ownerId');
    await requestJson(`${API_BASE_URL}/vehicles/${vehicleId}?ownerId=${ownerId}`, {
        method: 'DELETE',
        headers: withAuthHeaders()
    });
    return true;
};

export const addVehicleImagesByUrl = async (vehicleId, ownerId, { imageUrls, setFirstAsMain = false }) => {
    if (!vehicleId || !ownerId) throw new Error('Missing vehicleId/ownerId');
    const data = await requestJson(`${API_BASE_URL}/vehicles/${vehicleId}/images?ownerId=${ownerId}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            ...withAuthHeaders()
        },
        body: JSON.stringify({ imageUrls, setFirstAsMain })
    });
    return data || [];
};

export const setMainVehicleImage = async (vehicleId, ownerId, imageId) => {
    if (!vehicleId || !ownerId || !imageId) throw new Error('Missing vehicleId/ownerId/imageId');
    const data = await requestJson(`${API_BASE_URL}/vehicles/${vehicleId}/images/${imageId}/main?ownerId=${ownerId}`, {
        method: 'PATCH',
        headers: withAuthHeaders()
    });
    return data || [];
};

export const deleteVehicleImage = async (vehicleId, ownerId, imageId) => {
    if (!vehicleId || !ownerId || !imageId) throw new Error('Missing vehicleId/ownerId/imageId');
    await requestJson(`${API_BASE_URL}/vehicles/${vehicleId}/images/${imageId}?ownerId=${ownerId}`, {
        method: 'DELETE',
        headers: withAuthHeaders()
    });
    return true;
};

export const uploadVehicleImages = async (vehicleId, ownerId, files, { setFirstAsMain = false } = {}) => {
    if (!vehicleId || !ownerId) throw new Error('Missing vehicleId/ownerId');
    if (!files || files.length === 0) return [];

    const { validFiles, invalidFiles } = splitImageFiles(files);
    if (invalidFiles.length > 0) {
        throw new Error(buildInvalidImageFilesMessage(invalidFiles));
    }
    if (validFiles.length === 0) {
        throw new Error('Vui long chon it nhat 1 file anh hop le.');
    }

    const formData = new FormData();
    for (const file of validFiles) {
        formData.append('files', file);
    }

    const url = new URL(`${API_BASE_URL}/vehicles/${vehicleId}/images/upload`);
    url.searchParams.set('ownerId', String(ownerId));
    if (setFirstAsMain) {
        url.searchParams.set('setFirstAsMain', 'true');
    }

    const response = await fetch(url.toString(), {
        method: 'POST',
        headers: withAuthHeaders(),
        body: formData
    });

    const data = await parseJson(response);
    if (!response.ok) {
        const message =
            (data && typeof data === 'object' && (data.message || data.error))
                ? (data.message || data.error)
                : `API Error: ${response.status}`;
        throw new Error(message);
    }

    // upload endpoint returns raw array
    return unwrapApiResponse(data) || [];
};
