package com.triquang.service;

import java.util.List;

import com.triquang.enums.SeatAvailabilityStatus;
import com.triquang.payload.request.SeatInstanceRequest;
import com.triquang.payload.response.SeatInstanceResponse;

public interface SeatInstanceService {

	SeatInstanceResponse createSeatInstance(SeatInstanceRequest request);

	SeatInstanceResponse getSeatInstanceById(Long id);

	List<SeatInstanceResponse> getSeatInstancesByFlightId(Long flightId);

	List<SeatInstanceResponse> getAvailableSeatsByFlightId(Long flightId);

	List<SeatInstanceResponse> getAllByIds(List<Long> Ids);

	SeatInstanceResponse updateSeatInstanceStatus(Long id, SeatAvailabilityStatus status);

	Long countAvailableByFlightId(Long flightId);

	Double calculateSeatPrice(List<Long> seatInstanceId);
}
