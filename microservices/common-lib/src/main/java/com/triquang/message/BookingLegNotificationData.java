package com.triquang.message;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BookingLegNotificationData {

    private Integer legOrder;
    private String label;
    private String flightNumber;
    private String airlineName;
    private String aircraftModel;
    private String cabinClass;
    private String fareName;

    private String departureAirportCode;
    private String departureAirportName;
    private String departureCity;
    private String departureCountry;
    private String departureTerminal;
    private String departureGate;
    private String departureDate;
    private String departureTime;

    private String arrivalAirportCode;
    private String arrivalAirportName;
    private String arrivalCity;
    private String arrivalCountry;
    private String arrivalDate;
    private String arrivalTime;

    private String duration;
}
