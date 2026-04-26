package com.triquang.service.impl;

import java.util.List;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.triquang.enums.ErrorCode;
import com.triquang.exception.BaseException;
import com.triquang.mapper.FareRulesMapper;
import com.triquang.model.Fare;
import com.triquang.model.FareRules;
import com.triquang.payload.request.FareRulesRequest;
import com.triquang.payload.response.FareRulesResponse;
import com.triquang.repository.FareRepository;
import com.triquang.repository.FareRulesRepository;
import com.triquang.service.FareRulesService;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
@Transactional
public class FareRulesServiceImpl implements FareRulesService {

    private final FareRulesRepository fareRulesRepository;
    private final FareRepository fareRepository;

    @Override
    public FareRulesResponse createFareRules(FareRulesRequest request) {
        Fare fare = fareRepository.findById(request.getFareId())
                .orElseThrow(() -> new BaseException(ErrorCode.FARE_NOT_FOUND));

        if (fareRulesRepository.existsByFareId(request.getFareId())) {
            throw new BaseException(ErrorCode.FARE_RULE_ALREADY_EXISTS); 
        }

        FareRules fareRules = FareRulesMapper.toEntity(request, fare);
        FareRules saved = fareRulesRepository.save(fareRules);
        return FareRulesMapper.toResponse(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public FareRulesResponse getFareRulesById(Long id) {
        FareRules fareRules = fareRulesRepository.findById(id)
                .orElseThrow(() -> new BaseException(ErrorCode.FARE_RULE_NOT_FOUND)); 
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
    public List<FareRulesResponse> getFareRulesByAirlineId(Long airlineId) {
        return fareRulesRepository.findByAirlineId(airlineId)
                .stream()
                .map(FareRulesMapper::toResponse)
                .collect(Collectors.toList());
    }

    @Override
    public FareRulesResponse updateFareRules(Long id, FareRulesRequest request) {
        FareRules existing = fareRulesRepository.findById(id)
                .orElseThrow(() -> new BaseException(ErrorCode.FARE_RULE_NOT_FOUND)); 

        FareRulesMapper.updateEntity(request, existing);
        FareRules saved = fareRulesRepository.save(existing);
        return FareRulesMapper.toResponse(saved);
    }

    @Override
    public void deleteFareRules(Long id) {
        FareRules fareRules = fareRulesRepository.findById(id)
                .orElseThrow(() -> new BaseException(ErrorCode.FARE_RULE_NOT_FOUND)); 
        fareRulesRepository.delete(fareRules);
    }
}