package com.triquang.config;

import java.net.URI;
import java.util.Set;
import java.util.UUID;

import org.springframework.cloud.gateway.server.mvc.filter.BeforeFilterFunctions;
import org.springframework.cloud.gateway.server.mvc.filter.CircuitBreakerFilterFunctions;
import org.springframework.cloud.gateway.server.mvc.filter.LoadBalancerFilterFunctions;
import org.springframework.cloud.gateway.server.mvc.handler.GatewayRouterFunctions;
import org.springframework.cloud.gateway.server.mvc.handler.HandlerFunctions;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.annotation.Order;
import org.springframework.http.HttpStatus;
import org.slf4j.MDC;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.web.servlet.function.RequestPredicates;
import org.springframework.web.servlet.function.RouterFunction;
import org.springframework.web.servlet.function.RouterFunctions;
import org.springframework.web.servlet.function.ServerRequest;
import org.springframework.web.servlet.function.ServerResponse;

import com.triquang.client.UserServiceClient;
import com.triquang.enums.UserRole;
import com.triquang.service.TokenBlacklistService;

import io.jsonwebtoken.Claims;
import lombok.extern.slf4j.Slf4j;

@Configuration
@Slf4j
public class RouteConfig {

    static final Set<String> SYSTEM_ADMIN_BOOKING_ROUTES = Set.of(
            "/api/bookings/statistics/super-admin",
            "/api/bookings/dashboard-stats/super-admin",
            "/api/bookings/airline-performance/super-admin",
            "/api/bookings/airport-performance/super-admin",
            "/api/bookings/route-performance/super-admin"
    );

    static final Set<String> AIRLINE_OWNER_BOOKING_ROUTES = Set.of(
            "/api/bookings/airline",
            "/api/bookings/statistics/airline",
            "/api/bookings/route-performance/airline",
            "/api/bookings/airport-performance/airline"
    );

    static final Set<String> SYSTEM_ADMIN_MEDIA_ROUTES = Set.of(
            "/api/media",
            "/api/media/entity/{entityType}/{entityId}/{purpose}"
    );

    private final JwtUtil jwtUtil;
    private final TokenBlacklistService blacklistService;
    private final RedisRateLimitFilter redisRateLimitFilter;
    private final UserServiceClient userServiceClient;

    public RouteConfig(
            JwtUtil jwtUtil,
            TokenBlacklistService blacklistService,
            RedisRateLimitFilter redisRateLimitFilter,
            UserServiceClient userServiceClient
    ) {
        this.jwtUtil = jwtUtil;
        this.blacklistService = blacklistService;
        this.redisRateLimitFilter = redisRateLimitFilter;
        this.userServiceClient = userServiceClient;
    }

    // ==================== BUILDER ====================

    private RouterFunctions.Builder routeWithCB(
            String routeName,
            String serviceName,
            String cbName,
            String fallbackUri
    ) {
        return GatewayRouterFunctions.route(routeName)
                .filter(LoadBalancerFilterFunctions.lb(serviceName))
                .filter(CircuitBreakerFilterFunctions.circuitBreaker(
                        cbName,
                        URI.create(fallbackUri)
                ));
    }

    private RouterFunctions.Builder routeWithoutCB(
            String routeName,
            String serviceName
    ) {
        return GatewayRouterFunctions.route(routeName)
                .filter(LoadBalancerFilterFunctions.lb(serviceName));
    }

    // ==================== PUBLIC AUTH / RECOVERY ====================

    @Bean
    @Order(0)
    public RouterFunction<ServerResponse> paymentWebhookRoutes() {
        return routeWithoutCB("payment-webhooks", "payment-service")
                .route(RequestPredicates.POST("/api/payments/webhooks/stripe"), HandlerFunctions.http())
                .route(RequestPredicates.POST("/api/payments/webhooks/paypal"), HandlerFunctions.http())
                .filter(redisRateLimitFilter)
                .build();
    }

    @Bean
    @Order(0)
    public RouterFunction<ServerResponse> authRoutes() {
        return routeWithoutCB("auth-routes", "user-service")
                .route(RequestPredicates.path("/api/auth/**"), HandlerFunctions.http())
                .route(RequestPredicates.POST("/api/users/forgot-password"), HandlerFunctions.http())
                .route(RequestPredicates.POST("/api/users/reset-password"), HandlerFunctions.http())
                .route(RequestPredicates.GET("/api/users/profile/avatar/file/{userId}/{filename}"), HandlerFunctions.http())
                .filter(redisRateLimitFilter)
                .build();
    }

