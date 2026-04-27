package com.triquang.payload.response;

import com.triquang.enums.CoverageType;

import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class InsuranceCoverageResponse {
	private Long id;
	private Long ancillaryId;
	private String ancillaryName;
	private CoverageType coverageType;
	private String name;
	private String description;
	private Double coverageAmount;
	private String currency;
	private Boolean isFlat;
	private String claimCondition;
	private String emergencyContact;
	private Integer displayOrder;
	private Boolean active;
}
