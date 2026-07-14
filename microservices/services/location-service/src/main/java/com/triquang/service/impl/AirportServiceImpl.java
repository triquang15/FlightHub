package com.triquang.service.impl;

import com.triquang.exception.BaseException;
import com.triquang.enums.ErrorCode;
import com.triquang.mapper.AirportMapper;
import com.triquang.model.Airport;
import com.triquang.model.City;
import com.triquang.payload.request.AirportRequest;
import com.triquang.payload.response.AirportResponse;
import com.triquang.repository.AirportRepository;
import com.triquang.repository.CityRepository;
import com.triquang.service.AirportService;
import com.triquang.service.GeoTimezoneService;
import com.triquang.service.storage.AirportMediaStorageService;
import com.triquang.service.storage.AirportMediaStorageService.StoredAirportMedia;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import org.springframework.cache.annotation.*;
import org.springframework.data.domain.*;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class AirportServiceImpl implements AirportService {

    private final AirportRepository airportRepository;
    private final CityRepository cityRepository;
    private final GeoTimezoneService geoTimezoneService;
    private final AirportMediaStorageService airportMediaStorageService;

    // ================= SEARCH =================
    @Override
    @Transactional(readOnly = true)
    public Page<AirportResponse> searchAirports(
            String keyword,
            String country,
            Long cityId,
            Pageable pageable
    ) {

        log.info("DB HIT - searchAirports | keyword={} country={} cityId={} page={}",
                keyword, country, cityId, pageable.getPageNumber());

        Specification<Airport> spec = (root, query, cb) -> cb.conjunction();

        if (keyword != null && !keyword.isBlank()) {
            String kw = "%" + keyword.toLowerCase() + "%";

            spec = spec.and((root, q, cb) ->
                    cb.or(
                            cb.like(cb.lower(root.get("name")), kw),
                            cb.like(cb.lower(root.get("iataCode")), kw)
                    )
            );
        }

        if (country != null && !country.isBlank()) {
            spec = spec.and((root, q, cb) ->
                    cb.equal(cb.upper(root.get("city").get("countryCode")), country.toUpperCase())
            );
        }

        if (cityId != null) {
            spec = spec.and((root, q, cb) ->
                    cb.equal(root.get("city").get("id"), cityId)
            );
        }

        return airportRepository.findAll(spec, pageable)
                .map(AirportMapper::toResponse);
    }

    // ================= CREATE =================
    @Override
    @Transactional
    @Caching(evict = {
        @CacheEvict(cacheNames = "airportById", allEntries = true),
        @CacheEvict(cacheNames = "airportsByCity", allEntries = true)
    })
    public AirportResponse createAirport(AirportRequest request) {

        log.info("CREATE airport | iata={} cityId={}", request.getIataCode(), request.getCityId());

        String iata = normalizeIata(request.getIataCode());

        if (airportRepository.existsByIataCode(iata)) {
            throw new BaseException(ErrorCode.AIRPORT_ALREADY_EXISTS);
        }

        applyTimezone(request);

        City city = cityRepository.findById(request.getCityId())
                .orElseThrow(() -> new BaseException(ErrorCode.CITY_NOT_FOUND));

        Airport airport = AirportMapper.toEntity(request);
        airport.setIataCode(iata);
        airport.setCity(city);

        return AirportMapper.toResponse(airportRepository.save(airport));
    }

    // ================= BULK =================
    @Override
    @Transactional
    @Caching(evict = {
        @CacheEvict(cacheNames = "airportById", allEntries = true),
        @CacheEvict(cacheNames = "airportsByCity", allEntries = true)
    })
    public List<AirportResponse> createBulkAirports(List<AirportRequest> requests) {

        List<String> iatas = requests.stream()
                .map(r -> normalizeIata(r.getIataCode()))
                .toList();

        Set<String> existing = airportRepository.findAllByIataCodeIn(iatas)
                .stream()
                .map(Airport::getIataCode)
                .collect(Collectors.toSet());

        return requests.stream()
                .filter(r -> !existing.contains(normalizeIata(r.getIataCode())))
                .map(req -> {

                    applyTimezone(req);

                    City city = cityRepository.findById(req.getCityId())
                            .orElseThrow(() -> new BaseException(ErrorCode.CITY_NOT_FOUND));

                    Airport airport = AirportMapper.toEntity(req);
                    airport.setIataCode(normalizeIata(req.getIataCode()));
                    airport.setCity(city);

                    return AirportMapper.toResponse(airportRepository.save(airport));
                })
                .toList();
    }

    // ================= GET BY ID =================
    @Override
    @Transactional(readOnly = true)
    @Cacheable(
        cacheNames = "airportById",
        key = "#id",
        unless = "#result == null"
    )
    public AirportResponse getAirportById(Long id) {

        log.info("DB HIT - getAirportById | id={}", id);

        Airport airport = airportRepository.findByIdWithCity(id)
                .orElseThrow(() -> new BaseException(ErrorCode.AIRPORT_NOT_FOUND));

        return AirportMapper.toResponse(airport);
    }

    // ================= UPDATE =================
    @Override
    @Transactional
    @Caching(evict = {
        @CacheEvict(cacheNames = "airportById", key = "#id"),
        @CacheEvict(cacheNames = "airportsByCity", allEntries = true)
    })
    public AirportResponse updateAirport(Long id, AirportRequest request) {

        Airport airport = airportRepository.findById(id)
                .orElseThrow(() -> new BaseException(ErrorCode.AIRPORT_NOT_FOUND));

        if (request.getIataCode() != null) {
            String newIata = normalizeIata(request.getIataCode());

            if (!airport.getIataCode().equals(newIata)
                    && airportRepository.existsByIataCode(newIata)) {
                throw new BaseException(ErrorCode.AIRPORT_ALREADY_EXISTS);
            }

            airport.setIataCode(newIata);
        }

        if (request.getCityId() != null) {
            City city = cityRepository.findById(request.getCityId())
                    .orElseThrow(() -> new BaseException(ErrorCode.CITY_NOT_FOUND));
            airport.setCity(city);
        }

        applyTimezone(request);

        AirportMapper.updateEntity(request, airport);

        return AirportMapper.toResponse(airportRepository.save(airport));
    }

    @Override
    @Transactional
    @Caching(evict = {
        @CacheEvict(cacheNames = "airportById", key = "#id"),
        @CacheEvict(cacheNames = "airportsByCity", allEntries = true)
    })
    public AirportResponse updateHeroImage(Long id, MultipartFile file) {

        Airport airport = airportRepository.findById(id)
                .orElseThrow(() -> new BaseException(ErrorCode.AIRPORT_NOT_FOUND));

        StoredAirportMedia media = airportMediaStorageService.storeHeroImage(id, file);
        airportMediaStorageService.delete(airport.getHeroImageObjectKey());
        airport.setHeroImageObjectKey(media.objectKey());
        airport.setHeroImageUrl(media.publicUrl());

        return AirportMapper.toResponse(airportRepository.save(airport));
    }

    @Override
    @Transactional
    @Caching(evict = {
        @CacheEvict(cacheNames = "airportById", key = "#id"),
        @CacheEvict(cacheNames = "airportsByCity", allEntries = true)
    })
    public AirportResponse deleteHeroImage(Long id) {

        Airport airport = airportRepository.findById(id)
                .orElseThrow(() -> new BaseException(ErrorCode.AIRPORT_NOT_FOUND));

        airportMediaStorageService.delete(airport.getHeroImageObjectKey());
        airport.setHeroImageObjectKey(null);
        airport.setHeroImageUrl(null);

        return AirportMapper.toResponse(airportRepository.save(airport));
    }

    // ================= DELETE =================
    @Override
    @Transactional
    @Caching(evict = {
        @CacheEvict(cacheNames = "airportById", key = "#id"),
        @CacheEvict(cacheNames = "airportsByCity", allEntries = true)
    })
    public void deleteAirport(Long id) {

        Airport airport = airportRepository.findById(id)
                .orElseThrow(() -> new BaseException(ErrorCode.AIRPORT_NOT_FOUND));

        airportMediaStorageService.delete(airport.getHeroImageObjectKey());
        airportRepository.delete(airport);
    }

    // ================= HELPER =================
    private void applyTimezone(AirportRequest request) {

        if (request.getTimeZone() != null) return;

        // 1. GEO PRIORITY
        if (request.getGeoCode() != null &&
            request.getGeoCode().getLatitude() != null &&
            request.getGeoCode().getLongitude() != null) {

            String tz = geoTimezoneService.detect(
                    request.getGeoCode().getLatitude(),
                    request.getGeoCode().getLongitude()
            );

            if (tz != null) {
                request.setTimeZone(tz);
                return;
            }
        }

        // 2. FALLBACK CITY
        if (request.getCityId() != null) {
            cityRepository.findById(request.getCityId())
                    .map(City::getTimeZoneId)
                    .ifPresent(request::setTimeZone);
        }
    }

    private String normalizeIata(String iata) {
        if (iata == null || !iata.matches("^[A-Za-z]{3}$")) {
            throw new BaseException(ErrorCode.INVALID_INPUT);
        }
        return iata.toUpperCase();
    }
}
