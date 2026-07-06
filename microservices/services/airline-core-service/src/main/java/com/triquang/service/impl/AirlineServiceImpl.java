package com.triquang.service.impl;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.cache.annotation.Caching;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.triquang.client.CityClient;
import com.triquang.enums.AirlineStatus;
import com.triquang.enums.ErrorCode;
import com.triquang.exception.BaseException;
import com.triquang.mapper.AirlineMapper;
import com.triquang.model.Airline;
import com.triquang.payload.request.AirlineRequest;
import com.triquang.payload.response.AirlineDropdownItem;
import com.triquang.payload.response.AirlineResponse;
import com.triquang.payload.response.CityResponse;
import com.triquang.repository.AirlineRepository;
import com.triquang.service.AirlineService;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
@Slf4j
public class AirlineServiceImpl implements AirlineService {

    private final AirlineRepository airlineRepository;
    private final CityClient cityClient;

    // ================= CREATE =================
    @Override
    public AirlineResponse createAirline(AirlineRequest request, Long ownerId) {

        validateRequest(request);
        validateUniqueCodes(request, null);

        Airline airline = AirlineMapper.toEntity(request, ownerId);
        Airline saved = airlineRepository.save(airline);

        log.info("Created airline id={}", saved.getId());

        return mapWithCity(saved); // ✅ enrich đúng
    }

    // ================= READ =================

    @Override
    @Cacheable(cacheNames = "airlinesByOwner", key = "#ownerId")
    public List<AirlineResponse> getAirlinesByOwner(Long ownerId) {

        List<Airline> airlines = airlineRepository.findAllByOwnerId(ownerId);

        if (airlines.isEmpty()) {
            throw new BaseException(ErrorCode.AIRLINE_NOT_FOUND);
        }

        // ✅ FIX: dùng preload thay vì gọi từng cái
        Map<Long, CityResponse> cityMap = preloadCities(airlines);

        return airlines.stream()
                .map(a -> mapWithCityCached(a, cityMap))
                .toList();
    }

    @Override
    @Cacheable(cacheNames = "airlines", key = "#id")
    public AirlineResponse getAirlineById(Long id) {

        Airline airline = airlineRepository.findById(id)
                .orElseThrow(() -> new BaseException(ErrorCode.AIRLINE_NOT_FOUND));

        return mapWithCity(airline); // single → OK
    }

    @Override
    @Transactional(readOnly = true)
    public Map<Long, AirlineResponse> getAirlinesByIds(List<Long> ids) {
        if (ids == null || ids.isEmpty()) {
            return Map.of();
        }

        List<Airline> airlines = airlineRepository.findAllById(ids.stream()
                .filter(id -> id != null)
                .distinct()
                .toList());
        Map<Long, CityResponse> cityMap = preloadCities(airlines);

        return airlines.stream()
                .collect(Collectors.toMap(Airline::getId, airline -> mapWithCityCached(airline, cityMap)));
    }

    @Override
    public Page<AirlineResponse> getAllAirlines(Pageable pageable) {

        Page<Airline> page = airlineRepository.findAll(pageable);

        Map<Long, CityResponse> cityMap = preloadCities(page.getContent());

        return page.map(a -> mapWithCityCached(a, cityMap));
    }

    @Override
    public Page<AirlineResponse> searchAdvanced(String keyword, AirlineStatus status, Pageable pageable) {

        log.info("DB HIT - airline searchAdvanced | keyword={} status={} page={}",
                keyword, status, pageable.getPageNumber());

        Specification<Airline> spec = (root, query, cb) -> cb.conjunction();

        if (keyword != null && !keyword.isBlank()) {
            String kw = "%" + keyword.trim().toLowerCase() + "%";

            spec = spec.and((root, q, cb) ->
                    cb.or(
                            cb.like(cb.lower(root.get("name")), kw),
                            cb.like(cb.lower(root.get("alias")), kw),
                            cb.like(cb.lower(root.get("iataCode")), kw),
                            cb.like(cb.lower(root.get("icaoCode")), kw),
                            cb.like(cb.lower(root.get("alliance")), kw),
                            cb.like(cb.lower(root.get("website")), kw),
                            cb.like(cb.lower(root.get("support").get("email")), kw),
                            cb.like(cb.lower(root.get("support").get("phone")), kw)
                    )
            );
        }

        if (status != null) {
            spec = spec.and((root, q, cb) ->
                    cb.equal(root.get("status"), status)
            );
        }

        Page<Airline> page = airlineRepository.findAll(spec, pageable);
        Map<Long, CityResponse> cityMap = preloadCities(page.getContent());

        return page.map(a -> mapWithCityCached(a, cityMap));
    }

    // ================= UPDATE =================
    @Override
    @Caching(evict = {
            @CacheEvict(cacheNames = "airlines", key = "#id"),
            @CacheEvict(cacheNames = "airlinesByOwner", key = "#ownerId"),
            @CacheEvict(cacheNames = "airlinesDropdown", allEntries = true)
    })
    public AirlineResponse updateAirline(Long id, AirlineRequest request, Long ownerId) {

        validateRequest(request);
        validateUniqueCodes(request, id);

        Airline airline = airlineRepository.findById(id)
                .orElseThrow(() -> new BaseException(ErrorCode.AIRLINE_NOT_FOUND));

        if (!airline.getOwnerId().equals(ownerId)) {
            throw new BaseException(ErrorCode.INVALID_INPUT);
        }

        AirlineMapper.updateEntity(airline, request);

        Airline saved = airlineRepository.save(airline);

        return mapWithCity(saved); // single → OK
    }

