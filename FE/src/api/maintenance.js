const API_BASE_URL = 'http://localhost:8080/api/v1';

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
      ...options.headers,
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `API Error: ${response.status}`);
  }

  return response.json();
};

export const createMaintenanceRecord = async ({
  vehicleId,
  customerId,
  description,
  serviceType,
  odometerKm,
  scheduledAt,
}) => {
  const data = await authFetch(`${API_BASE_URL}/maintenance`, {
    method: 'POST',
    body: JSON.stringify({
      vehicleId,
      customerId,
      description,
      serviceType,
      odometerKm,
      scheduledAt,
    }),
  });
  return data.result;
};

export const getMaintenanceByVehicle = async (vehicleId) => {
  const data = await authFetch(`${API_BASE_URL}/maintenance?vehicleId=${vehicleId}`);
  return data.result || [];
};

export const updateMaintenanceStatus = async (id, payload) => {
  const data = await authFetch(`${API_BASE_URL}/maintenance/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
  return data.result;
};

export const addMaintenanceCostItem = async (id, payload) => {
  const data = await authFetch(`${API_BASE_URL}/maintenance/${id}/costs`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  return data.result;
};