    @Bean
    @Order(0)
    public RouterFunction<ServerResponse> publicLocationRoutes() {
        return routeWithCB("public-location", "location-service", "location-cb", "forward:/fallback/location")
                .route(RequestPredicates.GET("/api/airports/**"), HandlerFunctions.http())
                .route(RequestPredicates.GET("/api/cities/**"), HandlerFunctions.http())
                .filter(redisRateLimitFilter)
                .build();
    }

    @Bean
    @Order(0)
    public RouterFunction<ServerResponse> publicFlightSearchRoutes() {
        return routeWithCB("public-flight-search", "flight-ops-service", "flight-cb", "forward:/fallback/flight")
                .route(RequestPredicates.GET("/api/flights/search"), HandlerFunctions.http())
                .filter(redisRateLimitFilter)
                .build();
    }

    @Bean
    @Order(0)
    public RouterFunction<ServerResponse> publicAirlineRoutes() {
        return routeWithoutCB("public-airline", "airline-core-service")
                .route(RequestPredicates.GET("/api/airlines/dropdown"), HandlerFunctions.http())
                .route(RequestPredicates.GET("/api/airlines/{id}/logo/file/{filename}"), HandlerFunctions.http())
                .filter(redisRateLimitFilter)
                .build();
    }

    @Bean
    @Order(0)
    public RouterFunction<ServerResponse> publicAncillaryMediaRoutes() {
        return routeWithoutCB("public-ancillary-media", "ancillary-service")
                .route(RequestPredicates.GET("/api/ancillaries/{id}/icon/file/{filename}"), HandlerFunctions.http())
                .route(RequestPredicates.GET("/api/meals/{id}/image/file/{filename}"), HandlerFunctions.http())
                .filter(redisRateLimitFilter)
                .build();
    }

    @Bean
    @Order(0)
    public RouterFunction<ServerResponse> publicMediaRoutes() {
        return routeWithoutCB("public-media", "media-service")
                .route(RequestPredicates.GET("/api/media/file/**"), HandlerFunctions.http())
                .filter(redisRateLimitFilter)
                .build();
    }

    @Bean
    @Order(0)
    public RouterFunction<ServerResponse> publicPricingRoutes() {
        return routeWithCB("public-pricing", "pricing-service", "pricing-service-cb", "forward:/fallback/pricing")
                .route(RequestPredicates.GET("/api/fares/flight/{flightId}/cabin-class/{cabinClassId}"), HandlerFunctions.http())
                .route(RequestPredicates.GET("/api/fares/lowest/flight/{flightId}/cabin-class/{cabinClassId}"), HandlerFunctions.http())
                .route(RequestPredicates.GET("/api/coupons/public/**"), HandlerFunctions.http())
                .filter(redisRateLimitFilter)
                .build();
    }

    // ==================== OPENAPI DOCS ====================

