package com.triquang.client;

import java.util.List;

import org.springframework.stereotype.Component;

import com.triquang.payload.response.AirlineResponse;
import com.triquang.payload.response.ApiResponse;

@Component
public class AirlineClientFallback implements AirlineClient {

    @Override
    public ApiResponse<List<AirlineResponse>> getAirlinesByOwnerResponse(Long userId) {
        return null;
    }
}
