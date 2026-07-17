package com.triquang.config;

import java.io.IOException;

import org.slf4j.MDC;
import org.springframework.http.HttpRequest;
import org.springframework.http.client.ClientHttpRequestExecution;
import org.springframework.http.client.ClientHttpRequestInterceptor;
import org.springframework.http.client.ClientHttpResponse;
import org.springframework.web.client.RestClient;

public final class TraceRestClientCustomizer {

    private TraceRestClientCustomizer() {
    }

    public static RestClient.Builder withTracePropagation(RestClient.Builder builder) {
        return builder.requestInterceptor(new TraceIdClientHttpRequestInterceptor());
    }

    private static final class TraceIdClientHttpRequestInterceptor implements ClientHttpRequestInterceptor {
        @Override
        public ClientHttpResponse intercept(
                HttpRequest request,
                byte[] body,
                ClientHttpRequestExecution execution
        ) throws IOException {
            String traceId = MDC.get(TraceIdFilter.TRACE_ID);
            if (traceId != null && !traceId.isBlank()) {
                request.getHeaders().set(TraceIdFilter.HEADER_TRACE_ID, traceId);
            }
            return execution.execute(request, body);
        }
    }
}