    @Bean
    @Order(0)
    public RouterFunction<ServerResponse> openApiDocsRoutes() {
        return GatewayRouterFunctions.route("openapi-docs")
                .route(RequestPredicates.path("/docs/user-service/**"), HandlerFunctions.http())
                .before(this::jwtAuthFilter)
                .before(req -> requireRole(req, UserRole.ROLE_SYSTEM_ADMIN.name()))
                .before(BeforeFilterFunctions.rewritePath("/docs/user-service/(?<segment>.*)", "/${segment}"))
                .filter(LoadBalancerFilterFunctions.lb("user-service"))
                .build()
                .and(GatewayRouterFunctions.route("notification-openapi-docs")
                        .route(RequestPredicates.path("/docs/notification-service/**"), HandlerFunctions.http())
                        .before(this::jwtAuthFilter)
                        .before(req -> requireRole(req, UserRole.ROLE_SYSTEM_ADMIN.name()))
                        .before(BeforeFilterFunctions.rewritePath("/docs/notification-service/(?<segment>.*)", "/${segment}"))
                        .filter(LoadBalancerFilterFunctions.lb("notification-service"))
                        .build())
                .and(GatewayRouterFunctions.route("location-openapi-docs")
                        .route(RequestPredicates.path("/docs/location-service/**"), HandlerFunctions.http())
                        .before(this::jwtAuthFilter)
                        .before(req -> requireRole(req, UserRole.ROLE_SYSTEM_ADMIN.name()))
                        .before(BeforeFilterFunctions.rewritePath("/docs/location-service/(?<segment>.*)", "/${segment}"))
                        .filter(LoadBalancerFilterFunctions.lb("location-service"))
                        .build())
                .and(GatewayRouterFunctions.route("airline-core-openapi-docs")
                        .route(RequestPredicates.path("/docs/airline-core-service/**"), HandlerFunctions.http())
                        .before(this::jwtAuthFilter)
                        .before(req -> requireRole(req, UserRole.ROLE_SYSTEM_ADMIN.name()))
                        .before(BeforeFilterFunctions.rewritePath("/docs/airline-core-service/(?<segment>.*)", "/${segment}"))
                        .filter(LoadBalancerFilterFunctions.lb("airline-core-service"))
                        .build())
                .and(GatewayRouterFunctions.route("booking-openapi-docs")
                        .route(RequestPredicates.path("/docs/booking-service/**"), HandlerFunctions.http())
                        .before(this::jwtAuthFilter)
                        .before(req -> requireRole(req, UserRole.ROLE_SYSTEM_ADMIN.name()))
                        .before(BeforeFilterFunctions.rewritePath("/docs/booking-service/(?<segment>.*)", "/${segment}"))
                        .filter(LoadBalancerFilterFunctions.lb("booking-service"))
                        .build())
                .and(GatewayRouterFunctions.route("flight-ops-openapi-docs")
                        .route(RequestPredicates.path("/docs/flight-ops-service/**"), HandlerFunctions.http())
                        .before(this::jwtAuthFilter)
                        .before(req -> requireRole(req, UserRole.ROLE_SYSTEM_ADMIN.name()))
                        .before(BeforeFilterFunctions.rewritePath("/docs/flight-ops-service/(?<segment>.*)", "/${segment}"))
                        .filter(LoadBalancerFilterFunctions.lb("flight-ops-service"))
                        .build())
                .and(GatewayRouterFunctions.route("seat-openapi-docs")
                        .route(RequestPredicates.path("/docs/seat-service/**"), HandlerFunctions.http())
                        .before(this::jwtAuthFilter)
                        .before(req -> requireRole(req, UserRole.ROLE_SYSTEM_ADMIN.name()))
                        .before(BeforeFilterFunctions.rewritePath("/docs/seat-service/(?<segment>.*)", "/${segment}"))
                        .filter(LoadBalancerFilterFunctions.lb("seat-service"))
                        .build())
                .and(GatewayRouterFunctions.route("pricing-openapi-docs")
                        .route(RequestPredicates.path("/docs/pricing-service/**"), HandlerFunctions.http())
                        .before(this::jwtAuthFilter)
                        .before(req -> requireRole(req, UserRole.ROLE_SYSTEM_ADMIN.name()))
                        .before(BeforeFilterFunctions.rewritePath("/docs/pricing-service/(?<segment>.*)", "/${segment}"))
                        .filter(LoadBalancerFilterFunctions.lb("pricing-service"))
                        .build())
                .and(GatewayRouterFunctions.route("ancillary-openapi-docs")
                        .route(RequestPredicates.path("/docs/ancillary-service/**"), HandlerFunctions.http())
                        .before(this::jwtAuthFilter)
                        .before(req -> requireRole(req, UserRole.ROLE_SYSTEM_ADMIN.name()))
                        .before(BeforeFilterFunctions.rewritePath("/docs/ancillary-service/(?<segment>.*)", "/${segment}"))
                        .filter(LoadBalancerFilterFunctions.lb("ancillary-service"))
                        .build())
                .and(GatewayRouterFunctions.route("payment-openapi-docs")
                        .route(RequestPredicates.path("/docs/payment-service/**"), HandlerFunctions.http())
                        .before(this::jwtAuthFilter)
                        .before(req -> requireRole(req, UserRole.ROLE_SYSTEM_ADMIN.name()))
                        .before(BeforeFilterFunctions.rewritePath("/docs/payment-service/(?<segment>.*)", "/${segment}"))
                        .filter(LoadBalancerFilterFunctions.lb("payment-service"))
                        .build())
                .and(GatewayRouterFunctions.route("media-openapi-docs")
                        .route(RequestPredicates.path("/docs/media-service/**"), HandlerFunctions.http())
                        .before(this::jwtAuthFilter)
                        .before(req -> requireRole(req, UserRole.ROLE_SYSTEM_ADMIN.name()))
                        .before(BeforeFilterFunctions.rewritePath("/docs/media-service/(?<segment>.*)", "/${segment}"))
                        .filter(LoadBalancerFilterFunctions.lb("media-service"))
                        .build());
    }

    // ==================== CORE ====================

    @Bean
    public RouterFunction<ServerResponse> userServiceRoutes() {
        return routeWithoutCB("user-service", "user-service")
                .route(RequestPredicates.path("/api/users/**"), HandlerFunctions.http())
                .before(this::jwtAuthFilter)
                .filter(redisRateLimitFilter) 
                .build();
    }

