package com.triquang.service;

import java.util.List;

import com.triquang.payload.request.BaggagePolicyRequest;
import com.triquang.payload.response.BaggagePolicyResponse;

public interface BaggagePolicyService {

	BaggagePolicyResponse createBaggagePolicy(BaggagePolicyRequest request);

	List<BaggagePolicyResponse> createBaggagePolicies(List<BaggagePolicyRequest> requests);

	BaggagePolicyResponse getBaggagePolicyById(Long id);

	BaggagePolicyResponse getBaggagePolicyByFareId(Long fareId);

	List<BaggagePolicyResponse> getBaggagePoliciesByAirlineId(Long airlineId);

	BaggagePolicyResponse updateBaggagePolicy(Long id, BaggagePolicyRequest request);

	void deleteBaggagePolicy(Long id);
}
