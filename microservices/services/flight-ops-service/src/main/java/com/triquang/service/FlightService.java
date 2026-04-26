package com.triquang.service;

import java.util.List;
import java.util.Map;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import com.triquang.enums.FlightStatus;
import com.triquang.payload.request.FlightRequest;
import com.triquang.payload.response.FlightResponse;

public interface FlightService {

	FlightResponse createFlight(Long userId, FlightRequest request);

	List<FlightResponse> createFlights(Long userId, List<FlightRequest> requests);

	FlightResponse getFlightById(Long id);

	FlightResponse getFlightByNumber(String flightNumber);

	Page<FlightResponse> getFlightsByAirline(Long userId, Long departureAirportId, Long arrivalAirportId,
			Pageable pageable);

	FlightResponse updateFlight(Long id, FlightRequest request);

	FlightResponse changeStatus(Long id, FlightStatus status);

	void deleteFlight(Long id);

	Map<Long, FlightResponse> getFlightsByIds(List<Long> ids);
}
