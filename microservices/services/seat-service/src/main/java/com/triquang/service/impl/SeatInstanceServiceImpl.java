package com.triquang.service.impl;

import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.triquang.enums.ErrorCode;
import com.triquang.enums.SeatAvailabilityStatus;
import com.triquang.exception.BaseException;
import com.triquang.mapper.SeatInstanceMapper;
import com.triquang.model.FlightInstanceCabin;
import com.triquang.model.Seat;
import com.triquang.model.SeatInstance;
import com.triquang.payload.request.SeatInstanceRequest;
import com.triquang.payload.response.SeatInstanceResponse;
import com.triquang.repository.FlightInstanceCabinRepository;
import com.triquang.repository.SeatInstanceRepository;
import com.triquang.repository.SeatRepository;
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
    public List<SeatInstanceResponse> getAllByIds(List<Long> ids) {
        return seatInstanceRepository.findAllById(ids).stream()
                .map(SeatInstanceMapper::toResponse)
                .toList();
    }

    @Override
    public SeatInstanceResponse updateSeatInstanceStatus(Long id, SeatAvailabilityStatus status) {

        SeatInstance si = seatInstanceRepository.findByIdForUpdate(id)
                .orElseThrow(() -> new BaseException(ErrorCode.SEAT_NOT_FOUND));

        switch (status) {
            case AVAILABLE -> {
                si.setAvailable(true);
                si.setBooked(false);
            }
            case BOOKED -> {
                si.setAvailable(false);
                si.setBooked(true);
            }
            default -> throw new BaseException(ErrorCode.INVALID_INPUT);
        }

        si.setStatus(status);

        SeatInstance saved = seatInstanceRepository.save(si);
        return SeatInstanceMapper.toResponse(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public Long countAvailableByFlightId(Long flightId) {
        return seatInstanceRepository.countAvailableByFlightId(flightId);
    }

    @Override
    public Double calculateSeatPrice(List<Long> seatInstanceIds) {

        List<SeatInstance> seatInstances = seatInstanceRepository.findAllById(seatInstanceIds);

        return seatInstances.stream()
                .mapToDouble(si -> si.getPremiumSurcharge() != null ? si.getPremiumSurcharge() : 0.0)
                .sum();
    }
}
