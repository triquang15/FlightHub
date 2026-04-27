package com.triquang.payload.response;

import java.time.LocalDate;
import java.time.LocalDateTime;

import com.triquang.enums.Gender;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PassengerResponse {

    private Long id;
    private String firstName;
    private String lastName;
    private String email;
    private String phone;
    private LocalDate dateOfBirth;
    private Gender gender;

    private String passportNumber;
    private String nationality;
    private String frequentFlyerNumber;

    private Long primaryUserId;
    private String primaryUserName;

    private Boolean requiresWheelchairAssistance;
    private String dietaryPreferences;
    private String medicalConditions;

    private Boolean isActive;
    private Integer age;
    private Boolean isAdult;
    private String fullName;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
