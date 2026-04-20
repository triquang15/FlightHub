package com.triquang.service;

import java.util.List;

import com.triquang.exception.AirportException;
import com.triquang.exception.CityException;
import com.triquang.payload.request.AirportRequest;
import com.triquang.payload.response.AirportResponse;

public interface AirportService {

	AirportResponse createAirport(AirportRequest request) throws AirportException, CityException;

	List<AirportResponse> createBulkAirports(List<AirportRequest> requests) throws AirportException, CityException;

	AirportResponse getAirportById(Long id);

	List<AirportResponse> getAllAirports();

	AirportResponse updateAirport(Long id, AirportRequest request) throws AirportException, CityException;

	void deleteAirport(Long id) throws AirportException;

	List<AirportResponse> getAirportsByCityId(Long cityId);
}
