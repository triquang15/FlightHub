package com.triquang.client;

import java.util.List;
import java.util.Map;

import org.springframework.cloud.openfeign.FallbackFactory;
import org.springframework.stereotype.Component;

import com.triquang.payload.response.ApiResponse;
import com.triquang.payload.response.FareResponse;

import lombok.extern.slf4j.Slf4j;

@Slf4j
@Component
public class PricingClientFallbackFactory implements FallbackFactory<PricingClient> {

    @Override
    public PricingClient create(Throwable cause) {
        log.error("pricing-service call failed – fare/cabin filter will be skipped: {}", cause.getMessage(), cause);
        return new PricingClient() {
            @Override
            public ApiResponse<Map<Long, FareResponse>> getLowestFarePerFlightResponse(
                    List<Long> flightIds, Long cabinClassId) {
                return null;
            }

            @Override
            public ApiResponse<FareResponse> getLowestFareForFlightAndCabinClassResponse(
                    Long flightId, Long cabinClassId) {
                return null;
            }
        };
    }
}
