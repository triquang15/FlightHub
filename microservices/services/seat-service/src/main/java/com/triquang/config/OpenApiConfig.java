package com.triquang.config;

import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import io.swagger.v3.oas.models.security.SecurityScheme;
import org.springdoc.core.models.GroupedOpenApi;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class OpenApiConfig {

	private static final String BEARER_AUTH = "bearerAuth";

	@Bean
	public OpenAPI seatServiceOpenApi() {
		return new OpenAPI()
				.info(new Info()
						.title("FlightHub Seat Service API")
						.version("1.0.0")
						.description("""
								Cabin class, seat map, generated physical seat, and per-flight-instance seat inventory APIs.

								Use these APIs through the API Gateway with a Bearer JWT. Airline owner operations rely on
								trusted identity headers injected by the gateway. Customer booking flows should use the
								flight-instance seat inventory and hold/release/confirm lifecycle APIs.
								""")
						.contact(new Contact().name("FlightHub Seat Service Team")))
				.addSecurityItem(new SecurityRequirement().addList(BEARER_AUTH))
				.components(new Components()
						.addSecuritySchemes(BEARER_AUTH, new SecurityScheme()
								.name(BEARER_AUTH)
								.type(SecurityScheme.Type.HTTP)
								.scheme("bearer")
								.bearerFormat("JWT")));
	}

	@Bean
	public GroupedOpenApi cabinClassesApi() {
		return GroupedOpenApi.builder()
				.group("cabin-classes")
				.pathsToMatch("/api/cabin-classes/**")
				.build();
	}

	@Bean
	public GroupedOpenApi seatMapsApi() {
		return GroupedOpenApi.builder()
				.group("seat-maps")
				.pathsToMatch("/api/seat-maps/**")
				.build();
	}

	@Bean
	public GroupedOpenApi seatsApi() {
		return GroupedOpenApi.builder()
				.group("seats")
				.pathsToMatch("/api/seats/**")
				.build();
	}

	@Bean
	public GroupedOpenApi seatInstancesApi() {
		return GroupedOpenApi.builder()
				.group("seat-instances")
				.pathsToMatch("/api/seat-instances/**")
				.build();
	}

	@Bean
	public GroupedOpenApi flightInstanceCabinsApi() {
		return GroupedOpenApi.builder()
				.group("flight-instance-cabins")
				.pathsToMatch("/api/flight-instance-cabins/**")
				.build();
	}
}
