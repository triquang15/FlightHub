package com.triquang.service.impl;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import com.triquang.enums.ErrorCode;
import com.triquang.exception.BaseException;
import com.triquang.mapper.AncillaryMapper;
import com.triquang.mapper.InsuranceCoverageMapper;
import com.triquang.model.Ancillary;
import com.triquang.model.InsuranceCoverage;
import com.triquang.payload.request.AncillaryRequest;
import com.triquang.payload.response.AncillaryResponse;
import com.triquang.payload.response.InsuranceCoverageResponse;
import com.triquang.repository.AncillaryRepository;
import com.triquang.repository.InsuranceCoverageRepository;
import com.triquang.repository.FlightCabinAncillaryRepository;
import com.triquang.service.AirlineIntegrationService;
import com.triquang.service.AncillaryService;
import com.triquang.service.AncillaryOwnershipService;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AncillaryServiceImpl implements AncillaryService {

    private final AncillaryRepository ancillaryRepository;
    private final InsuranceCoverageRepository insuranceCoverageRepository;
    private final AirlineIntegrationService airlineIntegrationService;
    private final AncillaryOwnershipService ownershipService;
    private final FlightCabinAncillaryRepository flightCabinAncillaryRepository;

    @Override
    public AncillaryResponse create(Long userId, AncillaryRequest request){
        Long airlineId=airlineIntegrationService.getAirlineIdForUser(userId);
        Ancillary ancillary = Ancillary.builder()
                .type(request.getType())
                .subType(request.getSubType())
                .rfisc(request.getRfisc())
                .name(request.getName())
                .description(request.getDescription())
                .metadata(request.getMetadata())
                .displayOrder(request.getDisplayOrder())
                .airlineId(airlineId)
                .build();

        Ancillary saved = ancillaryRepository.save(ancillary);
        return AncillaryMapper.toResponse(saved, null);
    }

    @Override
    public AncillaryResponse getById(Long userId, Long id){
        var ancillary = ownershipService.requireOwnedAncillary(userId, id);

        List<InsuranceCoverage> insuranceCoverages = insuranceCoverageRepository.findByAncillary(ancillary);
        List<InsuranceCoverageResponse> coverageResponseList = insuranceCoverages.stream()
                .map(InsuranceCoverageMapper::toResponse)
                .toList();

        return AncillaryMapper.toResponse(ancillary, coverageResponseList);
    }

    @Override
    public List<AncillaryResponse> getAllByAirlineId(Long userId) {
        Long airlineId=airlineIntegrationService.getAirlineIdForUser(userId);
        return ancillaryRepository.findByAirlineId(airlineId)
                .stream()
                .map(ancillary -> {
                    List<InsuranceCoverage> insuranceCoverages = insuranceCoverageRepository
                            .findByAncillary(ancillary);
                    List<InsuranceCoverageResponse> coverageResponseList = insuranceCoverages.stream()
                            .map(InsuranceCoverageMapper::toResponse)
                            .toList();
                    return AncillaryMapper.toResponse(ancillary, coverageResponseList);
                })
                .collect(Collectors.toList());
    }

    @Override
    public AncillaryResponse update(Long userId, Long id, AncillaryRequest request) {
        var ancillary = ownershipService.requireOwnedAncillary(userId, id);

        ancillary.setType(request.getType());
        ancillary.setSubType(request.getSubType());
        ancillary.setRfisc(request.getRfisc());
        ancillary.setName(request.getName());
        ancillary.setDescription(request.getDescription());
        ancillary.setMetadata(request.getMetadata());
        ancillary.setDisplayOrder(request.getDisplayOrder());

        Ancillary updated = ancillaryRepository.save(ancillary);

        List<InsuranceCoverage> insuranceCoverages = insuranceCoverageRepository.findByAncillary(ancillary);
        List<InsuranceCoverageResponse> coverageResponseList = insuranceCoverages.stream()
                .map(InsuranceCoverageMapper::toResponse)
                .toList();

        return AncillaryMapper.toResponse(updated, coverageResponseList);
    }

    @Override
    public void delete(Long userId, Long id) {
        var ancillary = ownershipService.requireOwnedAncillary(userId, id);
        if (flightCabinAncillaryRepository.existsByAncillaryId(id)
                || insuranceCoverageRepository.existsByAncillaryId(id)) {
            throw new BaseException(ErrorCode.ANCILLARY_IN_USE);
        }
        ancillaryRepository.delete(ancillary);
    }
}
