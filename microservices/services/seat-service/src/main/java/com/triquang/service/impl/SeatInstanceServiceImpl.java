package com.triquang.service.impl;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.HashSet;
import java.util.List;
import java.util.Objects;
import java.util.Set;
import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.triquang.enums.ErrorCode;
import com.triquang.enums.SeatAvailabilityStatus;
import com.triquang.exception.BaseException;
import com.triquang.mapper.SeatInstanceMapper;
import com.triquang.model.FlightInstanceCabin;
import com.triquang.model.Seat;
import com.triquang.model.SeatInstance;
import com.triquang.payload.request.SeatConfirmRequest;
import com.triquang.payload.request.SeatHoldRequest;
import com.triquang.payload.request.SeatInstanceRequest;
import com.triquang.payload.request.SeatReleaseRequest;
import com.triquang.payload.response.SeatHoldResponse;
import com.triquang.payload.response.SeatInstanceResponse;
import com.triquang.repository.FlightInstanceCabinRepository;
import com.triquang.repository.SeatInstanceRepository;
import com.triquang.repository.SeatRepository;
import com.triquang.service.SeatLifecyclePolicy;
import com.triquang.service.SeatInstanceService;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
@Transactional
public class SeatInstanceServiceImpl implements SeatInstanceService {

    private final SeatInstanceRepository seatInstanceRepository;
    private final SeatRepository seatRepository;
    private final FlightInstanceCabinRepository flightInstanceCabinRepository;

