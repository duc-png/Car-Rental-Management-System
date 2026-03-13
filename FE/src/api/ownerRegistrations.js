import { buildInvalidImageFilesMessage, splitImageFiles } from '../utils/imageFileValidation';

const API_BASE_URL = 'http://localhost:8080/api/v1';

const parseApiError = async (response, fallbackMessage) => {
    const errorData = await response.json().catch(() => ({}));
    const error = new Error(errorData.message || fallbackMessage);
    if (typeof errorData.code === 'number') {
        error.code = errorData.code;
    }
    return error;
};

export const submitOwnerRegistration = async (payload, images) => {
    const formData = new FormData();
    const { validFiles, invalidFiles } = splitImageFiles(images || []);

    if (invalidFiles.length > 0) {
        throw new Error(buildInvalidImageFilesMessage(invalidFiles));
    }

    formData.append('data', new Blob([JSON.stringify(payload)], { type: 'application/json' }));

    validFiles.forEach((file) => {
        formData.append('images', file);
    });

    const token = localStorage.getItem('token');
    const headers = token ? { Authorization: `Bearer ${token}` } : undefined;

    const response = await fetch(`${API_BASE_URL}/owner-registrations`, {
        method: 'POST',
        headers,
        body: formData
    });

    if (!response.ok) {
        throw await parseApiError(response, 'Khong the gui yeu cau dang ky');
    }

    return response.json();
};

export const sendOwnerRegistrationEmailOtp = async () => {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE_URL}/owner-registrations/email-otp/send`, {
        method: 'POST',
        headers: {
            ...(token ? { Authorization: `Bearer ${token}` } : {})
        }
    });

    if (!response.ok) {
        throw await parseApiError(response, 'Khong the gui OTP');
    }

    return response.json();
};

export const verifyOwnerRegistrationEmailOtp = async (otp) => {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE_URL}/owner-registrations/email-otp/verify`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ otp })
    });

    if (!response.ok) {
        throw await parseApiError(response, 'OTP khong hop le');
    }

    return response.json();
};
