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

import com.triquang.client.AirlineClient;
import com.triquang.client.FlightClient;
import com.triquang.client.SeatClient;
import com.triquang.enums.CabinClassType;
import com.triquang.enums.ErrorCode;
import com.triquang.exception.BaseException;
import com.triquang.mapper.FareMapper;
import com.triquang.model.Fare;
import com.triquang.payload.request.FareRequest;
import com.triquang.payload.response.AirlineResponse;
import com.triquang.payload.response.CabinClassResponse;
import com.triquang.payload.response.FareResponse;
import com.triquang.payload.response.FlightResponse;
import com.triquang.repository.FareRepository;
import com.triquang.service.FareService;

import feign.FeignException;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
@Transactional
public class FareServiceImpl implements FareService {

	private final FareRepository fareRepository;
	private final AirlineClient airlineClient;
	private final FlightClient flightClient;
	private final SeatClient seatClient;

	@Override
	public FareResponse createFare(Long userId, FareRequest request) {
		Long airlineId = getAirlineForUser(userId);
		FlightResponse flight = requireOwnedFlight(request.getFlightId(), airlineId);
		CabinClassType cabinClass = requireCabinOnFlight(flight, request.getCabinClassId());
		if (fareRepository.existsByFlightIdAndCabinClassIdAndName(request.getFlightId(), request.getCabinClassId(),
				request.getName())) {
			throw new BaseException(ErrorCode.FARE_ALREADY_EXISTS);
		}

		Fare fare = FareMapper.toEntity(request);
		fare.setAirlineId(airlineId);
		fare.setCabinClass(cabinClass);
		Fare saved = fareRepository.save(fare);
		return FareMapper.toResponse(saved);
	}

	@Override
	public List<FareResponse> createFares(Long userId, List<FareRequest> requests) {
		Long airlineId = getAirlineForUser(userId);
		Map<Long, FlightResponse> flightById = requests.stream().map(FareRequest::getFlightId).distinct()
				.collect(Collectors.toMap(flightId -> flightId, flightId -> requireOwnedFlight(flightId, airlineId)));
		// Single DB call: fetch composite keys for all relevant flightIds
		Set<Long> flightIds = requests.stream().map(FareRequest::getFlightId).collect(Collectors.toSet());
		Set<String> existingKeys = fareRepository.findExistingFareKeys(flightIds);

		List<Fare> toSave = requests.stream().filter(
				req -> !existingKeys.contains(req.getFlightId() + ":" + req.getCabinClassId() + ":" + req.getName()))
				.map(FareMapper::toEntity)
				.peek(fare -> {
					fare.setAirlineId(airlineId);
					fare.setCabinClass(requireCabinOnFlight(flightById.get(fare.getFlightId()), fare.getCabinClassId()));
				})
				.collect(Collectors.toList());

		return fareRepository.saveAll(toSave).stream().map(FareMapper::toResponse).collect(Collectors.toList());
	}

	@Override
	@Transactional(readOnly = true)
	public List<FareResponse> getFaresByAirlineOwner(Long userId) {
		Long airlineId = getAirlineForUser(userId);
		return fareRepository.findByAirlineIdOrderByUpdatedAtDesc(airlineId).stream()
				.map(FareMapper::toResponse)
				.collect(Collectors.toList());
	}

