package com.triquang.config;

import org.slf4j.MDC;
import org.springframework.boot.autoconfigure.condition.ConditionalOnClass;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import feign.RequestInterceptor;

@Configuration
@ConditionalOnClass(RequestInterceptor.class)
public class TracePropagationConfig {

    @Bean
    public RequestInterceptor traceIdFeignRequestInterceptor() {
        return template -> {
            String traceId = MDC.get(TraceIdFilter.TRACE_ID);
            if (traceId != null && !traceId.isBlank()) {
                template.header(TraceIdFilter.HEADER_TRACE_ID, traceId);
            }
        };
    }
}
