package com.triquang.service.impl;

import java.time.LocalDate;
import java.util.List;

import org.springframework.cache.annotation.CacheEvict;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;

import com.triquang.enums.AircraftStatus;
import com.triquang.enums.ErrorCode;
import com.triquang.enums.UserRole;
import com.triquang.exception.BaseException;
import com.triquang.mapper.AircraftMapper;
import com.triquang.model.Aircraft;
import com.triquang.model.Airline;
import com.triquang.payload.request.AircraftRequest;
import com.triquang.payload.response.AircraftFleetSummary;
import com.triquang.payload.response.AircraftResponse;
import com.triquang.repository.AircraftRepository;
import com.triquang.repository.AirlineRepository;
import com.triquang.service.AircraftService;

import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * AircraftServiceImpl is the implementation of the AircraftService interface.
 * It provides methods to manage aircraft, including creating, reading, updating, and deleting aircraft,
 * as well as validating aircraft data.
 * 
 * @author Tri Quang
 */

@Service
@RequiredArgsConstructor
@Transactional
@Slf4j
public class AircraftServiceImpl implements AircraftService {

    private final AircraftRepository aircraftRepository;
    private final AirlineRepository airlineRepository;

    // ---------- CREATE ----------
    @Override
    public AircraftResponse createAircraft(AircraftRequest request, Long ownerId) {

        Airline airline = resolveAirlineForOwner(ownerId, request.getAirlineId());

        if (aircraftRepository.existsByCode(request.getCode())) {
            throw new BaseException(ErrorCode.AIRCRAFT_ALREADY_EXISTS);
        }

        Aircraft aircraft = AircraftMapper.toEntity(request, airline);

        validateAircraftData(aircraft);

        log.info("CREATE aircraft code={} ownerId={}", aircraft.getCode(), ownerId);

        return AircraftMapper.toResponse(
                aircraftRepository.save(aircraft)
        );
    }

    // ---------- READ ----------
    @Override
    public AircraftResponse getAircraftById(Long id, Long requesterId, String roles) {

        Aircraft aircraft = getAircraft(id);
        validateReadAccess(aircraft, requesterId, roles);

        return AircraftMapper.toResponse(aircraft);
    }

    @Override
    public Page<AircraftResponse> searchAircraftsByOwner(
            Long ownerId,
            String search,
            AircraftStatus status,
            Pageable pageable) {

        Specification<Aircraft> spec = (root, query, cb) ->
                cb.equal(root.get("airline").get("ownerId"), ownerId);

        if (search != null && !search.isBlank()) {
            String keyword = "%" + search.trim().toLowerCase() + "%";
            spec = spec.and((root, query, cb) ->
                    cb.or(
                            cb.like(cb.lower(root.get("code")), keyword),
                            cb.like(cb.lower(root.get("model")), keyword),
                            cb.like(cb.lower(root.get("manufacturer")), keyword)
                    ));
        }

        if (status != null) {
            spec = spec.and((root, query, cb) -> cb.equal(root.get("status"), status));
        }

        return aircraftRepository.findAll(spec, pageable).map(AircraftMapper::toResponse);
    }

    @Override
    public AircraftFleetSummary getFleetSummary(Long ownerId) {
        return new AircraftFleetSummary(
                aircraftRepository.countByAirlineOwnerId(ownerId),
                aircraftRepository.countByAirlineOwnerIdAndStatus(ownerId, AircraftStatus.ACTIVE),
                aircraftRepository.countByAirlineOwnerIdAndStatus(ownerId, AircraftStatus.MAINTENANCE),
                aircraftRepository.sumSeatingCapacityByOwnerId(ownerId)
        );
    }

    @Override
    public List<AircraftResponse> listAircraftOptions(Long ownerId) {
        return aircraftRepository.findByAirlineOwnerIdOrderByCodeAsc(ownerId)
                .stream()
                .map(AircraftMapper::toResponse)
                .toList();
    }

