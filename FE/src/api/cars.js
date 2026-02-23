// API calls for car data
const API_BASE_URL = 'http://localhost:8080/api/v1';

const buildHeaders = (token) => ({
  'Content-Type': 'application/json',
  ...(token ? { Authorization: `Bearer ${token}` } : {}),
});

export const getCarsList = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/vehicles`);
    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`);
    }
    const data = await response.json();
    return data.result || [];
  } catch (error) {
    console.error('[v0] Error fetching cars:', error);
    return [];
  }
};

/** Danh sách xe của owner (cần đăng nhập). */
export const getOwnerVehicles = async (token, ownerId) => {
  if (!token) throw new Error('Chưa đăng nhập');
  const params = ownerId != null ? `?ownerId=${ownerId}` : '';
  const response = await fetch(`${API_BASE_URL}/vehicles${params}`, {
    method: 'GET',
    headers: buildHeaders(token),
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.message || 'Không thể tải danh sách xe');
  }
  const data = await response.json();
  return data.result || [];
};

export const getCarById = async (id) => {
  try {
    const response = await fetch(`${API_BASE_URL}/vehicles/${id}`);
    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`);
    }
    const data = await response.json();
    return data.result || null;
  } catch (error) {
    console.error('[v0] Error fetching car:', error);
    return null;
  }
};
