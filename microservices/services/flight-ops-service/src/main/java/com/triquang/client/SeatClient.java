package com.triquang.client;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

import com.triquang.enums.CabinClassType;
import com.triquang.payload.response.ApiResponse;
import com.triquang.payload.response.CabinClassResponse;

import java.util.List;

@FeignClient(name = "seat-service", fallback = SeatClientFallback.class)
public interface SeatClient {

    @GetMapping("api/seats/aircraft/{aircraftId}")
    ApiResponse<List<CabinClassResponse>> getCabinClassesByAircraftIdResponse(
            @PathVariable Long aircraftId);

    default List<CabinClassResponse> getCabinClassesByAircraftId(Long aircraftId) {
        ApiResponse<List<CabinClassResponse>> response =
                getCabinClassesByAircraftIdResponse(aircraftId);
        return response == null || response.data() == null ? List.of() : response.data();
    }

    @GetMapping("/api/cabin-classes/aircraft/{aircraftId}/name/{cabinClass}")
    ApiResponse<CabinClassResponse> getCabinClassByAircraftIdAndNameResponse(
            @PathVariable("aircraftId") Long aircraftId,
            @PathVariable("cabinClass") CabinClassType cabinClass);

    default CabinClassResponse getCabinClassByAircraftIdAndName(
            CabinClassType cabinClass, Long aircraftId) {
        ApiResponse<CabinClassResponse> response =
                getCabinClassByAircraftIdAndNameResponse(aircraftId, cabinClass);
        return response == null ? null : response.data();
    }
}
