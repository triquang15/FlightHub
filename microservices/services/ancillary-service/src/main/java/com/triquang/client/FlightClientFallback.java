package com.triquang.client;

import org.springframework.stereotype.Component;

import com.triquang.payload.response.ApiResponse;
import com.triquang.payload.response.FlightResponse;

@Component
public class FlightClientFallback implements FlightClient {

    @Override
    public ApiResponse<FlightResponse> getFlightByIdResponse(Long id) {
        return null;
    }
}
