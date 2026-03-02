// API calls for booking data
const API_BASE_URL = 'http://localhost:8080/api/v1';

// Helper function to get auth token
const getAuthToken = () => localStorage.getItem('token');

// Helper function to make authenticated requests
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

/**
 * Tạo booking mới
 * @param {number} vehicleId - ID xe
 * @param {string} startDate - Ngày bắt đầu (ISO format)
 * @param {string} endDate - Ngày kết thúc (ISO format)
 */
export const createBooking = async (vehicleId, startDate, endDate) => {
    const data = await authFetch(`${API_BASE_URL}/bookings`, {
        method: 'POST',
        body: JSON.stringify({ vehicleId, startDate, endDate }),
    });
    return data.result;
};

/**
 * Lấy danh sách booking của user hiện tại
 */
export const getMyBookings = async () => {
    const data = await authFetch(`${API_BASE_URL}/bookings`);
    return data.result || [];
};

/**
 * Lấy danh sách ngày đã đặt của một xe cụ thể
 * @param {number} vehicleId - ID của xe
 */
export const getBookedDates = async (vehicleId) => {
    // This is public/semi-public info, so we can fetch it even without auth for displaying calendar
    // But since authFetch requires token in this file, we use standard fetch if we want it public
    // Assuming backend endpoint is public or user is already logged in when opening modal
    const response = await fetch(`${API_BASE_URL}/bookings/vehicle/${vehicleId}/booked-dates`);
    if (!response.ok) {
        throw new Error('Không thể tải lịch đặt xe');
    }
    const data = await response.json();
    return data.result || [];
};

/**
 * Lấy chi tiết 1 booking
 * @param {number} id - Booking ID
 */
export const getBookingById = async (id) => {
    const data = await authFetch(`${API_BASE_URL}/bookings/${id}`);
    return data.result;
};

/**
 * Cập nhật trạng thái booking (cho Owner)
 * @param {number} id - Booking ID
 * @param {string} status - CONFIRMED, ONGOING, COMPLETED, CANCELLED
 * @param {object} extraData - Optional extra fields (startKm, startFuelLevel, endKm, endFuelLevel, otherSurcharge, returnNotes)
 */
export const updateBookingStatus = async (id, status, extraData = {}) => {
    const data = await authFetch(`${API_BASE_URL}/bookings/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status, ...extraData }),
    });
    return data.result;
};

/**
 * Hủy booking (cho Renter)
 * @param {number} id - Booking ID
 */
export const cancelBooking = async (id) => {
    return updateBookingStatus(id, 'CANCELLED');
};
