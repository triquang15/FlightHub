package com.triquang.service.impl;

import feign.FeignException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import com.triquang.client.AirlineClient;
import com.triquang.enums.ErrorCode;
import com.triquang.exception.FlightException;
import com.triquang.payload.response.AircraftResponse;
import com.triquang.service.AirlineIntegrationService;

@Service
@RequiredArgsConstructor
public class AirlineIntegrationServiceImpl implements AirlineIntegrationService {

    private final AirlineClient airlineClient;

    // ---------- GET AIRLINE ID ----------
    @Override
    public Long getAirlineIdForUser(Long userId) {
        try {
            return airlineClient.getAirlineByOwner(userId).getId();

        } catch (FeignException.NotFound e) {
            throw new FlightException(ErrorCode.AIRLINE_NOT_FOUND);

        } catch (FeignException e) {
            throw new FlightException(ErrorCode.AIRLINE_SERVICE_UNAVAILABLE);
        }
    }

    // ---------- GET AIRCRAFT ----------
    @Override
    public AircraftResponse getAircraftById(Long aircraftId) {
        try {
            return airlineClient.getAircraftById(aircraftId);

        } catch (FeignException.NotFound e) {
            throw new FlightException(ErrorCode.AIRCRAFT_NOT_FOUND);

        } catch (FeignException e) {
            throw new FlightException(ErrorCode.AIRCRAFT_SERVICE_UNAVAILABLE);
        }
    }
}