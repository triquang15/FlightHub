package com.triquang.service.impl;

import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;

import com.triquang.enums.ErrorCode;
import com.triquang.exception.AircraftException;
import com.triquang.mapper.AircraftMapper;
import com.triquang.model.Aircraft;
import com.triquang.model.Airline;
import com.triquang.payload.request.AircraftRequest;
import com.triquang.payload.response.AircraftResponse;
import com.triquang.repository.AircraftRepository;
import com.triquang.repository.AirlineRepository;
import com.triquang.service.AircraftService;

import java.time.LocalDate;
import java.util.List;

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

        Airline airline = airlineRepository.findByOwnerId(ownerId)
                .orElseThrow(() -> new AircraftException(ErrorCode.AIRLINE_NOT_FOUND));

        if (aircraftRepository.existsByCode(request.getCode())) {
            throw new AircraftException(ErrorCode.AIRCRAFT_ALREADY_EXISTS);
        }

        Aircraft aircraft = AircraftMapper.toEntity(request, airline);

        validateAircraftData(aircraft);

        log.info("Create aircraft code={} owner={}", aircraft.getCode(), ownerId);

        return AircraftMapper.toResponse(aircraftRepository.save(aircraft));
    }

    // ---------- READ ----------
    @Override
    @Cacheable(cacheNames = "aircrafts", key = "#id")
    public AircraftResponse getAircraftById(Long id) {

        Aircraft aircraft = aircraftRepository.findById(id)
                .orElseThrow(() -> new AircraftException(ErrorCode.AIRCRAFT_NOT_FOUND));

        return AircraftMapper.toResponse(aircraft);
    }

    @Override
    public List<AircraftResponse> listAllAircraftsByOwner(Long ownerId) {

        Airline airline = airlineRepository.findByOwnerId(ownerId)
                .orElseThrow(() -> new AircraftException(ErrorCode.AIRLINE_NOT_FOUND));

        return aircraftRepository.findByAirline(airline)
                .stream()
                .map(AircraftMapper::toResponse)
                .toList();
    }

    // ---------- UPDATE ----------
    @Override
    @CacheEvict(cacheNames = "aircrafts", key = "#id")
    public AircraftResponse updateAircraft(Long id, AircraftRequest request, Long ownerId) {

        Airline airline = airlineRepository.findByOwnerId(ownerId)
                .orElseThrow(() -> new AircraftException(ErrorCode.AIRLINE_NOT_FOUND));

        Aircraft aircraft = aircraftRepository.findById(id)
                .orElseThrow(() -> new AircraftException(ErrorCode.AIRCRAFT_NOT_FOUND));

        // SECURITY CHECK
        if (!aircraft.getAirline().getId().equals(airline.getId())) {
            throw new AircraftException(ErrorCode.FORBIDDEN);
        }

        String oldCode = aircraft.getCode();

        AircraftMapper.updateEntity(aircraft, request, airline);

        if (!oldCode.equals(request.getCode())
                && aircraftRepository.existsByCode(request.getCode())) {
            throw new AircraftException(ErrorCode.AIRCRAFT_ALREADY_EXISTS);
        }

        validateAircraftData(aircraft);

        log.info("Update aircraft id={} owner={}", id, ownerId);

        return AircraftMapper.toResponse(aircraftRepository.save(aircraft));
    }

    // ---------- DELETE ----------
    @Override
    @CacheEvict(cacheNames = "aircrafts", key = "#id")
    public void deleteAircraft(Long id, Long ownerId) {

        Airline airline = airlineRepository.findByOwnerId(ownerId)
                .orElseThrow(() -> new AircraftException(ErrorCode.AIRLINE_NOT_FOUND));

        Aircraft aircraft = aircraftRepository.findById(id)
                .orElseThrow(() -> new AircraftException(ErrorCode.AIRCRAFT_NOT_FOUND));

        // SECURITY CHECK
        if (!aircraft.getAirline().getId().equals(airline.getId())) {
            throw new AircraftException(ErrorCode.FORBIDDEN);
        }

        log.warn("Delete aircraft id={} owner={}", id, ownerId);

        aircraftRepository.delete(aircraft);
    }

    // ---------- VALIDATION ----------
    private void validateAircraftData(Aircraft aircraft) {

        if (aircraft.getSeatingCapacity() == null || aircraft.getSeatingCapacity() <= 0) {
            throw new AircraftException(ErrorCode.INVALID_AIRCRAFT_DATA);
        }

        int totalSeats =
                safe(aircraft.getEconomySeats()) +
                safe(aircraft.getPremiumEconomySeats()) +
                safe(aircraft.getBusinessSeats()) +
                safe(aircraft.getFirstClassSeats());

        if (totalSeats > aircraft.getSeatingCapacity()) {
            throw new AircraftException(ErrorCode.INVALID_AIRCRAFT_DATA);
        }

        int currentYear = LocalDate.now().getYear();

        if (aircraft.getYearOfManufacture() == null
                || aircraft.getYearOfManufacture() < 1900
                || aircraft.getYearOfManufacture() > currentYear) {
            throw new AircraftException(ErrorCode.INVALID_AIRCRAFT_DATA);
        }
    }

    private int safe(Integer val) {
        return val == null ? 0 : val;
    }
}