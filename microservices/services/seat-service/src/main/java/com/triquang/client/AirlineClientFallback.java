package com.triquang.client;

import java.util.Collections;
import java.util.List;

import org.springframework.stereotype.Component;

import com.triquang.payload.response.ApiResponse;
import com.triquang.payload.response.AircraftResponse;
import com.triquang.payload.response.AirlineResponse;

@Component
public class AirlineClientFallback implements AirlineClient {

    @Override
    public ApiResponse<List<AirlineResponse>> getAirlinesByOwnerResponse(Long userId) {
        return new ApiResponse<>(200, null, "FALLBACK", Collections.emptyList(), null, null);
    }

    @Override
    public AircraftResponse getAircraftById(Long id) {
        return null;
    }
}
