package com.triquang.payload.response;

import lombok.*;

import java.time.LocalDateTime;
import java.util.List;

import com.triquang.embeddable.ContactInfo;
import com.triquang.enums.BookingStatus;
import com.triquang.enums.PaymentStatus;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BookingResponse {

    private Long id;
    private String bookingReference;

    private Long userId;
    private String userName;
    private String userEmail;

    private Long flightId;
    private String flightNumber;
    private String flightName;
    private String departureAirport;
    private String arrivalAirport;
    private LocalDateTime departureTime;
    private LocalDateTime arrivalTime;

    private BookingStatus status;
    private LocalDateTime bookingDate;
    private LocalDateTime lastModified;

    private List<PassengerResponse> passengers;
    private List<SeatInstanceResponse> seatInstances;
    private PaymentLinkResponse payment;
    private List<FlightCabinAncillaryResponse> ancillaries;
    private List<FlightMealResponse> meals;
    private List<TicketResponse> tickets;

    // Payment details
    private PaymentStatus paymentStatus;
    private String paymentLink;

    private Long fareId;
    private String fareName;
    private Double fareBaseFare;
    private Double fareTaxesAndFees;
    private Double fareAirlineFees;

    private FareResponse fare;

    private Integer totalPassengers;
    private Double totalAmount;
    private String currency;

    private String specialRequests;
    private Boolean requiresWheelchairAssistance;
    private Boolean requiresSpecialMeals;

    // Flight duration and other derived information
    private String flightDuration;
    private Boolean isUpcoming;
    private Boolean isPast;

    private String airlineName;
    private String airlineLogo;

    private ContactInfo contactInfo;
}
