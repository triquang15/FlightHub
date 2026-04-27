package com.triquang.service.impl;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.triquang.enums.ErrorCode;
import com.triquang.enums.SeatType;
import com.triquang.exception.BaseException;
import com.triquang.mapper.SeatMapper;
import com.triquang.model.CabinClass;
import com.triquang.model.Seat;
import com.triquang.model.SeatMap;
import com.triquang.payload.request.SeatRequest;
import com.triquang.payload.response.SeatResponse;
import com.triquang.repository.CabinClassRepository;
import com.triquang.repository.SeatMapRepository;
import com.triquang.repository.SeatRepository;
import com.triquang.service.SeatService;

import lombok.RequiredArgsConstructor;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class SeatServiceImpl implements SeatService {

    private final SeatRepository seatRepository;
    private final SeatMapRepository seatMapRepository;
    private final CabinClassRepository cabinClassRepository;

    @Override
    public void generateSeats(Long seatMapId) {

        boolean exists = seatRepository.existsBySeatMapId(seatMapId);
        if (exists) {
            throw new BaseException(ErrorCode.SEAT_ALREADY_GENERATED);
        }

        SeatMap seatMap = seatMapRepository.findById(seatMapId)
                .orElseThrow(() -> new BaseException(ErrorCode.SEAT_MAP_NOT_FOUND));

        int leftSeatsPerRow = seatMap.getLeftSeatsPerRow();
        int rightSeatsPerRow = seatMap.getRightSeatsPerRow();
        int rows = seatMap.getTotalRows();
        int seatsPerRow = leftSeatsPerRow + rightSeatsPerRow;

        if (rows <= 0 || seatsPerRow <= 0) {
            throw new BaseException(ErrorCode.SEAT_MAP_EMPTY);
        }

        List<Seat> seats = new ArrayList<>();

        for (int row = 1; row <= rows; row++) {
            for (int col = 0; col < seatsPerRow; col++) {

                String seatNum = row + getSeatLetter(col);
                SeatType type = getSeatType(col, leftSeatsPerRow, rightSeatsPerRow);

                seats.add(Seat.builder()
                        .seatNumber(seatNum)
                        .seatRow(row)
                        .columnLetter(getSeatLetter(col).charAt(0))
                        .seatType(type)
                        .seatMap(seatMap)
                        .build());
            }
        }

        seatRepository.saveAll(seats);
    }

    // =========================
    // UTIL
    // =========================
    private String getSeatLetter(int col) {
        StringBuilder sb = new StringBuilder();
        while (col >= 0) {
            sb.insert(0, (char) ('A' + (col % 26)));
            col = col / 26 - 1;
        }
        return sb.toString();
    }

    private SeatType getSeatType(int seatIndex, int leftBlockSeats, int rightBlockSeats) {
        int totalSeats = leftBlockSeats + rightBlockSeats;

        if (seatIndex == 0 || seatIndex == totalSeats - 1) return SeatType.WINDOW;
        if (seatIndex == leftBlockSeats - 1) return SeatType.AISLE;
        if (seatIndex == leftBlockSeats) return SeatType.AISLE;

        return SeatType.MIDDLE;
    }

    // =========================
    // CRUD
    // =========================

    @Override
    @Transactional(readOnly = true)
    public SeatResponse getSeatById(Long id) {
        Seat seat = seatRepository.findById(id)
                .orElseThrow(() -> new BaseException(ErrorCode.SEAT_NOT_FOUND));

        return SeatMapper.toResponse(seat);
    }

    @Override
    public List<SeatResponse> getAll() {
        return seatRepository.findAll().stream()
                .map(SeatMapper::toResponse)
                .collect(Collectors.toList());
    }

    @Override
    public SeatResponse updateSeat(Long id, SeatRequest request) {

        Seat existing = seatRepository.findById(id)
                .orElseThrow(() -> new BaseException(ErrorCode.SEAT_NOT_FOUND));

        SeatMap seatMap = seatMapRepository.findById(request.getSeatMapId())
                .orElseThrow(() -> new BaseException(ErrorCode.SEAT_MAP_NOT_FOUND));

        CabinClass cabinClass = null;
        if (request.getCabinClassId() != null) {
            cabinClass = cabinClassRepository.findById(request.getCabinClassId())
                    .orElseThrow(() -> new BaseException(ErrorCode.CABIN_CLASS_NOT_FOUND));
        }

        SeatMapper.updateEntity(request, existing, seatMap, cabinClass);

        Seat saved = seatRepository.save(existing);
        return SeatMapper.toResponse(saved);
    }
}
