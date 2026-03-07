package com.example.car_management.service.cloud;

import com.cloudinary.Cloudinary;
import com.example.car_management.exception.AppException;
import com.example.car_management.exception.ErrorCode;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.util.HashMap;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class CloudinaryService {

    private final Cloudinary cloudinary;
    private static final org.slf4j.Logger log = org.slf4j.LoggerFactory.getLogger(CloudinaryService.class);

    public String uploadVehicleImage(MultipartFile file, Integer vehicleId) {
        try {
            if (file == null || file.isEmpty()) {
                throw new AppException(ErrorCode.IMAGE_UPLOAD_FAILED);
            }

            String contentType = file.getContentType();
            if (contentType == null || !contentType.startsWith("image/")) {
                throw new AppException(ErrorCode.IMAGE_UPLOAD_FAILED);
            }

            Map<String, Object> options = new HashMap<>();
            options.put("folder", "car_management/vehicles/" + vehicleId);
            options.put("resource_type", "image");

            @SuppressWarnings("unchecked")
            Map<String, Object> res = cloudinary.uploader().upload(file.getBytes(), options);

            Object secureUrl = res.get("secure_url");
            if (secureUrl == null) {
                log.error("Cloudinary response missing secure_url. res={}", res);
                throw new AppException(ErrorCode.IMAGE_UPLOAD_FAILED);
            }
            return String.valueOf(secureUrl);

        } catch (AppException e) {
            throw e;
        } catch (Exception e) {
            log.error("Cloudinary upload failed: {}", e.getMessage(), e);
            throw new AppException(ErrorCode.IMAGE_UPLOAD_FAILED);
        }
    }

    public String uploadOwnerRegistrationImage(MultipartFile file, Integer requestId) {
        try {
            if (file == null || file.isEmpty()) {
                throw new AppException(ErrorCode.IMAGE_UPLOAD_FAILED);
            }

            String contentType = file.getContentType();
            if (contentType == null || !contentType.startsWith("image/")) {
                throw new AppException(ErrorCode.IMAGE_UPLOAD_FAILED);
            }

            Map<String, Object> options = new HashMap<>();
            options.put("folder", "car_management/owner-registrations/" + requestId);
            options.put("resource_type", "image");

            @SuppressWarnings("unchecked")
            Map<String, Object> res = cloudinary.uploader().upload(file.getBytes(), options);

            Object secureUrl = res.get("secure_url");
            if (secureUrl == null) {
                log.error("Cloudinary response missing secure_url. res={}", res);
                throw new AppException(ErrorCode.IMAGE_UPLOAD_FAILED);
            }
            return String.valueOf(secureUrl);

        } catch (AppException e) {
            throw e;
        } catch (Exception e) {
            log.error("Cloudinary upload failed: {}", e.getMessage(), e);
            throw new AppException(ErrorCode.IMAGE_UPLOAD_FAILED);
        }
    }

    public String uploadCustomerAvatar(MultipartFile file, Integer userId) {
        try {
            if (file == null || file.isEmpty()) {
                throw new AppException(ErrorCode.IMAGE_UPLOAD_FAILED);
            }

            String contentType = file.getContentType();
            if (contentType == null || !contentType.startsWith("image/")) {
                throw new AppException(ErrorCode.IMAGE_UPLOAD_FAILED);
            }

            Map<String, Object> options = new HashMap<>();
            options.put("folder", "car_management/users/" + userId + "/avatar");
            options.put("resource_type", "image");

            @SuppressWarnings("unchecked")
            Map<String, Object> res = cloudinary.uploader().upload(file.getBytes(), options);

            Object secureUrl = res.get("secure_url");
            if (secureUrl == null) {
                log.error("Cloudinary response missing secure_url. res={}", res);
                throw new AppException(ErrorCode.IMAGE_UPLOAD_FAILED);
            }

            return String.valueOf(secureUrl);
        } catch (AppException e) {
            throw e;
        } catch (Exception e) {
            log.error("Cloudinary upload failed: {}", e.getMessage(), e);
            throw new AppException(ErrorCode.IMAGE_UPLOAD_FAILED);
        }
    }

    public String uploadCustomerLicenseImage(MultipartFile file, Integer userId) {
        try {
            if (file == null || file.isEmpty()) {
                throw new AppException(ErrorCode.IMAGE_UPLOAD_FAILED);
            }

            String contentType = file.getContentType();
            if (contentType == null || !contentType.startsWith("image/")) {
                throw new AppException(ErrorCode.IMAGE_UPLOAD_FAILED);
            }

            Map<String, Object> options = new HashMap<>();
            options.put("folder", "car_management/users/" + userId + "/license");
            options.put("resource_type", "image");

            @SuppressWarnings("unchecked")
            Map<String, Object> res = cloudinary.uploader().upload(file.getBytes(), options);

            Object secureUrl = res.get("secure_url");
            if (secureUrl == null) {
                log.error("Cloudinary response missing secure_url. res={}", res);
                throw new AppException(ErrorCode.IMAGE_UPLOAD_FAILED);
            }

            return String.valueOf(secureUrl);
        } catch (AppException e) {
            throw e;
        } catch (Exception e) {
            log.error("Cloudinary upload failed: {}", e.getMessage(), e);
            throw new AppException(ErrorCode.IMAGE_UPLOAD_FAILED);
        }
    }
}
