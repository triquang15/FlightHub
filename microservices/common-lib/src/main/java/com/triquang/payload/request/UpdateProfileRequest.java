package com.triquang.payload.request;

import lombok.Data;

@Data
public class UpdateProfileRequest {

    private String fullName;
    private String phone;
}
