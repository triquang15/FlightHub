package com.triquang.service;

import java.util.List;

import com.triquang.payload.request.FareRulesRequest;
import com.triquang.payload.response.FareRulesResponse;

public interface FareRulesService {

	FareRulesResponse createFareRules(FareRulesRequest request);

	FareRulesResponse getFareRulesById(Long id);

	FareRulesResponse getFareRulesByFareId(Long fareId);

	List<FareRulesResponse> getFareRulesByAirlineId(Long airlineId);

	FareRulesResponse updateFareRules(Long id, FareRulesRequest request);

	void deleteFareRules(Long id);
}
