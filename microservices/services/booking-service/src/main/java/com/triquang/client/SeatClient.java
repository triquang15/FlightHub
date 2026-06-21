package com.triquang.client;

import java.util.List;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;

import com.triquang.enums.ErrorCode;
import com.triquang.exception.BaseException;
import com.triquang.payload.request.SeatConfirmRequest;
import com.triquang.payload.request.SeatHoldRequest;
import com.triquang.payload.request.SeatReleaseRequest;
import com.triquang.payload.response.ApiResponse;
import com.triquang.payload.response.SeatHoldResponse;
import com.triquang.payload.response.SeatInstanceResponse;

@FeignClient(name = "seat-service", fallback = SeatClientFallback.class)
public interface SeatClient {

	@PostMapping("/api/seat-instances/price/total")
	ApiResponse<Double> calculateSeatPriceResponse(@RequestBody List<Long> seatInstanceIds);

	default Double calculateSeatPrice(List<Long> seatInstanceIds) {
		return requireData(calculateSeatPriceResponse(seatInstanceIds));
	}

	@GetMapping("/api/seat-instances/all")
	ApiResponse<List<SeatInstanceResponse>> getAllByIdsResponse(@RequestParam List<Long> ids);

	default List<SeatInstanceResponse> getAllByIds(List<Long> ids) {
		return requireData(getAllByIdsResponse(ids));
	}

	@PostMapping("/api/seat-instances/hold")
	ApiResponse<SeatHoldResponse> holdSeatsResponse(@RequestBody SeatHoldRequest request);

	default SeatHoldResponse holdSeats(SeatHoldRequest request) {
		return requireData(holdSeatsResponse(request));
	}

	@PostMapping("/api/seat-instances/release")
	ApiResponse<List<SeatInstanceResponse>> releaseSeatsResponse(@RequestBody SeatReleaseRequest request);

	default List<SeatInstanceResponse> releaseSeats(SeatReleaseRequest request) {
		return requireData(releaseSeatsResponse(request));
	}

	@PostMapping("/api/seat-instances/confirm")
	ApiResponse<List<SeatInstanceResponse>> confirmSeatsResponse(@RequestBody SeatConfirmRequest request);

	default List<SeatInstanceResponse> confirmSeats(SeatConfirmRequest request) {
		return requireData(confirmSeatsResponse(request));
	}

	private static <T> T requireData(ApiResponse<T> response) {
		if (response == null || response.data() == null || response.errorCode() != null) {
			throw new BaseException(ErrorCode.EXTERNAL_SERVICE_ERROR);
		}
		return response.data();
	}

}
