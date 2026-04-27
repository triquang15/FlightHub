package com.triquang.service.impl;

import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.triquang.enums.ErrorCode;
import com.triquang.enums.SeatAvailabilityStatus;
import com.triquang.enums.SeatType;
import com.triquang.exception.BaseException;
import com.triquang.mapper.FlightInstanceCabinMapper;
import com.triquang.model.CabinClass;
import com.triquang.model.FlightInstanceCabin;
import com.triquang.model.Seat;
import com.triquang.model.SeatInstance;
import com.triquang.model.SeatMap;
import com.triquang.payload.request.FlightInstanceCabinRequest;
import com.triquang.payload.response.FlightInstanceCabinResponse;
import com.triquang.repository.CabinClassRepository;
import com.triquang.repository.FlightInstanceCabinRepository;
import com.triquang.repository.SeatInstanceRepository;
import com.triquang.repository.SeatMapRepository;
import com.triquang.service.FlightInstanceCabinService;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
@Transactional
public class FlightInstanceCabinServiceImpl implements FlightInstanceCabinService {

    private final FlightInstanceCabinRepository flightInstanceCabinRepository;
    private final CabinClassRepository cabinClassRepository;
    private final SeatMapRepository seatMapRepository;
    private final SeatInstanceRepository seatInstanceRepository;

    @Override
    public FlightInstanceCabinResponse createFlightInstanceCabin(FlightInstanceCabinRequest request) {

        CabinClass cabinClass = cabinClassRepository.findById(request.getCabinClassId())
                .orElseThrow(() -> new BaseException(ErrorCode.CABIN_CLASS_NOT_FOUND));

        SeatMap seatMap = seatMapRepository.findByCabinClassId(cabinClass.getId());

        if (seatMap == null) {
            throw new BaseException(ErrorCode.SEAT_MAP_NOT_FOUND); 
        }

        if (seatMap.getSeats() == null || seatMap.getSeats().isEmpty()) {
            throw new BaseException(ErrorCode.SEAT_NOT_FOUND); 
        }

        int totalSeats = seatMap.getSeats().size();

        FlightInstanceCabin fic = FlightInstanceCabin.builder()
                .flightInstanceId(request.getFlightInstanceId())
                .cabinClass(cabinClass)
                .totalSeats(totalSeats)
                .bookedSeats(0)
                .build();

        FlightInstanceCabin saved = flightInstanceCabinRepository.save(fic);

        // generate SeatInstances
        List<SeatInstance> seatInstances = seatMap.getSeats().stream()
                .map(seat -> buildSeatInstance(seat, saved, request))
                .toList();

        seatInstanceRepository.saveAll(seatInstances);
        saved.setSeats(seatInstances);

        return FlightInstanceCabinMapper.toResponse(saved);
    }

	private SeatInstance buildSeatInstance(Seat seat, FlightInstanceCabin saved, FlightInstanceCabinRequest request) {

		Double surcharge = getPremiumSurcharge(seat.getSeatType(), 1000.0, 500.0);

		return SeatInstance.builder()
				.flightId(request.getFlightId())
				.status(SeatAvailabilityStatus.AVAILABLE)
				.flightInstanceId(request.getFlightInstanceId())
				.flightInstanceCabin(saved).seat(seat)
				.isAvailable(true)
				.isBooked(false)
				.premiumSurcharge(surcharge).build();
	}

    @Override
    @Transactional(readOnly = true)
    public FlightInstanceCabinResponse getFlightInstanceCabinById(Long id) {

        FlightInstanceCabin fic = flightInstanceCabinRepository.findById(id)
                .orElseThrow(() -> new BaseException(ErrorCode.FLIGHT_INSTANCE_CABIN_NOT_FOUND));

        return FlightInstanceCabinMapper.toResponse(fic);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<FlightInstanceCabinResponse> getByFlightInstanceId(Long flightInstanceId, Pageable pageable) {

        return flightInstanceCabinRepository
                .findByFlightInstanceId(flightInstanceId, pageable)
                .map(FlightInstanceCabinMapper::toResponse);
    }

    @Override
    public FlightInstanceCabinResponse getByFlightInstanceIdAndCabinClassId(
            Long flightInstanceId,
            Long cabinClassId) {

        FlightInstanceCabin cabin =
                flightInstanceCabinRepository
                        .findByFlightInstanceIdAndCabinClassId(flightInstanceId, cabinClassId);

        if (cabin == null) {
            throw new BaseException(ErrorCode.INVALID_INPUT);
        }

        return FlightInstanceCabinMapper.toResponse(cabin);
    }

    @Override
    public FlightInstanceCabinResponse updateFlightInstanceCabin(
            Long id,
            FlightInstanceCabinRequest request) {

        FlightInstanceCabin existing =
                flightInstanceCabinRepository.findByIdForUpdate(id)
                        .orElseThrow(() -> new BaseException(ErrorCode.FLIGHT_INSTANCE_NOT_FOUND));

        if (request.getCabinClassId() != null) {
            CabinClass cabinClass = cabinClassRepository.findById(request.getCabinClassId())
                    .orElseThrow(() -> new BaseException(ErrorCode.CABIN_CLASS_NOT_FOUND));

            existing.setCabinClass(cabinClass);
        }

        FlightInstanceCabin saved = flightInstanceCabinRepository.save(existing);
        return FlightInstanceCabinMapper.toResponse(saved);
    }

    @Override
    public void deleteFlightInstanceCabin(Long id) {

        FlightInstanceCabin fic = flightInstanceCabinRepository.findById(id)
                .orElseThrow(() -> new BaseException(ErrorCode.FLIGHT_INSTANCE_NOT_FOUND));

        flightInstanceCabinRepository.delete(fic);
    }

    private Double getPremiumSurcharge(
            SeatType seatType,
            Double windowSurcharge,
            Double aisleSurcharge) {

        if (seatType == null) return 0.0;

        return switch (seatType) {
            case WINDOW -> windowSurcharge != null ? windowSurcharge : 0.0;
            case AISLE -> aisleSurcharge != null ? aisleSurcharge : 0.0;
            default -> 0.0;
        };
    }
}
