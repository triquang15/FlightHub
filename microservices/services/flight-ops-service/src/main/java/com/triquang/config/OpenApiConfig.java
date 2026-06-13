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
    public OpenAPI flightOpsServiceOpenApi() {
        return new OpenAPI()
                .info(new Info()
                        .title("FlightHub Flight Operations Service API")
                        .version("1.0.0")
                        .description("""
                                Flight definition, recurring schedule, flight instance, search, and operational lifecycle APIs.

                                Use these APIs through the API Gateway with a Bearer JWT. The gateway validates the token and
                                injects trusted identity headers. Flight, schedule, and instance mutations require ROLE_AIRLINE_OWNER.
                                """)
                        .contact(new Contact().name("FlightHub Flight Operations Team")))
                .addSecurityItem(new SecurityRequirement().addList(BEARER_AUTH))
                .components(new Components()
                        .addSecuritySchemes(BEARER_AUTH, new SecurityScheme()
                                .name(BEARER_AUTH)
                                .type(SecurityScheme.Type.HTTP)
                                .scheme("bearer")
                                .bearerFormat("JWT")));
    }

    @Bean
    public GroupedOpenApi flightsApi() {
        return GroupedOpenApi.builder()
                .group("flights")
                .pathsToMatch("/api/flights/**")
                .build();
    }

    @Bean
    public GroupedOpenApi flightSchedulesApi() {
        return GroupedOpenApi.builder()
                .group("flight-schedules")
                .pathsToMatch("/api/flight-schedules/**")
                .build();
    }

    @Bean
    public GroupedOpenApi flightInstancesApi() {
        return GroupedOpenApi.builder()
                .group("flight-instances")
                .pathsToMatch("/api/flight-instances/**")
                .build();
    }
}
