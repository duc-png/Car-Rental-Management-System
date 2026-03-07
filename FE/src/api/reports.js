/**
 * Reporting & Analytics API.
 * Standard params: fromDate, toDate (yyyy-MM-dd), granularity (DAILY | WEEKLY | MONTHLY for stats).
 */
const API_URL = 'http://localhost:8080';

const buildHeaders = (token) => ({
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {})
});

/**
 * @param {string} [token] - JWT (nếu không truyền sẽ lấy từ localStorage)
 * @param {{ fromDate: string, toDate: string }} params - fromDate, toDate ISO date yyyy-MM-dd
 */
export const getRevenueReport = async (token, { fromDate, toDate }) => {
    const authToken = token || localStorage.getItem('token');
    if (!authToken) throw new Error('Chưa đăng nhập');
    const params = new URLSearchParams({ fromDate, toDate });
    const response = await fetch(`${API_URL}/api/v1/reports/revenue?${params}`, {
        method: 'GET',
        headers: buildHeaders(authToken)
    });
    if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.message || 'Không thể tải báo cáo doanh thu');
    }
    return response.json();
};

/**
 * @param {string} [token] - JWT (nếu không truyền sẽ lấy từ localStorage)
 * @param {{ fromDate: string, toDate: string }} params
 */
export const getUsageReport = async (token, { fromDate, toDate }) => {
    const authToken = token || localStorage.getItem('token');
    if (!authToken) throw new Error('Chưa đăng nhập');
    const params = new URLSearchParams({ fromDate, toDate });
    const response = await fetch(`${API_URL}/api/v1/reports/usage?${params}`, {
        method: 'GET',
        headers: buildHeaders(authToken)
    });
    if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.message || 'Không thể tải báo cáo sử dụng xe');
    }
    return response.json();
};

/**
 * @param {string} [token] - JWT (nếu không truyền sẽ lấy từ localStorage)
 * @param {{ fromDate: string, toDate: string, granularity?: string }} params - granularity: DAILY | WEEKLY | MONTHLY
 */
export const getBookingStats = async (token, { fromDate, toDate, granularity = 'DAILY' }) => {
    const authToken = token || localStorage.getItem('token');
    if (!authToken) throw new Error('Chưa đăng nhập');
    const params = new URLSearchParams({ fromDate, toDate, granularity });
    const response = await fetch(`${API_URL}/api/v1/reports/bookings/stats?${params}`, {
        method: 'GET',
        headers: buildHeaders(authToken)
    });
    if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.message || 'Không thể tải thống kê đặt chỗ');
    }
    return response.json();
};
