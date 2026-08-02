package com.prodev.interior.domain;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "companies")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Builder
public class Company {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long companyId;

    @Column(nullable = false)
    private String companyName;

    private String businessNumber;

    private String address;

    @Column(nullable = false)
    private String subscriptionPlan; // LITE, STANDARD, PREMIUM

    private String tel;
    private String fax;
    private String businessType;
    private String businessItem;
    private String ceoName;

    private LocalDateTime createdAt;

    @PrePersist
    public void prePersist() {
        this.createdAt = LocalDateTime.now();
    }

    public void updateCompanyInfo(String companyName, String businessNumber, String address, String subscriptionPlan, String tel, String fax, String businessType, String businessItem, String ceoName) {
        this.companyName = companyName;
        this.businessNumber = businessNumber;
        this.address = address;
        this.subscriptionPlan = subscriptionPlan;
        this.tel = tel;
        this.fax = fax;
        this.businessType = businessType;
        this.businessItem = businessItem;
        this.ceoName = ceoName;
    }
}
