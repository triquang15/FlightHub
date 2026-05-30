package com.triquang.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import org.springdoc.core.models.GroupedOpenApi;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class OpenApiConfig {

    @Bean
    public OpenAPI notificationServiceOpenApi() {
        return new OpenAPI()
                .info(new Info()
                        .title("FlightHub Notification Service API")
                        .version("1.0.0")
                        .description("Notification delivery, audit, and operational endpoints.")
                        .contact(new Contact().name("FlightHub Platform Team")));
    }

    @Bean
    public GroupedOpenApi notificationApi() {
        return GroupedOpenApi.builder()
                .group("notifications")
                .pathsToMatch("/api/notifications/**")
                .build();
    }

    @Bean
    public GroupedOpenApi actuatorApi() {
        return GroupedOpenApi.builder()
                .group("operations")
                .pathsToMatch("/actuator/**")
                .build();
    }
}
