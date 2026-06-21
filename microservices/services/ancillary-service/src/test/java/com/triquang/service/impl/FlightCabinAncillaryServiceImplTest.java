package com.triquang.service.impl;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.when;

import java.util.List;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.triquang.exception.BaseException;
import com.triquang.model.FlightCabinAncillary;
import com.triquang.repository.FlightCabinAncillaryRepository;
import com.triquang.repository.InsuranceCoverageRepository;
import com.triquang.service.AncillaryOwnershipService;

@ExtendWith(MockitoExtension.class)
class FlightCabinAncillaryServiceImplTest {

    @Mock private FlightCabinAncillaryRepository repository;
    @Mock private InsuranceCoverageRepository coverageRepository;
    @Mock private AncillaryOwnershipService ownershipService;

    private FlightCabinAncillaryServiceImpl service;

    @BeforeEach
    void setUp() {
        service = new FlightCabinAncillaryServiceImpl(repository, coverageRepository, ownershipService);
    }

    @Test
    void calculatesOnlyChargeableAvailableSelections() {
        var chargeable = assignment(1L, 25.0, true, false);
        var included = assignment(2L, 0.0, true, true);
        when(repository.findAllById(List.of(1L, 2L))).thenReturn(List.of(chargeable, included));

        assertEquals(25.0, service.calculateAncillaryPrice(List.of(1L, 2L)));
    }

    @Test
    void rejectsDuplicateSelections() {
        assertThrows(BaseException.class, () -> service.calculateAncillaryPrice(List.of(1L, 1L)));
    }

    @Test
    void rejectsUnavailableSelections() {
        when(repository.findAllById(List.of(1L))).thenReturn(List.of(assignment(1L, 25.0, false, false)));
        assertThrows(BaseException.class, () -> service.calculateAncillaryPrice(List.of(1L)));
    }

    @Test
    void rejectsMissingSelections() {
        when(repository.findAllById(List.of(1L, 2L))).thenReturn(List.of(assignment(1L, 25.0, true, false)));
        assertThrows(BaseException.class, () -> service.calculateAncillaryPrice(List.of(1L, 2L)));
    }

    private FlightCabinAncillary assignment(Long id, Double price, boolean available, boolean included) {
        return FlightCabinAncillary.builder()
                .id(id)
                .price(price)
                .currency("USD")
                .available(available)
                .includedInFare(included)
                .build();
    }
}
