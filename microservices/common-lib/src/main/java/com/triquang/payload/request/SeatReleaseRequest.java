package com.triquang.payload.request;

import jakarta.validation.constraints.NotEmpty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SeatReleaseRequest {

    @NotEmpty(message = "At least one seat instance is required")
    private List<Long> seatInstanceIds;

    private String holdToken;
    private String bookingReference;
}
