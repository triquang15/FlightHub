package com.triquang.payload.request;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SeatMapZoneRequest {

    @NotBlank(message = "Zone name is required")
    private String name;

    @NotNull(message = "Start row is required")
    @Positive
    private Integer startRow;

    @NotNull(message = "End row is required")
    @Positive
    private Integer endRow;

    @NotNull(message = "Left seats per row is required")
    @Min(0)
    private Integer leftSeatsPerRow;

    @NotNull(message = "Right seats per row is required")
    @Min(0)
    private Integer rightSeatsPerRow;

    @Min(1)
    private Integer seatsInLastRow;

    private Integer displayOrder;
}
