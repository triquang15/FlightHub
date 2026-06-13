package com.triquang.service;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertThrows;

import org.junit.jupiter.api.Test;

import com.triquang.enums.FlightStatus;
import com.triquang.exception.BaseException;

class FlightStatusTransitionPolicyTest {

    private final FlightStatusTransitionPolicy policy = new FlightStatusTransitionPolicy();

    @Test
    void acceptsCanonicalLifecycleAndCancellation() {
        assertDoesNotThrow(() -> policy.validate(FlightStatus.SCHEDULED, FlightStatus.BOARDING));
        assertDoesNotThrow(() -> policy.validate(FlightStatus.BOARDING, FlightStatus.DEPARTED));
        assertDoesNotThrow(() -> policy.validate(FlightStatus.DEPARTED, FlightStatus.ARRIVED));
        assertDoesNotThrow(() -> policy.validate(FlightStatus.SCHEDULED, FlightStatus.CANCELLED));
    }

    @Test
    void rejectsSkippingAndLeavingTerminalStatus() {
        assertThrows(BaseException.class,
                () -> policy.validate(FlightStatus.SCHEDULED, FlightStatus.ARRIVED));
        assertThrows(BaseException.class,
                () -> policy.validate(FlightStatus.ARRIVED, FlightStatus.BOARDING));
        assertThrows(BaseException.class,
                () -> policy.validate(FlightStatus.CANCELLED, FlightStatus.SCHEDULED));
    }
}
