package com.triquang.payload.response;

import lombok.*;

import java.util.List;

import com.triquang.domain.AncillaryMetadata;
import com.triquang.enums.AncillaryType;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AncillaryResponse {
    private Long id;
    private AncillaryType type;
    private String subType;
    private String rfisc;
    private String name;
    private String description;
    private String categoryDisplayName;
    private String categoryIcon;
    private String iconUrl;
    private AncillaryMetadata metadata;
    private List<InsuranceCoverageResponse> coverages;
    private Integer displayOrder;
    private Long airlineId;
}
