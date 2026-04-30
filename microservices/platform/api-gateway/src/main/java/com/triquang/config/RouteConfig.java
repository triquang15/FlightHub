package com.triquang.config;

import java.net.URI;

import org.springframework.cloud.gateway.server.mvc.filter.CircuitBreakerFilterFunctions;
import org.springframework.cloud.gateway.server.mvc.filter.LoadBalancerFilterFunctions;
import org.springframework.cloud.gateway.server.mvc.handler.GatewayRouterFunctions;
import org.springframework.cloud.gateway.server.mvc.handler.HandlerFunctions;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.annotation.Order;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.web.servlet.function.RequestPredicates;
import org.springframework.web.servlet.function.RouterFunction;
import org.springframework.web.servlet.function.RouterFunctions;
import org.springframework.web.servlet.function.ServerRequest;
import org.springframework.web.servlet.function.ServerResponse;

import com.triquang.enums.UserRole;
import com.triquang.service.TokenBlacklistService;

@Configuration
public class RouteConfig {

    private final JwtUtil jwtUtil;
    private final TokenBlacklistService blacklistService;

    public RouteConfig(JwtUtil jwtUtil, TokenBlacklistService blacklistService) {
        this.jwtUtil = jwtUtil;
        this.blacklistService = blacklistService;
    }

    // ==================== COMMON BUILDER ====================

    private RouterFunctions.Builder routeBuilder(String routeName, String serviceName, String cbName) {
        return GatewayRouterFunctions.route(routeName)
                .filter(LoadBalancerFilterFunctions.lb(serviceName))
                .filter(CircuitBreakerFilterFunctions.circuitBreaker(cbName, URI.create("forward:/fallback")));
    }

    // ==================== Public routes ====================

    @Bean
    public RouterFunction<ServerResponse> authRoutes() {
        return routeBuilder("auth-routes", "user-service", "user-service-cb")
                .route(RequestPredicates.path("/auth/**"), HandlerFunctions.http())
                .build();
    }

    // ==================== Admin-only routes ====================

    @Bean
    @Order(1)
    public RouterFunction<ServerResponse> adminLocationServiceRoutes() {
        return routeBuilder("admin-location-routes", "location-service", "location-service-cb")
                .route(RequestPredicates.POST("/api/cities/**"), HandlerFunctions.http())
                .route(RequestPredicates.POST("/api/airports/**"), HandlerFunctions.http())
                .before(this::jwtAuthFilter)
                .before(request -> requireRole(request, UserRole.ROLE_SYSTEM_ADMIN.toString()))
                .build();
    }

    @Bean
    @Order(1)
    public RouterFunction<ServerResponse> adminAirlineCoreServiceRoutes() {
        return routeBuilder("admin-airline-core-routes", "airline-core-service", "airline-core-service-cb")
                .route(RequestPredicates.GET("/api/airlines"), HandlerFunctions.http())
                .before(this::jwtAuthFilter)
                .before(request -> requireRole(request, UserRole.ROLE_SYSTEM_ADMIN.toString()))
                .build();
    }

    // ==================== Protected routes ====================

    @Bean
    public RouterFunction<ServerResponse> userServiceRoutes() {
        return routeBuilder("user-service-routes", "user-service", "user-service-cb")
                .route(RequestPredicates.path("/api/users/**"), HandlerFunctions.http())
                .before(this::jwtAuthFilter)
                .build();
    }

    @Bean
    @Order(2)
    public RouterFunction<ServerResponse> airlineCoreServiceRoutes() {
        return routeBuilder("airline-core-routes", "airline-core-service", "airline-core-service-cb")
                .route(RequestPredicates.path("/api/airlines/**"), HandlerFunctions.http())
                .route(RequestPredicates.path("/api/aircrafts/**"), HandlerFunctions.http())
                .before(this::jwtAuthFilter)
                .build();
    }

    @Bean
    public RouterFunction<ServerResponse> seatServiceRoutes() {
        return routeBuilder("seat-service-routes", "seat-service", "seat-service-cb")
                .route(RequestPredicates.path("/api/cabin-classes/**"), HandlerFunctions.http())
                .route(RequestPredicates.path("/api/seat-maps/**"), HandlerFunctions.http())
                .route(RequestPredicates.path("/api/seats/**"), HandlerFunctions.http())
                .route(RequestPredicates.path("/api/seat-instances/**"), HandlerFunctions.http())
                .route(RequestPredicates.path("/api/flight-instance-cabins/**"), HandlerFunctions.http())
                .before(this::jwtAuthFilter)
                .build();
    }

