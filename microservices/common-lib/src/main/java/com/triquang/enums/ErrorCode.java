package com.triquang.enums;

import lombok.Getter;
import org.springframework.http.HttpStatus;

/**
 * Centralized error codes for consistent error handling across the application.
 */

@Getter
public enum ErrorCode {

    // =========================
    // SYSTEM
    // =========================
    INTERNAL_ERROR("SYS_001", "Internal server error", HttpStatus.INTERNAL_SERVER_ERROR),
    INVALID_INPUT("SYS_002", "Invalid input data", HttpStatus.BAD_REQUEST),

    // =========================
    // USER
    // =========================
    USER_NOT_FOUND("USR_001", "User not found", HttpStatus.NOT_FOUND),
    EMAIL_ALREADY_EXISTS("USR_002", "Email already exists", HttpStatus.BAD_REQUEST),
    INVALID_CREDENTIALS("USR_003", "Invalid email or password", HttpStatus.UNAUTHORIZED),

    // =========================
    // AUTH
    // =========================
    INVALID_TOKEN("AUTH_001", "Invalid token", HttpStatus.UNAUTHORIZED),
    INVALID_REFRESH_TOKEN("AUTH_002", "Invalid refresh token", HttpStatus.UNAUTHORIZED),
    ACCESS_DENIED("AUTH_003", "Access denied", HttpStatus.FORBIDDEN),

    // =========================
    // CITY
    // =========================
    CITY_NOT_FOUND("CITY_001", "City not found", HttpStatus.NOT_FOUND),
    CITY_ALREADY_EXISTS("CITY_002", "City already exists", HttpStatus.BAD_REQUEST),
    INVALID_CITY_CODE("CITY_003", "Invalid city code", HttpStatus.BAD_REQUEST),
    INVALID_COUNTRY_CODE("CITY_004", "Invalid country code", HttpStatus.BAD_REQUEST),
    INVALID_TIMEZONE_OFFSET("CITY_005", "Invalid timezone offset", HttpStatus.BAD_REQUEST),

    // =========================
    // AIRPORT
    // =========================
    AIRPORT_NOT_FOUND("APT_001", "Airport not found", HttpStatus.NOT_FOUND),
    AIRPORT_ALREADY_EXISTS("APT_002", "Airport already exists", HttpStatus.BAD_REQUEST),

    // =========================
    // AIRLINE
    // =========================
    AIRLINE_NOT_FOUND("ALN_001", "Airline not found", HttpStatus.NOT_FOUND),

    // =========================
    // AIRCRAFT
    // =========================
    AIRCRAFT_NOT_FOUND("AIR_001", "Aircraft not found", HttpStatus.NOT_FOUND),
    AIRCRAFT_ALREADY_EXISTS("AIR_002", "Aircraft already exists", HttpStatus.BAD_REQUEST),
    INVALID_AIRCRAFT_DATA("AIR_003", "Invalid aircraft data", HttpStatus.BAD_REQUEST),

    // =========================
    // FLIGHT
    // =========================
    FLIGHT_NOT_FOUND("FLT_001", "Flight not found", HttpStatus.NOT_FOUND),
    FLIGHT_ALREADY_EXISTS("FLT_002", "Flight already exists", HttpStatus.BAD_REQUEST),
    FLIGHT_INSTANCE_NOT_FOUND("FLT_003", "Flight instance not found", HttpStatus.NOT_FOUND),

    // =========================
    // EXTERNAL SERVICE (Feign)
    // =========================
    EXTERNAL_SERVICE_ERROR("EXT_001", "External service error", HttpStatus.BAD_GATEWAY),
    AIRLINE_SERVICE_UNAVAILABLE("EXT_002", "Airline service is unavailable", HttpStatus.SERVICE_UNAVAILABLE),
    AIRCRAFT_SERVICE_UNAVAILABLE("EXT_003", "Aircraft service is unavailable", HttpStatus.SERVICE_UNAVAILABLE),

    // =========================
    // FARE
    // =========================
    FARE_NOT_FOUND("FAR_001", "Fare not found", HttpStatus.NOT_FOUND),
    FARE_ALREADY_EXISTS("FAR_002", "Fare already exists", HttpStatus.BAD_REQUEST),

    // =========================
    // FARE RULES
    // =========================
    FARE_RULE_NOT_FOUND("FR_001", "Fare rule not found", HttpStatus.NOT_FOUND),
    FARE_RULE_ALREADY_EXISTS("FR_002", "Fare rule already exists", HttpStatus.BAD_REQUEST),

    // =========================
    // BAGGAGE POLICY
    // =========================
    BAGGAGE_POLICY_NOT_FOUND("BAG_001", "Baggage policy not found", HttpStatus.NOT_FOUND),
    BAGGAGE_POLICY_ALREADY_EXISTS("BAG_002", "Baggage policy already exists", HttpStatus.BAD_REQUEST),

