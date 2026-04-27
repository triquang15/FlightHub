package com.triquang.client;

import org.springframework.stereotype.Component;

import com.triquang.payload.response.CabinClassResponse;

import java.util.Collections;
import java.util.List;

@Component
public class SeatClientFallback implements SeatClient {

    @Override
    public List<CabinClassResponse> getCabinClassesByAircraftId(Long aircraftId) {
        return Collections.emptyList();
    }
}