    @Bean
    public RouterFunction<ServerResponse> flightOpsServiceRoutes() {
        return routeBuilder("flight-ops-routes", "flight-ops-service", "flight-ops-service-cb")
                .route(RequestPredicates.path("/api/flights/**"), HandlerFunctions.http())
                .route(RequestPredicates.path("/api/flight-instances/**"), HandlerFunctions.http())
                .route(RequestPredicates.path("/api/flight-schedules/**"), HandlerFunctions.http())
                .before(this::jwtAuthFilter)
                .build();
    }

    @Bean
    public RouterFunction<ServerResponse> pricingServiceRoutes() {
        return routeBuilder("pricing-service-routes", "pricing-service", "pricing-service-cb")
                .route(RequestPredicates.path("/api/fares/**"), HandlerFunctions.http())
                .route(RequestPredicates.path("/api/fare-rules/**"), HandlerFunctions.http())
                .route(RequestPredicates.path("/api/baggage-policies/**"), HandlerFunctions.http())
                .before(this::jwtAuthFilter)
                .build();
    }

    @Bean
    public RouterFunction<ServerResponse> ancillaryServiceRoutes() {
        return routeBuilder("ancillary-service-routes", "ancillary-service", "ancillary-service-cb")
                .route(RequestPredicates.path("/api/meals/**"), HandlerFunctions.http())
                .route(RequestPredicates.path("/api/ancillaries/**"), HandlerFunctions.http())
                .route(RequestPredicates.path("/api/insurance-coverages/**"), HandlerFunctions.http())
                .route(RequestPredicates.path("/api/flight-meals/**"), HandlerFunctions.http())
                .route(RequestPredicates.path("/api/flight-cabin-ancillaries/**"), HandlerFunctions.http())
                .before(this::jwtAuthFilter)
                .build();
    }

    @Bean
    @Order(2)
    public RouterFunction<ServerResponse> locationServiceRoutes() {
        return routeBuilder("location-service-routes", "location-service", "location-service-cb")
                .route(RequestPredicates.path("/api/cities/**"), HandlerFunctions.http())
                .route(RequestPredicates.path("/api/airports/**"), HandlerFunctions.http())
                .before(this::jwtAuthFilter)
                .build();
    }

    @Bean
    public RouterFunction<ServerResponse> bookingServiceRoutes() {
        return routeBuilder("booking-service-routes", "booking-service", "booking-service-cb")
                .route(RequestPredicates.path("/api/bookings/**"), HandlerFunctions.http())
                .before(this::jwtAuthFilter)
                .build();
    }

    @Bean
    public RouterFunction<ServerResponse> paymentServiceRoutes() {
        return routeBuilder("payment-service-routes", "payment-service", "payment-service-cb")
                .route(RequestPredicates.path("/api/payments/**"), HandlerFunctions.http())
                .before(this::jwtAuthFilter)
                .build();
    }

    // ==================== JWT filter ====================

    private ServerRequest jwtAuthFilter(ServerRequest request) {
        String authHeader = request.headers().firstHeader(JwtConstant.JWT_HEADER);

        if (authHeader == null || !authHeader.startsWith(JwtConstant.TOKEN_PREFIX)) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED,
                    "Missing or invalid Authorization header");
        }

        String token = authHeader.substring(JwtConstant.TOKEN_PREFIX.length());

        if (!jwtUtil.isTokenValid(token)) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED,
                    "Invalid or expired JWT token");
        }

        if (blacklistService.isBlacklisted(token)) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED,
                    "Token has been revoked. Please log in again.");
        }

        String email = jwtUtil.extractEmail(token);
        String authorities = jwtUtil.extractAuthorities(token);
        Long userId = jwtUtil.extractUserId(token);

        return ServerRequest.from(request)
                .header("X-User-Id", String.valueOf(userId))
                .header("X-User-Email", email)
                .header("X-User-Roles", authorities)
                .build();
    }

    private ServerRequest requireRole(ServerRequest request, String role) {
        String roles = request.headers().firstHeader("X-User-Roles");
        if (roles == null || !roles.contains(role)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                    "Access denied. Required role: " + role);
        }
        return request;
    }
}