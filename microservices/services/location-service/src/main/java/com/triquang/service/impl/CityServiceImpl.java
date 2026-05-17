package com.triquang.service.impl;

import java.util.List;

import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.cache.annotation.Caching;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
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

    // CREATE
    @Override
    @Caching(evict = {
            @CacheEvict(cacheNames = "cityDropdown", allEntries = true),
            @CacheEvict(cacheNames = "citiesByCode", allEntries = true)
    })
    public CityResponse createCity(CityRequest request) {

        normalize(request);
        validate(request);

        if (cityRepository.existsByCityCode(request.getCityCode())) {
            throw new BaseException(ErrorCode.CITY_ALREADY_EXISTS);
        }

        return CityMapper.toResponse(
                cityRepository.save(CityMapper.toEntity(request))
        );
    }

    // GET BY ID
    @Override
    @Cacheable(cacheNames = "cityById", key = "#id")
    public CityResponse getCityById(Long id) {

        validateId(id);

        City city = cityRepository.findById(id)
                .orElseThrow(() -> new BaseException(ErrorCode.CITY_NOT_FOUND));

        return CityMapper.toResponse(city);
    }

    @Override
    @Cacheable(cacheNames = "cityDropdown", key = "'all'")
    public List<CityResponse> getCitiesDropdown() {

        return cityRepository.findAll(Sort.by("name")).stream()
                .map(CityMapper::toResponse)
                .toList();
    }

    // PAGINATION
    @Override
    public Page<CityResponse> getAllCities(Pageable pageable) {
        return cityRepository.findAll(pageable)
                .map(CityMapper::toResponse);
    }

    // SEARCH
    @Override
    public Page<CityResponse> searchCities(String keyword, Pageable pageable) {

        if (keyword == null || keyword.isBlank()) {
            return getAllCities(pageable);
        }

        return cityRepository.searchByKeyword(keyword.trim(), pageable)
                .map(CityMapper::toResponse);
    }

    // BY COUNTRY
    @Override
    public Page<CityResponse> getCitiesByCountryCode(String countryCode, Pageable pageable) {
        return cityRepository.findByCountryCodeIgnoreCase(countryCode, pageable)
                .map(CityMapper::toResponse);
    }

    // UPDATE
    @Override
    @Caching(evict = {
            @CacheEvict(cacheNames = "cityById", key = "#id"),
            @CacheEvict(cacheNames = "cityDropdown", allEntries = true),
            @CacheEvict(cacheNames = "citiesByCode", allEntries = true)
    })
    public CityResponse updateCity(Long id, CityRequest request) {

        City city = cityRepository.findById(id)
                .orElseThrow(() -> new BaseException(ErrorCode.CITY_NOT_FOUND));

        normalize(request);
        validate(request);

        if (cityRepository.existsByCityCodeAndIdNot(request.getCityCode(), id)) {
            throw new BaseException(ErrorCode.CITY_ALREADY_EXISTS);
        }

        CityMapper.updateEntity(city, request);

        return CityMapper.toResponse(cityRepository.save(city));
    }

    // DELETE
    @Override
    @Caching(evict = {
            @CacheEvict(cacheNames = "cityById", key = "#id"),
            @CacheEvict(cacheNames = "cityDropdown", allEntries = true),
            @CacheEvict(cacheNames = "citiesByCode", allEntries = true)
    })
    public void deleteCity(Long id) {

        City city = cityRepository.findById(id)
                .orElseThrow(() -> new BaseException(ErrorCode.CITY_NOT_FOUND));

        cityRepository.delete(city);
    }

    // =========================
    // VALIDATION
    // =========================

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

    private void validateId(Long id) {
        if (id == null || id <= 0) {
            throw new BaseException(ErrorCode.INVALID_INPUT);
        }
    }
}