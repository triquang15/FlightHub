package com.triquang.client;

import org.springframework.stereotype.Component;

import com.triquang.payload.response.AircraftResponse;
import com.triquang.payload.response.AirlineResponse;

@Component
public class AirlineClientFallback implements AirlineClient {

    @Override
    public AirlineResponse getAirlineByOwner(Long userId) {
        return null;
    }

    @Override
    public AircraftResponse getAircraftById(Long id) {
        return null;
    }
}
