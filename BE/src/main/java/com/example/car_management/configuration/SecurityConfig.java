package com.example.car_management.configuration;

import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationConverter;
import org.springframework.security.oauth2.server.resource.authentication.JwtGrantedAuthoritiesConverter;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import org.springframework.web.filter.CorsFilter;

import java.util.List;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final String[] PUBLIC_ENDPOINTS = {
            "/auth/token",
            "/auth/logout",
            "/auth/refresh",
            "/auth/register",
            "/api/v1/owner-registrations"
    };

    private final CustomJwtDecoder customJwtDecoder;

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {

        http.authorizeHttpRequests(request -> request

                // Auth public
                .requestMatchers(HttpMethod.POST, PUBLIC_ENDPOINTS).permitAll()

                // Vehicles public
                .requestMatchers(HttpMethod.GET, "/api/v1/vehicles/**").permitAll()
                .requestMatchers(HttpMethod.POST, "/api/v1/vehicles/search").permitAll()

                // Vehicle metadata public
                .requestMatchers(HttpMethod.GET, "/api/v1/vehicle-models/**").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/v1/brands/**").permitAll()

                // Owners public
                .requestMatchers(HttpMethod.GET, "/api/v1/owners/**").permitAll()

                // Booking public
                .requestMatchers(
                        HttpMethod.GET,
                        "/api/v1/bookings/vehicle/*/booked-dates"
                ).permitAll()

                // PayOS
                .requestMatchers(
                        HttpMethod.POST,
                        "/api/v1/payments/payos-webhook"
                ).permitAll()

                .requestMatchers(
                        HttpMethod.GET,
                        "/api/v1/test-payos"
                ).permitAll()

                .anyRequest()
                .authenticated()
        );


        http.oauth2ResourceServer(oauth2 -> oauth2.jwt(jwtConfigurer -> jwtConfigurer
                .decoder(customJwtDecoder)
                .jwtAuthenticationConverter(jwtAuthenticationConverter()))
                .authenticationEntryPoint(new JwtAuthenticationEntryPoint())
        );

        // Enable CORS
        http.cors(cors ->
                cors.configurationSource(corsConfigurationSource())
        );

        // Disable CSRF
        http.csrf(AbstractHttpConfigurer::disable);

        return http.build();
    }


    @Bean
    public CorsConfigurationSource corsConfigurationSource() {

        CorsConfiguration config = new CorsConfiguration();

        config.setAllowedOriginPatterns(List.of(
                "http://localhost:*",
                "http://127.0.0.1:*"
        ));

        config.setAllowedMethods(List.of(
                "GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"
        ));

        config.setAllowedHeaders(List.of("*"));
        config.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source =
                new UrlBasedCorsConfigurationSource();

        source.registerCorsConfiguration("/**", config);

        return source;
    }


    @Bean
    public CorsFilter corsFilter() {

        UrlBasedCorsConfigurationSource source =
                new UrlBasedCorsConfigurationSource();

        CorsConfiguration config =
                new CorsConfiguration();

        config.addAllowedOrigin("*");
        config.addAllowedHeader("*");
        config.addAllowedMethod("*");

        source.registerCorsConfiguration("/**", config);

        return new CorsFilter(source);
    }


    @Bean
    JwtAuthenticationConverter jwtAuthenticationConverter() {

        JwtGrantedAuthoritiesConverter authoritiesConverter =
                new JwtGrantedAuthoritiesConverter();

        authoritiesConverter.setAuthorityPrefix("");

        JwtAuthenticationConverter converter =
                new JwtAuthenticationConverter();

        converter.setJwtGrantedAuthoritiesConverter(
                authoritiesConverter
        );

        return converter;
    }
}