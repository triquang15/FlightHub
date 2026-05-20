package com.triquang.payload.request;

import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import lombok.*;

import com.triquang.embeddable.Address;
import com.triquang.embeddable.GeoCode;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AirportRequest {

    @NotBlank(message = "IATA code is mandatory")
    @Pattern(
        regexp = "^[A-Za-z]{3}$",
        message = "IATA code must be exactly 3 letters"
    )
    private String iataCode;

    @NotBlank(message = "Airport name is mandatory")
    private String name;

    @Pattern(
        regexp = "^[A-Za-z]+/[A-Za-z_]+$",
        message = "Invalid timezone format (e.g., Asia/Ho_Chi_Minh)"
    )
    private String timeZone;

    @Valid
    private Address address;

    @NotNull(message = "City ID is mandatory")
    private Long cityId;

    @Valid
    private GeoCode geoCode;
}