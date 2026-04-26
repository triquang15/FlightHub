package com.triquang.service;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import com.triquang.payload.request.FlightInstanceRequest;
import com.triquang.payload.response.FlightInstanceResponse;

public interface FlightInstanceService {

	FlightInstanceResponse createFlightInstanceWithCabins(Long userId, FlightInstanceRequest request);

	List<FlightInstanceResponse> getFlightInstances();

	FlightInstanceResponse getFlightInstanceById(Long id);

	Page<FlightInstanceResponse> getByAirlineId(Long airlineId, Long departureAirportId, Long arrivalAirportId,
			Long flightId, LocalDate onDate, Pageable pageable);

	FlightInstanceResponse updateFlightInstance(Long id, FlightInstanceRequest request);

	void deleteFlightInstance(Long id);

	Map<Long, FlightInstanceResponse> getFlightInstancesByIds(List<Long> ids);
}
