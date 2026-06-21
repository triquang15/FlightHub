package com.triquang.client;

import java.util.List;
import java.util.Map;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;

import com.triquang.enums.ErrorCode;
import com.triquang.exception.BaseException;
import com.triquang.payload.response.ApiResponse;
import com.triquang.payload.response.FareResponse;

@FeignClient(name = "pricing-service", fallback = PricingClientFallback.class)
public interface PricingClient {

    @GetMapping("/api/fares/{id}")
    ApiResponse<FareResponse> getFareByIdResponse(@PathVariable Long id);

    default FareResponse getFareById(Long id) {
        return requireData(getFareByIdResponse(id));
    }

    @PostMapping("/api/fares/batch-by-ids")
    ApiResponse<Map<Long, FareResponse>> getFaresByIdsResponse(@RequestBody List<Long> ids);

    default Map<Long, FareResponse> getFaresByIds(List<Long> ids) {
        return requireData(getFaresByIdsResponse(ids));
    }

    private static <T> T requireData(ApiResponse<T> response) {
        if (response == null || response.data() == null || response.errorCode() != null) {
            throw new BaseException(ErrorCode.EXTERNAL_SERVICE_ERROR);
        }
        return response.data();
    }
}
