package com.triquang.service;

import java.util.List;

import com.triquang.payload.request.AncillaryRequest;
import com.triquang.payload.response.AncillaryResponse;

public interface AncillaryService {

	AncillaryResponse create(Long userId, AncillaryRequest request);

    AncillaryResponse getById(Long userId, Long id);

    List<AncillaryResponse> getAllByAirlineId(Long userId);

    AncillaryResponse update(Long userId, Long id, AncillaryRequest request);

    void delete(Long userId, Long id);
}
