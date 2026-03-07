import { buildInvalidImageFilesMessage, splitImageFiles } from '../utils/imageFileValidation';

const API_BASE_URL = 'http://localhost:8080/api/v1';

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

    const response = await fetch(`${API_BASE_URL}/owner-registrations`, {
        method: 'POST',
        body: formData
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Khong the gui yeu cau dang ky');
    }

    return response.json();
};
