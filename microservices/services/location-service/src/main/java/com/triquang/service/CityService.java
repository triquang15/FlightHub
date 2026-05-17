package com.triquang.service;

import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import com.triquang.payload.request.CityRequest;
import com.triquang.payload.response.CityResponse;

public interface CityService {

    CityResponse createCity(CityRequest request);

    CityResponse getCityById(Long id);

    List<CityResponse> getCitiesDropdown();

    Page<CityResponse> getAllCities(Pageable pageable);

    Page<CityResponse> searchCities(String keyword, Pageable pageable);

    Page<CityResponse> getCitiesByCountryCode(String countryCode, Pageable pageable);

    CityResponse updateCity(Long id, CityRequest request);

    void deleteCity(Long id);
}
