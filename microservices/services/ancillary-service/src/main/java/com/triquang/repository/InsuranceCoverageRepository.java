package com.triquang.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.triquang.enums.CoverageType;
import com.triquang.model.Ancillary;
import com.triquang.model.InsuranceCoverage;

import java.util.List;

public interface InsuranceCoverageRepository extends JpaRepository<InsuranceCoverage, Long> {

	List<InsuranceCoverage> findByAncillary(Ancillary ancillary);

	List<InsuranceCoverage> findByAncillaryAndActiveTrue(Ancillary ancillary);

	List<InsuranceCoverage> findByCoverageType(CoverageType coverageType);

	List<InsuranceCoverage> findByAncillaryIdAndActiveTrue(Long ancillaryId);
}
