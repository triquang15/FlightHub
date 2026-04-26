package com.triquang.payload.response;

import lombok.*;

import java.time.LocalDateTime;

import com.triquang.enums.FlightStatus;

import jakarta.persistence.Version;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FlightInstanceResponse {

    private Long id;
    @Version
    private Long version;

    private Long flightId;
    private String flightNumber;

    private Long airlineId;
    private String airlineName;
    private String airlineLogo;
    private Long aircraftId;
    private String aircraftModal;
    private String aircraftCode;
    private AirportResponse departureAirport;
    private AirportResponse arrivalAirport;

    private LocalDateTime departureDateTime;
    private LocalDateTime arrivalDateTime;
    private String formattedDuration;

    private Integer totalSeats;
    private Integer availableSeats;

    private FlightStatus status;

    private Integer minAdvanceBookingDays;
    private Integer maxAdvanceBookingDays;
    private Boolean isActive;

    private String terminal;
    private String gate;

    private FareResponse fare;
}
