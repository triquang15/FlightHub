package com.triquang.mapper;

import com.triquang.model.City;
import com.triquang.payload.request.CityRequest;
import com.triquang.payload.response.CityResponse;

public class CityMapper {

    public static City toEntity(CityRequest request) {
        if (request == null) return null;

        return City.builder()
                .name(request.getName())
                .cityCode(request.getCityCode().toUpperCase())
                .countryCode(request.getCountryCode().toUpperCase())
                .countryName(request.getCountryName())
                .regionCode(request.getRegionCode())
                .timeZoneId(request.getTimeZone())

                .build();
    }

    public static CityResponse toResponse(City city) {
        if (city == null) return null;

        return CityResponse.builder()
                .id(city.getId())
                .name(city.getName())
                .cityCode(city.getCityCode())
                .countryCode(city.getCountryCode())
                .countryName(city.getCountryName())
                .regionCode(city.getRegionCode())
                .timeZone(city.getTimeZoneId())
                .timeZoneOffset(city.getCurrentUtcOffset())

                .build();
    }

    public static void updateEntity(City city, CityRequest request) {

        if (request.getName() != null) {
            city.setName(request.getName().trim());
        }

        if (request.getCityCode() != null) {
            city.setCityCode(request.getCityCode().toUpperCase());
        }

        if (request.getCountryCode() != null) {
            city.setCountryCode(request.getCountryCode().toUpperCase());
        }

        if (request.getCountryName() != null) {
            city.setCountryName(request.getCountryName());
        }

        if (request.getRegionCode() != null) {
            city.setRegionCode(request.getRegionCode().toUpperCase());
        }

        if (request.getTimeZone() != null) {
            city.setTimeZoneId(request.getTimeZone());
        }
    }
}
