package com.example.car_management.mapper;

import com.example.car_management.dto.response.VehicleImageResponse;
import com.example.car_management.dto.response.VehicleResponse;
import com.example.car_management.entity.VehicleEntity;
import com.example.car_management.entity.VehicleImageEntity;

import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

public class VehicleMapper {

    private VehicleMapper() {}

    // Giữ nguyên: dùng khi entity đã fetch images (list/detail nếu bạn join fetch)
    public static VehicleResponse toResponse(VehicleEntity e) {
        if (e == null) return null;

        String modelName = (e.getModel() != null ? e.getModel().getName() : null);
        String brandName = (e.getModel() != null && e.getModel().getBrand() != null ? e.getModel().getBrand().getName() : null);
        String typeName  = (e.getModel() != null && e.getModel().getType() != null ? e.getModel().getType().getName() : null);

        Integer locationId = (e.getLocation() != null ? e.getLocation().getId() : null);

        return VehicleResponse.builder()
                .id(e.getId())
                .ownerId(e.getOwner() != null ? e.getOwner().getId() : null)
                .modelId(e.getModel() != null ? e.getModel().getId() : null)
                .modelName(modelName)
                .brandName(brandName)
                .carTypeName(typeName)
                .licensePlate(e.getLicensePlate())
                .color(e.getColor())
                .seatCount(e.getSeatCount())
                .transmission(e.getTransmission())
                .fuelType(e.getFuelType())
                .pricePerDay(e.getPricePerDay())
                .status(e.getStatus())
                .currentKm(e.getCurrentKm())
                .locationId(locationId)
                .city(e.getLocation() != null ? e.getLocation().getCity() : null)
                .district(e.getLocation() != null ? e.getLocation().getDistrict() : null)
                .addressDetail(e.getLocation() != null ? e.getLocation().getAddressDetail() : null)
                .images(toImageResponses(e.getImages()))
                .build();
    }

    // NEW: overload an toàn cho case orphanRemoval (update flow)
    public static VehicleResponse toResponse(VehicleEntity e, List<VehicleImageEntity> imgs) {
        if (e == null) return null;

        String modelName = (e.getModel() != null ? e.getModel().getName() : null);
        String brandName = (e.getModel() != null && e.getModel().getBrand() != null ? e.getModel().getBrand().getName() : null);
        String typeName  = (e.getModel() != null && e.getModel().getType() != null ? e.getModel().getType().getName() : null);

        Integer locationId = (e.getLocation() != null ? e.getLocation().getId() : null);

        return VehicleResponse.builder()
                .id(e.getId())
                .ownerId(e.getOwner() != null ? e.getOwner().getId() : null)
                .modelId(e.getModel() != null ? e.getModel().getId() : null)
                .modelName(modelName)
                .brandName(brandName)
                .carTypeName(typeName)
                .licensePlate(e.getLicensePlate())
                .color(e.getColor())
                .seatCount(e.getSeatCount())
                .transmission(e.getTransmission())
                .fuelType(e.getFuelType())
                .pricePerDay(e.getPricePerDay())
                .status(e.getStatus())
                .currentKm(e.getCurrentKm())
                .locationId(locationId)
                .city(e.getLocation() != null ? e.getLocation().getCity() : null)
                .district(e.getLocation() != null ? e.getLocation().getDistrict() : null)
                .addressDetail(e.getLocation() != null ? e.getLocation().getAddressDetail() : null)
                .images(toImageResponses(imgs)) // dùng list query, không động collection managed
                .build();
    }

    public static List<VehicleImageResponse> toImageResponses(List<VehicleImageEntity> imgs) {
        if (imgs == null || imgs.isEmpty()) return Collections.emptyList();
        return imgs.stream().map(VehicleMapper::toImageResponse).collect(Collectors.toList());
    }

    public static VehicleImageResponse toImageResponse(VehicleImageEntity img) {
        if (img == null) return null;
        return VehicleImageResponse.builder()
                .id(img.getId())
                .imageUrl(img.getImageUrl())
                .isMain(img.getIsMain())
                .build();
    }
    public static VehicleResponse toResponseWithImages(VehicleEntity e, List<VehicleImageEntity> imgs) {
        VehicleResponse res = toResponse(e);
        res.setImages(toImageResponses(imgs));
        return res;
    }
}
