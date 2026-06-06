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
    public OpenAPI airlineCoreServiceOpenApi() {
        return new OpenAPI()
                .info(new Info()
                        .title("FlightHub Airline Core Service API")
                        .version("1.0.0")
                        .description("Airline profile, approval, fleet, and aircraft master data APIs.")
                        .contact(new Contact().name("FlightHub Platform Team")))
                .addSecurityItem(new SecurityRequirement().addList(BEARER_AUTH))
                .components(new Components()
                        .addSecuritySchemes(BEARER_AUTH, new SecurityScheme()
                                .name(BEARER_AUTH)
                                .type(SecurityScheme.Type.HTTP)
                                .scheme("bearer")
                                .bearerFormat("JWT")));
    }

    @Bean
    public GroupedOpenApi airlinesApi() {
        return GroupedOpenApi.builder()
                .group("airlines")
                .pathsToMatch("/api/airlines/**")
                .build();
    }

    @Bean
    public GroupedOpenApi aircraftsApi() {
        return GroupedOpenApi.builder()
                .group("aircrafts")
                .pathsToMatch("/api/aircrafts/**")
                .build();
    }
}
