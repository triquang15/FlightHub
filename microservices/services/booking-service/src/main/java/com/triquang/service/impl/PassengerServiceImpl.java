package com.triquang.service.impl;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.triquang.mapper.PassengerMapper;
import com.triquang.model.Passenger;
import com.triquang.payload.request.PassengerRequest;
import com.triquang.payload.response.PassengerResponse;
import com.triquang.repository.PassengerRepository;
import com.triquang.service.PassengerService;

import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Slf4j
public class PassengerServiceImpl implements PassengerService {

	private final PassengerRepository passengerRepository;

	@Override
	@Transactional
	public PassengerResponse createPassenger(PassengerRequest request, Long userId) {
		return PassengerMapper.toResponse(findOrCreatePassengerEntity(request, userId));
	}

	@Override
	@Transactional
	public Passenger findOrCreatePassengerEntity(PassengerRequest request, Long userId) {
		normalizeRequest(request);
		Optional<Passenger> existing = findExistingPassengerOptional(request, userId);
		if (existing.isPresent()) {
			Passenger passenger = existing.get();
			PassengerMapper.updateEntityFromRequest(request, passenger);
			passenger.setPrimaryUserId(userId);
			return passengerRepository.save(passenger);
		}

		Passenger newPassenger = PassengerMapper.toEntity(request);
		newPassenger.setPrimaryUserId(userId);
		return passengerRepository.save(newPassenger);
	}

	@Override
	public Passenger findExistingPassenger(PassengerRequest request, Long userId) {
		normalizeRequest(request);
		return findExistingPassengerOptional(request, userId).orElse(null);
	}

	@Override
	@Transactional(readOnly = true)
	public List<PassengerResponse> getSavedPassengers(Long userId) {
		return passengerRepository.findByPrimaryUserIdAndIsActiveTrueOrderByUpdatedAtDesc(userId)
				.stream()
				.map(PassengerMapper::toResponse)
				.toList();
	}

	@Override
	public boolean existsById(Long id) {
		return passengerRepository.existsById(id);
	}

	@Override
	public long count() {
		return passengerRepository.count();
	}

	private Optional<Passenger> findExistingPassengerOptional(PassengerRequest request, Long userId) {
		if (request == null || userId == null) {
			return Optional.empty();
		}

		if (request.getPassportNumber() != null && !request.getPassportNumber().isEmpty()) {
			Optional<Passenger> byPassport = passengerRepository
					.findByPrimaryUserIdAndPassportNumber(userId, request.getPassportNumber());
			if (byPassport.isPresent()) {
				return byPassport;
			}
		}

		return passengerRepository.findByPrimaryUserIdAndEmailAndPhoneAndDateOfBirth(userId, request.getEmail(), request.getPhone(),
				request.getDateOfBirth());
	}

	private void normalizeRequest(PassengerRequest request) {
		if (request == null) {
			return;
		}
		request.setFirstName(trimToNull(request.getFirstName()));
		request.setLastName(trimToNull(request.getLastName()));
		request.setEmail(request.getEmail() == null ? null : request.getEmail().trim().toLowerCase());
		request.setPhone(request.getPhone() == null ? null : request.getPhone().replaceAll("\\s+", ""));
		request.setPassportNumber(request.getPassportNumber() == null ? null : request.getPassportNumber().trim().toUpperCase());
		request.setNationality(trimToNull(request.getNationality()));
		request.setFrequentFlyerNumber(trimToNull(request.getFrequentFlyerNumber()));
		request.setDietaryPreferences(trimToNull(request.getDietaryPreferences()));
		request.setMedicalConditions(trimToNull(request.getMedicalConditions()));
	}

	private String trimToNull(String value) {
		if (value == null) {
			return null;
		}
		String trimmed = value.trim();
		return trimmed.isEmpty() ? null : trimmed;
	}
}
