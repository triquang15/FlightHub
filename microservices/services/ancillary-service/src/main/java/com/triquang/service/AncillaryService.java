package com.triquang.service;

import java.util.List;

import com.triquang.payload.request.AncillaryRequest;
import com.triquang.payload.response.AncillaryResponse;
import org.springframework.web.multipart.MultipartFile;

public interface AncillaryService {

	AncillaryResponse create(Long userId, AncillaryRequest request);

    AncillaryResponse getById(Long userId, Long id);

    List<AncillaryResponse> getAllByAirlineId(Long userId);

    AncillaryResponse update(Long userId, Long id, AncillaryRequest request);

    AncillaryResponse updateIcon(Long userId, Long id, MultipartFile file);

    AncillaryResponse deleteIcon(Long userId, Long id);

    void delete(Long userId, Long id);
}
