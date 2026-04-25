package com.triquang.payload.response;

import lombok.*;

import java.time.Instant;

import com.triquang.dto.UserDTO;
import com.triquang.embeddable.Support;
import com.triquang.enums.AirlineStatus;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AirlineResponse {

    private Long id;

    private String iataCode;
    private String icaoCode;

    private String name;
    private String alias;
    private String country;

    private String logoUrl;
    private String website;

    private AirlineStatus status;
    private String alliance;

    private Long headquartersCityId;

    private Instant createdAt;
    private Instant updatedAt;

    private Long ownerId;
    private UserDTO owner;
    private Long updatedById;
    private Support support;
}
