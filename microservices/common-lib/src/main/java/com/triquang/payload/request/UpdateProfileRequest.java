package com.triquang.payload.request;

import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class UpdateProfileRequest {

    @Size(min = 2, max = 100)
    private String fullName;

    @Pattern(regexp = "^(\\+84|0)[0-9]{9}$", message = "Invalid phone number")
    private String phone;
}
