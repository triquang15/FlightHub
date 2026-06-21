package com.triquang.service.impl;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.triquang.enums.ErrorCode;
import com.triquang.exception.BaseException;
import com.triquang.mapper.InsuranceCoverageMapper;
import com.triquang.model.Ancillary;
import com.triquang.model.InsuranceCoverage;
import com.triquang.payload.request.InsuranceCoverageRequest;
import com.triquang.payload.response.InsuranceCoverageResponse;
import com.triquang.repository.AncillaryRepository;
import com.triquang.repository.InsuranceCoverageRepository;
import com.triquang.service.InsuranceCoverageService;
import com.triquang.service.AncillaryOwnershipService;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class InsuranceCoverageServiceImpl implements InsuranceCoverageService {

    private final InsuranceCoverageRepository coverageRepository;
    private final AncillaryRepository ancillaryRepository;
    private final AncillaryOwnershipService ownershipService;

    @Override
    @Transactional
    public InsuranceCoverageResponse createCoverage(Long userId, InsuranceCoverageRequest request) {

        Ancillary ancillary = ownershipService.requireOwnedAncillary(userId, request.getAncillaryId());

        InsuranceCoverage coverage = InsuranceCoverageMapper.toEntity(request, ancillary);
        InsuranceCoverage saved = coverageRepository.save(coverage);

        return InsuranceCoverageMapper.toResponse(saved);
    }

    @Override
    @Transactional
    public List<InsuranceCoverageResponse> createCoveragesBulk(Long userId, List<InsuranceCoverageRequest> requests) {

        if (requests == null || requests.isEmpty()) {
            throw new BaseException(ErrorCode.INSURANCE_COVERAGE_INVALID_REQUEST);
        }

        Long ancillaryId = requests.get(0).getAncillaryId();

        boolean allSameAncillary = requests.stream()
                .allMatch(req -> req.getAncillaryId().equals(ancillaryId));

        if (!allSameAncillary) {
            throw new BaseException(ErrorCode.INSURANCE_COVERAGE_INVALID_REQUEST);
        }

        Ancillary ancillary = ownershipService.requireOwnedAncillary(userId, ancillaryId);

        List<InsuranceCoverage> coverages = requests.stream()
                .map(req -> InsuranceCoverageMapper.toEntity(req, ancillary))
                .collect(Collectors.toList());

        return coverageRepository.saveAll(coverages)
                .stream()
                .map(InsuranceCoverageMapper::toResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public InsuranceCoverageResponse updateCoverage(Long userId, Long id, InsuranceCoverageRequest request) {

        InsuranceCoverage existing = ownershipService.requireOwnedCoverage(userId, id);

        Ancillary ancillary = null;
        if (request.getAncillaryId() != null) {
            ancillary = ownershipService.requireOwnedAncillary(userId, request.getAncillaryId());
        }

        InsuranceCoverageMapper.updateEntityFromRequest(existing, request, ancillary);

        return InsuranceCoverageMapper.toResponse(coverageRepository.save(existing));
    }

    @Override
    @Transactional
    public void deleteCoverage(Long userId, Long id) {

        InsuranceCoverage coverage = ownershipService.requireOwnedCoverage(userId, id);

        coverageRepository.delete(coverage);
    }

    @Override
    public InsuranceCoverageResponse getCoverageById(Long userId, Long id) {

        InsuranceCoverage coverage = ownershipService.requireOwnedCoverage(userId, id);

        return InsuranceCoverageMapper.toResponse(coverage);
    }

    @Override
    public List<InsuranceCoverageResponse> getCoveragesByAncillaryId(Long userId, Long ancillaryId) {
        Ancillary ancillary = ownershipService.requireOwnedAncillary(userId, ancillaryId);
        return coverageRepository.findByAncillary(ancillary)
                .stream()
                .map(InsuranceCoverageMapper::toResponse)
                .collect(Collectors.toList());
    }

    @Override
    public List<InsuranceCoverageResponse> getActiveCoveragesByAncillaryId(Long ancillaryId) {
        return coverageRepository.findByAncillaryIdAndActiveTrue(ancillaryId)
                .stream()
                .map(InsuranceCoverageMapper::toResponse)
                .collect(Collectors.toList());
    }

    @Override
    public List<InsuranceCoverageResponse> getAllCoverages(Long userId) {
        Long airlineId = ownershipService.airlineId(userId);
        return coverageRepository.findByAncillaryAirlineId(airlineId)
                .stream()
                .map(InsuranceCoverageMapper::toResponse)
                .collect(Collectors.toList());
    }
}