    @Bean
    @Order(0)
    public RouterFunction<ServerResponse> airlineAdminMutationRoutes() {
        return routeWithoutCB("airline-admin-mutations", "airline-core-service")
                .route(RequestPredicates.POST("/api/airlines/{id}/approve"), HandlerFunctions.http())
                .route(RequestPredicates.POST("/api/airlines/{id}/reject"), HandlerFunctions.http())
                .route(RequestPredicates.POST("/api/airlines/{id}/suspend"), HandlerFunctions.http())
                .route(RequestPredicates.POST("/api/airlines/{id}/ban"), HandlerFunctions.http())
                .before(this::jwtAuthFilter)
                .before(req -> requireRole(req, UserRole.ROLE_SYSTEM_ADMIN.name()))
                .filter(redisRateLimitFilter)
                .build();
    }

    @Bean
    @Order(1)
    public RouterFunction<ServerResponse> airlineOwnerMutationRoutes() {
        return routeWithoutCB("airline-owner-mutations", "airline-core-service")
                .route(RequestPredicates.POST("/api/airlines"), HandlerFunctions.http())
                .route(RequestPredicates.PUT("/api/airlines/**"), HandlerFunctions.http())
                .route(RequestPredicates.DELETE("/api/airlines/**"), HandlerFunctions.http())
                .route(RequestPredicates.POST("/api/aircrafts"), HandlerFunctions.http())
                .route(RequestPredicates.PUT("/api/aircrafts/**"), HandlerFunctions.http())
                .route(RequestPredicates.PATCH("/api/aircrafts/**"), HandlerFunctions.http())
                .route(RequestPredicates.DELETE("/api/aircrafts/**"), HandlerFunctions.http())
                .before(this::jwtAuthFilter)
                .before(req -> requireRole(req, UserRole.ROLE_AIRLINE_OWNER.name()))
                .filter(redisRateLimitFilter)
                .build();
    }

    @Bean
    @Order(3)
    public RouterFunction<ServerResponse> airlineCoreServiceRoutes() {
        return routeWithoutCB("airline-core", "airline-core-service")
                .route(RequestPredicates.path("/api/airlines/**"), HandlerFunctions.http())
                .route(RequestPredicates.path("/api/aircrafts/**"), HandlerFunctions.http())
                .before(this::jwtAuthFilter)
                .filter(redisRateLimitFilter) 
                .build();
    }

    @Bean
    public RouterFunction<ServerResponse> bookingServiceRoutes() {
        return routeWithoutCB("booking-service", "booking-service")
                .route(RequestPredicates.path("/api/bookings/**"), HandlerFunctions.http())
                .route(RequestPredicates.path("/api/tickets/**"), HandlerFunctions.http())
                .route(RequestPredicates.path("/api/passengers/**"), HandlerFunctions.http())
                .before(this::jwtAuthFilter)
                .filter(redisRateLimitFilter)
                .build();
    }

    @Bean
    @Order(0)
    public RouterFunction<ServerResponse> bookingSuperAdminRoutes() {
        RouterFunctions.Builder builder = routeWithoutCB("booking-super-admin", "booking-service");
        SYSTEM_ADMIN_BOOKING_ROUTES.forEach(path -> builder.route(RequestPredicates.GET(path), HandlerFunctions.http()));
        return builder
                .before(this::jwtAuthFilter)
                .before(req -> requireRole(req, UserRole.ROLE_SYSTEM_ADMIN.name()))
                .filter(redisRateLimitFilter)
                .build();
    }

    @Bean
    @Order(1)
    public RouterFunction<ServerResponse> bookingAirlineOwnerRoutes() {
        RouterFunctions.Builder builder = routeWithoutCB("booking-airline-owner", "booking-service");
        AIRLINE_OWNER_BOOKING_ROUTES.forEach(path -> builder.route(RequestPredicates.GET(path), HandlerFunctions.http()));
        return builder
                .before(this::jwtAuthFilter)
                .before(req -> requireRole(req, UserRole.ROLE_AIRLINE_OWNER.name()))
                .filter(redisRateLimitFilter)
                .build();
    }

    // ==================== OPTIONAL SERVICES ====================

    @Bean
    public RouterFunction<ServerResponse> locationRoutes() {
        return routeWithCB("location", "location-service", "location-cb", "forward:/fallback/location")
                .route(RequestPredicates.path("/api/airports/**"), HandlerFunctions.http())
                .route(RequestPredicates.path("/api/cities/**"), HandlerFunctions.http())
                .before(this::jwtAuthFilter)
                .filter(redisRateLimitFilter) 
                .build();
    }

