package com.triquang.service;

import java.util.Map;
import java.util.Set;

import org.springframework.stereotype.Component;

import com.triquang.enums.ErrorCode;
import com.triquang.enums.FlightStatus;
import com.triquang.exception.BaseException;

@Component
public class FlightStatusTransitionPolicy {

    private static final Map<FlightStatus, Set<FlightStatus>> ALLOWED = Map.of(
            FlightStatus.SCHEDULED, Set.of(FlightStatus.BOARDING, FlightStatus.CANCELLED),
            FlightStatus.BOARDING, Set.of(FlightStatus.DEPARTED, FlightStatus.CANCELLED),
            FlightStatus.DEPARTED, Set.of(FlightStatus.ARRIVED, FlightStatus.CANCELLED),
            FlightStatus.ARRIVED, Set.of(),
            FlightStatus.CANCELLED, Set.of());

    public void validate(FlightStatus current, FlightStatus target) {
        if (current == target) {
            return;
        }
        if (!ALLOWED.getOrDefault(current, Set.of()).contains(target)) {
            throw new BaseException(ErrorCode.INVALID_FLIGHT_STATUS_TRANSITION);
        }
    }
}
