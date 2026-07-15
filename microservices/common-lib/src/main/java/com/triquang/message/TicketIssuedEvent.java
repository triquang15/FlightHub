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
public class TicketIssuedEvent {
    private String eventId;
    private Long bookingId;
    private String bookingReference;
    private Long userId;
    private String userName;
    private String contactEmail;
    private String contactPhone;
    private String tripType;
    private String cabinClass;
    private List<BookingLegNotificationData> legs;
    private List<PassengerNotificationData> passengers;
    private LocalDateTime issuedAt;
    private String viewTicketUrl;
    private String manageBookingUrl;
}
