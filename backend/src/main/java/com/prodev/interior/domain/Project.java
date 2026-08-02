package com.prodev.interior.domain;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "projects")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Builder
public class Project {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long projectId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "company_id", nullable = false)
    private Company company;

    @Column(nullable = false)
    private String projectName;

    private String address;

    @Column(nullable = false)
    private String status; // ESTIMATING, CONTRACTED, IN_PROGRESS, COMPLETED

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "client_vendor_id")
    private Vendor clientVendor;

    private LocalDate startDate;
    private LocalDate endDate;

    @OneToMany(mappedBy = "project", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<ProjectImage> images = new ArrayList<>();

    private LocalDateTime createdAt;

    public Long getClientVendorId() {
        return clientVendor != null ? clientVendor.getVendorId() : null;
    }

    public String getClientVendorName() {
        return clientVendor != null ? clientVendor.getVendorName() : null;
    }

    @PrePersist
    public void prePersist() {
        this.createdAt = LocalDateTime.now();
    }

    public void updateProjectInfo(String projectName, String address, Vendor clientVendor) {
        this.projectName = projectName;
        this.address = address;
        this.clientVendor = clientVendor;
    }

    public void updateStatus(String status) {
        this.status = status;
    }
}
