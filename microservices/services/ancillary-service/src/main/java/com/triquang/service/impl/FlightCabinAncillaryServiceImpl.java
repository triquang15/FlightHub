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
import com.triquang.repository.FlightCabinAncillaryRepository;
import com.triquang.repository.InsuranceCoverageRepository;
import com.triquang.service.FlightCabinAncillaryService;
import com.triquang.service.AncillaryOwnershipService;

import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class FlightCabinAncillaryServiceImpl implements FlightCabinAncillaryService {

    private final FlightCabinAncillaryRepository repository;
    private final InsuranceCoverageRepository insuranceCoverageRepository;
    private final AncillaryOwnershipService ownershipService;

    private FlightCabinAncillaryResponse mapWithCoverages(FlightCabinAncillary entity) {
        List<InsuranceCoverage> coverages =
                insuranceCoverageRepository.findByAncillary(entity.getAncillary());

        List<InsuranceCoverageResponse> coverageResponses = coverages.stream()
                .map(InsuranceCoverageMapper::toResponse)
                .toList();

        return FlightCabinAncillaryMapper.toResponse(entity, coverageResponses);
    }

    @Override
    public FlightCabinAncillaryResponse create(Long userId, FlightCabinAncillaryRequest req) {

        var flight = ownershipService.requireOwnedFlight(userId, req.getFlightId());
        ownershipService.requireCabinOnFlight(flight, req.getCabinClassId());
        Ancillary ancillary = ownershipService.requireOwnedAncillary(userId, req.getAncillaryId());

        if (repository.existsByFlightIdAndCabinClassIdAndAncillaryId(
                req.getFlightId(), req.getCabinClassId(), req.getAncillaryId())) {
            throw new BaseException(ErrorCode.FLIGHT_CABIN_ANCILLARY_ALREADY_EXISTS);
        }

        double price = normalizePrice(req.getPrice(), req.getIncludedInFare());

        FlightCabinAncillary entity = FlightCabinAncillary.builder()
                .flightId(req.getFlightId())
                .cabinClassId(req.getCabinClassId())
                .ancillary(ancillary)
                .available(req.getAvailable())
                .maxQuantity(req.getMaxQuantity())
                .price(price)
                .currency(normalizeCurrency(req.getCurrency()))
                .includedInFare(req.getIncludedInFare())
                .build();

        return mapWithCoverages(repository.save(entity));
    }

    @Override
    public List<FlightCabinAncillaryResponse> bulkCreate(Long userId, List<FlightCabinAncillaryRequest> requests) {
        return requests.stream()
                .map(request -> create(userId, request))
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
    public FlightCabinAncillaryResponse update(Long userId, Long id, FlightCabinAncillaryRequest req) {

        FlightCabinAncillary entity = ownershipService.requireOwnedFlightCabinAncillary(userId, id);

        if (!entity.getFlightId().equals(req.getFlightId())
                || !entity.getCabinClassId().equals(req.getCabinClassId())
                || !entity.getAncillary().getId().equals(req.getAncillaryId())) {
            throw new BaseException(ErrorCode.INVALID_INPUT);
        }

        entity.setAvailable(req.getAvailable());
        entity.setMaxQuantity(req.getMaxQuantity());
        entity.setPrice(normalizePrice(req.getPrice(), req.getIncludedInFare()));
        entity.setCurrency(normalizeCurrency(req.getCurrency()));
        entity.setIncludedInFare(req.getIncludedInFare());

        return mapWithCoverages(repository.save(entity));
    }

    @Override
    public void delete(Long userId, Long id) {
        repository.delete(ownershipService.requireOwnedFlightCabinAncillary(userId, id));
    }

    @Override
    public Double calculateAncillaryPrice(List<Long> ancillaryIds) {
        if (ancillaryIds == null || ancillaryIds.isEmpty()) {
            return 0.0;
        }
        if (ancillaryIds.stream().anyMatch(id -> id == null)
                || Set.copyOf(ancillaryIds).size() != ancillaryIds.size()) {
            throw new BaseException(ErrorCode.INVALID_INPUT);
        }

        List<FlightCabinAncillary> selections = repository.findAllById(ancillaryIds);
        if (selections.size() != ancillaryIds.size()
                || selections.stream().anyMatch(item -> !Boolean.TRUE.equals(item.getAvailable()))) {
            throw new BaseException(ErrorCode.INVALID_INPUT);
        }

        return selections.stream()
                .filter(item -> !Boolean.TRUE.equals(item.getIncludedInFare()))
                .mapToDouble(FlightCabinAncillary::getPrice)
                .sum();
    }

    private double normalizePrice(Double price, Boolean includedInFare) {
        if (Boolean.TRUE.equals(includedInFare)) {
            return 0.0;
        }
        if (price == null || !Double.isFinite(price) || price < 0) {
            throw new BaseException(ErrorCode.INVALID_INPUT);
        }
        return price;
    }

    private String normalizeCurrency(String currency) {
        if (currency == null || !currency.matches("[A-Za-z]{3}")) {
            throw new BaseException(ErrorCode.INVALID_INPUT);
        }
        return currency.toUpperCase(Locale.ROOT);
    }
}
