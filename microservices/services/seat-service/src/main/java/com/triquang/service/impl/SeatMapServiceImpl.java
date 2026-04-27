package com.triquang.service.impl;

import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.triquang.client.AirlineClient;
import com.triquang.enums.ErrorCode;
import com.triquang.exception.BaseException;
import com.triquang.mapper.SeatMapMapper;
import com.triquang.model.CabinClass;
import com.triquang.model.SeatMap;
import com.triquang.payload.request.SeatMapRequest;
import com.triquang.payload.response.SeatMapResponse;
import com.triquang.repository.CabinClassRepository;
import com.triquang.repository.SeatMapRepository;
import com.triquang.service.SeatMapService;
import com.triquang.service.SeatService;

import feign.FeignException;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
@Transactional
public class SeatMapServiceImpl implements SeatMapService {

    private final SeatMapRepository seatMapRepository;
    private final CabinClassRepository cabinClassRepository;
    private final AirlineClient airlineClient;
    private final SeatService seatService;

    @Override
    public SeatMapResponse createSeatMap(Long userId, SeatMapRequest request) {

        Long airlineId = getAirlineForUser(userId);

        CabinClass cabinClass = cabinClassRepository.findById(request.getCabinClassId())
                .orElseThrow(() -> new BaseException(ErrorCode.CABIN_CLASS_NOT_FOUND));

        if (seatMapRepository.existsByAirlineIdAndCabinClassIdAndName(
                airlineId, request.getCabinClassId(), request.getName())) {
            throw new BaseException(ErrorCode.SEAT_MAP_ALREADY_EXISTS); 
        }

        SeatMap seatMap = SeatMapMapper.toEntity(request, cabinClass);
        seatMap.setAirlineId(airlineId);

        SeatMap saved = seatMapRepository.save(seatMap);

        seatService.generateSeats(saved.getId());

        return SeatMapMapper.toResponse(saved);
    }

    @Override
    public List<SeatMapResponse> createSeatMaps(Long userId, List<SeatMapRequest> requests) {

        Long airlineId = getAirlineForUser(userId);

        List<SeatMap> toSave = requests.stream()
                .map(req -> {
                    CabinClass cabinClass = cabinClassRepository.findById(req.getCabinClassId())
                            .orElseThrow(() -> new BaseException(ErrorCode.CABIN_CLASS_NOT_FOUND));

                    if (seatMapRepository.existsByAirlineIdAndCabinClassIdAndName(
                            airlineId, req.getCabinClassId(), req.getName())) {
                        throw new BaseException(ErrorCode.SEAT_MAP_ALREADY_EXISTS);
                    }

                    SeatMap seatMap = SeatMapMapper.toEntity(req, cabinClass);
                    seatMap.setAirlineId(airlineId);
                    return seatMap;
                })
                .toList();

        List<SeatMap> saved = seatMapRepository.saveAll(toSave);

        saved.forEach(sm -> seatService.generateSeats(sm.getId()));

        return saved.stream()
                .map(SeatMapMapper::toResponse)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public SeatMapResponse getSeatMapById(Long id) {

        SeatMap seatMap = seatMapRepository.findByIdWithDetails(id)
                .orElseThrow(() -> new BaseException(ErrorCode.SEAT_MAP_NOT_FOUND));

        return SeatMapMapper.toResponse(seatMap);
    }

    @Override
    @Transactional(readOnly = true)
    public SeatMapResponse getSeatMapsByCabinClass(Long cabinClassId) {

        cabinClassRepository.findById(cabinClassId)
                .orElseThrow(() -> new BaseException(ErrorCode.CABIN_CLASS_NOT_FOUND));

        SeatMap seatMap = seatMapRepository.findByCabinClassId(cabinClassId);

        if (seatMap == null) {
            throw new BaseException(ErrorCode.SEAT_MAP_NOT_FOUND);
        }

        return SeatMapMapper.toResponse(seatMap);
    }

    @Override
    public SeatMapResponse updateSeatMap(Long userId, Long id, SeatMapRequest request) {

        Long airlineId = getAirlineForUser(userId);

        SeatMap existing = seatMapRepository.findById(id)
                .orElseThrow(() -> new BaseException(ErrorCode.SEAT_MAP_NOT_FOUND));

        if (seatMapRepository.existsByAirlineIdAndNameAndIdNot(
                airlineId, request.getName(), id)) {
            throw new BaseException(ErrorCode.SEAT_MAP_ALREADY_EXISTS);
        }

        SeatMapMapper.updateEntity(request, existing);

        SeatMap saved = seatMapRepository.save(existing);

        return SeatMapMapper.toResponse(saved);
    }

    @Override
    public void deleteSeatMap(Long id) {

        SeatMap seatMap = seatMapRepository.findById(id)
                .orElseThrow(() -> new BaseException(ErrorCode.SEAT_MAP_NOT_FOUND));

        seatMapRepository.delete(seatMap);
    }

    private Long getAirlineForUser(Long userId) {
        try {
            return airlineClient.getAirlineByOwner(userId).getId();

        } catch (FeignException.NotFound e) {
            throw new BaseException(ErrorCode.AIRLINE_NOT_FOUND);

        } catch (FeignException.ServiceUnavailable e) {
            throw new BaseException(ErrorCode.AIRLINE_SERVICE_UNAVAILABLE);

        } catch (FeignException e) {
            throw new BaseException(ErrorCode.EXTERNAL_SERVICE_ERROR);
        }
    }
}
