package com.triquang.service;

import java.util.List;

import com.triquang.enums.AncillaryType;
import com.triquang.payload.request.FlightCabinAncillaryRequest;
import com.triquang.payload.response.FlightCabinAncillaryResponse;

public interface FlightCabinAncillaryService {

	FlightCabinAncillaryResponse create(FlightCabinAncillaryRequest request);

	List<FlightCabinAncillaryResponse> bulkCreate(List<FlightCabinAncillaryRequest> requests);

	FlightCabinAncillaryResponse getById(Long id);

	List<FlightCabinAncillaryResponse> getAllByFlightAndCabinClass(Long flightId, Long cabinClassId);

	List<FlightCabinAncillaryResponse> getAllByIds(List<Long> ids);

	FlightCabinAncillaryResponse getByFlightIdAndCabinClassAndType(Long flightId, Long cabinClassId, AncillaryType type);

	List<FlightCabinAncillaryResponse> getAllByFlightIdAndCabinClassAndType(Long flightId, Long cabinClassId, AncillaryType type);

	FlightCabinAncillaryResponse update(Long id, FlightCabinAncillaryRequest request);

	void delete(Long id);

	Double calculateAncillaryPrice(List<Long> ancillaryIds);
}
