package com.triquang.config;

import java.time.Duration;
import java.util.Map;

import org.springframework.cache.Cache;
import org.springframework.cache.annotation.CachingConfigurer;
import org.springframework.cache.interceptor.CacheErrorHandler;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.redis.cache.RedisCacheConfiguration;
import org.springframework.data.redis.cache.RedisCacheManager;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.data.redis.serializer.GenericJackson2JsonRedisSerializer;
import org.springframework.data.redis.serializer.RedisSerializationContext;
import org.springframework.data.redis.serializer.StringRedisSerializer;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;

import lombok.extern.slf4j.Slf4j;

@Slf4j
@Configuration
public class RedisConfig implements CachingConfigurer {

    @Bean
    public RedisCacheManager cacheManager(RedisConnectionFactory factory) {

        // =========================
        // OBJECT MAPPER
        // =========================
        ObjectMapper mapper = new ObjectMapper();
        mapper.registerModule(new JavaTimeModule());

        // 🔥 NOTE:
        // ❌ bỏ activateDefaultTyping để tránh security risk

        GenericJackson2JsonRedisSerializer jsonSerializer =
                new GenericJackson2JsonRedisSerializer(mapper);

        // =========================
        // DEFAULT CONFIG
        // =========================
        RedisCacheConfiguration defaults = RedisCacheConfiguration.defaultCacheConfig()
                .serializeKeysWith(RedisSerializationContext.SerializationPair
                        .fromSerializer(new StringRedisSerializer()))
                .serializeValuesWith(RedisSerializationContext.SerializationPair
                        .fromSerializer(jsonSerializer))
                .disableCachingNullValues();

        // =========================
        // CACHE CONFIG PER USE-CASE
        // =========================
        Map<String, RedisCacheConfiguration> cacheConfigs = Map.of(

                // =========================
                // CITY CACHE
                // =========================
                "cityById", defaults.entryTtl(Duration.ofHours(6)),
                "cityDropdown", defaults.entryTtl(Duration.ofHours(6)),
                "citiesByCode", defaults.entryTtl(Duration.ofHours(6)),

                // =========================
                // AIRPORT CACHE
                // =========================
                "airportById", defaults.entryTtl(Duration.ofHours(6)),
                "airportsByIata", defaults.entryTtl(Duration.ofHours(6)),
                "airportsByCity", defaults.entryTtl(Duration.ofHours(6)),

                // 🔥 list lớn → TTL ngắn hơn
                "allAirports", defaults.entryTtl(Duration.ofHours(2))
        );

        return RedisCacheManager.builder(factory)
                .cacheDefaults(defaults.entryTtl(Duration.ofHours(6)))
                .withInitialCacheConfigurations(cacheConfigs)
                .build();
    }

    // =========================
    // ERROR HANDLER (KEEP SYSTEM ALIVE)
    // =========================
    @Override
    public CacheErrorHandler errorHandler() {
        return new CacheErrorHandler() {

            @Override
            public void handleCacheGetError(RuntimeException e, Cache cache, Object key) {
                log.warn("Cache GET failed [{}] key={}: {}", cache.getName(), key, e.getMessage());
            }

            @Override
            public void handleCachePutError(RuntimeException e, Cache cache, Object key, Object value) {
                log.warn("Cache PUT failed [{}] key={}: {}", cache.getName(), key, e.getMessage());
            }

            @Override
            public void handleCacheEvictError(RuntimeException e, Cache cache, Object key) {
                log.warn("Cache EVICT failed [{}] key={}: {}", cache.getName(), key, e.getMessage());
            }

            @Override
            public void handleCacheClearError(RuntimeException e, Cache cache) {
                log.warn("Cache CLEAR failed [{}]: {}", cache.getName(), e.getMessage());
            }
        };
    }
}