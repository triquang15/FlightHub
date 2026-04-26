package com.triquang.payload.request;

import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

import com.triquang.enums.RecurrenceType;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FlightScheduleRequest {

    @NotNull(message = "Flight ID is required")
    private Long flightId;

    private Long departureAirportId;

    private Long arrivalAirportId;

    @NotNull(message = "Departure time is required")
    private LocalTime departureTime;

    @NotNull(message = "Arrival time is required")
    private LocalTime arrivalTime;

    @NotNull(message = "Start date is required")
    private LocalDate startDate;

    @NotNull(message = "End date is required")
    private LocalDate endDate;

    private RecurrenceType recurrenceType;

    private List<DayOfWeek> operatingDays;

    private Boolean isActive;
}
