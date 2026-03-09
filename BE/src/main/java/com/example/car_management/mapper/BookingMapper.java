package com.example.car_management.mapper;

import com.example.car_management.dto.response.BookedPeriodResponse;
import com.example.car_management.dto.response.BookingResponse;
import com.example.car_management.entity.BookingEntity;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

import java.util.List;

@Mapper(componentModel = "spring")
public interface BookingMapper {

    @Mapping(target = "vehicleId", source = "vehicle.id")
    @Mapping(target = "vehicleName", expression = "java(booking.getVehicle().getModel().getBrand().getName() + \" \" + booking.getVehicle().getModel().getName())")
    @Mapping(target = "vehicleImage", expression = "java(booking.getVehicle().getImages().stream().filter(img -> img.getIsMain() != null && img.getIsMain()).findFirst().map(img -> img.getImageUrl()).orElse(booking.getVehicle().getImages().isEmpty() ? null : booking.getVehicle().getImages().get(0).getImageUrl()))")
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
}
