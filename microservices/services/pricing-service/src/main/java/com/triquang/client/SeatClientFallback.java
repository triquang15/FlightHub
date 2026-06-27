package com.triquang.client;

import java.util.List;

import org.springframework.stereotype.Component;

import com.triquang.payload.response.ApiResponse;
import com.triquang.payload.response.CabinClassResponse;

@Component
public class SeatClientFallback implements SeatClient {

    @Override
    public ApiResponse<List<CabinClassResponse>> getCabinClassesByAircraftIdResponse(Long aircraftId) {
        return null;
    }
}
