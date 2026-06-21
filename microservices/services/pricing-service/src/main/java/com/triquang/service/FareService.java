package com.triquang.service;

import java.util.List;
import java.util.Map;

import com.triquang.model.Fare;
import com.triquang.payload.request.FareRequest;
import com.triquang.payload.response.FareResponse;

public interface FareService {

	FareResponse createFare(Long userId, FareRequest request);

	List<FareResponse> createFares(Long userId, List<FareRequest> requests);

	List<FareResponse> getFaresByAirlineOwner(Long userId);

	FareResponse getOwnedFareById(Long userId, Long id);

	FareResponse getFareById(Long id);

	List<FareResponse> getFaresByFlightIdAndCabinClassId(Long flightId, Long cabinClassId);

	FareResponse updateFare(Long userId, Long id, FareRequest request);

	void deleteFare(Long userId, Long id);

	List<Fare> getFares();

	Map<Long, FareResponse> getLowestFarePerFlight(List<Long> flightIds, Long cabinClassId);

	FareResponse getLowestFareForFlightAndCabin(Long flightId, Long cabinClassId);

	Map<Long, FareResponse> getFaresByIds(List<Long> ids);
}
