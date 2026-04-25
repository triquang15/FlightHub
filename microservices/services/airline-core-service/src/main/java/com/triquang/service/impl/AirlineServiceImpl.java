package com.triquang.service.impl;

import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.cache.annotation.Caching;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.triquang.enums.AirlineStatus;
import com.triquang.enums.ErrorCode;
import com.triquang.exception.AirlineException;
import com.triquang.mapper.AirlineMapper;
import com.triquang.model.Airline;
import com.triquang.payload.request.AirlineRequest;
import com.triquang.payload.response.AirlineDropdownItem;
import com.triquang.payload.response.AirlineResponse;
import com.triquang.repository.AirlineRepository;
import com.triquang.service.AirlineService;

import java.util.List;

/**
 * AirlineServiceImpl is the implementation of the AirlineService interface.
 * It provides methods to manage airlines, including creating, reading, updating, and deleting airlines,
 * as well as changing airline status and retrieving airlines for dropdowns.
 * 
 * @author Tri Quang
 */

@Service
@RequiredArgsConstructor
@Transactional
public class AirlineServiceImpl implements AirlineService {

    private final AirlineRepository airlineRepository;

    // ---------- CREATE ----------
    @Override
    public AirlineResponse createAirline(AirlineRequest request, Long ownerId) {

        validateRequest(request);

        Airline airline = AirlineMapper.toEntity(request, ownerId);
        Airline saved = airlineRepository.save(airline);

        return AirlineMapper.toResponse(saved);
    }

    // ---------- READ ----------
    @Override
    @Cacheable(cacheNames = "airlinesByOwner", key = "#ownerId")
    public AirlineResponse getAirlineByOwner(Long ownerId) {

        Airline airline = airlineRepository.findByOwnerId(ownerId)
                .orElseThrow(() -> new AirlineException(ErrorCode.AIRLINE_NOT_FOUND));

        return AirlineMapper.toResponse(airline);
    }

    @Override
    @Cacheable(cacheNames = "airlines", key = "#id")
    public AirlineResponse getAirlineById(Long id) {

        Airline airline = airlineRepository.findById(id)
                .orElseThrow(() -> new AirlineException(ErrorCode.AIRLINE_NOT_FOUND));

        return AirlineMapper.toResponse(airline);
    }

    @Override
    public Page<AirlineResponse> getAllAirlines(Pageable pageable) {
        return airlineRepository.findAll(pageable)
                .map(AirlineMapper::toResponse);
    }

    // ---------- UPDATE ----------
    @Override
    @Caching(evict = {
            @CacheEvict(cacheNames = "airlinesByOwner", key = "#ownerId"),
            @CacheEvict(cacheNames = "airlines", allEntries = true),
            @CacheEvict(cacheNames = "airlinesByIata", allEntries = true),
            @CacheEvict(cacheNames = "airlinesByAlliance", allEntries = true)
    })
    public AirlineResponse updateAirline(AirlineRequest request, Long ownerId) {

        validateRequest(request);

        Airline airline = airlineRepository.findByOwnerId(ownerId)
                .orElseThrow(() -> new AirlineException(ErrorCode.AIRLINE_NOT_FOUND));

        AirlineMapper.updateEntity(airline, request);

        return AirlineMapper.toResponse(airlineRepository.save(airline));
    }

    // ---------- DELETE ----------
    @Override
    @Caching(evict = {
            @CacheEvict(cacheNames = "airlines", allEntries = true),
            @CacheEvict(cacheNames = "airlinesByOwner", allEntries = true),
            @CacheEvict(cacheNames = "airlinesByIata", allEntries = true),
            @CacheEvict(cacheNames = "airlinesByAlliance", allEntries = true)
    })
    public void deleteAirline(Long id, Long ownerId) {

        Airline airline = airlineRepository.findByOwnerId(ownerId)
                .orElseThrow(() -> new AirlineException(ErrorCode.AIRLINE_NOT_FOUND));

        airlineRepository.delete(airline);
    }

    // ---------- BUSINESS ----------
    @Override
    @Caching(evict = {
            @CacheEvict(cacheNames = "airlines", key = "#airlineId"),
            @CacheEvict(cacheNames = "airlinesByAlliance", allEntries = true)
    })
    public AirlineResponse changeStatusByAdmin(Long airlineId, AirlineStatus status) {

        Airline airline = airlineRepository.findById(airlineId)
                .orElseThrow(() -> new AirlineException(ErrorCode.AIRLINE_NOT_FOUND));

        airline.setStatus(status);

        return AirlineMapper.toResponse(airlineRepository.save(airline));
    }

    // ---------- DROPDOWN ----------
    @Override
    @Cacheable(cacheNames = "airlinesDropdown")
    public List<AirlineDropdownItem> getAirlinesForDropdown() {

        return airlineRepository.findByStatus(AirlineStatus.ACTIVE)
                .stream()
                .map(a -> AirlineDropdownItem.builder()
                        .id(a.getId())
                        .name(a.getName())
                        .iataCode(a.getIataCode())
                        .icaoCode(a.getIcaoCode())
                        .logoUrl(a.getLogoUrl())
                        .country(a.getCountry())
                        .build())
                .toList();
    }

    // ---------- VALIDATION ----------
    private void validateRequest(AirlineRequest request) {

        if (request.getName() == null || request.getName().isBlank()) {
            throw new AirlineException(ErrorCode.INVALID_INPUT);
        }

        if (request.getIataCode() != null && request.getIataCode().length() != 2) {
            throw new AirlineException(ErrorCode.INVALID_INPUT);
        }

        if (request.getIcaoCode() != null && request.getIcaoCode().length() != 3) {
            throw new AirlineException(ErrorCode.INVALID_INPUT);
        }
    }
}