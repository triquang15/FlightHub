package com.triquang.service.impl;

import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.triquang.enums.ErrorCode;
import com.triquang.exception.BaseException;
import com.triquang.mapper.MealMapper;
import com.triquang.model.Meal;
import com.triquang.payload.request.MealRequest;
import com.triquang.payload.response.MealResponse;
import com.triquang.repository.MealRepository;
import com.triquang.service.AirlineIntegrationService;
import com.triquang.service.MealService;
import com.triquang.utils.MealSpecification;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class MealServiceImpl implements MealService {

    private final MealRepository mealRepository;
    private final AirlineIntegrationService airlineIntegrationService;

    @Override
    @Transactional
    public MealResponse create(Long userId, MealRequest request) {
        log.debug("Creating meal with code: {}", request.getCode());

        Long airlineId = airlineIntegrationService.getAirlineIdForUser(userId);

        Specification<Meal> spec = MealSpecification.hasCodeAndAirlineId(request.getCode(), airlineId);
        if (mealRepository.exists(spec)) {
            throw new BaseException(ErrorCode.MEAL_ALREADY_EXISTS); // duplicate meal code
        }

        Meal meal = Meal.builder()
                .code(request.getCode())
                .name(request.getName())
                .mealType(request.getMealType())
                .dietaryRestriction(request.getDietaryRestriction())
                .ingredients(request.getIngredients())
                .imageUrl(request.getImageUrl())
                .available(request.getAvailable())
                .requiresAdvanceBooking(
                        request.getRequiresAdvanceBooking() != null
                                ? request.getRequiresAdvanceBooking()
                                : false
                )
                .advanceBookingHours(request.getAdvanceBookingHours())
                .displayOrder(request.getDisplayOrder() != null ? request.getDisplayOrder() : 0)
                .airlineId(airlineId)
                .build();

        Meal savedMeal = mealRepository.save(meal);
        log.info("Meal created successfully with id: {}", savedMeal.getId());

        return MealMapper.toResponse(savedMeal);
    }

    @Override
    @Transactional
    public List<MealResponse> bulkCreate(Long userId, List<MealRequest> requests) {
        log.debug("Bulk creating {} meals", requests.size());

        Long airlineId = airlineIntegrationService.getAirlineIdForUser(userId);

        List<MealResponse> responses = new ArrayList<>();

        for (MealRequest request : requests) {
            Specification<Meal> spec = MealSpecification.hasCodeAndAirlineId(request.getCode(), airlineId);

            if (mealRepository.exists(spec)) {
                log.warn("Skipping meal with code {} - already exists for airline {}",
                        request.getCode(), airlineId);
                continue;
            }

            Meal meal = Meal.builder()
                    .code(request.getCode())
                    .name(request.getName())
                    .mealType(request.getMealType())
                    .dietaryRestriction(request.getDietaryRestriction())
                    .ingredients(request.getIngredients())
                    .imageUrl(request.getImageUrl())
                    .available(request.getAvailable())
                    .requiresAdvanceBooking(
                            request.getRequiresAdvanceBooking() != null
                                    ? request.getRequiresAdvanceBooking()
                                    : false
                    )
                    .advanceBookingHours(request.getAdvanceBookingHours())
                    .displayOrder(request.getDisplayOrder() != null ? request.getDisplayOrder() : 0)
                    .airlineId(airlineId)
                    .build();

            Meal savedMeal = mealRepository.save(meal);
            responses.add(MealMapper.toResponse(savedMeal));
        }

        log.info("Successfully created {} meals", responses.size());
        return responses;
    }

    @Override
    @Transactional(readOnly = true)
    public MealResponse getById(Long id) {
        Meal meal = mealRepository.findById(id)
                .orElseThrow(() -> new BaseException(ErrorCode.MEAL_NOT_FOUND)); 
        return MealMapper.toResponse(meal);
    }

    @Override
    @Transactional(readOnly = true)
    public List<MealResponse> getByAirlineId(Long userId) {
        Long airlineId = airlineIntegrationService.getAirlineIdForUser(userId);

        Specification<Meal> spec = MealSpecification.hasAirlineId(airlineId);

        return mealRepository.findAll(spec).stream()
                .map(MealMapper::toResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public MealResponse update(Long userId, Long id, MealRequest request) {
        log.debug("Updating meal with id: {}", id);

        Long airlineId = airlineIntegrationService.getAirlineIdForUser(userId);

        Meal meal = mealRepository.findById(id)
                .orElseThrow(() -> new BaseException(ErrorCode.ANCILLARY_NOT_FOUND));

        if (!meal.getCode().equals(request.getCode())) {
            Specification<Meal> spec = MealSpecification.hasCodeAndAirlineId(request.getCode(), airlineId);

            if (mealRepository.exists(spec)) {
                throw new BaseException(ErrorCode.INVALID_INPUT);
            }
        }

        meal.setCode(request.getCode());
        meal.setName(request.getName());
        meal.setMealType(request.getMealType());
        meal.setDietaryRestriction(request.getDietaryRestriction());
        meal.setIngredients(request.getIngredients());
        meal.setImageUrl(request.getImageUrl());
        meal.setAvailable(request.getAvailable());
        meal.setRequiresAdvanceBooking(request.getRequiresAdvanceBooking());
        meal.setAdvanceBookingHours(request.getAdvanceBookingHours());
        meal.setDisplayOrder(request.getDisplayOrder());

        Meal updatedMeal = mealRepository.save(meal);
        log.info("Meal updated successfully with id: {}", updatedMeal.getId());

        return MealMapper.toResponse(updatedMeal);
    }

    @Override
    @Transactional
    public void delete(Long id) {
        if (!mealRepository.existsById(id)) {
            throw new BaseException(ErrorCode.ANCILLARY_NOT_FOUND);
        }

        mealRepository.deleteById(id);
        log.info("Meal deleted successfully with id: {}", id);
    }

    @Override
    @Transactional
    public MealResponse updateAvailability(Long id, Boolean available) {
        Meal meal = mealRepository.findById(id)
                .orElseThrow(() -> new BaseException(ErrorCode.ANCILLARY_NOT_FOUND));

        meal.setAvailable(available);

        Meal updatedMeal = mealRepository.save(meal);
        log.info("Meal availability updated successfully for id: {}", updatedMeal.getId());

        return MealMapper.toResponse(updatedMeal);
    }
}
