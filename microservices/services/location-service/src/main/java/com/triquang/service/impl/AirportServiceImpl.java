package com.triquang.service.impl;

import java.util.List;
import java.util.stream.Collectors;

import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.cache.annotation.Caching;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.triquang.enums.ErrorCode;
import com.triquang.exception.BaseException;
import com.triquang.mapper.AirportMapper;
import com.triquang.model.Airport;
import com.triquang.model.City;
import com.triquang.payload.request.AirportRequest;
import com.triquang.payload.response.AirportResponse;
import com.triquang.repository.AirportRepository;
import com.triquang.repository.CityRepository;
import com.triquang.service.AirportService;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Service
@RequiredArgsConstructor
@Slf4j
public class AirportServiceImpl implements AirportService {

	private final AirportRepository airportRepository;
	private final CityRepository cityRepository;

	// =========================
	// CREATE SINGLE AIRPORT
	// =========================
	@Override
	@Transactional
	@Caching(evict = { @CacheEvict(cacheNames = "allAirports", allEntries = true),
			@CacheEvict(cacheNames = "airportsByCity", allEntries = true) })
	public AirportResponse createAirport(AirportRequest request) {

		validateIata(request.getIataCode());

		if (airportRepository.findByIataCode(request.getIataCode()).isPresent()) {
			throw new BaseException(ErrorCode.AIRPORT_ALREADY_EXISTS);
		}

		City city = cityRepository.findById(request.getCityId())
				.orElseThrow(() -> new BaseException(ErrorCode.CITY_NOT_FOUND));

		Airport airport = AirportMapper.toEntity(request);
		airport.setCity(city);

		return AirportMapper.toResponse(airportRepository.save(airport));
	}

	// =========================
	// BULK CREATE
	// =========================
	@Override
	@Transactional
	@Caching(evict = { @CacheEvict(cacheNames = "allAirports", allEntries = true),
			@CacheEvict(cacheNames = "airportsByCity", allEntries = true) })
	public List<AirportResponse> createBulkAirports(List<AirportRequest> requests) {

		return requests.stream().filter(req -> {
			boolean exists = airportRepository.findByIataCode(req.getIataCode()).isPresent();
			if (exists) {
				log.warn("Skip existing airport: {}", req.getIataCode());
			}
			return !exists;
		}).map(req -> {

			City city = cityRepository.findById(req.getCityId())
					.orElseThrow(() -> new BaseException(ErrorCode.CITY_NOT_FOUND));

			Airport airport = AirportMapper.toEntity(req);
			airport.setCity(city);

			return AirportMapper.toResponse(airportRepository.save(airport));
		}).collect(Collectors.toList());
	}

	// =========================
	// GET BY ID (CACHE)
	// =========================
	@Override
	@Transactional(readOnly = true)
	@Cacheable(cacheNames = "airports", key = "#id")
	public AirportResponse getAirportById(Long id) {

		validateId(id);

		Airport airport = airportRepository.findById(id)
				.orElseThrow(() -> new BaseException(ErrorCode.AIRPORT_NOT_FOUND));

		return AirportMapper.toResponse(airport);
	}

	// =========================
	// GET ALL
	// =========================
	@Override
	@Transactional(readOnly = true)
	@Cacheable(cacheNames = "allAirports")
	public List<AirportResponse> getAllAirports() {
		return airportRepository.findAll().stream().map(AirportMapper::toResponse).toList();
	}

	// =========================
	// UPDATE
	// =========================
	@Override
	@Transactional
	@Caching(evict = { @CacheEvict(cacheNames = "airports", key = "#id"),
			@CacheEvict(cacheNames = "allAirports", allEntries = true),
			@CacheEvict(cacheNames = "airportsByCity", allEntries = true) })
	public AirportResponse updateAirport(Long id, AirportRequest request) {

		Airport airport = airportRepository.findById(id)
				.orElseThrow(() -> new BaseException(ErrorCode.AIRPORT_NOT_FOUND));

		if (request.getIataCode() != null && !airport.getIataCode().equals(request.getIataCode())
				&& airportRepository.findByIataCode(request.getIataCode()).isPresent()) {

			throw new BaseException(ErrorCode.AIRPORT_ALREADY_EXISTS);
		}

		if (request.getCityId() != null) {
			City city = cityRepository.findById(request.getCityId())
					.orElseThrow(() -> new BaseException(ErrorCode.CITY_NOT_FOUND));

			airport.setCity(city);
		}

		AirportMapper.updateEntity(request, airport);

		return AirportMapper.toResponse(airportRepository.save(airport));
	}

	// =========================
	// DELETE
	// =========================
	@Override
	@Transactional
	@Caching(evict = { @CacheEvict(cacheNames = "airports", key = "#id"),
			@CacheEvict(cacheNames = "allAirports", allEntries = true),
			@CacheEvict(cacheNames = "airportsByCity", allEntries = true) })
	public void deleteAirport(Long id) {

		Airport airport = airportRepository.findById(id)
				.orElseThrow(() -> new BaseException(ErrorCode.AIRPORT_NOT_FOUND));

		airportRepository.delete(airport);
	}

	// =========================
	// BY CITY (CACHE)
	// =========================
	@Override
	@Transactional(readOnly = true)
	@Cacheable(cacheNames = "airportsByCity", key = "#cityId")
	public List<AirportResponse> getAirportsByCityId(Long cityId) {

		return airportRepository.findByCityId(cityId).stream().map(AirportMapper::toResponse).toList();
	}

	// =========================
	// VALIDATION
	// =========================
	private void validateId(Long id) {
		if (id == null || id <= 0) {
			throw new BaseException(ErrorCode.INVALID_INPUT);
		}
	}

	private void validateIata(String iata) {
		if (iata == null || iata.isBlank()) {
			throw new BaseException(ErrorCode.INVALID_INPUT);
		}
	}
}