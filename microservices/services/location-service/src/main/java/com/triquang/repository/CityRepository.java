package com.triquang.repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.triquang.model.City;

public interface CityRepository extends JpaRepository<City, Long> {

    boolean existsByCityCode(String cityCode);

    boolean existsByCityCodeAndIdNot(String cityCode, Long id);

    Page<City> findByCountryCodeIgnoreCase(String countryCode, Pageable pageable);

    @Query("""
        SELECT c FROM City c
        WHERE LOWER(c.name) LIKE LOWER(CONCAT('%', :keyword, '%'))
           OR LOWER(c.cityCode) LIKE LOWER(CONCAT('%', :keyword, '%'))
    """)
    Page<City> searchByKeyword(@Param("keyword") String keyword, Pageable pageable);
}
