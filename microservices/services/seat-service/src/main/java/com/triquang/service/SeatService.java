package com.triquang.service;

import java.util.List;

import com.triquang.payload.request.SeatRequest;
import com.triquang.payload.response.SeatResponse;

public interface SeatService {

	void generateSeats(Long seatMapId);

	SeatResponse getSeatById(Long id);

	List<SeatResponse> getAll();

	SeatResponse updateSeat(Long id, SeatRequest request);

}
