package com.triquang.service.impl;

import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.cache.annotation.Caching;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.triquang.enums.ErrorCode;
import com.triquang.exception.BaseException;
import com.triquang.mapper.FareMapper;
import com.triquang.model.Fare;
import com.triquang.payload.request.FareRequest;
import com.triquang.payload.response.FareResponse;
import com.triquang.repository.FareRepository;
import com.triquang.service.FareService;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
@Transactional
public class FareServiceImpl implements FareService {

	private final FareRepository fareRepository;

	@Override
	public FareResponse createFare(FareRequest request) {
		if (fareRepository.existsByFlightIdAndCabinClassIdAndName(request.getFlightId(), request.getCabinClassId(),
				request.getName())) {
			throw new BaseException(ErrorCode.FARE_ALREADY_EXISTS);
		}

		Fare fare = FareMapper.toEntity(request);
		Fare saved = fareRepository.save(fare);
		return FareMapper.toResponse(saved);
	}

	@Override
	public List<FareResponse> createFares(List<FareRequest> requests) {
		// Single DB call: fetch composite keys for all relevant flightIds
		Set<Long> flightIds = requests.stream().map(FareRequest::getFlightId).collect(Collectors.toSet());
		Set<String> existingKeys = fareRepository.findExistingFareKeys(flightIds);

		List<Fare> toSave = requests.stream().filter(
				req -> !existingKeys.contains(req.getFlightId() + ":" + req.getCabinClassId() + ":" + req.getName()))
				.map(FareMapper::toEntity).collect(Collectors.toList());

		return fareRepository.saveAll(toSave).stream().map(FareMapper::toResponse).collect(Collectors.toList());
	}

	@Override
	@Transactional(readOnly = true)
	@Cacheable(cacheNames = "fares", key = "#id")
	public FareResponse getFareById(Long id) {
		Fare fare = fareRepository.findById(id).orElseThrow(() -> new BaseException(ErrorCode.FARE_NOT_FOUND));
		return FareMapper.toResponse(fare);
	}

	@Override
	@Transactional(readOnly = true)
	public List<FareResponse> getFaresByFlightIdAndCabinClassId(Long flightId, Long cabinClassId) {
		return fareRepository.findByFlightIdAndCabinClassId(flightId, cabinClassId).stream().map(FareMapper::toResponse)
				.collect(Collectors.toList());
	}

	@Override
	@Caching(evict = { @CacheEvict(cacheNames = "fares", key = "#id"),
			@CacheEvict(cacheNames = "faresByFlight", allEntries = true) })
	public FareResponse updateFare(Long id, FareRequest request) {
		Fare existing = fareRepository.findById(id).orElseThrow(() -> new BaseException(ErrorCode.FARE_NOT_FOUND));

		if (fareRepository.existsByFlightIdAndCabinClassIdAndNameAndIdNot(request.getFlightId(),
				request.getCabinClassId(), request.getName(), id)) {
			throw new BaseException(ErrorCode.FARE_ALREADY_EXISTS);
		}

		FareMapper.updateEntity(request, existing);
		Fare saved = fareRepository.save(existing);
		return FareMapper.toResponse(saved);
	}

	@Override
	@Caching(evict = { @CacheEvict(cacheNames = "fares", key = "#id"),
			@CacheEvict(cacheNames = "faresByFlight", allEntries = true) })
	public void deleteFare(Long id) {
		Fare fare = fareRepository.findById(id).orElseThrow(() -> new BaseException(ErrorCode.FARE_NOT_FOUND));
		fareRepository.delete(fare);
	}

	@Override
	public List<Fare> getFares() {
		return fareRepository.findAll();
	}

	@Override
	@Transactional(readOnly = true)
	public Map<Long, FareResponse> getFaresByIds(List<Long> ids) {
		if (ids == null || ids.isEmpty())
			return Map.of();
		return fareRepository.findAllById(ids).stream().collect(Collectors.toMap(Fare::getId, FareMapper::toResponse));
	}

	@Override
	@Transactional(readOnly = true)
	public Map<Long, FareResponse> getLowestFarePerFlight(List<Long> flightIds, Long cabinClassId) {
		if (flightIds == null || flightIds.isEmpty())
			return Map.of();

		List<Fare> fares = fareRepository.findByFlightIdInAndCabinClassId(flightIds, cabinClassId);

		// Group by flightId and keep only the cheapest fare per flight
		Map<Long, FareResponse> result = fares.stream().collect(Collectors.toMap(Fare::getFlightId, fare -> fare,
				// merge: keep the fare with the lower total price
				(existing, candidate) -> candidate.getTotalPrice() < existing.getTotalPrice() ? candidate : existing))
				.entrySet().stream()
				.collect(Collectors.toMap(Map.Entry::getKey, e -> FareMapper.toResponse(e.getValue())));

		return result;
	}

	@Override
	public FareResponse getLowestFareForFlightAndCabin(Long flightId, Long cabinClassId) {

		List<Fare> fares = fareRepository.findByFlightIdAndCabinClassId(flightId, cabinClassId);

		Fare lowestFare = fares.stream().min(Comparator.comparingDouble(Fare::getTotalPrice)).orElse(null);

		return FareMapper.toResponse(lowestFare);
	}
}
