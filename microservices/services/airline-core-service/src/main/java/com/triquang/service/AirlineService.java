package com.triquang.service;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import com.triquang.enums.AirlineStatus;
import com.triquang.payload.request.AirlineRequest;
import com.triquang.payload.response.AirlineDropdownItem;
import com.triquang.payload.response.AirlineResponse;

import java.util.List;

public interface AirlineService {

	// ----- CRUD -----
	AirlineResponse createAirline(AirlineRequest request, Long ownerId);

	AirlineResponse getAirlineByOwner(Long ownerId);

	AirlineResponse getAirlineById(Long id);

	Page<AirlineResponse> getAllAirlines(Pageable pageable);

	AirlineResponse updateAirline(AirlineRequest request, Long ownerId);

	void deleteAirline(Long id, Long ownerId);

	AirlineResponse changeStatusByAdmin(Long airlineId, AirlineStatus status);

	// ----- Dropdown -----
	List<AirlineDropdownItem> getAirlinesForDropdown();
}
