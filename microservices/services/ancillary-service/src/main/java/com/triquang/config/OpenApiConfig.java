package com.triquang.config;

import org.springdoc.core.models.GroupedOpenApi;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import io.swagger.v3.oas.models.security.SecurityScheme;

@Configuration
public class OpenApiConfig {

    private static final String BEARER_AUTH = "bearerAuth";

    @Bean
    public OpenAPI ancillaryServiceOpenApi() {
        return new OpenAPI()
                .info(new Info()
                        .title("FlightHub Ancillary Service API")
                        .version("1.0.0")
                        .description("Ancillary catalog, meal catalog, flight assignments, and insurance coverage APIs."))
                .addSecurityItem(new SecurityRequirement().addList(BEARER_AUTH))
                .components(new Components().addSecuritySchemes(BEARER_AUTH,
                        new SecurityScheme()
                                .type(SecurityScheme.Type.HTTP)
                                .scheme("bearer")
                                .bearerFormat("JWT")));
    }

    @Bean
    public GroupedOpenApi ancillaryCatalogApi() {
        return group("ancillary-catalog", "/api/ancillaries/**", "/api/insurance-coverages/**");
    }

    @Bean
    public GroupedOpenApi mealApi() {
        return group("meals", "/api/meals/**", "/api/flight-meals/**");
    }

    @Bean
    public GroupedOpenApi flightAssignmentApi() {
        return group("flight-ancillary-assignments", "/api/flight-cabin-ancillaries/**");
    }

    private GroupedOpenApi group(String name, String... paths) {
        return GroupedOpenApi.builder().group(name).pathsToMatch(paths).build();
    }
}
