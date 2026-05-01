package com.triquang.event;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.triquang.enums.SeatAvailabilityStatus;
import com.triquang.message.FlightInstanceCreatedEvent;
import com.triquang.model.CabinClass;
import com.triquang.model.FlightInstanceCabin;
import com.triquang.model.Seat;
import com.triquang.model.SeatInstance;
import com.triquang.repository.CabinClassRepository;
import com.triquang.repository.FlightInstanceCabinRepository;
import com.triquang.repository.SeatInstanceRepository;
import com.triquang.repository.SeatRepository;

import java.util.List;

/**
 * Consumer for handling flight instance events, specifically the creation of new flight instances.
 * When a new flight instance is created, this consumer will generate the corresponding seat instances
 * based on the aircraft's cabin configuration.
 * 
 * @author Tri Quang
 * @version 1.0
 */

@Slf4j
@Service
@RequiredArgsConstructor
public class FlightInstanceEventConsumer {

    private final CabinClassRepository cabinClassRepository;
    private final SeatRepository seatRepository;
    private final FlightInstanceCabinRepository flightInstanceCabinRepository;
    private final SeatInstanceRepository seatInstanceRepository;

    @KafkaListener(topics = "flight-instance-created", groupId = "seat-service-group")
    @Transactional
    public void handleFlightInstanceCreated(FlightInstanceCreatedEvent event) {
        log.info("Received FlightInstanceCreatedEvent: flightInstanceId={}, aircraftId={}",
                event.getFlightInstanceId(), event.getAircraftId());

        List<CabinClass> cabinClasses = cabinClassRepository.findByAircraftId(event.getAircraftId());
        int totalSeatInstances = 0;

        for (CabinClass cabinClass : cabinClasses) {
            List<Seat> seats = cabinClass.getSeatMap() != null
                    ? seatRepository.findBySeatMapId(cabinClass.getSeatMap().getId())
                    : List.of();

            FlightInstanceCabin fic = FlightInstanceCabin.builder()
                    .flightInstanceId(event.getFlightInstanceId())
                    .cabinClass(cabinClass)
                    .totalSeats(seats.size())
                    .bookedSeats(0)
                    .build();

            var savedFic = flightInstanceCabinRepository.save(fic);

            // Generate SeatInstances for each seat in this cabin
            List<SeatInstance> seatInstances = seats.stream()
                    .map(seat -> SeatInstance.builder()
                            .flightId(event.getFlightId())
                            .flightInstanceId(event.getFlightInstanceId())
                            .flightInstanceCabin(savedFic)
                            .seat(seat)
                            .status(SeatAvailabilityStatus.AVAILABLE)
                            .isAvailable(true)
                            .isBooked(false)
                            .premiumSurcharge(seat.getPremiumSurcharge())
                            .build())
                    .toList();

            seatInstanceRepository.saveAll(seatInstances);
            totalSeatInstances += seatInstances.size();
        }

        log.info("Created {} FlightInstanceCabin and {} SeatInstance records for flightInstanceId={}",
                cabinClasses.size(), totalSeatInstances, event.getFlightInstanceId());
    }
}
