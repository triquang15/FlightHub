package com.triquang.client;

import java.util.List;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;

import com.triquang.payload.response.SeatInstanceResponse;

@FeignClient(name = "seat-service", fallback = SeatClientFallback.class)
public interface SeatClient {

	@PostMapping("/api/seat-instances/price/total")
	Double calculateSeatPrice(@RequestBody List<Long> seatInstanceIds);

	@GetMapping("/api/seat-instances/all")
	List<SeatInstanceResponse> getAllByIds(@RequestParam List<Long> Ids);

}
