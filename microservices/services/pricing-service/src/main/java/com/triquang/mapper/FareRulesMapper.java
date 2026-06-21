package com.triquang.mapper;

import com.triquang.model.Fare;
import com.triquang.model.FareRules;
import com.triquang.payload.request.FareRulesRequest;
import com.triquang.payload.response.FareRulesResponse;

public class FareRulesMapper {

    public static FareRules toEntity(FareRulesRequest request, Fare fare) {
        if (request == null) return null;
        return FareRules.builder()
                .ruleName(request.getRuleName())
                .fare(fare)
                .isRefundable(request.getIsRefundable())
                .changeFee(request.getChangeFee())
                .cancellationFee(request.getCancellationFee())
                .refundDeadlineDays(request.getRefundDeadlineDays())
                .changeDeadlineHours(request.getChangeDeadlineHours())
                .isChangeable(request.getIsChangeable() != null ? request.getIsChangeable() : false)
                .build();
    }

    public static FareRulesResponse toResponse(FareRules fareRules) {
        if (fareRules == null) return null;
        return FareRulesResponse.builder()
                .id(fareRules.getId())
                .ruleName(fareRules.getRuleName())
                .fareId(fareRules.getFare() != null ? fareRules.getFare().getId() : null)
                .airlineId(fareRules.getAirlineId())
                .isRefundable(fareRules.getIsRefundable())
                .changeFee(fareRules.getChangeFee())
                .cancellationFee(fareRules.getCancellationFee())
                .refundDeadlineDays(fareRules.getRefundDeadlineDays())
                .changeDeadlineHours(fareRules.getChangeDeadlineHours())
                .isChangeable(fareRules.getIsChangeable())
                .createdAt(fareRules.getCreatedAt())
                .updatedAt(fareRules.getUpdatedAt())
                .build();
    }

    public static void updateEntity(FareRulesRequest request, FareRules existing) {
        if (request == null || existing == null) return;
        if (request.getRuleName() != null) existing.setRuleName(request.getRuleName());
        if (request.getIsRefundable() != null) {
            existing.setIsRefundable(request.getIsRefundable());
            existing.setCancellationFee(request.getIsRefundable() ? request.getCancellationFee() : null);
            existing.setRefundDeadlineDays(request.getIsRefundable() ? request.getRefundDeadlineDays() : null);
        }
        if (request.getIsChangeable() != null) {
            existing.setIsChangeable(request.getIsChangeable());
            existing.setChangeFee(request.getIsChangeable() ? request.getChangeFee() : null);
            existing.setChangeDeadlineHours(request.getIsChangeable() ? request.getChangeDeadlineHours() : null);
        }
    }
}
