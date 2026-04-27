package com.triquang.service;

import java.util.List;

import com.triquang.payload.request.InsuranceCoverageRequest;
import com.triquang.payload.response.InsuranceCoverageResponse;

public interface InsuranceCoverageService {

	InsuranceCoverageResponse createCoverage(InsuranceCoverageRequest request);

	List<InsuranceCoverageResponse> createCoveragesBulk(List<InsuranceCoverageRequest> requests);

	InsuranceCoverageResponse updateCoverage(Long id, InsuranceCoverageRequest request);

	void deleteCoverage(Long id);

	InsuranceCoverageResponse getCoverageById(Long id);

	List<InsuranceCoverageResponse> getCoveragesByAncillaryId(Long ancillaryId);

	List<InsuranceCoverageResponse> getActiveCoveragesByAncillaryId(Long ancillaryId);

	List<InsuranceCoverageResponse> getAllCoverages();
}
