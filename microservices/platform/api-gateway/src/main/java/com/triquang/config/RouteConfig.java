package com.triquang.config;

import java.net.URI;
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
    public RouterFunction<ServerResponse> authRoutes() {
        return routeWithoutCB("auth-routes", "user-service")
                .route(RequestPredicates.path("/api/auth/**"), HandlerFunctions.http())
                .route(RequestPredicates.POST("/api/users/forgot-password"), HandlerFunctions.http())
                .route(RequestPredicates.POST("/api/users/reset-password"), HandlerFunctions.http())
                .filter(redisRateLimitFilter)
                .build();
    }

    // ==================== OPENAPI DOCS ====================

    @Bean
    @Order(0)
    public RouterFunction<ServerResponse> openApiDocsRoutes() {
        return GatewayRouterFunctions.route("openapi-docs")
                .route(RequestPredicates.path("/docs/user-service/**"), HandlerFunctions.http())
                .before(BeforeFilterFunctions.rewritePath("/docs/user-service/(?<segment>.*)", "/${segment}"))
                .filter(LoadBalancerFilterFunctions.lb("user-service"))
                .build()
                .and(GatewayRouterFunctions.route("notification-openapi-docs")
                        .route(RequestPredicates.path("/docs/notification-service/**"), HandlerFunctions.http())
                        .before(BeforeFilterFunctions.rewritePath("/docs/notification-service/(?<segment>.*)", "/${segment}"))
                        .filter(LoadBalancerFilterFunctions.lb("notification-service"))
                        .build())
                .and(GatewayRouterFunctions.route("location-openapi-docs")
                        .route(RequestPredicates.path("/docs/location-service/**"), HandlerFunctions.http())
                        .before(BeforeFilterFunctions.rewritePath("/docs/location-service/(?<segment>.*)", "/${segment}"))
                        .filter(LoadBalancerFilterFunctions.lb("location-service"))
                        .build())
                .and(GatewayRouterFunctions.route("airline-core-openapi-docs")
                        .route(RequestPredicates.path("/docs/airline-core-service/**"), HandlerFunctions.http())
                        .before(BeforeFilterFunctions.rewritePath("/docs/airline-core-service/(?<segment>.*)", "/${segment}"))
                        .filter(LoadBalancerFilterFunctions.lb("airline-core-service"))
                        .build())
                .and(GatewayRouterFunctions.route("booking-openapi-docs")
                        .route(RequestPredicates.path("/docs/booking-service/**"), HandlerFunctions.http())
                        .before(BeforeFilterFunctions.rewritePath("/docs/booking-service/(?<segment>.*)", "/${segment}"))
                        .filter(LoadBalancerFilterFunctions.lb("booking-service"))
                        .build())
                .and(GatewayRouterFunctions.route("flight-ops-openapi-docs")
                        .route(RequestPredicates.path("/docs/flight-ops-service/**"), HandlerFunctions.http())
                        .before(BeforeFilterFunctions.rewritePath("/docs/flight-ops-service/(?<segment>.*)", "/${segment}"))
                        .filter(LoadBalancerFilterFunctions.lb("flight-ops-service"))
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
    @Order(2)
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
    public RouterFunction<ServerResponse> seatRoutes() {
        return routeWithCB("seat", "seat-service", "seat-cb", "forward:/fallback/seat")
                .route(RequestPredicates.path("/api/seats/**"), HandlerFunctions.http())
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
    public RouterFunction<ServerResponse> ancillaryRoutes() {
        return routeWithCB("ancillary", "ancillary-service", "ancillary-cb", "forward:/fallback/ancillary")
                .route(RequestPredicates.path("/api/ancillaries/**"), HandlerFunctions.http())
                .before(this::jwtAuthFilter)
                .filter(redisRateLimitFilter) 
                .build();
    }

    @Bean
    public RouterFunction<ServerResponse> paymentRoutes() {
        return routeWithCB("payment", "payment-service", "payment-cb", "forward:/fallback/payment")
                .route(RequestPredicates.path("/api/payments/**"), HandlerFunctions.http())
                .before(this::jwtAuthFilter)
                .filter(redisRateLimitFilter) 
                .build();
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
    @Order(1)
    public RouterFunction<ServerResponse> adminRoutes() {
        return routeWithoutCB("admin", "location-service")
                .route(RequestPredicates.POST("/api/cities/**"), HandlerFunctions.http())
                .route(RequestPredicates.POST("/api/airports/**"), HandlerFunctions.http())
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

        // =========================
        // EXTRACT USER INFO
        // =========================
        String email = jwtUtil.extractEmail(claims);
        String roles = jwtUtil.extractAuthorities(claims);
        Long userId = jwtUtil.extractUserId(claims);
        Integer tokenVersion = jwtUtil.extractTokenVersion(claims);

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
                })
                .header("X-User-Email", email)
                .header("X-User-Id", String.valueOf(userId))
                .header("X-User-Roles", roles)
                .header("X-Trace-Id", UUID.randomUUID().toString())
                .build();
    }

    private ServerRequest requireRole(ServerRequest request, String role) {
        String roles = request.headers().firstHeader("X-User-Roles");

        if (roles == null || !roles.contains(role)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Access denied");
        }

        return request;
    }

}
