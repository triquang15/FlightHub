package com.triquang.payload.request;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FlightCabinAncillaryRequest {

	@NotNull(message = "Flight ID is required")
	private Long flightId;

	@NotNull(message = "Cabin Class ID is required")
	private Long cabinClassId;

	@NotNull(message = "Ancillary ID is required")
	private Long ancillaryId;

	@NotNull(message = "Availability status is required")
	private Boolean available;

	@Min(value = 1, message = "Max quantity must be at least 1")
	private Integer maxQuantity;

	@NotNull(message = "Price is required")
	@DecimalMin(value = "0.0", message = "Price cannot be negative")
	private Double price;

	@NotBlank(message = "Currency is required")
	@Pattern(regexp = "^[A-Za-z]{3}$", message = "Currency must be a 3-letter ISO code")
	private String currency;

	@NotNull(message = "Included in fare status is required")
	private Boolean includedInFare;
}
