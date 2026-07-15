package com.triquang.message;

import java.time.LocalDateTime;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FlightScheduleChangedEvent {
    private String eventId;
    private Long flightInstanceId;
    private Long flightId;
    private Long airlineId;
    private String flightNumber;
    private String oldStatus;
    private String newStatus;
    private LocalDateTime oldDepartureDateTime;
    private LocalDateTime newDepartureDateTime;
    private LocalDateTime oldArrivalDateTime;
    private LocalDateTime newArrivalDateTime;
    private String oldGate;
    private String newGate;
    private String oldTerminal;
    private String newTerminal;
    private LocalDateTime changedAt;
}
