// API calls for car data
const API_BASE_URL = 'http://localhost:8081/api/v1';

export const getCarsList = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/vehicles`);
    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`);
    }
    const data = await response.json();
    console.log("[v0] Cars API Response:", data);
    return data.result || [];
  } catch (error) {
    console.error('[v0] Error fetching cars:', error);
    return [];
  }
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
