package com.triquang.payload.response;

import com.triquang.enums.CabinClassType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BookingLegResponse {
    private Long id;
    private Integer legOrder;
    private Long flightId;
    private Long flightInstanceId;
    private Long fareId;
    private CabinClassType cabinClass;
    private String flightNumber;
    private String departureAirport;
    private String arrivalAirport;
    private LocalDateTime departureTime;
    private LocalDateTime arrivalTime;
    private String flightDuration;
}
