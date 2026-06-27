package com.triquang.client;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.List;
import java.util.Map;

import org.junit.jupiter.api.Test;

import com.triquang.enums.CabinClassType;
import com.triquang.payload.response.ApiResponse;
import com.triquang.payload.response.CabinClassResponse;
import com.triquang.payload.response.FareResponse;

class FeignEnvelopeClientTest {

    @Test
    void seatClientUnwrapsCabinClassResponse() {
        CabinClassResponse economy = CabinClassResponse.builder().id(26L).build();
        SeatClient client = new SeatClient() {
            @Override
            public ApiResponse<List<CabinClassResponse>> getCabinClassesByAircraftIdResponse(Long aircraftId) {
                return ApiResponse.success(List.of(economy), "test");
            }

            @Override
            public ApiResponse<CabinClassResponse> getCabinClassByAircraftIdAndNameResponse(
                    Long aircraftId, CabinClassType cabinClass) {
                return ApiResponse.success(economy, "test");
            }
        };

        assertThat(client.getCabinClassesByAircraftId(1L)).containsExactly(economy);
        assertThat(client.getCabinClassByAircraftIdAndName(CabinClassType.ECONOMY, 1L))
                .isEqualTo(economy);
    }

    @Test
    void pricingClientUnwrapsFareMapResponse() {
        FareResponse fare = FareResponse.builder().id(1L).flightId(1L).currency("USD").build();
        PricingClient client = new PricingClient() {
            @Override
            public ApiResponse<Map<Long, FareResponse>> getLowestFarePerFlightResponse(
                    List<Long> flightIds, Long cabinClassId) {
                return ApiResponse.success(Map.of(1L, fare), "test");
            }

            @Override
            public ApiResponse<FareResponse> getLowestFareForFlightAndCabinClassResponse(
                    Long flightId, Long cabinClassId) {
                return ApiResponse.success(fare, "test");
            }
        };

        assertThat(client.getLowestFarePerFlight(List.of(1L), 26L)).containsEntry(1L, fare);
        assertThat(client.getLowestFareForFlightAndCabinClass(1L, 26L)).isEqualTo(fare);
    }
}
