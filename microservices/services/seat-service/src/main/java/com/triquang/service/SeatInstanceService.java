package com.triquang.service;

import java.util.List;

import com.triquang.enums.SeatAvailabilityStatus;
import com.triquang.payload.request.SeatConfirmRequest;
import com.triquang.payload.request.SeatHoldRequest;
import com.triquang.payload.request.SeatInstanceRequest;
import com.triquang.payload.request.SeatReleaseRequest;
import com.triquang.payload.response.SeatHoldResponse;
import com.triquang.payload.response.SeatInstanceResponse;

public interface SeatInstanceService {

	SeatInstanceResponse createSeatInstance(SeatInstanceRequest request);

	SeatInstanceResponse getSeatInstanceById(Long id);

	List<SeatInstanceResponse> getSeatInstancesByFlightId(Long flightId);

	List<SeatInstanceResponse> getAvailableSeatsByFlightId(Long flightId);

	List<SeatInstanceResponse> getSeatInstancesByFlightInstanceId(Long flightInstanceId);

	List<SeatInstanceResponse> getAvailableSeatsByFlightInstanceId(Long flightInstanceId);

	List<SeatInstanceResponse> getAllByIds(List<Long> Ids);

	SeatInstanceResponse updateSeatInstanceStatus(Long id, SeatAvailabilityStatus status);

	SeatHoldResponse holdSeats(SeatHoldRequest request);

	List<SeatInstanceResponse> releaseSeats(SeatReleaseRequest request);

	List<SeatInstanceResponse> confirmSeats(SeatConfirmRequest request);

	Long countAvailableByFlightId(Long flightId);

	Long countAvailableByFlightInstanceId(Long flightInstanceId);

	Double calculateSeatPrice(List<Long> seatInstanceId);
}
