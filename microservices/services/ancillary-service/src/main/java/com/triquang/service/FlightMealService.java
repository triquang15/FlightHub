package com.triquang.service;

import java.util.List;

import com.triquang.payload.request.FlightMealRequest;
import com.triquang.payload.response.FlightMealResponse;

public interface FlightMealService {

	FlightMealResponse create(FlightMealRequest request);

	List<FlightMealResponse> bulkCreate(List<FlightMealRequest> requests);

	FlightMealResponse getById(Long id);

	List<FlightMealResponse> getByFlightId(Long flightId);

	List<FlightMealResponse> getAllByIds(List<Long> Ids);

	FlightMealResponse update(Long id, FlightMealRequest request);

	void delete(Long id);

	FlightMealResponse updateAvailability(Long id, Boolean available);

	Double calculateMealPrice(List<Long> mealIds);
}
