package com.triquang.service.impl;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import com.triquang.enums.AncillaryType;
import com.triquang.enums.ErrorCode;
import com.triquang.exception.BaseException;
import com.triquang.mapper.FlightCabinAncillaryMapper;
import com.triquang.mapper.InsuranceCoverageMapper;
import com.triquang.model.Ancillary;
import com.triquang.model.FlightCabinAncillary;
import com.triquang.model.InsuranceCoverage;
import com.triquang.payload.request.FlightCabinAncillaryRequest;
import com.triquang.payload.response.FlightCabinAncillaryResponse;
import com.triquang.payload.response.InsuranceCoverageResponse;
import com.triquang.repository.AncillaryRepository;
import com.triquang.repository.FlightCabinAncillaryRepository;
import com.triquang.repository.InsuranceCoverageRepository;
import com.triquang.service.FlightCabinAncillaryService;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class FlightCabinAncillaryServiceImpl implements FlightCabinAncillaryService {

    private final FlightCabinAncillaryRepository repository;
    private final AncillaryRepository ancillaryRepository;
    private final InsuranceCoverageRepository insuranceCoverageRepository;

    private FlightCabinAncillaryResponse mapWithCoverages(FlightCabinAncillary entity) {
        List<InsuranceCoverage> coverages =
                insuranceCoverageRepository.findByAncillary(entity.getAncillary());

        List<InsuranceCoverageResponse> coverageResponses = coverages.stream()
                .map(InsuranceCoverageMapper::toResponse)
                .toList();

        return FlightCabinAncillaryMapper.toResponse(entity, coverageResponses);
    }

    @Override
    public FlightCabinAncillaryResponse create(FlightCabinAncillaryRequest req) {

        Ancillary ancillary = ancillaryRepository.findById(req.getAncillaryId())
                .orElseThrow(() -> new BaseException(ErrorCode.ANCILLARY_NOT_FOUND));

        FlightCabinAncillary entity = FlightCabinAncillary.builder()
                .flightId(req.getFlightId())
                .cabinClassId(req.getCabinClassId())
                .ancillary(ancillary)
                .available(req.getAvailable())
                .maxQuantity(req.getMaxQuantity())
                .price(req.getPrice())
                .currency(req.getCurrency())
                .includedInFare(req.getIncludedInFare())
                .build();

        return mapWithCoverages(repository.save(entity));
    }

    @Override
    public List<FlightCabinAncillaryResponse> bulkCreate(List<FlightCabinAncillaryRequest> requests) {
        return requests.stream()
                .map(this::create)
                .collect(Collectors.toList());
    }

    @Override
    public FlightCabinAncillaryResponse getById(Long id) {
        FlightCabinAncillary entity = repository.findById(id)
                .orElseThrow(() -> new BaseException(ErrorCode.FLIGHT_CABIN_ANCILLARY_NOT_FOUND));

        return mapWithCoverages(entity);
    }

    @Override
    public List<FlightCabinAncillaryResponse> getAllByFlightAndCabinClass(Long flightId, Long cabinClassId) {
        return repository.findByFlightIdAndCabinClassId(flightId, cabinClassId)
                .stream()
                .map(this::mapWithCoverages)
                .collect(Collectors.toList());
    }

    @Override
    public List<FlightCabinAncillaryResponse> getAllByIds(List<Long> ids) {
        return repository.findAllById(ids)
                .stream()
                .map(this::mapWithCoverages)
                .collect(Collectors.toList());
    }

    @Override
    public FlightCabinAncillaryResponse getByFlightIdAndCabinClassAndType(
            Long flightId, Long cabinClassId, AncillaryType type) {

        FlightCabinAncillary entity = repository
                .findByFlightIdAndCabinClassIdAndAncillary_Type(flightId, cabinClassId, type)
                .orElseThrow(() -> new BaseException(ErrorCode.FLIGHT_CABIN_ANCILLARY_NOT_FOUND));

        return mapWithCoverages(entity);
    }

    @Override
    public List<FlightCabinAncillaryResponse> getAllByFlightIdAndCabinClassAndType(
            Long flightId, Long cabinClassId, AncillaryType type) {

        return repository.findAllByFlightIdAndCabinClassIdAndAncillary_Type(
                        flightId, cabinClassId, type)
                .stream()
                .map(this::mapWithCoverages)
                .collect(Collectors.toList());
    }

    @Override
    public FlightCabinAncillaryResponse update(Long id, FlightCabinAncillaryRequest req) {

        FlightCabinAncillary entity = repository.findById(id)
                .orElseThrow(() -> new BaseException(ErrorCode.FLIGHT_CABIN_ANCILLARY_NOT_FOUND));

        entity.setAvailable(req.getAvailable());
        entity.setMaxQuantity(req.getMaxQuantity());
        entity.setPrice(req.getPrice());
        entity.setCurrency(req.getCurrency());
        entity.setIncludedInFare(req.getIncludedInFare());

        return mapWithCoverages(repository.save(entity));
    }

    @Override
    public void delete(Long id) {
        if (!repository.existsById(id)) {
            throw new BaseException(ErrorCode.FLIGHT_CABIN_ANCILLARY_NOT_FOUND);
        }
        repository.deleteById(id);
    }

    @Override
    public Double calculateAncillaryPrice(List<Long> ancillaryIds) {
        return repository.findAllById(ancillaryIds)
                .stream()
                .mapToDouble(FlightCabinAncillary::getPrice)
                .sum();
    }
}
