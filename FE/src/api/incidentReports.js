const API_BASE_URL = 'http://localhost:8080/api/v1';

const getAuthToken = () => localStorage.getItem('token');

const authFetch = async (url, options = {}) => {
    const token = getAuthToken();
    if (!token) {
        throw new Error('Chua dang nhap!');
    }
    const response = await fetch(url, {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
            ...options.headers,
        },
    });
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `API Error: ${response.status}`);
    }
    return response.json();
};

export const createIncidentReport = async (payload) => {
    const data = await authFetch(`${API_BASE_URL}/incident-reports`, {
        method: 'POST',
        body: JSON.stringify(payload),
    });
    return data.result;
};

export const getMyIncidentReports = async () => {
    const data = await authFetch(`${API_BASE_URL}/incident-reports/my`);
    return data.result || [];
};

export const getAdminIncidentReports = async () => {
    const data = await authFetch(`${API_BASE_URL}/incident-reports/admin`);
    return data.result || [];
};

export const decideIncidentReport = async (reportId, status, decisionNote) => {
    const data = await authFetch(`${API_BASE_URL}/incident-reports/${reportId}/decision`, {
        method: 'PATCH',
        body: JSON.stringify({ status, decisionNote }),
    });
    return data.result;
};

export const getOwnerIncidentReports = async () => {
    const data = await authFetch(`${API_BASE_URL}/incident-reports/owner`);
    return data.result || [];
};

export const submitIncidentReportAppeal = async (reportId, appealContent, evidenceUrls = []) => {
    const data = await authFetch(`${API_BASE_URL}/incident-reports/${reportId}/appeal`, {
        method: 'POST',
        body: JSON.stringify({ appealContent, evidenceUrls }),
    });
    return data.result;
};

export const reviewIncidentReportAppeal = async (reportId, approve, updatedStatus, decisionNote) => {
    const data = await authFetch(`${API_BASE_URL}/incident-reports/${reportId}/appeal/review`, {
        method: 'PATCH',
        body: JSON.stringify({ approve, updatedStatus, decisionNote }),
    });
    return data.result;
};
