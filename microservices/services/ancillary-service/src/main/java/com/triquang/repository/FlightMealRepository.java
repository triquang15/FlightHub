package com.triquang.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import com.triquang.model.FlightMeal;
import com.triquang.model.Meal;

import java.util.Optional;

public interface FlightMealRepository extends JpaRepository<FlightMeal, Long>, JpaSpecificationExecutor<FlightMeal> {

	Optional<FlightMeal> findByFlightIdAndMeal(Long flightId, Meal meal);

	void deleteByFlightId(Long flightId);
}
