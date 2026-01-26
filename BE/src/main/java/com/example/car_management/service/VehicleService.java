package com.example.car_management.service;

import com.example.car_management.dto.request.*;
import com.example.car_management.dto.response.*;

import java.time.LocalDateTime;
import java.util.List;

public interface VehicleService {
    VehicleResponse createVehicle(CreateVehicleRequest req);
    VehicleResponse getVehicleDetail(Integer id);
    List<VehicleResponse> listVehicles(Integer ownerId);
    VehicleResponse updateVehicle(Integer id, Integer ownerId, UpdateVehicleRequest req);
    void deleteVehicle(Integer id, Integer ownerId);
    VehicleResponse updateStatus(Integer id, Integer ownerId, UpdateVehicleStatusRequest req);

    AvailabilityResponse checkAvailability(Integer vehicleId, LocalDateTime from, LocalDateTime to);

    List<VehicleImageResponse> addImages(Integer vehicleId, Integer ownerId, AddVehicleImagesRequest req);
    List<VehicleImageResponse> setMainImage(Integer vehicleId, Integer ownerId, Integer imageId);
    void deleteImage(Integer vehicleId, Integer ownerId, Integer imageId);
}
