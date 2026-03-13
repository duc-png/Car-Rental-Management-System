package com.example.car_management.configuration;

import com.example.car_management.entity.UserEntity;
import com.example.car_management.entity.enums.UserRole;
import com.example.car_management.repository.UserRepository;
import com.nimbusds.jose.JOSEException;
import com.nimbusds.jose.JWSAlgorithm;
import com.nimbusds.jose.JWSHeader;
import com.nimbusds.jose.JWSObject;
import com.nimbusds.jose.Payload;
import com.nimbusds.jose.crypto.MACSigner;
import com.nimbusds.jwt.JWTClaimsSet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.experimental.NonFinal;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.core.oidc.user.OidcUser;
import org.springframework.security.web.authentication.AuthenticationSuccessHandler;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Date;
import java.util.StringJoiner;
import java.util.UUID;

@Slf4j
@Component
@RequiredArgsConstructor
public class OAuth2SuccessHandler implements AuthenticationSuccessHandler {

    private final UserRepository userRepository;

    @NonFinal
    @Value("${jwt.signerKey}")
    protected String SIGNER_KEY;

    @NonFinal
    @Value("${jwt.valid-duration}")
    protected long VALID_DURATION;

    @NonFinal
    @Value("${app.frontend-url}")
    protected String FRONTEND_URL;

    @Override
    public void onAuthenticationSuccess(HttpServletRequest request,
            HttpServletResponse response,
            Authentication authentication) throws IOException {
        OidcUser oidcUser = (OidcUser) authentication.getPrincipal();

        String email = oidcUser.getEmail();
        String fullName = oidcUser.getFullName();

        // Tìm user trong DB hoặc tạo mới
        UserEntity user = userRepository.findByEmail(email)
                .orElseGet(() -> {
                    UserEntity newUser = new UserEntity();
                    newUser.setEmail(email);
                    newUser.setFullName(fullName);
                    newUser.setRoleId(UserRole.USER);
                    newUser.setIsActive(true);
                    newUser.setIsVerified(true);
                    newUser.setCreatedAt(Instant.now());
                    newUser.setPassword(""); // Google login, no password
                    return userRepository.save(newUser);
                });

        // Generate JWT token
        String token = generateToken(user);

        // Redirect về FE với token
        response.sendRedirect(FRONTEND_URL + "/oauth2/callback?token=" + token);
    }

    private String generateToken(UserEntity user) {
        JWSHeader jwsHeader = new JWSHeader(JWSAlgorithm.HS512);

        StringJoiner scope = new StringJoiner(" ");
        if (user.getRoleId() != null) {
            scope.add("ROLE_" + user.getRoleId().name());
        }

        JWTClaimsSet jwtClaimsSet = new JWTClaimsSet.Builder()
                .subject(user.getEmail())
                .issuer("ducmito.com")
                .issueTime(new Date())
                .expirationTime(new Date(
                        Instant.now().plus(VALID_DURATION, ChronoUnit.SECONDS).toEpochMilli()))
                .jwtID(UUID.randomUUID().toString())
                .claim("scope", scope.toString())
                .claim("userId", user.getId())
                .claim("fullName", user.getFullName())
                .build();

        Payload payload = new Payload(jwtClaimsSet.toJSONObject());
        JWSObject jwsObject = new JWSObject(jwsHeader, payload);

        try {
            jwsObject.sign(new MACSigner(SIGNER_KEY.getBytes()));
            return jwsObject.serialize();
        } catch (JOSEException e) {
            log.error("Cannot create token for Google OAuth2 user");
            throw new RuntimeException(e);
        }
    }
}
