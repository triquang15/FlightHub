package com.triquang.service;

import java.util.List;

import com.triquang.payload.request.AircraftRequest;
import com.triquang.payload.response.AircraftResponse;

public interface AircraftService {

	AircraftResponse getAircraftById(Long id);

	List<AircraftResponse> listAllAircraftsByOwner(Long ownerId);

	AircraftResponse createAircraft(AircraftRequest request, Long ownerId);

	AircraftResponse updateAircraft(Long id, AircraftRequest request, Long ownerId);

	void deleteAircraft(Long id);
}
