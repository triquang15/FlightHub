package com.triquang.service.impl;

import org.springframework.stereotype.Service;

import com.triquang.client.AirlineClient;
import com.triquang.enums.ErrorCode;
import com.triquang.exception.BaseException;
import com.triquang.service.AirlineIntegrationService;

import feign.FeignException;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class AirlineIntegrationServiceImpl implements AirlineIntegrationService {

    private final AirlineClient airlineClient;

    @Override
    public Long getAirlineIdForUser(Long userId) {
        try {
            var airlines = airlineClient.getAirlinesByOwner(userId);
            if (airlines == null) {
                throw new BaseException(ErrorCode.AIRLINE_SERVICE_UNAVAILABLE);
            }
            if (airlines.isEmpty()) {
                throw new BaseException(ErrorCode.AIRLINE_NOT_FOUND);
            }
            return airlines.getFirst().getId();

        } catch (FeignException.NotFound e) {
            throw new BaseException(ErrorCode.AIRLINE_NOT_FOUND);

        } catch (FeignException.ServiceUnavailable e) {
            throw new BaseException(ErrorCode.AIRLINE_SERVICE_UNAVAILABLE);

        } catch (FeignException e) {
            throw new BaseException(ErrorCode.EXTERNAL_SERVICE_ERROR);
        }
    }
}
