package com.triquang.service.impl;

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
import org.springframework.cache.annotation.*;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class CityServiceImpl implements CityService {

	private final CityRepository cityRepository;

	// =========================
	// CREATE CITY
	// =========================
	@Override
	@Caching(evict = { @CacheEvict(cacheNames = "cities", allEntries = true),
			@CacheEvict(cacheNames = "citiesByCode", allEntries = true) })
	public CityResponse createCity(CityRequest request) {

		validate(request);

		if (cityRepository.existsByCityCode(request.getCityCode())) {
			throw new BaseException(ErrorCode.CITY_ALREADY_EXISTS);
		}

		City city = CityMapper.toEntity(request);
		City saved = cityRepository.save(city);

		log.info("City created: {}", saved.getCityCode());

		return CityMapper.toResponse(saved);
	}

	// =========================
	// BULK CREATE (SAFE VERSION)
	// =========================
	@Override
	@Caching(evict = { @CacheEvict(cacheNames = "cities", allEntries = true),
			@CacheEvict(cacheNames = "citiesByCode", allEntries = true) })
	public List<CityResponse> createBulkCities(List<CityRequest> requests) {

		return requests.stream().filter(req -> {
			if (cityRepository.existsByCityCode(req.getCityCode())) {
				log.warn("Skip existing city: {}", req.getCityCode());
				return false;
			}
			return true;
		}).map(req -> {
			validate(req);

			City city = CityMapper.toEntity(req);
			return CityMapper.toResponse(cityRepository.save(city));
		}).collect(Collectors.toList());
	}

	// =========================
	// GET BY ID (CACHE)
	// =========================
	@Override
	@Cacheable(cacheNames = "cities", key = "#id")
	public CityResponse getCityById(Long id) {

		validateId(id);

		City city = cityRepository.findById(id).orElseThrow(() -> new BaseException(ErrorCode.CITY_NOT_FOUND));

		return CityMapper.toResponse(city);
	}

	// =========================
	// UPDATE
	// =========================
	@Override
	@Caching(evict = { @CacheEvict(cacheNames = "cities", key = "#id"),
			@CacheEvict(cacheNames = "citiesByCode", allEntries = true) })
	public CityResponse updateCity(Long id, CityRequest request) {

		City city = cityRepository.findById(id).orElseThrow(() -> new BaseException(ErrorCode.CITY_NOT_FOUND));

		validate(request);

		if (cityRepository.existsByCityCodeAndIdNot(request.getCityCode(), id)) {
			throw new BaseException(ErrorCode.CITY_ALREADY_EXISTS);
		}

		CityMapper.updateEntity(city, request);

		City updated = cityRepository.save(city);

		log.info("City updated: {}", updated.getCityCode());

		return CityMapper.toResponse(updated);
	}

	// =========================
	// DELETE
	// =========================
	@Override
	@Caching(evict = { @CacheEvict(cacheNames = "cities", key = "#id"),
			@CacheEvict(cacheNames = "citiesByCode", allEntries = true) })
	public void deleteCity(Long id) {

		City city = cityRepository.findById(id).orElseThrow(() -> new BaseException(ErrorCode.CITY_NOT_FOUND));

		cityRepository.delete(city);

		log.info("City deleted: {}", city.getCityCode());
	}

	// =========================
	// LIST
	// =========================
	@Override
	public Page<CityResponse> getAllCities(Pageable pageable) {
		return cityRepository.findAll(pageable).map(CityMapper::toResponse);
	}

	// =========================
	// SEARCH
	// =========================
	@Override
	public Page<CityResponse> searchCities(String keyword, Pageable pageable) {
		return cityRepository.searchByKeyword(keyword, pageable).map(CityMapper::toResponse);
	}

	// =========================
	// BY COUNTRY
	// =========================
	@Override
	public Page<CityResponse> getCitiesByCountryCode(String countryCode, Pageable pageable) {
		return cityRepository.findByCountryCodeIgnoreCase(countryCode, pageable).map(CityMapper::toResponse);
	}

	// =========================
	// EXISTS
	// =========================
	@Override
	public boolean cityExists(String cityCode) {
		return cityRepository.existsByCityCode(cityCode);
	}

	// =========================
	// VALIDATION (SENIOR VERSION)
	// =========================
	private void validate(CityRequest request) {

		if (request.getCityCode() == null || !request.getCityCode().matches("^[A-Z0-9]{2,10}$")) {
			throw new BaseException(ErrorCode.INVALID_CITY_CODE);
		}

		if (request.getCountryCode() == null || !request.getCountryCode().matches("^[A-Z]{2,5}$")) {
			throw new BaseException(ErrorCode.INVALID_COUNTRY_CODE);
		}

		if (request.getTimeZoneOffset() != null) {

			String tz = request.getTimeZoneOffset().trim();

			if (!tz.matches("^[+-](0[0-9]|1[0-4]):[0-5][0-9]$")) {
				throw new BaseException(ErrorCode.INVALID_TIMEZONE_OFFSET);
			}
		}
	}

	private void validateId(Long id) {
		if (id == null || id <= 0) {
			throw new BaseException(ErrorCode.INVALID_INPUT);
		}
	}
}