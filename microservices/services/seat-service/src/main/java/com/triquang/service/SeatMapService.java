package com.triquang.service;

import java.util.List;

import com.triquang.payload.request.SeatMapRequest;
import com.triquang.payload.response.SeatMapResponse;

public interface SeatMapService {

	SeatMapResponse createSeatMap(Long userId, SeatMapRequest request) throws Exception;

	List<SeatMapResponse> createSeatMaps(Long userId, List<SeatMapRequest> requests) throws Exception;

	SeatMapResponse getSeatMapById(Long id);

	SeatMapResponse getSeatMapsByCabinClass(Long cabinClassId);

	SeatMapResponse updateSeatMap(Long userId, Long id, SeatMapRequest request);

	void deleteSeatMap(Long id) throws Exception;
}
