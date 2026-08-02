package com.prodev.interior.domain;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "materials")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Builder
public class Material {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long materialId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "process_id", nullable = false)
    private Process process;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "company_id")
    private Company company; // nullable for system-wide materials

    @Column(nullable = false)
    private String materialName;

    @Column(nullable = false)
    private String standardUnit; // e.g. ㎡

    @Column(nullable = false)
    private String distributionUnit; // e.g. Box

    @Column(nullable = false)
    private Double conversionRate; // standard to distribution conversion

    @Column(nullable = false)
    private Integer purchasePrice; // material cost

    @Column(nullable = false)
    private Integer laborPrice; // labor cost

    private String specification; // e.g. 600x600, 100m

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ItemType itemType; // MATERIAL, LABOR

    public void updateMaterialInfo(String materialName, String standardUnit, String distributionUnit, Double conversionRate, Integer purchasePrice, Integer laborPrice, Process process, String specification, ItemType itemType) {
        this.materialName = materialName;
        this.standardUnit = standardUnit;
        this.distributionUnit = distributionUnit;
        this.conversionRate = conversionRate;
        this.purchasePrice = purchasePrice;
        this.laborPrice = laborPrice;
        this.process = process;
        this.specification = specification;
        this.itemType = itemType;
    }
}
