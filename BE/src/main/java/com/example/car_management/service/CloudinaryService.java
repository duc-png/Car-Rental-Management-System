//package com.example.car_management.service;
//
//import com.cloudinary.Cloudinary;
//import com.cloudinary.utils.ObjectUtils;
//import org.springframework.stereotype.Service;
//import org.springframework.web.multipart.MultipartFile;
//import com.example.car_management.exception.AppException;
//import com.example.car_management.exception.ErrorCode;
//
//
//import java.io.IOException;
//import java.util.ArrayList;
//import java.util.List;
//import java.util.Map;
//
//@Service
//public class CloudinaryService {
//
//    private static final String ROOT_FOLDER = "SWP391";
//
//    private final Cloudinary cloudinary;
//
//    public CloudinaryService(Cloudinary cloudinary) {
//        this.cloudinary = cloudinary;
//    }
//
//    /**
//     * Upload 1 image
//     */
//    public Map<String, Object> uploadImage(MultipartFile file, String subFolder) {
//        try {
//            String folderPath = buildFolderPath(subFolder);
//
//            return cloudinary.uploader().upload(
//                    file.getBytes(),
//                    ObjectUtils.asMap(
//                            "folder", folderPath,
//                            "resource_type", "image"
//                    )
//            );
//        } catch (IOException e) {
//            throw new AppException(ErrorCode.IMAGE_UPLOAD_FAILED);
//
//        }
//    }
//
//    /**
//     * Upload multiple images
//     */
//    public List<Map<String, Object>> uploadMultipleImages(
//            MultipartFile[] files,
//            String subFolder
//    ) {
//        List<Map<String, Object>> results = new ArrayList<>();
//
//        for (MultipartFile file : files) {
//            if (file == null || file.isEmpty()) continue;
//
//            results.add(uploadImage(file, subFolder));
//        }
//
//        if (results.isEmpty()) {
//            throw new AppException(ErrorCode.IMAGE_UPLOAD_FAILED);
//
//        }
//
//        return results;
//    }
//
//    /**
//     * Delete image by publicId
//     */
//    public void deleteImage(String publicId) {
//        try {
//            cloudinary.uploader().destroy(
//                    publicId,
//                    ObjectUtils.emptyMap()
//            );
//        } catch (IOException e) {
//            throw new AppException(ErrorCode.IMAGE_DELETE_FAILED);
//
//        }
//    }
//
//    private String buildFolderPath(String subFolder) {
//        if (subFolder == null || subFolder.isBlank()) {
//            return ROOT_FOLDER;
//        }
//        return ROOT_FOLDER + "/" + subFolder;
//    }
//}
