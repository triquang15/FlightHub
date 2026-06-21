package com.triquang.payload.request;

import jakarta.validation.constraints.*;
import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FlightMealRequest {

	@NotNull(message = "Flight ID is required")
	private Long flightId;

	@NotNull(message = "Meal ID is required")
	private Long mealId;

	@NotNull(message = "Availability status is required")
	private Boolean available;

	@NotNull(message = "Price is required")
	@DecimalMin(value = "0.0", message = "Price cannot be negative")
	private Double price;

	@NotBlank(message = "Currency is required")
	@Pattern(regexp = "^[A-Za-z]{3}$", message = "Currency must be a 3-letter ISO code")
	private String currency;

	@Min(value = 0, message = "Display order cannot be negative")
	private Integer displayOrder;
}
