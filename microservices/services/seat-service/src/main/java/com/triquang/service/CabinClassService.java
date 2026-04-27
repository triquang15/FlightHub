package com.triquang.service;

import java.util.List;

import com.triquang.enums.CabinClassType;
import com.triquang.payload.request.CabinClassRequest;
import com.triquang.payload.response.CabinClassResponse;

public interface CabinClassService {

	CabinClassResponse createCabinClass(CabinClassRequest request);

	List<CabinClassResponse> createCabinClasses(List<CabinClassRequest> requests);

	CabinClassResponse getCabinClassById(Long id);

	List<CabinClassResponse> getCabinClassesByAircraftId(Long aircraftId);

	CabinClassResponse getByAircraftIdAndName(Long aircraftId, CabinClassType name);

	CabinClassResponse updateCabinClass(Long id, CabinClassRequest request);

	void deleteCabinClass(Long id);
}
