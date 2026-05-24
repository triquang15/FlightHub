package com.triquang.config;

import java.time.Duration;
import java.util.HashMap;
import java.util.Map;

import org.springframework.cache.Cache;
import org.springframework.cache.annotation.CachingConfigurer;
import org.springframework.cache.interceptor.CacheErrorHandler;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.redis.cache.RedisCacheConfiguration;
import org.springframework.data.redis.cache.RedisCacheManager;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.data.redis.serializer.RedisSerializationContext;
import org.springframework.data.redis.serializer.StringRedisSerializer;

import com.fasterxml.jackson.annotation.JsonTypeInfo;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.jsontype.BasicPolymorphicTypeValidator;

import org.springframework.data.redis.serializer.GenericJackson2JsonRedisSerializer;

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
        mapper.findAndRegisterModules();

        mapper.activateDefaultTyping(
                BasicPolymorphicTypeValidator.builder()
                        .allowIfSubType(Object.class)
                        .build(),
                ObjectMapper.DefaultTyping.NON_FINAL,
                JsonTypeInfo.As.PROPERTY
        );

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
                .disableCachingNullValues()
                .entryTtl(Duration.ofMinutes(30));

        // =========================
        // CACHE CONFIG
        // =========================
        Map<String, RedisCacheConfiguration> cacheConfigs = new HashMap<>();

        cacheConfigs.put("cityById", defaults.entryTtl(Duration.ofHours(6)));
        cacheConfigs.put("cityDropdown", defaults.entryTtl(Duration.ofHours(6)));

        cacheConfigs.put("airportById", defaults.entryTtl(Duration.ofHours(6)));
        cacheConfigs.put("airportsByCity", defaults.entryTtl(Duration.ofHours(1)));

        cacheConfigs.put("geoTimezone", defaults.entryTtl(Duration.ofHours(24)));
        cacheConfigs.put("timezones", defaults.entryTtl(Duration.ofDays(1)));

        // =========================
        // BUILD
        // =========================
        return RedisCacheManager.builder(factory)
                .cacheDefaults(defaults)
                .withInitialCacheConfigurations(cacheConfigs)
                .transactionAware()
                .build();
    }

    // =========================
    // FAIL SAFE
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