    @Bean
    @Order(1)
    public RouterFunction<ServerResponse> seatMutationRoutes() {
        return routeWithCB("seat-mutations", "seat-service", "seat-cb", "forward:/fallback/seat")
                .route(RequestPredicates.POST("/api/cabin-classes"), HandlerFunctions.http())
                .route(RequestPredicates.POST("/api/cabin-classes/bulk"), HandlerFunctions.http())
                .route(RequestPredicates.PUT("/api/cabin-classes/**"), HandlerFunctions.http())
                .route(RequestPredicates.DELETE("/api/cabin-classes/**"), HandlerFunctions.http())
                .route(RequestPredicates.POST("/api/seat-maps"), HandlerFunctions.http())
                .route(RequestPredicates.POST("/api/seat-maps/bulk"), HandlerFunctions.http())
                .route(RequestPredicates.PUT("/api/seat-maps/**"), HandlerFunctions.http())
                .route(RequestPredicates.DELETE("/api/seat-maps/**"), HandlerFunctions.http())
                .route(RequestPredicates.PUT("/api/seats/**"), HandlerFunctions.http())
                .route(RequestPredicates.POST("/api/seat-instances"), HandlerFunctions.http())
                .route(RequestPredicates.PATCH("/api/seat-instances/**"), HandlerFunctions.http())
                .route(RequestPredicates.POST("/api/flight-instance-cabins"), HandlerFunctions.http())
                .route(RequestPredicates.PUT("/api/flight-instance-cabins/**"), HandlerFunctions.http())
                .route(RequestPredicates.DELETE("/api/flight-instance-cabins/**"), HandlerFunctions.http())
                .before(this::jwtAuthFilter)
                .before(req -> requireRole(req, UserRole.ROLE_AIRLINE_OWNER.name()))
                .filter(redisRateLimitFilter)
                .build();
    }

    @Bean
    @Order(3)
    public RouterFunction<ServerResponse> seatRoutes() {
        return routeWithCB("seat", "seat-service", "seat-cb", "forward:/fallback/seat")
                .route(RequestPredicates.path("/api/cabin-classes/**"), HandlerFunctions.http())
                .route(RequestPredicates.path("/api/seat-maps/**"), HandlerFunctions.http())
                .route(RequestPredicates.path("/api/seats/**"), HandlerFunctions.http())
                .route(RequestPredicates.path("/api/seat-instances/**"), HandlerFunctions.http())
                .route(RequestPredicates.path("/api/flight-instance-cabins/**"), HandlerFunctions.http())
                .before(this::jwtAuthFilter)
                .filter(redisRateLimitFilter) 
                .build();
    }

    @Bean
    @Order(0)
    public RouterFunction<ServerResponse> flightMutationRoutes() {
        return routeWithCB("flight-mutations", "flight-ops-service", "flight-cb", "forward:/fallback/flight")
                .route(RequestPredicates.POST("/api/flights"), HandlerFunctions.http())
                .route(RequestPredicates.POST("/api/flights/bulk"), HandlerFunctions.http())
                .route(RequestPredicates.PUT("/api/flights/**"), HandlerFunctions.http())
                .route(RequestPredicates.PATCH("/api/flights/**"), HandlerFunctions.http())
                .route(RequestPredicates.DELETE("/api/flights/**"), HandlerFunctions.http())
                .route(RequestPredicates.POST("/api/flight-schedules"), HandlerFunctions.http())
                .route(RequestPredicates.PUT("/api/flight-schedules/**"), HandlerFunctions.http())
                .route(RequestPredicates.DELETE("/api/flight-schedules/**"), HandlerFunctions.http())
                .route(RequestPredicates.POST("/api/flight-instances"), HandlerFunctions.http())
                .route(RequestPredicates.PUT("/api/flight-instances/**"), HandlerFunctions.http())
                .route(RequestPredicates.PATCH("/api/flight-instances/**"), HandlerFunctions.http())
                .route(RequestPredicates.DELETE("/api/flight-instances/**"), HandlerFunctions.http())
                .before(this::jwtAuthFilter)
                .before(req -> requireRole(req, UserRole.ROLE_AIRLINE_OWNER.name()))
                .filter(redisRateLimitFilter)
                .build();
    }

    @Bean
    @Order(3)
    public RouterFunction<ServerResponse> flightRoutes() {
        return routeWithCB("flight", "flight-ops-service", "flight-cb", "forward:/fallback/flight")
                .route(RequestPredicates.path("/api/flights/**"), HandlerFunctions.http())
                .route(RequestPredicates.path("/api/flight-schedules/**"), HandlerFunctions.http())
                .route(RequestPredicates.path("/api/flight-instances/**"), HandlerFunctions.http())
                .before(this::jwtAuthFilter)
                .filter(redisRateLimitFilter) 
                .build();
    }

