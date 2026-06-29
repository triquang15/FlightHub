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
import com.triquang.service.AncillaryOwnershipService;
import com.triquang.utils.FlightMealSpecification;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class FlightMealServiceImpl implements FlightMealService {

    private final FlightMealRepository flightMealRepository;
    private final MealRepository mealRepository;
    private final AncillaryOwnershipService ownershipService;

    @Override
    @Transactional
    public FlightMealResponse create(Long userId, FlightMealRequest request){
        log.debug("Creating flight meal for flight ID: {} and meal ID: {}",
                request.getFlightId(), request.getMealId());

        ownershipService.requireOwnedFlight(userId, request.getFlightId());
        Meal meal = ownershipService.requireOwnedMeal(userId, request.getMealId());

        Specification<FlightMeal> spec = FlightMealSpecification.hasFlightIdAndMealId(
                request.getFlightId(), request.getMealId());

        if (flightMealRepository.exists(spec)) {
            throw new BaseException(ErrorCode.FLIGHT_MEAL_ALREADY_EXISTS);
        }

        FlightMeal flightMeal = FlightMeal.builder()
                .flightId(request.getFlightId())
                .meal(meal)
                .available(request.getAvailable())
                .price(requireValidPrice(request.getPrice()))
                .currency(normalizeCurrency(request.getCurrency()))
                .displayOrder(request.getDisplayOrder() != null ? request.getDisplayOrder() : 0)
                .build();

        FlightMeal saved = flightMealRepository.save(flightMeal);
        log.info("Flight meal created successfully with id: {}", saved.getId());

        return FlightMealMapper.toResponse(saved);
    }

    @Override
    @Transactional
    public List<FlightMealResponse> bulkCreate(Long userId, List<FlightMealRequest> requests) {
        log.debug("Bulk creating {} flight meals", requests.size());

        List<FlightMealResponse> responses = new ArrayList<>();

        for (FlightMealRequest request : requests) {

            ownershipService.requireOwnedFlight(userId, request.getFlightId());
            Meal meal = ownershipService.requireOwnedMeal(userId, request.getMealId());

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
                    .price(requireValidPrice(request.getPrice()))
                    .currency(normalizeCurrency(request.getCurrency()))
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
    public FlightMealResponse update(Long userId, Long id, FlightMealRequest request) {

        log.debug("Updating flight meal with id: {}", id);

        FlightMeal flightMeal = ownershipService.requireOwnedFlightMeal(userId, id);

        if (!flightMeal.getFlightId().equals(request.getFlightId())
                || !flightMeal.getMeal().getId().equals(request.getMealId())) {
            throw new BaseException(ErrorCode.INVALID_INPUT);
        }

        flightMeal.setAvailable(request.getAvailable());
        flightMeal.setPrice(requireValidPrice(request.getPrice()));
        flightMeal.setCurrency(normalizeCurrency(request.getCurrency()));
        flightMeal.setDisplayOrder(request.getDisplayOrder() != null ? request.getDisplayOrder() : 0);

        FlightMeal updated = flightMealRepository.save(flightMeal);
        log.info("Flight meal updated successfully with id: {}", updated.getId());

        return FlightMealMapper.toResponse(updated);
    }

    @Override
    @Transactional
    public void delete(Long userId, Long id) {
        flightMealRepository.delete(ownershipService.requireOwnedFlightMeal(userId, id));
        log.info("Flight meal deleted successfully with id: {}", id);
    }

    @Override
    @Transactional
    public FlightMealResponse updateAvailability(Long userId, Long id, Boolean available) {

        FlightMeal flightMeal = ownershipService.requireOwnedFlightMeal(userId, id);

        flightMeal.setAvailable(available);

        FlightMeal updated = flightMealRepository.save(flightMeal);
        log.info("Updated availability for id: {}", updated.getId());

        return FlightMealMapper.toResponse(updated);
    }

    @Override
    public Double calculateMealPrice(List<Long> mealIds) {
        if (mealIds == null || mealIds.isEmpty()) {
            return 0.0;
        }
        if (mealIds.stream().anyMatch(id -> id == null)) {
            throw new BaseException(ErrorCode.INVALID_INPUT);
        }

        Map<Long, Long> quantityById = mealIds.stream()
                .collect(Collectors.groupingBy(Function.identity(), Collectors.counting()));
        List<FlightMeal> selections = flightMealRepository.findAllById(quantityById.keySet());
        if (selections.size() != quantityById.size()
                || selections.stream().anyMatch(item -> !Boolean.TRUE.equals(item.getAvailable()))) {
            throw new BaseException(ErrorCode.INVALID_INPUT);
        }
        return selections.stream()
                .mapToDouble(item -> item.getPrice() * quantityById.getOrDefault(item.getId(), 0L))
                .sum();
    }

    private double requireValidPrice(Double price) {
        if (price == null || !Double.isFinite(price) || price < 0) {
            throw new BaseException(ErrorCode.INVALID_INPUT);
        }
        return price;
    }

    private String normalizeCurrency(String currency) {
        if (currency == null || !currency.matches("[A-Za-z]{3}")) {
            throw new BaseException(ErrorCode.INVALID_INPUT);
        }
        return currency.toUpperCase(Locale.ROOT);
    }
}