    // ---------- UPDATE ----------
    @Override
    @CacheEvict(cacheNames = "aircrafts", allEntries = true)
    public AircraftResponse updateAircraft(Long id, AircraftRequest request, Long ownerId) {

        Airline airline = resolveAirlineForOwner(ownerId, request.getAirlineId());
        Aircraft aircraft = getAircraft(id);

        validateOwnership(aircraft, ownerId);

        String oldCode = aircraft.getCode();

        AircraftMapper.updateEntity(aircraft, request, airline);

        if (!oldCode.equals(request.getCode())
                && aircraftRepository.existsByCode(request.getCode())) {
            throw new BaseException(ErrorCode.AIRCRAFT_ALREADY_EXISTS);
        }

        validateAircraftData(aircraft);

        log.info("UPDATE aircraft id={} ownerId={}", id, ownerId);

        return AircraftMapper.toResponse(
                aircraftRepository.save(aircraft)
        );
    }

    // ---------- DELETE ----------
    @Override
    @CacheEvict(cacheNames = "aircrafts", allEntries = true)
    public void deleteAircraft(Long id, Long ownerId) {

        Aircraft aircraft = getAircraft(id);

        validateOwnership(aircraft, ownerId);

        log.warn("DELETE aircraft id={} ownerId={}", id, ownerId);

        aircraftRepository.delete(aircraft);
    }

    // ---------- BUSINESS VALIDATION ----------
    private void validateAircraftData(Aircraft aircraft) {

        if (aircraft.getSeatingCapacity() == null || aircraft.getSeatingCapacity() <= 0) {
            throw new BaseException(ErrorCode.INVALID_AIRCRAFT_DATA);
        }

        int totalSeats =
                safe(aircraft.getEconomySeats()) +
                safe(aircraft.getPremiumEconomySeats()) +
                safe(aircraft.getBusinessSeats()) +
                safe(aircraft.getFirstClassSeats());

        if (totalSeats > aircraft.getSeatingCapacity()) {
            throw new BaseException(ErrorCode.INVALID_AIRCRAFT_DATA);
        }

        int currentYear = LocalDate.now().getYear();

        if (aircraft.getYearOfManufacture() == null
                || aircraft.getYearOfManufacture() < 1950
                || aircraft.getYearOfManufacture() > currentYear) {
            throw new BaseException(ErrorCode.INVALID_AIRCRAFT_DATA);
        }

        if (aircraft.getRangeKm() != null && aircraft.getRangeKm() <= 0) {
            throw new BaseException(ErrorCode.INVALID_AIRCRAFT_DATA);
        }

        if (aircraft.getCruisingSpeedKmh() != null && aircraft.getCruisingSpeedKmh() <= 0) {
            throw new BaseException(ErrorCode.INVALID_AIRCRAFT_DATA);
        }
    }

    // ---------- HELPERS ----------  
    private List<Airline> getAirlinesByOwner(Long ownerId) {

        List<Airline> airlines = airlineRepository.findAllByOwnerId(ownerId);

        if (airlines.isEmpty()) {
            throw new BaseException(ErrorCode.AIRLINE_NOT_FOUND);
        }

        return airlines;
    }

    private Airline resolveAirlineForOwner(Long ownerId, Long airlineId) {
        List<Airline> airlines = getAirlinesByOwner(ownerId);

        if (airlineId == null) {
            if (airlines.size() == 1) {
                return airlines.get(0);
            }
            throw new BaseException(ErrorCode.INVALID_INPUT);
        }

        return airlines.stream()
                .filter(a -> a.getId().equals(airlineId))
                .findFirst()
                .orElseThrow(() -> new BaseException(ErrorCode.FORBIDDEN));
    }

    private Aircraft getAircraft(Long id) {
        return aircraftRepository.findById(id)
                .orElseThrow(() -> new BaseException(ErrorCode.AIRCRAFT_NOT_FOUND));
    }

    private void validateOwnership(Aircraft aircraft, Long ownerId) {
        if (!aircraft.getAirline().getOwnerId().equals(ownerId)) {
            throw new BaseException(ErrorCode.FORBIDDEN);
        }
    }

    private void validateReadAccess(Aircraft aircraft, Long requesterId, String roles) {
        if (isSystemAdmin(roles)) {
            return;
        }

        validateOwnership(aircraft, requesterId);
    }

    private boolean isSystemAdmin(String roles) {
        return roles != null && roles.contains(UserRole.ROLE_SYSTEM_ADMIN.name());
    }

    private int safe(Integer val) {
        return val == null ? 0 : val;
    }
}
