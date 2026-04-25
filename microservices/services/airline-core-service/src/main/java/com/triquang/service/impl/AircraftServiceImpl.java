package com.triquang.service.impl;

import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
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
public class AircraftServiceImpl implements AircraftService {

    private final AircraftRepository aircraftRepository;
    private final AirlineRepository airlineRepository;

    // ---------- CREATE ----------
    @Override
    public AircraftResponse createAircraft(AircraftRequest request, Long ownerId) {

        Airline airline = airlineRepository.findByOwnerId(ownerId)
                .orElseThrow(() -> new AircraftException(ErrorCode.AIRLINE_NOT_FOUND));

        Aircraft aircraft = AircraftMapper.toEntity(request, airline);

        if (aircraftRepository.existsByCode(aircraft.getCode())) {
            throw new AircraftException(ErrorCode.AIRCRAFT_ALREADY_EXISTS);
        }

        validateAircraftData(aircraft);

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

        String oldCode = aircraft.getCode();

        AircraftMapper.updateEntity(aircraft, request, airline);

        if (!oldCode.equals(request.getCode())
                && aircraftRepository.existsByCode(request.getCode())) {
            throw new AircraftException(ErrorCode.AIRCRAFT_ALREADY_EXISTS);
        }

        validateAircraftData(aircraft);

        return AircraftMapper.toResponse(aircraftRepository.save(aircraft));
    }

    // ---------- DELETE ----------
    @Override
    @CacheEvict(cacheNames = "aircrafts", key = "#id")
    public void deleteAircraft(Long id) {

        Aircraft aircraft = aircraftRepository.findById(id)
                .orElseThrow(() -> new AircraftException(ErrorCode.AIRCRAFT_NOT_FOUND));

        aircraftRepository.delete(aircraft);
    }

    // ---------- VALIDATION ----------
    private void validateAircraftData(Aircraft aircraft) {

        if (aircraft.getSeatingCapacity() == null || aircraft.getSeatingCapacity() <= 0) {
            throw new AircraftException(ErrorCode.INVALID_AIRCRAFT_DATA);
        }

        int totalSeats =
                (aircraft.getEconomySeats() != null ? aircraft.getEconomySeats() : 0) +
                (aircraft.getPremiumEconomySeats() != null ? aircraft.getPremiumEconomySeats() : 0) +
                (aircraft.getBusinessSeats() != null ? aircraft.getBusinessSeats() : 0) +
                (aircraft.getFirstClassSeats() != null ? aircraft.getFirstClassSeats() : 0);

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
}