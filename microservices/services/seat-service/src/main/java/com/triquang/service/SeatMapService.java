package com.triquang.service;

import java.util.List;

import com.triquang.payload.request.SeatMapRequest;
import com.triquang.payload.response.SeatMapResponse;

public interface SeatMapService {

	SeatMapResponse createSeatMap(Long userId, SeatMapRequest request);

	List<SeatMapResponse> createSeatMaps(Long userId, List<SeatMapRequest> requests);

	SeatMapResponse getSeatMapById(Long id);

	SeatMapResponse getSeatMapsByCabinClass(Long cabinClassId);

	SeatMapResponse updateSeatMap(Long userId, Long id, SeatMapRequest request);

	void deleteSeatMap(Long id);
}
