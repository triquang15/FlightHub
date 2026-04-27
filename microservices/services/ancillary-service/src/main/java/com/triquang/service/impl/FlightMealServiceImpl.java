package com.triquang.service.impl;

import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.triquang.enums.ErrorCode;
import com.triquang.exception.BaseException;
import com.triquang.mapper.FlightMealMapper;
import com.triquang.model.FlightMeal;
import com.triquang.model.Meal;
import com.triquang.payload.request.FlightMealRequest;
import com.triquang.payload.response.FlightMealResponse;
import com.triquang.repository.FlightMealRepository;
import com.triquang.repository.MealRepository;
import com.triquang.service.FlightMealService;
import com.triquang.utils.FlightMealSpecification;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class FlightMealServiceImpl implements FlightMealService {

    private final FlightMealRepository flightMealRepository;
    private final MealRepository mealRepository;

    @Override
    @Transactional
    public FlightMealResponse create(FlightMealRequest request){
        log.debug("Creating flight meal for flight ID: {} and meal ID: {}",
                request.getFlightId(), request.getMealId());

        Meal meal = mealRepository.findById(request.getMealId())
                .orElseThrow(() -> new BaseException(ErrorCode.MEAL_NOT_FOUND));

        Specification<FlightMeal> spec = FlightMealSpecification.hasFlightIdAndMealId(
                request.getFlightId(), request.getMealId());

        if (flightMealRepository.exists(spec)) {
            throw new BaseException(ErrorCode.FLIGHT_MEAL_ALREADY_EXISTS);
        }

        FlightMeal flightMeal = FlightMeal.builder()
                .flightId(request.getFlightId())
                .meal(meal)
                .available(request.getAvailable())
                .price(request.getPrice())
                .displayOrder(request.getDisplayOrder() != null ? request.getDisplayOrder() : 0)
                .build();

        FlightMeal saved = flightMealRepository.save(flightMeal);
        log.info("Flight meal created successfully with id: {}", saved.getId());

        return FlightMealMapper.toResponse(saved);
    }

    @Override
    @Transactional
    public List<FlightMealResponse> bulkCreate(List<FlightMealRequest> requests) {
        log.debug("Bulk creating {} flight meals", requests.size());

        List<FlightMealResponse> responses = new ArrayList<>();

        for (FlightMealRequest request : requests) {

            Meal meal = mealRepository.findById(request.getMealId())
                    .orElseThrow(() -> new BaseException(ErrorCode.MEAL_NOT_FOUND));

            Specification<FlightMeal> spec = FlightMealSpecification.hasFlightIdAndMealId(
                    request.getFlightId(), request.getMealId());

            if (flightMealRepository.exists(spec)) {
                log.warn("Skipping - meal {} already assigned to flight {}",
                        request.getMealId(), request.getFlightId());
                continue;
            }

            FlightMeal flightMeal = FlightMeal.builder()
                    .flightId(request.getFlightId())
                    .meal(meal)
                    .available(request.getAvailable())
                    .price(request.getPrice())
                    .displayOrder(request.getDisplayOrder() != null ? request.getDisplayOrder() : 0)
                    .build();

            FlightMeal saved = flightMealRepository.save(flightMeal);
            responses.add(FlightMealMapper.toResponse(saved));
        }

        log.info("Successfully created {} flight meals", responses.size());
        return responses;
    }

    @Override
    @Transactional(readOnly = true)
    public FlightMealResponse getById(Long id) {
        FlightMeal flightMeal = flightMealRepository.findById(id)
                .orElseThrow(() -> new BaseException(ErrorCode.FLIGHT_MEAL_NOT_FOUND));

        return FlightMealMapper.toResponse(flightMeal);
    }

    @Override
    @Transactional(readOnly = true)
    public List<FlightMealResponse> getByFlightId(Long flightId) {
        Specification<FlightMeal> spec = FlightMealSpecification.hasFlightId(flightId);

        return flightMealRepository.findAll(spec)
                .stream()
                .map(FlightMealMapper::toResponse)
                .collect(Collectors.toList());
    }

    @Override
    public List<FlightMealResponse> getAllByIds(List<Long> ids) {
        return flightMealRepository.findAllById(ids)
                .stream()
                .map(FlightMealMapper::toResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public FlightMealResponse update(Long id, FlightMealRequest request) {

        log.debug("Updating flight meal with id: {}", id);

        FlightMeal flightMeal = flightMealRepository.findById(id)
                .orElseThrow(() -> new BaseException(ErrorCode.FLIGHT_MEAL_NOT_FOUND));

        // update flightId
        if (!flightMeal.getFlightId().equals(request.getFlightId())) {
            flightMeal.setFlightId(request.getFlightId());
        }

        // update meal
        if (!flightMeal.getMeal().getId().equals(request.getMealId())) {
            Meal meal = mealRepository.findById(request.getMealId())
                    .orElseThrow(() -> new BaseException(ErrorCode.MEAL_NOT_FOUND));
            flightMeal.setMeal(meal);
        }

        flightMeal.setAvailable(request.getAvailable());
        flightMeal.setPrice(request.getPrice());
        flightMeal.setDisplayOrder(request.getDisplayOrder());

        FlightMeal updated = flightMealRepository.save(flightMeal);
        log.info("Flight meal updated successfully with id: {}", updated.getId());

        return FlightMealMapper.toResponse(updated);
    }

    @Override
    @Transactional
    public void delete(Long id) {
        if (!flightMealRepository.existsById(id)) {
            throw new BaseException(ErrorCode.FLIGHT_MEAL_NOT_FOUND);
        }

        flightMealRepository.deleteById(id);
        log.info("Flight meal deleted successfully with id: {}", id);
    }

    @Override
    @Transactional
    public FlightMealResponse updateAvailability(Long id, Boolean available) {

        FlightMeal flightMeal = flightMealRepository.findById(id)
                .orElseThrow(() -> new BaseException(ErrorCode.FLIGHT_MEAL_NOT_FOUND));

        flightMeal.setAvailable(available);

        FlightMeal updated = flightMealRepository.save(flightMeal);
        log.info("Updated availability for id: {}", updated.getId());

        return FlightMealMapper.toResponse(updated);
    }

    @Override
    public Double calculateMealPrice(List<Long> mealIds) {
        return flightMealRepository.findAllById(mealIds)
                .stream()
                .mapToDouble(FlightMeal::getPrice)
                .sum();
    }
}
