package com.triquang.mapper;

import com.triquang.enums.FlightStatus;
import com.triquang.model.Flight;
import com.triquang.model.FlightInstance;
import com.triquang.payload.request.FlightInstanceRequest;
import com.triquang.payload.response.AircraftResponse;
import com.triquang.payload.response.AirlineResponse;
import com.triquang.payload.response.AirportResponse;
import com.triquang.payload.response.FlightInstanceResponse;

public class FlightInstanceMapper {

    public static FlightInstance toEntity(FlightInstanceRequest request, Flight flight) {
        if (request == null) return null;
        return FlightInstance.builder()
                .flight(flight)
                .airlineId(request.getAirlineId() != null ? request.getAirlineId() : flight.getAirlineId())
                .scheduleId(request.getScheduleId())
                .departureAirportId(request.getDepartureAirportId() != null ?
                        request.getDepartureAirportId() : flight.getDepartureAirportId())
                .arrivalAirportId(request.getArrivalAirportId() != null ?
                        request.getArrivalAirportId() : flight.getArrivalAirportId())
                .departureDateTime(request.getDepartureDateTime())
                .arrivalDateTime(request.getArrivalDateTime())
                .totalSeats(request.getTotalSeats())
                .availableSeats(request.getAvailableSeats() != null ?
                        request.getAvailableSeats() : request.getTotalSeats())
                .status(FlightStatus.SCHEDULED)
                .minAdvanceBookingDays(request.getMinAdvanceBookingDays())
                .maxAdvanceBookingDays(request.getMaxAdvanceBookingDays())
                .isActive(request.getIsActive() != null ? request.getIsActive() : true)
                .terminal(request.getTerminal())
                .gate(request.getGate())
                .build();
    }

    public static FlightInstanceResponse toResponse(FlightInstance fi,
                                                    AircraftResponse aircraftResponse,
                                                    AirlineResponse airline,
                                                    AirportResponse departureAirport,
                                                    AirportResponse arrivalAirport) {
        if (fi == null) return null;
        Flight flight = fi.getFlight();
        return FlightInstanceResponse.builder()
                .id(fi.getId())
                .flightId(flight != null ? flight.getId() : null)
                .scheduleId(fi.getScheduleId())
                .flightNumber(flight != null ? flight.getFlightNumber() : null)
                .aircraftId(flight != null ? flight.getAircraftId() : null)
                .aircraftModal(aircraftResponse != null ? aircraftResponse.getModel() : null)
                .aircraftCode(aircraftResponse != null ? aircraftResponse.getCode() : null)
                .airlineId(fi.getAirlineId())
                .airlineName(airline != null ? airline.getName() : null)
                .airlineLogo(airline != null ? airline.getLogoUrl() : null)
                .departureAirport(departureAirport)
                .arrivalAirport(arrivalAirport)
                .departureDateTime(fi.getDepartureDateTime())
                .arrivalDateTime(fi.getArrivalDateTime())
                .formattedDuration(fi.getFormattedDuration())
                .totalSeats(fi.getTotalSeats())
                .availableSeats(fi.getAvailableSeats())
                .status(fi.getStatus())
                .minAdvanceBookingDays(fi.getMinAdvanceBookingDays())
                .maxAdvanceBookingDays(fi.getMaxAdvanceBookingDays())
                .isActive(fi.getIsActive())
                .terminal(fi.getTerminal())
                .gate(fi.getGate())
                .version(fi.getVersion())
                .build();
    }

    public static void updateEntity(FlightInstanceRequest request, FlightInstance existing) {
        if (request == null || existing == null) return;
        if (request.getDepartureAirportId() != null) existing.setDepartureAirportId(request.getDepartureAirportId());
        if (request.getArrivalAirportId() != null) existing.setArrivalAirportId(request.getArrivalAirportId());
        if (request.getDepartureDateTime() != null) existing.setDepartureDateTime(request.getDepartureDateTime());
        if (request.getArrivalDateTime() != null) existing.setArrivalDateTime(request.getArrivalDateTime());
        if (request.getMinAdvanceBookingDays() != null) existing.setMinAdvanceBookingDays(request.getMinAdvanceBookingDays());
        if (request.getMaxAdvanceBookingDays() != null) existing.setMaxAdvanceBookingDays(request.getMaxAdvanceBookingDays());
        if (request.getIsActive() != null) existing.setIsActive(request.getIsActive());
        if (request.getTerminal() != null) existing.setTerminal(request.getTerminal());
        if (request.getGate() != null) existing.setGate(request.getGate());
    }
}
