package com.triquang.service;

import java.util.List;

import com.triquang.payload.request.FareRulesRequest;
import com.triquang.payload.response.FareRulesResponse;

public interface FareRulesService {

	FareRulesResponse createFareRules(Long userId, FareRulesRequest request);

	FareRulesResponse getFareRulesById(Long userId, Long id);

	FareRulesResponse getFareRulesByFareId(Long fareId);

	List<FareRulesResponse> getFareRulesByAirlineOwner(Long userId);

	FareRulesResponse updateFareRules(Long userId, Long id, FareRulesRequest request);

	void deleteFareRules(Long userId, Long id);
}
