package com.triquang;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.netflix.eureka.server.EnableEurekaServer;

/**
 * The ServiceRegistryApplication class is the entry point for the Service Registry microservice.
 * It is annotated with @SpringBootApplication to indicate that it is a Spring Boot application,
 * and @EnableEurekaServer to enable Eureka Server functionality for service discovery.
 */

@SpringBootApplication
@EnableEurekaServer
public class ServiceRegistryApplication {

	public static void main(String[] args) {
		SpringApplication.run(ServiceRegistryApplication.class, args);
	}

}
