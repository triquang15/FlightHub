package com.triquang.service;

import com.triquang.payload.request.AirportRequest;
import com.triquang.payload.response.AirportResponse;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;

public interface AirportService {

    // ================= SEARCH + PAGINATION =================
    Page<AirportResponse> searchAirports(
            String keyword,
            String country,
            Long cityId,
            Pageable pageable
    );

    // ================= CREATE =================
    AirportResponse createAirport(AirportRequest request);

    // ================= BULK CREATE =================
    List<AirportResponse> createBulkAirports(List<AirportRequest> requests);

    // ================= GET BY ID =================
    AirportResponse getAirportById(Long id);

    // ================= UPDATE =================
    AirportResponse updateAirport(Long id, AirportRequest request);

    // ================= DELETE =================
    void deleteAirport(Long id);
}