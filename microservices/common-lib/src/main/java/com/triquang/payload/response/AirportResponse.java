package com.triquang.payload.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.ZoneId;

import com.triquang.embeddable.Address;
import com.triquang.embeddable.Analytics;
import com.triquang.embeddable.GeoCode;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AirportResponse {

	private Long id;
	private String iataCode;
	private String name;
	private String detailedName;
	private ZoneId timeZone;
	private Address address;
	private CityResponse city;
	private GeoCode geoCode;
	private Analytics analytics;
}
