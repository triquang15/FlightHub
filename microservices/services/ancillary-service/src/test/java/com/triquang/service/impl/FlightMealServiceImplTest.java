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
import com.triquang.model.FlightMeal;
import com.triquang.repository.FlightMealRepository;
import com.triquang.repository.MealRepository;
import com.triquang.service.AncillaryOwnershipService;

@ExtendWith(MockitoExtension.class)
class FlightMealServiceImplTest {

    @Mock private FlightMealRepository repository;
    @Mock private MealRepository mealRepository;
    @Mock private AncillaryOwnershipService ownershipService;

    private FlightMealServiceImpl service;

    @BeforeEach
    void setUp() {
        service = new FlightMealServiceImpl(repository, mealRepository, ownershipService);
    }

    @Test
    void calculatesAvailableMealSelections() {
        when(repository.findAllById(List.of(1L, 2L)))
                .thenReturn(List.of(meal(1L, 10.0, true), meal(2L, 15.0, true)));
        assertEquals(25.0, service.calculateMealPrice(List.of(1L, 2L)));
    }

    @Test
    void rejectsDuplicateMealSelections() {
        assertThrows(BaseException.class, () -> service.calculateMealPrice(List.of(1L, 1L)));
    }

    @Test
    void rejectsUnavailableMealSelections() {
        when(repository.findAllById(List.of(1L))).thenReturn(List.of(meal(1L, 10.0, false)));
        assertThrows(BaseException.class, () -> service.calculateMealPrice(List.of(1L)));
    }

    private FlightMeal meal(Long id, Double price, boolean available) {
        return FlightMeal.builder().id(id).price(price).currency("USD").available(available).build();
    }
}