    @Override
    public SeatInstanceResponse createSeatInstance(SeatInstanceRequest request) {

        Seat seat = seatRepository.findById(request.getSeatId())
                .orElseThrow(() -> new BaseException(ErrorCode.SEAT_NOT_FOUND));

        FlightInstanceCabin fic = null;
        if (request.getFlightInstanceCabinId() != null) {
            fic = flightInstanceCabinRepository.findById(request.getFlightInstanceCabinId())
                    .orElseThrow(() -> new BaseException(ErrorCode.FLIGHT_INSTANCE_NOT_FOUND));
        }

        SeatInstance seatInstance = SeatInstanceMapper.toEntity(request, seat, fic);
        SeatInstance saved = seatInstanceRepository.save(seatInstance);

        return SeatInstanceMapper.toResponse(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public SeatInstanceResponse getSeatInstanceById(Long id) {
        SeatInstance si = seatInstanceRepository.findById(id)
                .orElseThrow(() -> new BaseException(ErrorCode.SEAT_NOT_FOUND));

        return SeatInstanceMapper.toResponse(si);
    }

    @Override
    @Transactional(readOnly = true)
    public List<SeatInstanceResponse> getSeatInstancesByFlightId(Long flightId) {
        return seatInstanceRepository.findByFlightId(flightId).stream()
                .map(SeatInstanceMapper::toResponse)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<SeatInstanceResponse> getAvailableSeatsByFlightId(Long flightId) {
        return seatInstanceRepository.findAvailableByFlightId(flightId).stream()
                .map(SeatInstanceMapper::toResponse)
                .toList();
    }

    @Override
    public List<SeatInstanceResponse> getSeatInstancesByFlightInstanceId(Long flightInstanceId) {
        releaseExpiredHolds(flightInstanceId);

        return seatInstanceRepository.findByFlightInstanceId(flightInstanceId).stream()
                .map(SeatInstanceMapper::toResponse)
                .toList();
    }

    @Override
    public List<SeatInstanceResponse> getAvailableSeatsByFlightInstanceId(Long flightInstanceId) {
        releaseExpiredHolds(flightInstanceId);

        return seatInstanceRepository.findAvailableByFlightInstanceId(flightInstanceId).stream()
                .map(SeatInstanceMapper::toResponse)
                .toList();
    }

    @Override
    public List<SeatInstanceResponse> getAllByIds(List<Long> ids) {
        return seatInstanceRepository.findAllById(ids).stream()
                .map(SeatInstanceMapper::toResponse)
                .toList();
    }

    @Override
    public SeatInstanceResponse updateSeatInstanceStatus(Long id, SeatAvailabilityStatus status) {

        SeatInstance si = seatInstanceRepository.findByIdForUpdate(id)
                .orElseThrow(() -> new BaseException(ErrorCode.SEAT_NOT_FOUND));

        SeatAvailabilityStatus previousStatus = si.getStatus();
        switch (status) {
            case AVAILABLE -> {
                markAvailable(si);
            }
            case HELD -> markHeld(si, null, null, Instant.now().plus(10, ChronoUnit.MINUTES));
            case BOOKED -> {
                markBooked(si, null);
            }
            case BLOCKED, OCCUPIED -> markUnavailable(si, status);
            default -> throw new BaseException(ErrorCode.INVALID_INPUT);
        }

        SeatInstance saved = seatInstanceRepository.save(si);
        refreshBookedCounter(saved.getFlightInstanceCabin(), previousStatus, saved.getStatus());
        return SeatInstanceMapper.toResponse(saved);
    }

    @Override
    public SeatHoldResponse holdSeats(SeatHoldRequest request) {
        releaseExpiredHolds(request.getFlightInstanceId());

        List<SeatInstance> seatInstances = lockSeats(request.getSeatInstanceIds());
        validateAllRequestedSeatsWereFound(request.getSeatInstanceIds(), seatInstances);

        Instant now = Instant.now();
        Instant holdExpiresAt = now.plus(resolveHoldMinutes(request.getHoldMinutes()), ChronoUnit.MINUTES);
        String holdToken = request.getHoldToken() == null || request.getHoldToken().isBlank()
                ? UUID.randomUUID().toString()
                : request.getHoldToken();

        for (SeatInstance seatInstance : seatInstances) {
            if (!request.getFlightInstanceId().equals(seatInstance.getFlightInstanceId())) {
                throw new BaseException(ErrorCode.INVALID_INPUT);
            }

            boolean sameActiveHold = seatInstance.getStatus() == SeatAvailabilityStatus.HELD
                    && holdToken.equals(seatInstance.getHoldToken())
                    && Objects.equals(request.getUserId(), seatInstance.getHeldByUserId())
                    && seatInstance.getHoldExpiresAt() != null
                    && seatInstance.getHoldExpiresAt().isAfter(now);

            if (!sameActiveHold && !SeatLifecyclePolicy.canHold(seatInstance.getStatus(), seatInstance.getHoldExpiresAt(), now)) {
                throw new BaseException(ErrorCode.INVALID_INPUT);
            }

            markHeld(seatInstance, holdToken, request.getUserId(), holdExpiresAt);
        }

        List<SeatInstance> saved = seatInstanceRepository.saveAll(seatInstances);

        return SeatHoldResponse.builder()
                .holdToken(holdToken)
                .holdExpiresAt(holdExpiresAt)
                .seats(toResponses(saved))
                .build();
    }

    @Override
    public List<SeatInstanceResponse> releaseSeats(SeatReleaseRequest request) {
        List<SeatInstance> seatInstances = lockSeats(request.getSeatInstanceIds());
        validateAllRequestedSeatsWereFound(request.getSeatInstanceIds(), seatInstances);

        for (SeatInstance seatInstance : seatInstances) {
            SeatAvailabilityStatus previousStatus = seatInstance.getStatus();
            if (!SeatLifecyclePolicy.canRelease(seatInstance.getStatus())) {
                throw new BaseException(ErrorCode.INVALID_INPUT);
            }

            if (seatInstance.getStatus() == SeatAvailabilityStatus.BOOKED
                    && (request.getBookingReference() == null
                    || !request.getBookingReference().equals(seatInstance.getBookingReference()))) {
                throw new BaseException(ErrorCode.INVALID_INPUT);
            }

            if (seatInstance.getStatus() == SeatAvailabilityStatus.HELD
                    && request.getHoldToken() != null
                    && !request.getHoldToken().isBlank()
                    && !request.getHoldToken().equals(seatInstance.getHoldToken())) {
                throw new BaseException(ErrorCode.INVALID_INPUT);
            }

            markAvailable(seatInstance);
            refreshBookedCounter(seatInstance.getFlightInstanceCabin(), previousStatus, seatInstance.getStatus());
        }

        return toResponses(seatInstanceRepository.saveAll(seatInstances));
    }

    @Override
    public List<SeatInstanceResponse> confirmSeats(SeatConfirmRequest request) {
        List<SeatInstance> seatInstances = lockSeats(request.getSeatInstanceIds());
        validateAllRequestedSeatsWereFound(request.getSeatInstanceIds(), seatInstances);

        for (SeatInstance seatInstance : seatInstances) {
            SeatAvailabilityStatus previousStatus = seatInstance.getStatus();

            if (seatInstance.getStatus() == SeatAvailabilityStatus.BOOKED
                    && Objects.equals(seatInstance.getBookingReference(), request.getBookingReference())) {
                continue;
            }

            if (!SeatLifecyclePolicy.canConfirm(seatInstance.getStatus())) {
                throw new BaseException(ErrorCode.INVALID_INPUT);
            }

            if (seatInstance.getStatus() == SeatAvailabilityStatus.HELD
                    && request.getHoldToken() != null
                    && !request.getHoldToken().isBlank()
                    && !request.getHoldToken().equals(seatInstance.getHoldToken())) {
                throw new BaseException(ErrorCode.INVALID_INPUT);
            }

            markBooked(seatInstance, request.getBookingReference());
            refreshBookedCounter(seatInstance.getFlightInstanceCabin(), previousStatus, seatInstance.getStatus());
        }

        return toResponses(seatInstanceRepository.saveAll(seatInstances));
    }

    @Override
    @Transactional(readOnly = true)
    public Long countAvailableByFlightId(Long flightId) {
        return seatInstanceRepository.countAvailableByFlightId(flightId);
    }

    @Override
    public Long countAvailableByFlightInstanceId(Long flightInstanceId) {
        releaseExpiredHolds(flightInstanceId);
        return seatInstanceRepository.countAvailableByFlightInstanceId(flightInstanceId);
    }

    @Override
    public Double calculateSeatPrice(List<Long> seatInstanceIds) {

        List<SeatInstance> seatInstances = seatInstanceRepository.findAllById(seatInstanceIds);

        return seatInstances.stream()
                .mapToDouble(si -> si.getPremiumSurcharge() != null ? si.getPremiumSurcharge() : 0.0)
                .sum();
    }

    private List<SeatInstance> lockSeats(List<Long> seatInstanceIds) {
        if (seatInstanceIds == null || seatInstanceIds.isEmpty()) {
            throw new BaseException(ErrorCode.INVALID_INPUT);
        }
        return seatInstanceRepository.findAllByIdForUpdate(seatInstanceIds);
    }

    private void validateAllRequestedSeatsWereFound(List<Long> requestedIds, List<SeatInstance> seatInstances) {
        Set<Long> foundIds = new HashSet<>(seatInstances.stream().map(SeatInstance::getId).toList());
        if (foundIds.size() != requestedIds.size() || !foundIds.containsAll(requestedIds)) {
            throw new BaseException(ErrorCode.SEAT_NOT_FOUND);
        }
    }

    private void releaseExpiredHolds(Long flightInstanceId) {
        List<SeatInstance> expiredHolds =
                seatInstanceRepository.findExpiredHoldsByFlightInstanceIdForUpdate(flightInstanceId, Instant.now());

        if (expiredHolds.isEmpty()) {
            return;
        }

        expiredHolds.forEach(this::markAvailable);
        seatInstanceRepository.saveAll(expiredHolds);
    }

    private int resolveHoldMinutes(Integer requestedHoldMinutes) {
        return requestedHoldMinutes == null ? 10 : requestedHoldMinutes;
    }

    private void markAvailable(SeatInstance seatInstance) {
        seatInstance.setStatus(SeatAvailabilityStatus.AVAILABLE);
        seatInstance.setAvailable(true);
        seatInstance.setBooked(false);
        seatInstance.setHoldToken(null);
        seatInstance.setHeldByUserId(null);
        seatInstance.setHoldExpiresAt(null);
        seatInstance.setBookingReference(null);
    }

    private void markHeld(SeatInstance seatInstance, String holdToken, Long userId, Instant holdExpiresAt) {
        seatInstance.setStatus(SeatAvailabilityStatus.HELD);
        seatInstance.setAvailable(false);
        seatInstance.setBooked(false);
        seatInstance.setHoldToken(holdToken);
        seatInstance.setHeldByUserId(userId);
        seatInstance.setHoldExpiresAt(holdExpiresAt);
    }

    private void markBooked(SeatInstance seatInstance, String bookingReference) {
        seatInstance.setStatus(SeatAvailabilityStatus.BOOKED);
        seatInstance.setAvailable(false);
        seatInstance.setBooked(true);
        seatInstance.setHoldToken(null);
        seatInstance.setHeldByUserId(null);
        seatInstance.setHoldExpiresAt(null);
        seatInstance.setBookingReference(bookingReference);
    }

    private void markUnavailable(SeatInstance seatInstance, SeatAvailabilityStatus status) {
        seatInstance.setStatus(status);
        seatInstance.setAvailable(false);
        seatInstance.setBooked(status == SeatAvailabilityStatus.BOOKED);
        seatInstance.setHoldToken(null);
        seatInstance.setHeldByUserId(null);
        seatInstance.setHoldExpiresAt(null);
    }

    private void refreshBookedCounter(
            FlightInstanceCabin cabin,
            SeatAvailabilityStatus previousStatus,
            SeatAvailabilityStatus currentStatus) {
        if (cabin == null || previousStatus == currentStatus) {
            return;
        }

        Long bookedSeats = seatInstanceRepository.countByFlightInstanceCabinIdAndStatus(
                cabin.getId(),
                SeatAvailabilityStatus.BOOKED);
        cabin.setBookedSeats(bookedSeats.intValue());
        flightInstanceCabinRepository.save(cabin);
    }

    private List<SeatInstanceResponse> toResponses(List<SeatInstance> seatInstances) {
        return seatInstances.stream()
                .map(SeatInstanceMapper::toResponse)
                .toList();
    }
}
