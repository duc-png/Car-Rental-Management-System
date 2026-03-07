package com.example.car_management.service;

import com.example.car_management.dto.response.OwnerProfileResponse;
import com.example.car_management.dto.response.OwnerPerformanceResponse;
import com.example.car_management.dto.response.OwnerPublicProfileResponse;

import java.util.List;

public interface OwnerService {
    List<OwnerProfileResponse> listOwners(Integer page, Integer size, String q);

    OwnerProfileResponse getOwnerProfile(Integer ownerId);

    OwnerPerformanceResponse getOwnerPerformance(Integer ownerId);

    OwnerPublicProfileResponse getOwnerPublicProfile(Integer ownerId);
}
