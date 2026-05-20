package com.triquang.service.impl;

import java.time.ZoneId;
import java.util.List;

import org.springframework.cache.annotation.*;
import org.springframework.data.domain.*;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;

import com.triquang.enums.ErrorCode;
import com.triquang.exception.BaseException;
import com.triquang.mapper.CityMapper;
import com.triquang.model.City;
import com.triquang.payload.request.CityRequest;
import com.triquang.payload.response.CityResponse;
import com.triquang.repository.CityRepository;
import com.triquang.service.CityService;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Service
@RequiredArgsConstructor
@Slf4j
public class CityServiceImpl implements CityService {

    private final CityRepository cityRepository;

    // ================= CREATE =================
    @Override
    @Caching(evict = {
            @CacheEvict(cacheNames = "cityDropdown", allEntries = true),
            @CacheEvict(cacheNames = "cityById", allEntries = true)
    })
    public CityResponse createCity(CityRequest request) {

        log.info("CREATE city | code={} country={}",
                request.getCityCode(), request.getCountryCode());

        normalize(request);
        validate(request);
        validateTimezone(request.getTimeZone());

        if (cityRepository.existsByCityCode(request.getCityCode())) {
            throw new BaseException(ErrorCode.CITY_ALREADY_EXISTS);
        }

        City city = CityMapper.toEntity(request);

        return CityMapper.toResponse(cityRepository.save(city));
    }

    // ================= GET BY ID =================
    @Override
    @Cacheable(cacheNames = "cityById", key = "#id")
    public CityResponse getCityById(Long id) {

        log.info("DB HIT - getCityById | id={}", id);

        validateId(id);

        City city = cityRepository.findById(id)
                .orElseThrow(() -> new BaseException(ErrorCode.CITY_NOT_FOUND));

        return CityMapper.toResponse(city);
    }

    // ================= DROPDOWN =================
    @Override
    @Cacheable(cacheNames = "cityDropdown", key = "'all'")
    public List<CityResponse> getCitiesDropdown() {

        log.info("DB HIT - getCitiesDropdown");

        return cityRepository.findAll(Sort.by("name")).stream()
                .map(CityMapper::toResponse)
                .toList();
    }

    // ================= PAGINATION =================
    @Override
    public Page<CityResponse> getAllCities(Pageable pageable) {

        log.info("DB HIT - getAllCities | page={}", pageable.getPageNumber());

        return cityRepository.findAll(pageable)
                .map(CityMapper::toResponse);
    }

    // ================= SEARCH =================
    @Override
    public Page<CityResponse> searchCities(String keyword, Pageable pageable) {

        log.info("DB HIT - searchCities | keyword={} page={}",
                keyword, pageable.getPageNumber());

        if (keyword == null || keyword.isBlank()) {
            return getAllCities(pageable);
        }

        return cityRepository.searchByKeyword(keyword.trim(), pageable)
                .map(CityMapper::toResponse);
    }

    // ================= BY COUNTRY =================
    @Override
    public Page<CityResponse> getCitiesByCountryCode(String countryCode, Pageable pageable) {

        log.info("DB HIT - getCitiesByCountryCode | country={} page={}",
                countryCode, pageable.getPageNumber());

        return cityRepository.findByCountryCodeIgnoreCase(countryCode, pageable)
                .map(CityMapper::toResponse);
    }

    // ================= ADVANCED SEARCH =================
    @Override
    public Page<CityResponse> searchAdvanced(
            String keyword,
            String country,
            String timezone,
            String region,
            Pageable pageable
    ) {

        log.info("DB HIT - searchAdvanced | keyword={} country={} timezone={} region={} page={}",
                keyword, country, timezone, region, pageable.getPageNumber());

        Specification<City> spec = (root, query, cb) -> cb.conjunction();

        if (keyword != null && !keyword.isBlank()) {
            String kw = "%" + keyword.trim().toLowerCase() + "%";

            spec = spec.and((root, q, cb) ->
                    cb.or(
                            cb.like(cb.lower(root.get("name")), kw),
                            cb.like(cb.lower(root.get("cityCode")), kw)
                    )
            );
        }

        if (country != null && !country.isBlank()) {
            spec = spec.and((root, q, cb) ->
                    cb.equal(cb.upper(root.get("countryCode")), country.toUpperCase())
            );
        }

        if (timezone != null && !timezone.isBlank()) {
            spec = spec.and((root, q, cb) ->
                    cb.equal(root.get("timeZoneId"), timezone)
            );
        }

        if (region != null && !region.isBlank()) {
            spec = spec.and((root, q, cb) ->
                    cb.equal(root.get("regionCode"), region)
            );
        }

        return cityRepository.findAll(spec, pageable)
                .map(CityMapper::toResponse);
    }

    // ================= UPDATE =================
    @Override
    @Caching(evict = {
            @CacheEvict(cacheNames = "cityDropdown", allEntries = true),
            @CacheEvict(cacheNames = "cityById", key = "#id")
    })
    public CityResponse updateCity(Long id, CityRequest request) {

        log.info("UPDATE city | id={}", id);

        City city = cityRepository.findById(id)
                .orElseThrow(() -> new BaseException(ErrorCode.CITY_NOT_FOUND));

        normalize(request);
        validate(request);
        validateTimezone(request.getTimeZone());

        if (cityRepository.existsByCityCodeAndIdNot(request.getCityCode(), id)) {
            throw new BaseException(ErrorCode.CITY_ALREADY_EXISTS);
        }

        CityMapper.updateEntity(city, request);

        return CityMapper.toResponse(cityRepository.save(city));
    }

    // ================= DELETE =================
    @Override
    @Caching(evict = {
            @CacheEvict(cacheNames = "cityDropdown", allEntries = true),
            @CacheEvict(cacheNames = "cityById", key = "#id")
    })
    public void deleteCity(Long id) {

        log.info("DELETE city | id={}", id);

        City city = cityRepository.findById(id)
                .orElseThrow(() -> new BaseException(ErrorCode.CITY_NOT_FOUND));

        cityRepository.delete(city);
    }

    // ================= HELPER =================
    private void normalize(CityRequest request) {
        request.setCityCode(request.getCityCode().trim().toUpperCase());
        request.setCountryCode(request.getCountryCode().trim().toUpperCase());
    }

    private void validate(CityRequest request) {

        if (!request.getCityCode().matches("^[A-Z0-9]{2,10}$")) {
            throw new BaseException(ErrorCode.INVALID_CITY_CODE);
        }

        if (!request.getCountryCode().matches("^[A-Z]{2,5}$")) {
            throw new BaseException(ErrorCode.INVALID_COUNTRY_CODE);
        }
    }

    private void validateTimezone(String timeZone) {
        try {
            ZoneId.of(timeZone);
        } catch (Exception e) {
            throw new BaseException(ErrorCode.INVALID_TIMEZONE);
        }
    }

    private void validateId(Long id) {
        if (id == null || id <= 0) {
            throw new BaseException(ErrorCode.INVALID_INPUT);
        }
    }
}