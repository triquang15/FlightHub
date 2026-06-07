package com.triquang.service;

import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import com.triquang.enums.AircraftStatus;
import com.triquang.payload.request.AircraftRequest;
import com.triquang.payload.response.AircraftFleetSummary;
import com.triquang.payload.response.AircraftResponse;

public interface AircraftService {

	AircraftResponse getAircraftById(Long id, Long requesterId, String roles);

	Page<AircraftResponse> searchAircraftsByOwner(
			Long ownerId,
			String search,
			AircraftStatus status,
			Pageable pageable);

	AircraftFleetSummary getFleetSummary(Long ownerId);

	List<AircraftResponse> listAircraftOptions(Long ownerId);

	AircraftResponse createAircraft(AircraftRequest request, Long ownerId);

	AircraftResponse updateAircraft(Long id, AircraftRequest request, Long ownerId);

	void deleteAircraft(Long id, Long ownerId);
}
