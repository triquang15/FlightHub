package com.triquang.client;

import java.util.List;

import org.springframework.stereotype.Component;

import com.triquang.enums.ErrorCode;
import com.triquang.payload.request.SeatConfirmRequest;
import com.triquang.payload.request.SeatHoldRequest;
import com.triquang.payload.request.SeatReleaseRequest;
import com.triquang.payload.response.ApiResponse;
import com.triquang.payload.response.SeatHoldResponse;
import com.triquang.payload.response.SeatInstanceResponse;

@Component
public class SeatClientFallback implements SeatClient {

    @Override
    public ApiResponse<Double> calculateSeatPriceResponse(List<Long> seatInstanceIds) {
        return ApiResponse.error(ErrorCode.EXTERNAL_SERVICE_ERROR, "seat-service-fallback");
    }

    @Override
    public ApiResponse<List<SeatInstanceResponse>> getAllByIdsResponse(List<Long> ids) {
        return ApiResponse.error(ErrorCode.EXTERNAL_SERVICE_ERROR, "seat-service-fallback");
    }

    @Override
    public ApiResponse<SeatHoldResponse> holdSeatsResponse(SeatHoldRequest request) {
        return ApiResponse.error(ErrorCode.EXTERNAL_SERVICE_ERROR, "seat-service-fallback");
    }

    @Override
    public ApiResponse<List<SeatInstanceResponse>> releaseSeatsResponse(SeatReleaseRequest request) {
        return ApiResponse.error(ErrorCode.EXTERNAL_SERVICE_ERROR, "seat-service-fallback");
    }

    @Override
    public ApiResponse<List<SeatInstanceResponse>> confirmSeatsResponse(SeatConfirmRequest request) {
        return ApiResponse.error(ErrorCode.EXTERNAL_SERVICE_ERROR, "seat-service-fallback");
    }
}
