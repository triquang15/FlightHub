package com.triquang.config;

import lombok.extern.slf4j.Slf4j;
import net.iakovlev.timeshape.TimeZoneEngine;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
@Slf4j
public class TimezoneConfig {

    @Bean
    public TimeZoneEngine timeZoneEngine() {
        log.info("🔥 Initializing TimeZoneEngine...");

        TimeZoneEngine engine = TimeZoneEngine.initialize();

        // 🔥 warmup luôn tại đây
        engine.query(10.8, 106.6);

        log.info("✅ TimeZoneEngine ready");

        return engine;
    }
}