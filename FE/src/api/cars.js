// API calls for car data
const API_BASE_URL = 'http://localhost:8080/api/v1';

const toIsoLocalDateTime = (dateString, timeString = '09:00') => {
  if (!dateString) return null;
  const parts = dateString.split('/');
  if (parts.length !== 3) return null;

  const day = Number(parts[0]);
  const month = Number(parts[1]);
  const year = Number(parts[2]);

  if (!day || !month || !year) return null;

  const [hoursRaw, minutesRaw] = (timeString || '09:00').split(':');
  const hours = Number(hoursRaw);
  const minutes = Number(minutesRaw);

  const date = new Date(year, month - 1, day, Number.isNaN(hours) ? 9 : hours, Number.isNaN(minutes) ? 0 : minutes, 0);
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  const hh = String(date.getHours()).padStart(2, '0');
  const min = String(date.getMinutes()).padStart(2, '0');

  return `${yyyy}-${mm}-${dd}T${hh}:${min}:00`;
};

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

export const searchCars = async ({ address, pickupDate, returnDate, pickupTime, returnTime }) => {
  try {
    const from = toIsoLocalDateTime(pickupDate, pickupTime || '09:00');
    const to = toIsoLocalDateTime(returnDate, returnTime || '09:00');

    if (!from || !to) {
      return [];
    }

    const response = await fetch(`${API_BASE_URL}/vehicles/search`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        address: address?.trim() || null,
        from,
        to
      })
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`);
    }

    const data = await response.json();
    return data.result || [];
  } catch (error) {
    console.error('[v0] Error searching cars:', error);
    return [];
  }
};
