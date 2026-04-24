package com.triquang.service;

import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import com.triquang.payload.request.CityRequest;
import com.triquang.payload.response.CityResponse;

public interface CityService {

	// ---------- Core CRUD ----------
	CityResponse createCity(CityRequest request);

	List<CityResponse> createBulkCities(List<CityRequest> requests);

	CityResponse getCityById(Long id);

	CityResponse updateCity(Long id, CityRequest request);

	void deleteCity(Long id);

	Page<CityResponse> getAllCities(Pageable pageable);

	// ---------- Search & Query ----------
	Page<CityResponse> searchCities(String keyword, Pageable pageable);

	Page<CityResponse> getCitiesByCountryCode(String countryCode, Pageable pageable);

	// ---------- Validation ----------
	boolean cityExists(String cityCode);

}