    // =========================
    // ANCILLARY
    // =========================
    ANCILLARY_NOT_FOUND("ANC_001", "Ancillary not found", HttpStatus.NOT_FOUND),

    // =========================
    // FLIGHT CABIN ANCILLARY
    // =========================
    FLIGHT_CABIN_ANCILLARY_NOT_FOUND("FCA_001", "Flight cabin ancillary not found", HttpStatus.NOT_FOUND),

    // =========================
    // MEAL
    // =========================
    MEAL_NOT_FOUND("MEA_001", "Meal not found", HttpStatus.NOT_FOUND),
    MEAL_ALREADY_EXISTS("MEA_002", "Meal already exists", HttpStatus.BAD_REQUEST),

    // =========================
    // FLIGHT MEAL
    // =========================
    FLIGHT_MEAL_NOT_FOUND("FML_001", "Flight meal not found", HttpStatus.NOT_FOUND),
    FLIGHT_MEAL_ALREADY_EXISTS("FML_002", "Flight meal already exists", HttpStatus.BAD_REQUEST),

    // =========================
    // INSURANCE COVERAGE
    // =========================
    INSURANCE_COVERAGE_NOT_FOUND("INS_001", "Insurance coverage not found", HttpStatus.NOT_FOUND),
    INSURANCE_COVERAGE_INVALID_REQUEST("INS_002", "Invalid insurance coverage request", HttpStatus.BAD_REQUEST),

    // =========================
    // CABIN CLASS
    // =========================
    CABIN_CLASS_NOT_FOUND("CAB_001", "Cabin class not found", HttpStatus.NOT_FOUND),
    CABIN_CLASS_ALREADY_EXISTS("CAB_002", "Cabin class already exists", HttpStatus.BAD_REQUEST),

    // =========================
    // SEAT MAP
    // =========================
    SEAT_MAP_NOT_FOUND("STM_001", "Seat map not found", HttpStatus.NOT_FOUND),
    SEAT_MAP_ALREADY_EXISTS("STM_002", "Seat map already exists", HttpStatus.BAD_REQUEST),
    SEAT_NOT_FOUND("STM_003", "Seat not found", HttpStatus.NOT_FOUND),
    SEAT_ALREADY_GENERATED("STM_004", "Seats already generated", HttpStatus.BAD_REQUEST),
    SEAT_MAP_EMPTY("STM_005", "Seat map is empty", HttpStatus.BAD_REQUEST),

    // =========================
    // FLIGHT INSTANCE CABIN
    // =========================
    FLIGHT_INSTANCE_CABIN_NOT_FOUND("FIC_001", "Flight instance cabin not found", HttpStatus.NOT_FOUND),

    // =========================
    // BOOKING
    // =========================
    BOOKING_NOT_FOUND("BKG_001", "Booking not found", HttpStatus.NOT_FOUND),
    BOOKING_ALREADY_EXISTS("BKG_002", "Booking already exists", HttpStatus.BAD_REQUEST),

    // =========================
    // TICKET
    // =========================
    TICKET_NOT_FOUND("TKT_001", "Ticket not found", HttpStatus.NOT_FOUND),
    TICKET_ALREADY_EXISTS("TKT_002", "Ticket already exists", HttpStatus.BAD_REQUEST),

    // =========================
    // PAYMENT
    // =========================
    PAYMENT_ALREADY_COMPLETED("PAY_001", "Payment already completed", HttpStatus.BAD_REQUEST),
    UNSUPPORTED_PAYMENT_GATEWAY("PAY_002", "Unsupported payment gateway", HttpStatus.BAD_REQUEST),
    PAYMENT_VERIFICATION_FAILED("PAY_003", "Payment verification failed", HttpStatus.BAD_REQUEST),
    PAYMENT_NOT_FOUND("PAY_004", "Payment not found", HttpStatus.NOT_FOUND),

    // =========================
    // EXTERNAL SERVICE (Fallback)
    // =========================
    SERVICE_UNAVAILABLE(
            "SYS_503",
            "The service is temporarily unavailable. Please try again later.",
            HttpStatus.SERVICE_UNAVAILABLE
    ),

    // =========================
    // SECURITY
    // =========================
    FORBIDDEN("SEC_001", "Access denied", HttpStatus.FORBIDDEN),
    UNAUTHORIZED("SEC_002", "Unauthorized", HttpStatus.UNAUTHORIZED),
    TOO_MANY_REQUESTS("SEC_003", "Too many requests. Please try again later.", HttpStatus.TOO_MANY_REQUESTS),
    NOT_FOUND("SEC_004", "Resource not found", HttpStatus.NOT_FOUND);

    private final String code;
    private final String message;
    private final HttpStatus status;

    ErrorCode(String code, String message, HttpStatus status) {
        this.code = code;
        this.message = message;
        this.status = status;
    }
}