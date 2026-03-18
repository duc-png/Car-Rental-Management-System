package com.example.car_management.entity;

import com.example.car_management.entity.enums.IncidentReportAppealStatus;
import com.example.car_management.entity.enums.IncidentReportCategory;
import com.example.car_management.entity.enums.IncidentReportStatus;
import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name = "incident_reports")
public class IncidentReportEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "booking_id", nullable = false)
    private BookingEntity booking;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "customer_id", nullable = false)
    private UserEntity customer;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "owner_id", nullable = false)
    private UserEntity owner;

    @Enumerated(EnumType.STRING)
    @Column(name = "category", nullable = false, length = 64)
    private IncidentReportCategory category;

    @Column(name = "description", nullable = false, length = 3000)
    private String description;

    @ElementCollection
    @CollectionTable(name = "incident_report_evidences", joinColumns = @JoinColumn(name = "report_id"))
    @Column(name = "evidence_url", length = 1000)
    @Builder.Default
    private List<String> evidenceUrls = new ArrayList<>();

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 32)
    @Builder.Default
    private IncidentReportStatus status = IncidentReportStatus.PENDING;

    @Column(name = "decision_note", length = 2000)
    private String decisionNote;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "decision_by")
    private UserEntity decisionBy;

    @Column(name = "decision_at")
    private Instant decisionAt;

    @Enumerated(EnumType.STRING)
    @Column(name = "appeal_status", nullable = false, length = 32)
    @Builder.Default
    private IncidentReportAppealStatus appealStatus = IncidentReportAppealStatus.NONE;

    @Column(name = "appeal_content", length = 2000)
    private String appealContent;

    @ElementCollection
    @CollectionTable(name = "incident_report_appeal_evidences", joinColumns = @JoinColumn(name = "report_id"))
    @Column(name = "evidence_url", length = 1000)
    @Builder.Default
    private List<String> appealEvidenceUrls = new ArrayList<>();

    @Column(name = "appeal_decision_note", length = 2000)
    private String appealDecisionNote;

    @Column(name = "appeal_decision_at")
    private Instant appealDecisionAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "appeal_decision_by")
    private UserEntity appealDecisionBy;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;
}