    @Bean
    @Order(0)
    public RouterFunction<ServerResponse> ancillaryMutationRoutes() {
        return routeWithCB("ancillary-mutations", "ancillary-service", "ancillary-service-cb", "forward:/fallback/ancillary")
                .route(RequestPredicates.POST("/api/ancillaries"), HandlerFunctions.http())
                .route(RequestPredicates.PUT("/api/ancillaries/**"), HandlerFunctions.http())
                .route(RequestPredicates.PATCH("/api/ancillaries/**"), HandlerFunctions.http())
                .route(RequestPredicates.DELETE("/api/ancillaries/**"), HandlerFunctions.http())
                .route(RequestPredicates.POST("/api/meals"), HandlerFunctions.http())
                .route(RequestPredicates.POST("/api/meals/bulk"), HandlerFunctions.http())
                .route(RequestPredicates.PUT("/api/meals/**"), HandlerFunctions.http())
                .route(RequestPredicates.PATCH("/api/meals/**"), HandlerFunctions.http())
                .route(RequestPredicates.DELETE("/api/meals/**"), HandlerFunctions.http())
                .route(RequestPredicates.POST("/api/flight-meals"), HandlerFunctions.http())
                .route(RequestPredicates.POST("/api/flight-meals/bulk"), HandlerFunctions.http())
                .route(RequestPredicates.PUT("/api/flight-meals/**"), HandlerFunctions.http())
                .route(RequestPredicates.PATCH("/api/flight-meals/**"), HandlerFunctions.http())
                .route(RequestPredicates.DELETE("/api/flight-meals/**"), HandlerFunctions.http())
                .route(RequestPredicates.POST("/api/flight-cabin-ancillaries"), HandlerFunctions.http())
                .route(RequestPredicates.POST("/api/flight-cabin-ancillaries/bulk"), HandlerFunctions.http())
                .route(RequestPredicates.PUT("/api/flight-cabin-ancillaries/**"), HandlerFunctions.http())
                .route(RequestPredicates.PATCH("/api/flight-cabin-ancillaries/**"), HandlerFunctions.http())
                .route(RequestPredicates.DELETE("/api/flight-cabin-ancillaries/**"), HandlerFunctions.http())
                .route(RequestPredicates.POST("/api/insurance-coverages"), HandlerFunctions.http())
                .route(RequestPredicates.POST("/api/insurance-coverages/bulk"), HandlerFunctions.http())
                .route(RequestPredicates.PUT("/api/insurance-coverages/**"), HandlerFunctions.http())
                .route(RequestPredicates.PATCH("/api/insurance-coverages/**"), HandlerFunctions.http())
                .route(RequestPredicates.DELETE("/api/insurance-coverages/**"), HandlerFunctions.http())
                .before(this::jwtAuthFilter)
                .before(req -> requireRole(req, UserRole.ROLE_AIRLINE_OWNER.name()))
                .filter(redisRateLimitFilter)
                .build();
    }

    @Bean
    @Order(3)
    public RouterFunction<ServerResponse> ancillaryRoutes() {
        return routeWithCB("ancillary", "ancillary-service", "ancillary-service-cb", "forward:/fallback/ancillary")
                .route(RequestPredicates.path("/api/ancillaries/**"), HandlerFunctions.http())
                .route(RequestPredicates.path("/api/meals/**"), HandlerFunctions.http())
                .route(RequestPredicates.path("/api/flight-meals/**"), HandlerFunctions.http())
                .route(RequestPredicates.path("/api/flight-cabin-ancillaries/**"), HandlerFunctions.http())
                .route(RequestPredicates.path("/api/insurance-coverages/**"), HandlerFunctions.http())
                .before(this::jwtAuthFilter)
                .filter(redisRateLimitFilter) 
                .build();
    }

    @Bean
    @Order(0)
    public RouterFunction<ServerResponse> pricingMutationRoutes() {
        return routeWithCB("pricing-mutations", "pricing-service", "pricing-service-cb", "forward:/fallback/pricing")
                .route(RequestPredicates.POST("/api/fares"), HandlerFunctions.http())
                .route(RequestPredicates.POST("/api/fares/bulk"), HandlerFunctions.http())
                .route(RequestPredicates.PUT("/api/fares/**"), HandlerFunctions.http())
                .route(RequestPredicates.DELETE("/api/fares/**"), HandlerFunctions.http())
                .route(RequestPredicates.POST("/api/fare-rules"), HandlerFunctions.http())
                .route(RequestPredicates.PUT("/api/fare-rules/**"), HandlerFunctions.http())
                .route(RequestPredicates.DELETE("/api/fare-rules/**"), HandlerFunctions.http())
                .route(RequestPredicates.POST("/api/baggage-policies"), HandlerFunctions.http())
                .route(RequestPredicates.PUT("/api/baggage-policies/**"), HandlerFunctions.http())
                .route(RequestPredicates.DELETE("/api/baggage-policies/**"), HandlerFunctions.http())
                .route(RequestPredicates.POST("/api/coupons"), HandlerFunctions.http())
                .route(RequestPredicates.PUT("/api/coupons/**"), HandlerFunctions.http())
                .route(RequestPredicates.DELETE("/api/coupons/**"), HandlerFunctions.http())
                .before(this::jwtAuthFilter)
                .before(req -> requireRole(req, UserRole.ROLE_AIRLINE_OWNER.name()))
                .filter(redisRateLimitFilter)
                .build();
    }

