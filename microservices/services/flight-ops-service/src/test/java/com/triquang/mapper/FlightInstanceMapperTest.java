package com.triquang.mapper;

import static org.assertj.core.api.Assertions.assertThat;

import java.time.LocalDateTime;

import org.junit.jupiter.api.Test;

import com.triquang.enums.FlightStatus;
import com.triquang.model.Flight;
import com.triquang.model.FlightInstance;

class FlightInstanceMapperTest {

    @Test
    void mapsCoreInstanceWhenExternalEnrichmentIsUnavailable() {
        Flight flight = Flight.builder()
                .id(11L)
                .flightNumber("FH101")
                .aircraftId(22L)
                .build();
        FlightInstance instance = FlightInstance.builder()
                .id(33L)
                .flight(flight)
                .airlineId(44L)
                .scheduleId(55L)
                .departureAirportId(66L)
                .arrivalAirportId(77L)
                .departureDateTime(LocalDateTime.of(2026, 6, 14, 8, 0))
                .arrivalDateTime(LocalDateTime.of(2026, 6, 14, 10, 0))
                .totalSeats(180)
                .availableSeats(180)
                .status(FlightStatus.SCHEDULED)
                .isActive(true)
                .build();

        var response = FlightInstanceMapper.toResponse(instance, null, null, null, null);

        assertThat(response.getId()).isEqualTo(33L);
        assertThat(response.getFlightId()).isEqualTo(11L);
        assertThat(response.getFlightNumber()).isEqualTo("FH101");
        assertThat(response.getAircraftId()).isEqualTo(22L);
        assertThat(response.getAirlineId()).isEqualTo(44L);
        assertThat(response.getAircraftModal()).isNull();
        assertThat(response.getAirlineName()).isNull();
        assertThat(response.getDepartureAirport()).isNull();
        assertThat(response.getArrivalAirport()).isNull();
    }
}
