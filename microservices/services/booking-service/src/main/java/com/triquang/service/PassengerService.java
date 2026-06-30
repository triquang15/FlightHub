package com.triquang.service;

import com.triquang.model.Passenger;
import com.triquang.payload.request.PassengerRequest;
import com.triquang.payload.response.PassengerResponse;
import java.util.List;

public interface PassengerService {

	PassengerResponse createPassenger(PassengerRequest request, Long userId);

	Passenger findOrCreatePassengerEntity(PassengerRequest request, Long userId);

	Passenger findExistingPassenger(PassengerRequest request, Long userId);

	List<PassengerResponse> getSavedPassengers(Long userId);

	boolean existsById(Long id);

	long count();
}
