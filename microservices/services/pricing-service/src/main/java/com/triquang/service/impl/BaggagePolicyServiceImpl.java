package com.triquang.service.impl;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.triquang.enums.ErrorCode;
import com.triquang.exception.BaseException;
import com.triquang.mapper.BaggagePolicyMapper;
import com.triquang.model.BaggagePolicy;
import com.triquang.model.Fare;
import com.triquang.payload.request.BaggagePolicyRequest;
import com.triquang.payload.response.BaggagePolicyResponse;
import com.triquang.repository.BaggagePolicyRepository;
import com.triquang.repository.FareRepository;
import com.triquang.service.BaggagePolicyService;

import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * Service implementation for managing baggage policies. It provides methods to create,
 * retrieve, update, and delete baggage policies, as well as to handle batch creation.
 *
 * @author Tri Quang
 * @since 2024-04
 */

@Service
@RequiredArgsConstructor
@Transactional
public class BaggagePolicyServiceImpl implements BaggagePolicyService {

    private final BaggagePolicyRepository baggagePolicyRepository;
    private final FareRepository fareRepository;

    @Override
    public BaggagePolicyResponse createBaggagePolicy(BaggagePolicyRequest request) {
        Fare fare = fareRepository.findById(request.getFareId())
                .orElseThrow(() -> new BaseException(ErrorCode.FARE_NOT_FOUND));

        if (baggagePolicyRepository.existsByFareId(request.getFareId())) {
            throw new BaseException(ErrorCode.BAGGAGE_POLICY_ALREADY_EXISTS);
        }

        BaggagePolicy policy = BaggagePolicyMapper.toEntity(request, fare);
        BaggagePolicy saved = baggagePolicyRepository.save(policy);
        return BaggagePolicyMapper.toResponse(saved);
    }

    @Override
    public List<BaggagePolicyResponse> createBaggagePolicies(List<BaggagePolicyRequest> requests) {

        List<Long> fareIds = requests.stream()
                .map(BaggagePolicyRequest::getFareId)
                .toList();

        Map<Long, Fare> fareMap = fareRepository.findAllById(fareIds).stream()
                .collect(Collectors.toMap(Fare::getId, f -> f));

        fareIds.forEach(fareId -> {
            if (!fareMap.containsKey(fareId)) {
                throw new BaseException(ErrorCode.FARE_NOT_FOUND);
            }
        });

        Set<Long> alreadyHasPolicy =
                baggagePolicyRepository.findFareIdsWithExistingPolicy(fareIds);

        List<BaggagePolicy> toSave = requests.stream()
                .filter(req -> !alreadyHasPolicy.contains(req.getFareId()))
                .map(req -> BaggagePolicyMapper.toEntity(req, fareMap.get(req.getFareId())))
                .toList();

        return baggagePolicyRepository.saveAll(toSave)
                .stream()
                .map(BaggagePolicyMapper::toResponse)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public BaggagePolicyResponse getBaggagePolicyById(Long id) {
        BaggagePolicy policy = baggagePolicyRepository.findById(id)
                .orElseThrow(() -> new BaseException(ErrorCode.BAGGAGE_POLICY_NOT_FOUND));

        return BaggagePolicyMapper.toResponse(policy);
    }

    @Override
    @Transactional(readOnly = true)
    public BaggagePolicyResponse getBaggagePolicyByFareId(Long fareId) {
        BaggagePolicy policy = baggagePolicyRepository.findByFareId(fareId)
                .orElseThrow(() -> new BaseException(ErrorCode.BAGGAGE_POLICY_NOT_FOUND));

        return BaggagePolicyMapper.toResponse(policy);
    }

    @Override
    @Transactional(readOnly = true)
    public List<BaggagePolicyResponse> getBaggagePoliciesByAirlineId(Long airlineId) {
        return baggagePolicyRepository.findByAirlineId(airlineId)
                .stream()
                .map(BaggagePolicyMapper::toResponse)
                .toList();
    }

    @Override
    public BaggagePolicyResponse updateBaggagePolicy(Long id, BaggagePolicyRequest request) {
        BaggagePolicy existing = baggagePolicyRepository.findById(id)
                .orElseThrow(() -> new BaseException(ErrorCode.BAGGAGE_POLICY_NOT_FOUND));

        BaggagePolicyMapper.updateEntity(request, existing);
        BaggagePolicy saved = baggagePolicyRepository.save(existing);

        return BaggagePolicyMapper.toResponse(saved);
    }

    @Override
    public void deleteBaggagePolicy(Long id) {
        BaggagePolicy policy = baggagePolicyRepository.findById(id)
                .orElseThrow(() -> new BaseException(ErrorCode.BAGGAGE_POLICY_NOT_FOUND));

        baggagePolicyRepository.delete(policy);
    }
}
