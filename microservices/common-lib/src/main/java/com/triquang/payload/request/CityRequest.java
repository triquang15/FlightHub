package com.triquang.payload.request;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CityRequest {

    @NotBlank
    private String name;

    @NotBlank
    private String cityCode;

    @NotBlank
    private String countryCode;

    @NotBlank
    private String countryName;

    private String regionCode;

    @NotBlank(message = "Timezone is required")
    private String timeZone;   // Asia/Ho_Chi_Minh
}
