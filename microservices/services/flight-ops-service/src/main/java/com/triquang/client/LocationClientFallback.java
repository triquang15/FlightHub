package com.triquang.client;

import org.springframework.stereotype.Component;

import com.triquang.payload.response.AirportResponse;
import com.triquang.payload.response.ApiResponse;

@Component
public class LocationClientFallback implements LocationClient {

    @Override
    public ApiResponse<AirportResponse> getAirportByIdResponse(Long id) {
        return null;
    }
}
