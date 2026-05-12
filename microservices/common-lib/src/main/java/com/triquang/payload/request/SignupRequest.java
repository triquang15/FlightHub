package com.triquang.payload.request;

import jakarta.validation.constraints.*;
import lombok.Data;

@Data
public class SignupRequest {

    @NotBlank
    @Email
    private String email;

    @NotBlank
    @Size(min = 8, max = 64, message = "Password must be at least 8 characters")
    private String password;

    @NotBlank
    @Size(min = 2, max = 100)
    private String fullName;

    @Pattern(regexp = "^(\\+84|0)[0-9]{9}$", message = "Invalid phone number")
    private String phone;

    private String deviceId;
}