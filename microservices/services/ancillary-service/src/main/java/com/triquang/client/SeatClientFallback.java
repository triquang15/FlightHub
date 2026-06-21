package com.triquang.client;

import org.springframework.stereotype.Component;

import com.triquang.payload.response.CabinClassResponse;
import com.triquang.payload.response.ApiResponse;

import java.util.List;

@Component
public class SeatClientFallback implements SeatClient {

    @Override
    public ApiResponse<List<CabinClassResponse>> getCabinClassesByAircraftIdResponse(Long aircraftId) {
        return null;
    }
}
