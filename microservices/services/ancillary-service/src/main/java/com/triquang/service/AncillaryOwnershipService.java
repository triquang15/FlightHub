package com.triquang.service;

import java.util.List;

import org.springframework.stereotype.Service;

import com.triquang.client.FlightClient;
import com.triquang.client.SeatClient;
import com.triquang.enums.ErrorCode;
import com.triquang.exception.BaseException;
import com.triquang.model.Ancillary;
import com.triquang.model.FlightCabinAncillary;
import com.triquang.model.FlightMeal;
import com.triquang.model.InsuranceCoverage;
import com.triquang.model.Meal;
import com.triquang.payload.response.CabinClassResponse;
import com.triquang.payload.response.FlightResponse;
import com.triquang.repository.AncillaryRepository;
import com.triquang.repository.FlightCabinAncillaryRepository;
import com.triquang.repository.FlightMealRepository;
import com.triquang.repository.InsuranceCoverageRepository;
import com.triquang.repository.MealRepository;

import feign.FeignException;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class AncillaryOwnershipService {

    private final AirlineIntegrationService airlineIntegrationService;
    private final FlightClient flightClient;
    private final SeatClient seatClient;
    private final AncillaryRepository ancillaryRepository;
    private final MealRepository mealRepository;
    private final FlightCabinAncillaryRepository flightCabinAncillaryRepository;
    private final FlightMealRepository flightMealRepository;
    private final InsuranceCoverageRepository insuranceCoverageRepository;

    public Long airlineId(Long userId) {
        return airlineIntegrationService.getAirlineIdForUser(userId);
    }

    public Ancillary requireOwnedAncillary(Long userId, Long id) {
        Ancillary ancillary = ancillaryRepository.findById(id)
                .orElseThrow(() -> new BaseException(ErrorCode.ANCILLARY_NOT_FOUND));
        requireAirline(userId, ancillary.getAirlineId());
        return ancillary;
    }

    public Meal requireOwnedMeal(Long userId, Long id) {
        Meal meal = mealRepository.findById(id)
                .orElseThrow(() -> new BaseException(ErrorCode.MEAL_NOT_FOUND));
        requireAirline(userId, meal.getAirlineId());
        return meal;
    }

    public FlightResponse requireOwnedFlight(Long userId, Long flightId) {
        Long airlineId = airlineId(userId);
        try {
            FlightResponse flight = flightClient.getFlightById(flightId);
            if (flight == null) {
                throw new BaseException(ErrorCode.EXTERNAL_SERVICE_ERROR);
            }
            if (flight.getAirline() == null || !airlineId.equals(flight.getAirline().getId())) {
                throw new BaseException(ErrorCode.ACCESS_DENIED);
            }
            return flight;
        } catch (FeignException.NotFound exception) {
            throw new BaseException(ErrorCode.FLIGHT_NOT_FOUND);
        } catch (FeignException exception) {
            throw new BaseException(ErrorCode.EXTERNAL_SERVICE_ERROR);
        }
    }

    public void requireCabinOnFlight(FlightResponse flight, Long cabinClassId) {
        if (flight.getAircraft() == null) {
            throw new BaseException(ErrorCode.INVALID_INPUT);
        }
        try {
            List<CabinClassResponse> cabins = seatClient.getCabinClassesByAircraftId(flight.getAircraft().getId());
            if (cabins == null) {
                throw new BaseException(ErrorCode.EXTERNAL_SERVICE_ERROR);
            }
            boolean matchesAircraft = cabins.stream()
                    .anyMatch(cabin -> cabin.getId().equals(cabinClassId)
                            && flight.getAircraft().getId().equals(cabin.getAircraftId()));
            if (!matchesAircraft) {
                throw new BaseException(ErrorCode.ACCESS_DENIED);
            }
        } catch (FeignException.NotFound exception) {
            throw new BaseException(ErrorCode.INVALID_INPUT);
        } catch (FeignException exception) {
            throw new BaseException(ErrorCode.EXTERNAL_SERVICE_ERROR);
        }
    }

    public FlightCabinAncillary requireOwnedFlightCabinAncillary(Long userId, Long id) {
        FlightCabinAncillary assignment = flightCabinAncillaryRepository.findById(id)
                .orElseThrow(() -> new BaseException(ErrorCode.FLIGHT_CABIN_ANCILLARY_NOT_FOUND));
        FlightResponse flight = requireOwnedFlight(userId, assignment.getFlightId());
        requireCabinOnFlight(flight, assignment.getCabinClassId());
        requireAirline(userId, assignment.getAncillary().getAirlineId());
        return assignment;
    }

    public FlightMeal requireOwnedFlightMeal(Long userId, Long id) {
        FlightMeal assignment = flightMealRepository.findById(id)
                .orElseThrow(() -> new BaseException(ErrorCode.FLIGHT_MEAL_NOT_FOUND));
        requireOwnedFlight(userId, assignment.getFlightId());
        requireAirline(userId, assignment.getMeal().getAirlineId());
        return assignment;
    }

    public InsuranceCoverage requireOwnedCoverage(Long userId, Long id) {
        InsuranceCoverage coverage = insuranceCoverageRepository.findById(id)
                .orElseThrow(() -> new BaseException(ErrorCode.INSURANCE_COVERAGE_NOT_FOUND));
        requireAirline(userId, coverage.getAncillary().getAirlineId());
        return coverage;
    }

    public void requireAirline(Long userId, Long resourceAirlineId) {
        if (!airlineId(userId).equals(resourceAirlineId)) {
            throw new BaseException(ErrorCode.ACCESS_DENIED);
        }
    }
}
