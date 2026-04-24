package com.triquang.config;

import java.io.IOException;
import java.util.UUID;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.slf4j.MDC;
import org.springframework.stereotype.Component;

import jakarta.servlet.Filter;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.ServletRequest;
import jakarta.servlet.ServletResponse;

/**
 * TraceId filter for request tracking
 */
@Component
public class TraceIdFilter implements Filter {

    private static final Logger log = LoggerFactory.getLogger(TraceIdFilter.class);

    public static final String TRACE_ID = "traceId";

    @Override
    public void doFilter(ServletRequest request,
                         ServletResponse response,
                         FilterChain chain)
            throws IOException, ServletException {

        String traceId = UUID.randomUUID().toString();

        MDC.put(TRACE_ID, traceId);

        // LOG WHEN FILTER STARTS
        log.info("=== TraceIdFilter START | traceId={} ===", traceId);

        try {
            chain.doFilter(request, response);
        } finally {

            // LOG WHEN FILTER ENDS
            log.info("=== TraceIdFilter END | traceId={} ===", traceId);

            MDC.clear();
        }
    }
}