package com.triquang.service;

import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;

import com.triquang.client.AirlineClient;
import com.triquang.client.LocationClient;
import com.triquang.payload.response.AircraftResponse;
import com.triquang.payload.response.AirlineResponse;
import com.triquang.payload.response.AirportResponse;

import feign.FeignException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Service
@RequiredArgsConstructor
@Slf4j
public class ReferenceDataService {

    private final AirlineClient airlineClient;
    private final LocationClient locationClient;

    @Cacheable(cacheNames = "referenceAirlines", key = "#airlineId", condition = "#airlineId != null", unless = "#result == null")
    public AirlineResponse getAirline(Long airlineId) {
        if (airlineId == null) {
            return null;
        }

        try {
            return airlineClient.getAirlineById(airlineId);
        } catch (FeignException e) {
            log.warn("Unable to resolve airline reference | airlineId={} status={}", airlineId, e.status());
            return null;
        }
    }

    @Cacheable(cacheNames = "referenceAircraft", key = "#aircraftId", condition = "#aircraftId != null", unless = "#result == null")
    public AircraftResponse getAircraft(Long aircraftId) {
        if (aircraftId == null) {
            return null;
        }

        try {
            return airlineClient.getAircraftById(aircraftId);
        } catch (FeignException e) {
            log.warn("Unable to resolve aircraft reference | aircraftId={} status={}", aircraftId, e.status());
            return null;
        }
    }

    @Cacheable(cacheNames = "referenceAirports", key = "#airportId", condition = "#airportId != null", unless = "#result == null")
    public AirportResponse getAirport(Long airportId) {
        if (airportId == null) {
            return null;
        }

        try {
            return locationClient.getAirportById(airportId);
        } catch (FeignException e) {
            log.warn("Unable to resolve airport reference | airportId={} status={}", airportId, e.status());
            return null;
        }
    }
}
