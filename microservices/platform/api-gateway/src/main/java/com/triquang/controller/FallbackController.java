package com.triquang.controller;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.triquang.enums.ErrorCode;
import com.triquang.utils.ResponseUtil;

/**
 * Client → Gateway → Service A → Service B (fail - e.g. timeout)
                              ↓
                        fallback("/fallback")
 
 * @author Tri Quang
 * @since 2024-04
 */
@RestController
public class FallbackController {

    private static final Logger log = LoggerFactory.getLogger(FallbackController.class);

    @RequestMapping("/fallback")
    public ResponseEntity<?> fallback(Throwable ex) {

        log.error("Fallback triggered - downstream service unavailable", ex);

        return ResponseUtil.error(ErrorCode.SERVICE_UNAVAILABLE);
    }
}