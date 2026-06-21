package com.triquang.service.impl;

import java.util.List;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.triquang.client.AirlineClient;
import com.triquang.client.FlightClient;
import com.triquang.enums.ErrorCode;
import com.triquang.exception.BaseException;
import com.triquang.mapper.FareRulesMapper;
import com.triquang.model.Fare;
import com.triquang.model.FareRules;
import com.triquang.payload.request.FareRulesRequest;
import com.triquang.payload.response.FareRulesResponse;
import com.triquang.payload.response.AirlineResponse;
import com.triquang.payload.response.FlightResponse;
import com.triquang.repository.FareRepository;
import com.triquang.repository.FareRulesRepository;
import com.triquang.service.FareRulesService;

import feign.FeignException;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
@Transactional
public class FareRulesServiceImpl implements FareRulesService {

    private final FareRulesRepository fareRulesRepository;
    private final FareRepository fareRepository;
    private final AirlineClient airlineClient;
    private final FlightClient flightClient;

    @Override
    public FareRulesResponse createFareRules(Long userId, FareRulesRequest request) {
        Long airlineId = getAirlineForUser(userId);
        Fare fare = requireOwnedFare(request.getFareId(), airlineId);

        if (fareRulesRepository.existsByFareId(request.getFareId())) {
            throw new BaseException(ErrorCode.FARE_RULE_ALREADY_EXISTS); 
        }

        FareRules fareRules = FareRulesMapper.toEntity(request, fare);
        fareRules.setAirlineId(airlineId);
        normalizePolicy(fareRules);
        FareRules saved = fareRulesRepository.save(fareRules);
        return FareRulesMapper.toResponse(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public FareRulesResponse getFareRulesById(Long userId, Long id) {
        FareRules fareRules = requireOwnedRule(userId, id);
        return FareRulesMapper.toResponse(fareRules);
    }

    @Override
    @Transactional(readOnly = true)
    public FareRulesResponse getFareRulesByFareId(Long fareId) {
        FareRules fareRules = fareRulesRepository.findByFareId(fareId)
                .orElseThrow(() -> new BaseException(ErrorCode.FARE_NOT_FOUND));
        return FareRulesMapper.toResponse(fareRules);
    }

    @Override
    @Transactional(readOnly = true)
    public List<FareRulesResponse> getFareRulesByAirlineOwner(Long userId) {
        Long airlineId = getAirlineForUser(userId);
        return fareRulesRepository.findByAirlineId(airlineId)
                .stream()
                .map(FareRulesMapper::toResponse)
                .collect(Collectors.toList());
    }

    @Override
    public FareRulesResponse updateFareRules(Long userId, Long id, FareRulesRequest request) {
        FareRules existing = requireOwnedRule(userId, id);

        if (!existing.getFare().getId().equals(request.getFareId())) {
            throw new BaseException(ErrorCode.ACCESS_DENIED);
        }

        FareRulesMapper.updateEntity(request, existing);
        normalizePolicy(existing);
        FareRules saved = fareRulesRepository.save(existing);
        return FareRulesMapper.toResponse(saved);
    }

    @Override
    public void deleteFareRules(Long userId, Long id) {
        FareRules fareRules = requireOwnedRule(userId, id);
        fareRulesRepository.delete(fareRules);
    }

    private FareRules requireOwnedRule(Long userId, Long id) {
        FareRules fareRules = fareRulesRepository.findById(id)
                .orElseThrow(() -> new BaseException(ErrorCode.FARE_RULE_NOT_FOUND));
        if (!getAirlineForUser(userId).equals(fareRules.getAirlineId())) {
            throw new BaseException(ErrorCode.ACCESS_DENIED);
        }
        return fareRules;
    }

    private Fare requireOwnedFare(Long fareId, Long airlineId) {
        Fare fare = fareRepository.findById(fareId)
                .orElseThrow(() -> new BaseException(ErrorCode.FARE_NOT_FOUND));
        try {
            FlightResponse flight = flightClient.getFlightById(fare.getFlightId());
            if (flight == null || flight.getAirline() == null
                    || !airlineId.equals(flight.getAirline().getId())) {
                throw new BaseException(ErrorCode.ACCESS_DENIED);
            }
            return fare;
        } catch (FeignException.NotFound e) {
            throw new BaseException(ErrorCode.FARE_NOT_FOUND);
        } catch (FeignException e) {
            throw new BaseException(ErrorCode.EXTERNAL_SERVICE_ERROR);
        }
    }

    private Long getAirlineForUser(Long userId) {
        try {
            List<AirlineResponse> airlines = airlineClient.getAirlinesByOwner(userId);
            if (airlines == null || airlines.isEmpty()) {
                throw new BaseException(ErrorCode.AIRLINE_NOT_FOUND);
            }
            return airlines.getFirst().getId();
        } catch (FeignException.NotFound e) {
            throw new BaseException(ErrorCode.AIRLINE_NOT_FOUND);
        } catch (FeignException e) {
            throw new BaseException(ErrorCode.EXTERNAL_SERVICE_ERROR);
        }
    }

    private void normalizePolicy(FareRules fareRules) {
        if (!Boolean.TRUE.equals(fareRules.getIsRefundable())) {
            fareRules.setCancellationFee(null);
            fareRules.setRefundDeadlineDays(null);
        }
        if (!Boolean.TRUE.equals(fareRules.getIsChangeable())) {
            fareRules.setChangeFee(null);
            fareRules.setChangeDeadlineHours(null);
        }
    }
}
