package com.triquang.payload.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;
import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FareRequest {

    @NotBlank(message = "Fare name is required")
    private String name;

    @NotNull(message = "RBD code is required")
    private Character rbdCode;

    @NotNull(message = "Flight ID is required")
    private Long flightId;

    @NotNull(message = "Cabin class ID is required")
    private Long cabinClassId;

    // Pricing
    @NotBlank(message = "Currency is required")
    @Size(min = 3, max = 3, message = "Currency must be a 3-letter ISO code")
    private String currency;

    @NotNull(message = "Base fare is required")
    @Positive
    private Double baseFare;

    @DecimalMin(value = "0.0", inclusive = true, message = "Taxes and fees cannot be negative")
    private Double taxesAndFees;

    @DecimalMin(value = "0.0", inclusive = true, message = "Airline fees cannot be negative")
    private Double airlineFees;
    private Double currentPrice;

    @Size(max = 100)
    private String fareLabel;

    // Seat benefits
    private Boolean extraSeatSpace;
    private Boolean preferredSeatChoice;
    private Boolean advanceSeatSelection;
    private Boolean guaranteedSeatTogether;

    // Boarding benefits
    private Boolean priorityBoarding;
    private Boolean priorityCheckin;
    private Boolean fastTrackSecurity;

    // In-flight benefits
    private Boolean complimentaryMeals;
    private Boolean premiumMealChoice;
    private Boolean inFlightInternet;
    private Boolean inFlightEntertainment;
    private Boolean complimentaryBeverages;

    // Flexibility benefits
    private Boolean freeDateChange;
    private Boolean partialRefund;
    private Boolean fullRefund;

    // Premium service benefits
    private Boolean loungeAccess;
    private Boolean airportTransfer;
}