    // ================= DELETE =================
    @Override
    @Caching(evict = {
            @CacheEvict(cacheNames = "airlines", key = "#id"),
            @CacheEvict(cacheNames = "airlinesByOwner", key = "#ownerId"),
            @CacheEvict(cacheNames = "airlinesDropdown", allEntries = true)
    })
    public void deleteAirline(Long id, Long ownerId) {

        Airline airline = airlineRepository.findById(id)
                .orElseThrow(() -> new BaseException(ErrorCode.AIRLINE_NOT_FOUND));

        if (!airline.getOwnerId().equals(ownerId)) {
            throw new BaseException(ErrorCode.INVALID_INPUT);
        }

        airlineRepository.delete(airline);
    }

    // ================= ADMIN =================
    @Override
    @Caching(evict = {
            @CacheEvict(cacheNames = "airlines", key = "#airlineId"),
            @CacheEvict(cacheNames = "airlinesByOwner", allEntries = true),
            @CacheEvict(cacheNames = "airlinesDropdown", allEntries = true)
    })
    public AirlineResponse changeStatusByAdmin(Long airlineId, AirlineStatus status) {

        Airline airline = airlineRepository.findById(airlineId)
                .orElseThrow(() -> new BaseException(ErrorCode.AIRLINE_NOT_FOUND));

        if (airline.getStatus() == AirlineStatus.BANNED && status == AirlineStatus.ACTIVE) {
            throw new BaseException(ErrorCode.INVALID_INPUT);
        }

        airline.setStatus(status);

        return AirlineMapper.toResponse(airlineRepository.save(airline));
    }

    @Override
    @Caching(evict = {
            @CacheEvict(cacheNames = "airlines", key = "#airlineId"),
            @CacheEvict(cacheNames = "airlinesByOwner", allEntries = true),
            @CacheEvict(cacheNames = "airlinesDropdown", allEntries = true)
    })
    public void rejectAirlineByAdmin(Long airlineId) {
        Airline airline = airlineRepository.findById(airlineId)
                .orElseThrow(() -> new BaseException(ErrorCode.AIRLINE_NOT_FOUND));

        if (airline.getStatus() != AirlineStatus.PENDING) {
            throw new BaseException(ErrorCode.INVALID_INPUT);
        }

        airlineRepository.delete(airline);
        log.info("Rejected pending airline id={} ownerId={}", airlineId, airline.getOwnerId());
    }

    // ================= DROPDOWN =================
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
                        .build())
                .toList();
    }

    // ================= HELPER =================

    // SINGLE entity
    private AirlineResponse mapWithCity(Airline airline) {

        AirlineResponse res = AirlineMapper.toResponse(airline);

        if (airline.getHeadquartersCityId() != null) {
            try {
                var response = cityClient.getCityById(airline.getHeadquartersCityId());

                if (response != null && response.data() != null) {
                    var city = response.data();

                    res.setCountryCode(city.getCountryCode());
                    res.setCountryName(city.getCountryName());
                }

            } catch (Exception e) {
                log.warn("City service failed for airline {}", airline.getId(), e);
            }
        }

        return res;
    }

    private Map<Long, CityResponse> preloadCities(List<Airline> airlines) {

        return airlines.stream()
                .map(Airline::getHeadquartersCityId)
                .filter(id -> id != null)
                .distinct()
                .map(id -> {
                    try {
                        var res = cityClient.getCityById(id);
                        return res != null ? res.data() : null;
                    } catch (Exception e) {
                        log.warn("City preload failed id={}", id);
                        return null;
                    }
                })
                .filter(c -> c != null)
                .collect(Collectors.toMap(CityResponse::getId, c -> c));
    }

    private AirlineResponse mapWithCityCached(Airline airline, Map<Long, CityResponse> cityMap) {

        var res = AirlineMapper.toResponse(airline);

        CityResponse city = cityMap.get(airline.getHeadquartersCityId());

        if (city != null) {
            res.setCountryCode(city.getCountryCode());
            res.setCountryName(city.getCountryName());
        }

        return res;
    }

    // ================= VALIDATION =================
    private void validateRequest(AirlineRequest request) {

        if (request.getName() == null || request.getName().isBlank()) {
            throw new BaseException(ErrorCode.INVALID_INPUT);
        }

        if (request.getIataCode() != null && request.getIataCode().length() != 2) {
            throw new BaseException(ErrorCode.INVALID_INPUT);
        }

        if (request.getIcaoCode() != null && request.getIcaoCode().length() != 3) {
            throw new BaseException(ErrorCode.INVALID_INPUT);
        }
    }

    private void validateUniqueCodes(AirlineRequest request, Long currentAirlineId) {
        String iataCode = normalizeCode(request.getIataCode());
        String icaoCode = normalizeCode(request.getIcaoCode());
        String name = request.getName() == null ? null : request.getName().trim();

        if (iataCode != null && (currentAirlineId == null
                ? airlineRepository.existsByIataCode(iataCode)
                : airlineRepository.existsByIataCodeAndIdNot(iataCode, currentAirlineId))) {
            throw new BaseException(ErrorCode.AIRLINE_IATA_ALREADY_EXISTS);
        }

        if (icaoCode != null && (currentAirlineId == null
                ? airlineRepository.existsByIcaoCode(icaoCode)
                : airlineRepository.existsByIcaoCodeAndIdNot(icaoCode, currentAirlineId))) {
            throw new BaseException(ErrorCode.AIRLINE_ICAO_ALREADY_EXISTS);
        }

        if (name != null && (currentAirlineId == null
                ? airlineRepository.existsByNameIgnoreCase(name)
                : airlineRepository.existsByNameIgnoreCaseAndIdNot(name, currentAirlineId))) {
            throw new BaseException(ErrorCode.AIRLINE_NAME_ALREADY_EXISTS);
        }
    }

    private String normalizeCode(String value) {
        return value == null || value.isBlank() ? null : value.trim().toUpperCase();
    }
}
