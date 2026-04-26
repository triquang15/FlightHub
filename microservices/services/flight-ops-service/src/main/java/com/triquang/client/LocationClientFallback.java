package com.triquang.client;

import org.springframework.stereotype.Component;

import com.triquang.payload.response.AirportResponse;

@Component
public class LocationClientFallback implements LocationClient {

    @Override
    public AirportResponse getAirportById(Long id) {
        return null;
    }
}
