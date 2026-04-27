package com.triquang.mapper;

import java.util.stream.Collectors;

import com.triquang.model.FlightInstanceCabin;
import com.triquang.payload.response.FlightInstanceCabinResponse;

public class FlightInstanceCabinMapper {

    public static FlightInstanceCabinResponse toResponse(FlightInstanceCabin fic) {
        if (fic == null) return null;
        return FlightInstanceCabinResponse.builder()
                .id(fic.getId())
                .flightInstanceId(fic.getFlightInstanceId())
                .cabinClassType(fic.getCabinClass() != null ? fic.getCabinClass().getName() : null)
                .cabinClass(fic.getCabinClass() != null ?
                        CabinClassMapper.toResponse(fic.getCabinClass(), fic.getCabinClass().getSeatMap()) : null)
                .seats(fic.getSeats() != null ?
                        fic.getSeats().stream().map(SeatInstanceMapper::toResponse)
                                .collect(Collectors.toList()) : null)
                .seatMap(fic.getCabinClass() != null && fic.getCabinClass().getSeatMap() != null ?
                        SeatMapMapper.toSimpleResponse(fic.getCabinClass().getSeatMap()) : null)
                .totalSeats(fic.getTotalSeats())
                .bookedSeats(fic.getBookedSeats())
                .availableSeats(fic.getAvailableSeats())
                .build();
    }

}
