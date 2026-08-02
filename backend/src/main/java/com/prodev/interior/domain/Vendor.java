package com.prodev.interior.domain;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "vendors")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Builder
public class Vendor {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long vendorId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "company_id", nullable = false)
    private Company company;

    @Column(nullable = false)
    private String vendorType; // CLIENT(수금처), SUPPLIER(매입처), SUBCONTRACTOR(외주처)

    @Column(nullable = false)
    private String businessType; // CORPORATION, INDIVIDUAL

    @Column(nullable = false)
    private String vendorName;

    private String businessNumber;

    private String address;

    private String contactPerson;

    private String accountInfo;

    private LocalDateTime createdAt;

    @PrePersist
    public void prePersist() {
        this.createdAt = LocalDateTime.now();
    }

    public void updateVendorInfo(String vendorName, String vendorType, String businessType, String businessNumber, String address, String contactPerson, String accountInfo) {
        this.vendorName = vendorName;
        this.vendorType = vendorType;
        this.businessType = businessType;
        this.businessNumber = businessNumber;
        this.address = address;
        this.contactPerson = contactPerson;
        this.accountInfo = accountInfo;
    }
}
