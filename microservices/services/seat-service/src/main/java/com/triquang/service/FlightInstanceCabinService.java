package com.triquang.service;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import com.triquang.payload.request.FlightInstanceCabinRequest;
import com.triquang.payload.response.FlightInstanceCabinResponse;

public interface FlightInstanceCabinService {

	FlightInstanceCabinResponse createFlightInstanceCabin(FlightInstanceCabinRequest request);

	FlightInstanceCabinResponse getFlightInstanceCabinById(Long id);

	Page<FlightInstanceCabinResponse> getByFlightInstanceId(Long flightInstanceId, Pageable pageable);

	FlightInstanceCabinResponse getByFlightInstanceIdAndCabinClassId(Long flightInstanceId, Long cabinClassId);

	FlightInstanceCabinResponse updateFlightInstanceCabin(Long id, FlightInstanceCabinRequest request);

	void deleteFlightInstanceCabin(Long id);
}
