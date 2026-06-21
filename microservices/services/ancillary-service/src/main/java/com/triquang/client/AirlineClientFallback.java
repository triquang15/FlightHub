package com.triquang.client;

import org.springframework.stereotype.Component;

import com.triquang.payload.response.AirlineResponse;
import com.triquang.payload.response.ApiResponse;

import java.util.List;

@Component
public class AirlineClientFallback implements AirlineClient {

    @Override
    public ApiResponse<List<AirlineResponse>> getAirlinesByOwnerResponse(Long userId) {
        return null;
    }
}
