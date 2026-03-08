package com.example.car_management.service.impl;

import com.example.car_management.entity.OwnerRegistration;
import com.example.car_management.service.OwnerRegistrationNotificationService;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class OwnerRegistrationNotificationServiceImpl implements OwnerRegistrationNotificationService {

    private static final Logger LOG = LoggerFactory.getLogger(OwnerRegistrationNotificationServiceImpl.class);

    private final ObjectProvider<JavaMailSender> mailSenderProvider;

    @Value("${app.mail.enabled:false}")
    private boolean mailEnabled;

    @Value("${spring.mail.username:no-reply@carrental.local}")
    private String fromEmail;

    @Value("${app.frontend-url:http://localhost:3000}")
    private String frontendUrl;

    @Override
    public void sendApprovedEmail(OwnerRegistration registration) {
        String subject = "[CarRental] Hồ sơ đăng ký chủ xe đã được chấp thuận";
        String body = "Xin chào " + safeName(registration.getFullName()) + ",\n\n"
                + "Yêu cầu đăng ký chủ xe của bạn đã được admin chấp thuận.\n"
                + "Biển số xe: " + safeValue(registration.getLicensePlate()) + "\n\n"
                + "Bạn có thể đăng nhập với vai trò chủ xe tại: " + frontendUrl + "/owner/login\n\n"
                + "Trân trọng,\nCarRental";

        sendEmail(registration.getEmail(), subject, body);
    }

    @Override
    public void sendRejectedEmail(OwnerRegistration registration) {
        String note = registration.getAdminNote() == null || registration.getAdminNote().isBlank()
                ? "Chưa có ghi chú từ admin."
                : registration.getAdminNote().trim();

        String subject = "[CarRental] Hồ sơ đăng ký chủ xe đã bị từ chối";
        String body = "Xin chào " + safeName(registration.getFullName()) + ",\n\n"
                + "Yêu cầu đăng ký chủ xe của bạn đã bị từ chối.\n"
                + "Biển số xe: " + safeValue(registration.getLicensePlate()) + "\n"
                + "Lý do/ghi chú: " + note + "\n\n"
                + "Bạn có thể cập nhật thông tin và gửi lại yêu cầu tại: " + frontendUrl + "/become-owner\n\n"
                + "Trân trọng,\nCarRental";

        sendEmail(registration.getEmail(), subject, body);
    }

    private void sendEmail(String to, String subject, String body) {
        if (!mailEnabled) {
            LOG.info("Skip sending owner registration email because app.mail.enabled=false. Recipient={}", to);
            return;
        }

        JavaMailSender mailSender = mailSenderProvider.getIfAvailable();
        if (mailSender == null) {
            LOG.warn("JavaMailSender bean is not available. Cannot send email to {}", to);
            return;
        }

        if (to == null || to.isBlank()) {
            LOG.warn("Skip sending email because recipient is empty.");
            return;
        }

        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(fromEmail);
            message.setTo(to.trim());
            message.setSubject(subject);
            message.setText(body);
            mailSender.send(message);
            LOG.info("Owner registration notification email sent to {}", to);
        } catch (Exception ex) {
            LOG.error("Failed to send owner registration email to {}: {}", to, ex.getMessage());
        }
    }

    private String safeName(String value) {
        if (value == null || value.isBlank()) {
            return "Chủ xe";
        }
        return value.trim();
    }

    private String safeValue(String value) {
        if (value == null || value.isBlank()) {
            return "N/A";
        }
        return value.trim();
    }
}
