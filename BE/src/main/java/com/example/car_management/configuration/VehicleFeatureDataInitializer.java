package com.example.car_management.configuration;

import com.example.car_management.entity.VehicleFeatureEntity;
import com.example.car_management.repository.VehicleFeatureRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
@RequiredArgsConstructor
public class VehicleFeatureDataInitializer implements ApplicationRunner {

    private final VehicleFeatureRepository vehicleFeatureRepository;

    @Override
    public void run(ApplicationArguments args) {
        List<String> defaults = List.of(
                "Bản đồ",
                "Bluetooth",
                "Camera 360",
                "Camera cặp lề",
                "Camera hành trình",
                "Camera lùi",
                "Cảm biến lốp",
                "Cảm biến va chạm",
                "Cảnh báo tốc độ",
                "Cửa sổ trời",
                "Định vị GPS",
                "Ghế trẻ em",
                "Khe cắm USB",
                "Lốp dự phòng",
                "Màn hình DVD",
                "Nắp thùng xe bán tải",
                "ETC",
                "Túi khí an toàn");

        for (String name : defaults) {
            if (!vehicleFeatureRepository.existsByNameIgnoreCase(name)) {
                vehicleFeatureRepository.save(VehicleFeatureEntity.builder().name(name).build());
            }
        }
    }
}