    @Bean
    @Order(3)
    public RouterFunction<ServerResponse> pricingRoutes() {
        return routeWithCB("pricing", "pricing-service", "pricing-service-cb", "forward:/fallback/pricing")
                .route(RequestPredicates.path("/api/fares/**"), HandlerFunctions.http())
                .route(RequestPredicates.path("/api/fare-rules/**"), HandlerFunctions.http())
                .route(RequestPredicates.path("/api/baggage-policies/**"), HandlerFunctions.http())
                .route(RequestPredicates.path("/api/coupons/**"), HandlerFunctions.http())
                .before(this::jwtAuthFilter)
                .filter(redisRateLimitFilter)
                .build();
    }

    @Bean
    @Order(1)
    public RouterFunction<ServerResponse> paymentAdminRoutes() {
        return routeWithCB("payment-admin", "payment-service", "payment-service-cb", "forward:/fallback/payment")
                .route(RequestPredicates.POST("/api/payments/{paymentId}/refund"), HandlerFunctions.http())
                .route(RequestPredicates.GET("/api/payments"), HandlerFunctions.http())
                .before(this::jwtAuthFilter)
                .before(req -> requireRole(req, UserRole.ROLE_SYSTEM_ADMIN.name()))
                .filter(redisRateLimitFilter)
                .build();
    }

    @Bean
    @Order(3)
    public RouterFunction<ServerResponse> paymentRoutes() {
        return routeWithCB("payment", "payment-service", "payment-service-cb", "forward:/fallback/payment")
                .route(RequestPredicates.path("/api/payments/**"), HandlerFunctions.http())
                .before(this::jwtAuthFilter)
                .filter(redisRateLimitFilter) 
                .build();
    }

    @Bean
    @Order(3)
    public RouterFunction<ServerResponse> mediaRoutes() {
        return routeWithoutCB("media", "media-service")
                .route(RequestPredicates.path("/api/media/**"), HandlerFunctions.http())
                .before(this::jwtAuthFilter)
                .filter(redisRateLimitFilter)
                .build();
    }

    @Bean
    @Order(2)
    public RouterFunction<ServerResponse> mediaAdminRoutes() {
        RouterFunctions.Builder builder = routeWithoutCB("media-admin", "media-service");
        SYSTEM_ADMIN_MEDIA_ROUTES.forEach(path -> builder.route(RequestPredicates.GET(path), HandlerFunctions.http()));
        return builder
                .route(RequestPredicates.DELETE("/api/media/**"), HandlerFunctions.http())
                .before(this::jwtAuthFilter)
                .before(req -> requireRole(req, UserRole.ROLE_SYSTEM_ADMIN.name()))
                .filter(redisRateLimitFilter)
                .build();
    }

    @Bean
    @Order(2)
    public RouterFunction<ServerResponse> ticketStaffRoutes() {
        return routeWithoutCB("ticket-staff", "booking-service")
                .route(RequestPredicates.PUT("/api/tickets/{ticketId}/use"), HandlerFunctions.http())
                .before(this::jwtAuthFilter)
                .before(req -> requireRole(req, UserRole.ROLE_AIRLINE_OWNER.name()))
                .filter(redisRateLimitFilter)
                .build()
                .and(routeWithoutCB("ticket-refund-admin", "booking-service")
                        .route(RequestPredicates.PUT("/api/tickets/{ticketId}/refund"), HandlerFunctions.http())
                        .before(this::jwtAuthFilter)
                        .before(req -> requireRole(req, UserRole.ROLE_SYSTEM_ADMIN.name()))
                        .filter(redisRateLimitFilter)
                        .build());
    }

    @Bean
    @Order(2)
    public RouterFunction<ServerResponse> notificationRoutes() {
        return routeWithoutCB("notification", "notification-service")
                .route(RequestPredicates.path("/api/notifications/**"), HandlerFunctions.http())
                .before(this::jwtAuthFilter)
                .filter(redisRateLimitFilter)
                .before(req -> requireRole(req, UserRole.ROLE_SYSTEM_ADMIN.name()))
                .build();
    }

