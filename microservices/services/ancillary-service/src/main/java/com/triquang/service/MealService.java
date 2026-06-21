package com.triquang.service;

import java.util.List;

import com.triquang.payload.request.MealRequest;
import com.triquang.payload.response.MealResponse;

public interface MealService {

	MealResponse create(Long userId, MealRequest request);

	List<MealResponse> bulkCreate(Long userId, List<MealRequest> requests);

	MealResponse getById(Long userId, Long id);

	List<MealResponse> getByAirlineId(Long userId);

	MealResponse update(Long userId, Long id, MealRequest request);

	void delete(Long userId, Long id);

	MealResponse updateAvailability(Long userId, Long id, Boolean available);

}
