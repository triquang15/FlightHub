package com.triquang.service;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import com.triquang.payload.request.FlightSearchRequest;
import com.triquang.payload.response.FlightInstanceResponse;

public interface FlightSearchService {

	Page<FlightInstanceResponse> searchFlights(FlightSearchRequest request, Pageable pageable);

}
