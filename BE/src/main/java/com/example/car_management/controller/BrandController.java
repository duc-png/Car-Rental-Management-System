package com.example.car_management.controller;

import com.example.car_management.dto.ApiResponse;
import com.example.car_management.dto.response.BrandResponse;
import com.example.car_management.repository.BrandRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Comparator;
import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/v1/brands")
public class BrandController {

    private final BrandRepository brandRepository;

    @GetMapping
    public ResponseEntity<ApiResponse<List<BrandResponse>>> list() {
        var brands = brandRepository.findAll();
        List<BrandResponse> data = brands.stream()
                .map(b -> BrandResponse.builder().id(b.getId()).name(b.getName()).build())
                .sorted(Comparator.comparing(item -> item.getName() == null ? "" : item.getName(), String.CASE_INSENSITIVE_ORDER))
                .toList();

        return ResponseEntity.ok(ApiResponse.<List<BrandResponse>>builder()
                .code(1000)
                .message("Success")
                .result(data)
                .build());
    }
}
