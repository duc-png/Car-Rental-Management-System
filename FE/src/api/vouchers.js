// API calls for voucher validation
const API_BASE_URL = 'http://localhost:8080/api/v1';

const getAuthToken = () => localStorage.getItem('token');

/**
 * Generate a unique 8-character voucher code
 * @returns {Promise<string>} The generated code
 */
export const generateVoucherCode = async () => {
    const token = getAuthToken();
    if (!token) throw new Error('Chưa đăng nhập!');

    const response = await fetch(`${API_BASE_URL}/vouchers/generate-code`, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${token}`,
        },
    });

    if (!response.ok) {
        throw new Error('Không thể tạo mã voucher');
    }

    const data = await response.json();
    return data.result.code;
};

/**
 * Create a new voucher (admin)
 * @param {{ code: string, discountPercent: number, quantity: number }} payload
 * @returns {Promise<object>} Created voucher info
 */
export const createVoucher = async ({ code, discountPercent, quantity }) => {
    const token = getAuthToken();
    if (!token) throw new Error('Chưa đăng nhập!');

    const response = await fetch(`${API_BASE_URL}/vouchers`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ code, discountPercent, quantity }),
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const code_num = errorData?.code;
        if (code_num === 7004) throw new Error('Mã voucher đã tồn tại');
        if (code_num === 7005) throw new Error('Giảm giá không được vượt quá 30%');
        throw new Error(errorData.message || 'Không thể tạo voucher');
    }

    const data = await response.json();
    return data.result;
};

/**
 * Validate a voucher code
 * @param {string} code - 8-character voucher code
 * @returns {Promise<{code: string, discountPercent: number, remainingUses: number, valid: boolean}>}
 */
export const validateVoucher = async (code) => {
    const token = getAuthToken();
    if (!token) {
        throw new Error('Chưa đăng nhập!');
    }

    const response = await fetch(`${API_BASE_URL}/vouchers/validate`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ code }),
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        // Map backend error codes to Vietnamese messages
        const code_num = errorData?.code;
        if (code_num === 7001) throw new Error('Mã giảm giá không tồn tại');
        if (code_num === 7002) throw new Error('Mã giảm giá đã hết lượt sử dụng');
        if (code_num === 7003) throw new Error('Mã giảm giá không hợp lệ');
        throw new Error(errorData.message || 'Không thể kiểm tra mã giảm giá');
    }

    const data = await response.json();
    return data.result;
};