    // ==================== ADMIN ====================

    @Bean
    @Order(0)
    public RouterFunction<ServerResponse> adminRoutes() {
        return routeWithoutCB("admin", "location-service")
                .route(RequestPredicates.POST("/api/cities/**"), HandlerFunctions.http())
                .route(RequestPredicates.POST("/api/airports/**"), HandlerFunctions.http())
                .route(RequestPredicates.PUT("/api/cities/**"), HandlerFunctions.http())
                .route(RequestPredicates.PUT("/api/airports/**"), HandlerFunctions.http())
                .route(RequestPredicates.PATCH("/api/cities/**"), HandlerFunctions.http())
                .route(RequestPredicates.PATCH("/api/airports/**"), HandlerFunctions.http())
                .route(RequestPredicates.DELETE("/api/cities/**"), HandlerFunctions.http())
                .route(RequestPredicates.DELETE("/api/airports/**"), HandlerFunctions.http())
                .before(this::jwtAuthFilter)
                .filter(redisRateLimitFilter) 
                .before(req -> requireRole(req, UserRole.ROLE_SYSTEM_ADMIN.name()))
                .build();
    }

    // ==================== JWT FILTER ====================

    private ServerRequest jwtAuthFilter(ServerRequest request) {

        String authHeader = request.headers().firstHeader(JwtConstant.JWT_HEADER);

        if (authHeader == null || !authHeader.startsWith(JwtConstant.TOKEN_PREFIX)) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Missing Authorization");
        }

        String token = authHeader.substring(JwtConstant.TOKEN_PREFIX.length());

        // =========================
        // PARSE TOKEN (ONCE)
        // =========================
        Claims claims = jwtUtil.safeExtractClaims(token);

        if (claims == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid token");
        }

        // =========================
        // CHECK BLACKLIST
        // =========================
        if (blacklistService.isBlacklisted(token)) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Token revoked");
        }

        // =========================
        // CHECK EXPIRED
        // =========================
        if (jwtUtil.isTokenExpired(claims)) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Token expired");
        }

        if (!JwtConstant.ACCESS_TOKEN.equals(jwtUtil.extractTokenType(claims))) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Access token required");
        }

        // =========================
        // EXTRACT USER INFO
        // =========================
        String email = jwtUtil.extractEmail(claims);
        String roles = jwtUtil.extractAuthorities(claims);
        Long userId = jwtUtil.extractUserId(claims);
        Integer tokenVersion = jwtUtil.extractTokenVersion(claims);

        if (userId == null || tokenVersion == null || email == null || email.isBlank()) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid token claims");
        }

        // =========================
        // CRITICAL SECURITY CHECK
        // =========================
        Integer currentVersion;

        try {
            currentVersion = userServiceClient.getTokenVersion(userId);
        } catch (Exception ex) {
            log.error("AUTH_FAIL type=USER_SERVICE_DOWN userId={} error={}", userId, ex.getMessage());
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "User service unavailable");
        }

        if (currentVersion == null || !currentVersion.equals(tokenVersion)) {

            log.warn(
                "AUTH_FAIL type=TOKEN_INVALIDATED userId={} tokenVersion={} currentVersion={} ip={} uri={}",
                userId,
                tokenVersion,
                currentVersion,
                request.servletRequest().getRemoteAddr(),
                request.uri()
            );

            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Token invalidated");
        }

        // =========================
        // INJECT HEADERS (ANTI SPOOF)
        // =========================
        return ServerRequest.from(request)
                .headers(headers -> {
                    headers.remove("X-User-Email");
                    headers.remove("X-User-Id");
                    headers.remove("X-User-Roles");
                    headers.remove("X-Trace-Id");
                    headers.remove("X-Internal-Secret");
                })
                .header("X-User-Email", email)
                .header("X-User-Id", String.valueOf(userId))
                .header("X-User-Roles", roles)
                .header("X-Trace-Id", currentTraceId())
                .build();
    }

    private ServerRequest requireRole(ServerRequest request, String role) {
        String roles = request.headers().firstHeader("X-User-Roles");

        if (!hasRole(roles, role)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Access denied");
        }

        return request;
    }

    static boolean hasRole(String roles, String requiredRole) {
        if (roles == null || requiredRole == null) {
            return false;
        }
        return java.util.Arrays.stream(roles.split(","))
                .map(String::trim)
                .anyMatch(requiredRole::equals);
    }

    private String currentTraceId() {
        String traceId = MDC.get(com.triquang.config.TraceIdFilter.TRACE_ID);
        return traceId != null && !traceId.isBlank() ? traceId : UUID.randomUUID().toString();
    }

}
