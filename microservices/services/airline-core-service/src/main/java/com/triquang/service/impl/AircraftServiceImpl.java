package com.triquang.service.impl;

import java.time.LocalDate;
import java.util.List;

import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;

import com.triquang.enums.ErrorCode;
import com.triquang.exception.BaseException;
import com.triquang.mapper.AircraftMapper;
import com.triquang.model.Aircraft;
import com.triquang.model.Airline;
import com.triquang.payload.request.AircraftRequest;
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

        Airline airline = getAirlineByOwner(ownerId);

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
    @Cacheable(cacheNames = "aircrafts", key = "#id")
    public AircraftResponse getAircraftById(Long id) {

        Aircraft aircraft = getAircraft(id);

        return AircraftMapper.toResponse(aircraft);
    }

    @Override
    public List<AircraftResponse> listAllAircraftsByOwner(Long ownerId) {

        Airline airline = getAirlineByOwner(ownerId);

        return aircraftRepository.findByAirline(airline)
                .stream()
                .map(AircraftMapper::toResponse)
                .toList();
    }

    // ---------- UPDATE ----------
    @Override
    @CacheEvict(cacheNames = "aircrafts", allEntries = true)
    public AircraftResponse updateAircraft(Long id, AircraftRequest request, Long ownerId) {

        Airline airline = getAirlineByOwner(ownerId);
        Aircraft aircraft = getAircraft(id);

        validateOwnership(aircraft, airline);

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

        Airline airline = getAirlineByOwner(ownerId);
        Aircraft aircraft = getAircraft(id);

        validateOwnership(aircraft, airline);

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
    private Airline getAirlineByOwner(Long ownerId) {

        List<Airline> airlines = airlineRepository.findAllByOwnerId(ownerId);

        if (airlines.isEmpty()) {
            throw new BaseException(ErrorCode.AIRLINE_NOT_FOUND);
        }

        return airlines.get(0);
    }

    private Aircraft getAircraft(Long id) {
        return aircraftRepository.findById(id)
                .orElseThrow(() -> new BaseException(ErrorCode.AIRCRAFT_NOT_FOUND));
    }

    private void validateOwnership(Aircraft aircraft, Airline airline) {
        if (!aircraft.getAirline().getId().equals(airline.getId())) {
            throw new BaseException(ErrorCode.FORBIDDEN);
        }
    }

    private int safe(Integer val) {
        return val == null ? 0 : val;
    }
}