	@Override
	@Transactional(readOnly = true)
	public FareResponse getOwnedFareById(Long userId, Long id) {
		return FareMapper.toResponse(requireOwnedFare(userId, id));
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
	public FareResponse updateFare(Long userId, Long id, FareRequest request) {
		Fare existing = requireOwnedFare(userId, id);
		FlightResponse flight = requireOwnedFlight(request.getFlightId(), existing.getAirlineId());
		CabinClassType cabinClass = requireCabinOnFlight(flight, request.getCabinClassId());

		if (fareRepository.existsByFlightIdAndCabinClassIdAndNameAndIdNot(request.getFlightId(),
				request.getCabinClassId(), request.getName(), id)) {
			throw new BaseException(ErrorCode.FARE_ALREADY_EXISTS);
		}

		FareMapper.updateEntity(request, existing);
		existing.setCabinClass(cabinClass);
		Fare saved = fareRepository.save(existing);
		return FareMapper.toResponse(saved);
	}

	@Override
	@Caching(evict = { @CacheEvict(cacheNames = "fares", key = "#id"),
			@CacheEvict(cacheNames = "faresByFlight", allEntries = true) })
	public void deleteFare(Long userId, Long id) {
		Fare fare = requireOwnedFare(userId, id);
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

	private Fare requireOwnedFare(Long userId, Long id) {
		Fare fare = fareRepository.findByIdWithDetails(id)
				.orElseThrow(() -> new BaseException(ErrorCode.FARE_NOT_FOUND));
		if (!getAirlineForUser(userId).equals(fare.getAirlineId())) {
			throw new BaseException(ErrorCode.ACCESS_DENIED);
		}
		return fare;
	}

	private FlightResponse requireOwnedFlight(Long flightId, Long airlineId) {
		try {
			FlightResponse flight = flightClient.getFlightById(flightId);
			if (flight == null) {
				throw new BaseException(ErrorCode.EXTERNAL_SERVICE_ERROR);
			}
			if (flight.getAirline() == null || !airlineId.equals(flight.getAirline().getId())) {
				throw new BaseException(ErrorCode.ACCESS_DENIED);
			}
			return flight;
		} catch (FeignException.NotFound e) {
			throw new BaseException(ErrorCode.FARE_NOT_FOUND);
		} catch (FeignException e) {
			throw new BaseException(ErrorCode.EXTERNAL_SERVICE_ERROR);
		}
	}

	private CabinClassType requireCabinOnFlight(FlightResponse flight, Long cabinClassId) {
		try {
			if (flight == null || flight.getAircraft() == null || flight.getAircraft().getId() == null) {
				throw new BaseException(ErrorCode.EXTERNAL_SERVICE_ERROR);
			}

			List<CabinClassResponse> cabins = seatClient.getCabinClassesByAircraftId(flight.getAircraft().getId());
			if (cabins == null) {
				throw new BaseException(ErrorCode.EXTERNAL_SERVICE_ERROR);
			}

			CabinClassResponse cabin = cabins.stream()
					.filter(candidate -> cabinClassId.equals(candidate.getId()))
					.findFirst()
					.orElseThrow(() -> new BaseException(ErrorCode.CABIN_CLASS_NOT_FOUND));

			if (!Boolean.TRUE.equals(cabin.getIsActive()) || !Boolean.TRUE.equals(cabin.getIsBookable())) {
				throw new BaseException(ErrorCode.INVALID_INPUT);
			}

			return CabinClassType.valueOf(cabin.getName());
		} catch (IllegalArgumentException e) {
			throw new BaseException(ErrorCode.INVALID_INPUT);
		} catch (FeignException.NotFound e) {
			throw new BaseException(ErrorCode.CABIN_CLASS_NOT_FOUND);
		} catch (FeignException e) {
			throw new BaseException(ErrorCode.EXTERNAL_SERVICE_ERROR);
		}
	}

	private Long getAirlineForUser(Long userId) {
		try {
			List<AirlineResponse> airlines = airlineClient.getAirlinesByOwner(userId);
			if (airlines == null || airlines.isEmpty()) {
				throw new BaseException(ErrorCode.AIRLINE_NOT_FOUND);
			}
			return airlines.get(0).getId();
		} catch (FeignException.NotFound e) {
			throw new BaseException(ErrorCode.AIRLINE_NOT_FOUND);
		} catch (FeignException e) {
			throw new BaseException(ErrorCode.EXTERNAL_SERVICE_ERROR);
		}
	}
}
