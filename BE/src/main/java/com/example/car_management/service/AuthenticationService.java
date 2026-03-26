package com.example.car_management.service;

import com.example.car_management.dto.request.*;
import com.example.car_management.dto.response.AuthenticationResponse;
import com.example.car_management.dto.response.IntrospectResponse;
import com.example.car_management.entity.InvalidatedTokenEntity;
import com.example.car_management.entity.UserEntity;
import com.example.car_management.entity.enums.OwnerRegistrationStatus;
import com.example.car_management.entity.enums.UserRole;
import com.example.car_management.exception.AppException;
import com.example.car_management.exception.ErrorCode;
import com.example.car_management.mapper.UserMapper;
import com.example.car_management.repository.InvalidatedTokenRepository;
import com.example.car_management.repository.OwnerRegistrationRepository;
import com.example.car_management.repository.UserRepository;
import com.nimbusds.jose.*;
import com.nimbusds.jose.crypto.MACSigner;
import com.nimbusds.jose.crypto.MACVerifier;
import com.nimbusds.jwt.JWTClaimsSet;
import com.nimbusds.jwt.SignedJWT;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.experimental.NonFinal;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.text.ParseException;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Map;
import java.util.Date;
import java.util.LinkedHashSet;
import java.util.Set;
import java.util.StringJoiner;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ThreadLocalRandom;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class AuthenticationService {
    UserRepository userRepository;
    PasswordEncoder passwordEncoder;
    InvalidatedTokenRepository invalidatedTokenRepository;
    OwnerRegistrationRepository ownerRegistrationRepository;
    UserMapper userMapper;
    ObjectProvider<JavaMailSender> mailSenderProvider;

    private static final long REGISTRATION_EMAIL_OTP_EXPIRE_SECONDS = 300;
    private final Map<Integer, RegistrationEmailOtpSession> registrationEmailOtpSessions = new ConcurrentHashMap<>();

    @NonFinal
    @Value("${jwt.signerKey}")
    protected String SIGNER_KEY;

    @NonFinal
    @Value("${jwt.valid-duration}")
    protected long VALID_DURATION;

    @NonFinal
    @Value("${jwt.refreshable-duration}")
    protected long REFRESHABLE_DURATION;

    @NonFinal
    @Value("${app.mail.enabled:true}")
    protected boolean mailEnabled;

    @NonFinal
    @Value("${spring.mail.username:no-reply@carrental.local}")
    protected String fromEmail;

    public IntrospectResponse introspect(IntrospectRequest request) throws JOSEException, ParseException {
        var token = request.getToken();
        boolean isValid = true;
        try {
            verifyToken(token, false);
        } catch (AppException e) {
            isValid = false;
        }
        return IntrospectResponse.builder()
                .valid(isValid)
                .build();
    }

    public AuthenticationResponse register(RegisterRequest request) {
        if (userRepository.findByEmail(request.getEmail()).isPresent()) {
            throw new AppException(ErrorCode.EMAIL_EXISTED);
        }

        UserEntity user = userMapper.toEntity(request);

        String hashedPassword = passwordEncoder.encode(request.getPassword());
        user.setPassword(hashedPassword);

        user.setRoleId(UserRole.USER);

        user.setCreatedAt(Instant.now());

        UserEntity savedUser = userRepository.save(user);

        issueRegistrationEmailOtp(savedUser);

        String token = generateToken(savedUser);

        return AuthenticationResponse.builder()
                .token(token)
                .authenticated(true)
                .build();
    }

    public void resendRegistrationEmailOtp(Integer userId) {
        UserEntity user = userRepository.findById(userId)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));

        if (Boolean.TRUE.equals(user.getIsVerified())) {
            return;
        }

        issueRegistrationEmailOtp(user);
    }

    public void verifyRegistrationEmailOtp(Integer userId, String otp) {
        UserEntity user = userRepository.findById(userId)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));

        if (Boolean.TRUE.equals(user.getIsVerified())) {
            registrationEmailOtpSessions.remove(user.getId());
            return;
        }

        RegistrationEmailOtpSession session = registrationEmailOtpSessions.get(user.getId());
        if (session == null) {
            throw new AppException(ErrorCode.EMAIL_OTP_NOT_FOUND);
        }

        if (Instant.now().isAfter(session.expireAt())) {
            registrationEmailOtpSessions.remove(user.getId());
            throw new AppException(ErrorCode.EMAIL_OTP_EXPIRED);
        }

        String normalizedEmail = String.valueOf(user.getEmail() == null ? "" : user.getEmail()).trim().toLowerCase();
        if (!session.email().equalsIgnoreCase(normalizedEmail)) {
            throw new AppException(ErrorCode.EMAIL_OTP_INVALID);
        }

        String normalizedOtp = String.valueOf(otp == null ? "" : otp).trim();
        if (!session.otp().equals(normalizedOtp)) {
            throw new AppException(ErrorCode.EMAIL_OTP_INVALID);
        }

        user.setIsVerified(true);
        userRepository.save(user);
        registrationEmailOtpSessions.remove(user.getId());
    }

    public AuthenticationResponse authenticate(AuthenticationRequest request) {
        var user = userRepository
                .findByEmail(request.getEmail())
                .orElseThrow(() -> new AppException(ErrorCode.EMAIL_NOT_EXISTED));

        boolean isCustomer = user.getRoleId() == UserRole.USER;
        if (isCustomer && !Boolean.TRUE.equals(user.getIsVerified())) {
            issueRegistrationEmailOtp(user);
            throw new AppException(ErrorCode.EMAIL_NOT_VERIFIED);
        }

        if (user.getIsActive() != null && !user.getIsActive()) {
            throw new AppException(ErrorCode.UNAUTHORIZED);
        }

        boolean authenticated = passwordEncoder.matches(request.getPassword(), user.getPassword());
        if (!authenticated) {
            throw new AppException(ErrorCode.UNAUTHENTICATED);
        }

        var token = generateToken(user);
        return AuthenticationResponse.builder()
                .token(token)
                .authenticated(true)
                .build();
    }

    private String generateToken(UserEntity user) {
        JWSHeader jwsHeader = new JWSHeader(JWSAlgorithm.HS512);

        JWTClaimsSet jwtClaimsSet = new JWTClaimsSet.Builder()
                .subject(user.getEmail())
                .issuer("ducmito.com")
                .issueTime(new Date())
                .expirationTime(new Date(
                        Instant.now().plus(VALID_DURATION, ChronoUnit.SECONDS).toEpochMilli()))
                .jwtID(UUID.randomUUID().toString())
                .claim("scope", buildScope(user))
                .claim("userId", user.getId())
                .claim("fullName", user.getFullName())
                .build();

        Payload payload = new Payload(jwtClaimsSet.toJSONObject());

        JWSObject jwsObject = new JWSObject(jwsHeader, payload);

        try {
            jwsObject.sign(new MACSigner(SIGNER_KEY.getBytes()));
            return jwsObject.serialize();
        } catch (JOSEException e) {
            log.error("Cannot create token");
            throw new RuntimeException(e);
        }
    }

    private SignedJWT verifyToken(String token, boolean isRefresh) throws JOSEException, ParseException {
        JWSVerifier verifier = new MACVerifier(SIGNER_KEY.getBytes());

        SignedJWT signedJWT = SignedJWT.parse(token);

        Date expiryTime = (isRefresh)
                ? new Date(signedJWT
                        .getJWTClaimsSet()
                        .getIssueTime()
                        .toInstant()
                        .plus(REFRESHABLE_DURATION, ChronoUnit.SECONDS)
                        .toEpochMilli())
                : signedJWT.getJWTClaimsSet().getExpirationTime();

        var verified = signedJWT.verify(verifier);

        if (!verified && expiryTime.after(new Date()))
            throw new AppException((ErrorCode.UNAUTHENTICATED));

        return signedJWT;
    }

    public AuthenticationResponse refreshToken(RefreshRequest request) throws ParseException, JOSEException {
        var signedJWT = verifyToken(request.getToken(), true);

        var jit = signedJWT.getJWTClaimsSet().getJWTID();
        var expireTime = signedJWT.getJWTClaimsSet().getExpirationTime();

        InvalidatedTokenEntity invalidatedToken = InvalidatedTokenEntity.builder()
                .id(jit)
                .expiryTime(expireTime)
                .build();
        invalidatedTokenRepository.save(invalidatedToken);

        var fullName = signedJWT.getJWTClaimsSet().getSubject();
        var user = userRepository.findByEmail(fullName).orElseThrow(() -> new AppException(ErrorCode.UNAUTHENTICATED));
        var token = generateToken(user);

        return AuthenticationResponse.builder()
                .token(token)
                .authenticated(true)
                .build();
    }

    public void Logout(LogoutRequest request) throws JOSEException, ParseException {
        try {
            var signToken = verifyToken(request.getToken(), true);

            String jit = signToken.getJWTClaimsSet().getJWTID();
            Date expireTime = signToken.getJWTClaimsSet().getExpirationTime();

            InvalidatedTokenEntity invalidatedToken = InvalidatedTokenEntity.builder()
                    .id(jit)
                    .expiryTime(expireTime)
                    .build();
            invalidatedTokenRepository.save(invalidatedToken);
        } catch (AppException e) {
            log.info("token already expired");
        }
    }

    public void forgotPassword(Long id) {
        UserEntity user = userRepository.findById(id);

        String hashedPassword = passwordEncoder.encode("123456");
        user.setPassword(hashedPassword);
        userRepository.save(user);
    }

    private String buildScope(UserEntity user) {
        Set<String> authorities = new LinkedHashSet<>();

        if (user.getRoleId() != null) {
            authorities.add("ROLE_" + user.getRoleId().name());
        }

        if (user.getRoleId() == UserRole.USER) {
            authorities.add("ROLE_USER");
        }

        boolean hasApprovedOwnerRegistration = user.getId() != null
                && ownerRegistrationRepository
                        .findFirstByApprovedOwner_IdAndStatusOrderByReviewedAtAsc(user.getId(),
                                OwnerRegistrationStatus.APPROVED)
                        .isPresent();

        if (user.getRoleId() == UserRole.CAR_OWNER || hasApprovedOwnerRegistration) {
            authorities.add("ROLE_CAR_OWNER");
        }

        if (user.getRoleId() == UserRole.USER && hasApprovedOwnerRegistration) {
            authorities.add("ROLE_USER");
        }

        return String.join(" ", authorities);
    }

    private void issueRegistrationEmailOtp(UserEntity user) {
        String email = String.valueOf(user.getEmail() == null ? "" : user.getEmail()).trim().toLowerCase();
        if (email.isBlank()) {
            throw new AppException(ErrorCode.EMAIL_OTP_SEND_FAILED);
        }

        String otp = String.format("%06d", ThreadLocalRandom.current().nextInt(0, 1_000_000));
        Instant expireAt = Instant.now().plusSeconds(REGISTRATION_EMAIL_OTP_EXPIRE_SECONDS);
        registrationEmailOtpSessions.put(user.getId(), new RegistrationEmailOtpSession(email, otp, expireAt));
        sendRegistrationOtpEmail(email, user.getFullName(), otp);
    }

    private void sendRegistrationOtpEmail(String toEmail, String fullName, String otp) {
        if (!mailEnabled) {
            throw new AppException(ErrorCode.EMAIL_OTP_SEND_FAILED);
        }

        JavaMailSender mailSender = mailSenderProvider.getIfAvailable();
        if (mailSender == null) {
            throw new AppException(ErrorCode.EMAIL_OTP_SEND_FAILED);
        }

        try {
            String displayName = (fullName == null || fullName.isBlank()) ? "Ban" : fullName.trim();

            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(fromEmail);
            message.setTo(toEmail);
            message.setSubject("[CarRental] Ma OTP xac minh email tai khoan");
            message.setText("Xin chao " + displayName + ",\n\n"
                    + "Ma OTP xac minh email dang ky tai khoan cua ban la: " + otp + "\n"
                    + "Ma co hieu luc trong 5 phut.\n\n"
                    + "CarRental");

            mailSender.send(message);
        } catch (Exception ex) {
            throw new AppException(ErrorCode.EMAIL_OTP_SEND_FAILED);
        }
    }

    private record RegistrationEmailOtpSession(String email, String otp, Instant expireAt) {
    }

}
