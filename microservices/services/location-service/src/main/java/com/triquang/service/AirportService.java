package com.triquang.service;

import java.util.List;

import com.triquang.payload.request.AirportRequest;
import com.triquang.payload.response.AirportResponse;

public interface AirportService {

	AirportResponse createAirport(AirportRequest request);

	List<AirportResponse> createBulkAirports(List<AirportRequest> requests);

	AirportResponse getAirportById(Long id);

	List<AirportResponse> getAllAirports();

	AirportResponse updateAirport(Long id, AirportRequest request);

	void deleteAirport(Long id);

	List<AirportResponse> getAirportsByCityId(Long cityId);
}
