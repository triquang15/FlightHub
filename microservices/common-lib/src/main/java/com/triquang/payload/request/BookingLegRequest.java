package com.triquang.payload.request;

import com.triquang.enums.CabinClassType;
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
public class BookingLegRequest {

    @NotNull(message = "Flight ID is required")
    private Long flightId;

    @NotNull(message = "Flight Instance ID is required")
    private Long flightInstanceId;

    @NotNull(message = "Fare ID is required")
    private Long fareId;

    @NotNull(message = "Cabin class is required")
    private CabinClassType cabinClass;

    private Integer legOrder;
    private List<Long> seatInstanceIds;
    private String seatHoldToken;
}
