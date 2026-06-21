package com.triquang.config;

import org.springdoc.core.models.GroupedOpenApi;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import io.swagger.v3.oas.models.security.SecurityScheme;

@Configuration
public class OpenApiConfig {

    private static final String BEARER_AUTH = "bearerAuth";

    @Bean
    public OpenAPI pricingServiceOpenApi() {
        return new OpenAPI()
                .info(new Info()
                        .title("FlightHub Pricing Service API")
                        .version("1.0.0")
                        .description("""
                                Fare products, fare rules, baggage policies, and lowest-fare lookup APIs.

                                Call these APIs through the API Gateway with a Bearer JWT. The gateway validates the
                                token and injects trusted identity headers. Pricing mutations require ROLE_AIRLINE_OWNER.
                                Fare Rules are owner-scoped and each Fare may have at most one Fare Rule.
                                """)
                        .contact(new Contact().name("FlightHub Commercial Platform Team")))
                .addSecurityItem(new SecurityRequirement().addList(BEARER_AUTH))
                .components(new Components()
                        .addSecuritySchemes(BEARER_AUTH, new SecurityScheme()
                                .name(BEARER_AUTH)
                                .type(SecurityScheme.Type.HTTP)
                                .scheme("bearer")
                                .bearerFormat("JWT")));
    }

    @Bean
    public GroupedOpenApi faresApi() {
        return GroupedOpenApi.builder()
                .group("fares")
                .pathsToMatch("/api/fares/**")
                .build();
    }

    @Bean
    public GroupedOpenApi fareRulesApi() {
        return GroupedOpenApi.builder()
                .group("fare-rules")
                .pathsToMatch("/api/fare-rules/**")
                .build();
    }

    @Bean
    public GroupedOpenApi baggagePoliciesApi() {
        return GroupedOpenApi.builder()
                .group("baggage-policies")
                .pathsToMatch("/api/baggage-policies/**")
                .build();
    }
}
