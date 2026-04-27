package com.triquang.client;

import java.util.Collections;
import java.util.List;

import org.springframework.stereotype.Component;

import com.triquang.payload.response.SeatInstanceResponse;

@Component
public class SeatClientFallback implements SeatClient {

    @Override
    public Double calculateSeatPrice(List<Long> seatInstanceIds) {
        return 0.0;
    }

    @Override
    public List<SeatInstanceResponse> getAllByIds(List<Long> Ids) {
        return Collections.emptyList();
    }
}
