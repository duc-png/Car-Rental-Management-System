package com.example.car_management.dto.request;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotBlank;
import lombok.*;

import java.util.List;

@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @Builder
public class AddVehicleImagesRequest {

    @NotEmpty
    private List<@NotBlank String> imageUrls;

    // nếu true thì set ảnh đầu tiên làm main (đơn giản cho BE)
    private Boolean setFirstAsMain;
}
