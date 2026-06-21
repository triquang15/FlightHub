package com.triquang.service;

import java.util.List;

import com.triquang.payload.request.InsuranceCoverageRequest;
import com.triquang.payload.response.InsuranceCoverageResponse;

public interface InsuranceCoverageService {

	InsuranceCoverageResponse createCoverage(Long userId, InsuranceCoverageRequest request);

	List<InsuranceCoverageResponse> createCoveragesBulk(Long userId, List<InsuranceCoverageRequest> requests);

	InsuranceCoverageResponse updateCoverage(Long userId, Long id, InsuranceCoverageRequest request);

	void deleteCoverage(Long userId, Long id);

	InsuranceCoverageResponse getCoverageById(Long userId, Long id);

	List<InsuranceCoverageResponse> getCoveragesByAncillaryId(Long userId, Long ancillaryId);

	List<InsuranceCoverageResponse> getActiveCoveragesByAncillaryId(Long ancillaryId);

	List<InsuranceCoverageResponse> getAllCoverages(Long userId);
}
