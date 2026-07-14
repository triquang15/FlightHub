package com.triquang.service;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.web.multipart.MultipartFile;

import com.triquang.enums.AirlineStatus;
import com.triquang.payload.request.AirlineRequest;
import com.triquang.payload.response.AirlineDropdownItem;
import com.triquang.payload.response.AirlineResponse;

import java.util.List;
import java.util.Map;

public interface AirlineService {

	// ----- CRUD -----
	AirlineResponse createAirline(AirlineRequest request, Long ownerId);

	AirlineResponse getAirlineById(Long id);

	Map<Long, AirlineResponse> getAirlinesByIds(List<Long> ids);

	Page<AirlineResponse> getAllAirlines(Pageable pageable);

	Page<AirlineResponse> searchAdvanced(String keyword, AirlineStatus status, Pageable pageable);

	AirlineResponse changeStatusByAdmin(Long airlineId, AirlineStatus status);

	void rejectAirlineByAdmin(Long airlineId);

	// ----- Dropdown -----
	List<AirlineDropdownItem> getAirlinesForDropdown();

	List<AirlineResponse> getAirlinesByOwner(Long ownerId);

	AirlineResponse updateAirline(Long id, AirlineRequest request, Long ownerId);

	AirlineResponse updateLogo(Long id, Long ownerId, MultipartFile file);

	AirlineResponse deleteLogo(Long id, Long ownerId);

	void deleteAirline(Long id, Long ownerId);
}
