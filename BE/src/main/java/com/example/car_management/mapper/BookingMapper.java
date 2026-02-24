package com.example.car_management.mapper;

import com.example.car_management.dto.response.BookedPeriodResponse;
import com.example.car_management.dto.response.BookingResponse;
import com.example.car_management.entity.BookingEntity;
import com.example.car_management.entity.VehicleEntity;
import com.example.car_management.entity.VehicleImageEntity;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

import java.util.List;

@Mapper(componentModel = "spring")
public interface BookingMapper {

    @Mapping(target = "vehicleId", source = "vehicle.id")
    @Mapping(target = "vehicleName", expression = "java(buildVehicleName(booking))")
    @Mapping(target = "vehicleImage", expression = "java(resolveVehicleImageUrl(booking.getVehicle()))")
    @Mapping(target = "renterId", source = "customer.id")
    @Mapping(target = "renterName", source = "customer.fullName")
    @Mapping(target = "renterEmail", source = "customer.email")
    @Mapping(target = "ownerId", source = "vehicle.owner.id")
    @Mapping(target = "ownerName", source = "vehicle.owner.fullName")
    @Mapping(target = "ownerPhone", source = "vehicle.owner.phone")
    BookingResponse toResponse(BookingEntity booking);

    List<BookingResponse> toResponseList(List<BookingEntity> bookings);

    @Mapping(target = "bookingId", source = "id")
    BookedPeriodResponse toBookedPeriodResponse(BookingEntity booking);

    List<BookedPeriodResponse> toBookedPeriodResponseList(List<BookingEntity> bookings);

    // ===== helper methods =====

    default String buildVehicleName(BookingEntity booking) {
        if (booking == null) return null;
        VehicleEntity v = booking.getVehicle();
        if (v == null || v.getModel() == null) return null;

        String brand = (v.getModel().getBrand() != null ? v.getModel().getBrand().getName() : null);
        String model = v.getModel().getName();

        if (brand == null && model == null) return null;
        if (brand == null) return model;
        if (model == null) return brand;
        return brand + " " + model;
    }

    default String resolveVehicleImageUrl(VehicleEntity v) {
        if (v == null || v.getImages() == null || v.getImages().isEmpty()) return null;

        // ưu tiên ảnh main
        for (VehicleImageEntity img : v.getImages()) {
            if (img != null && Boolean.TRUE.equals(img.getIsMain()) && img.getImageUrl() != null) {
                return img.getImageUrl();
            }
        }

        // fallback ảnh đầu tiên có url
        for (VehicleImageEntity img : v.getImages()) {
            if (img != null && img.getImageUrl() != null) return img.getImageUrl();
        }

        return null;
    }
}
