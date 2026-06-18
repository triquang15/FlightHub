package com.triquang.payload.request;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SeatHoldRequest {

    @NotNull(message = "Flight instance ID is required")
    private Long flightInstanceId;

    @NotEmpty(message = "At least one seat instance is required")
    private List<Long> seatInstanceIds;

    private Long userId;

    @Min(value = 1, message = "Hold duration must be at least 1 minute")
    @Max(value = 30, message = "Hold duration cannot exceed 30 minutes")
    private Integer holdMinutes;
}
