package com.triquang.message;

import java.time.LocalDateTime;
import java.util.List;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FlightScheduleChangedNotificationEvent {
    private String eventId;
    private Long bookingId;
    private String bookingReference;
    private Long userId;
    private String userName;
    private String contactEmail;
    private String contactPhone;
    private Long flightInstanceId;
    private String flightNumber;
    private String tripType;
    private List<BookingLegNotificationData> legs;
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
    private String manageBookingUrl;
}
