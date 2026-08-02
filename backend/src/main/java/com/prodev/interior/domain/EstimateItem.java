package com.prodev.interior.domain;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "estimate_items")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Builder
public class EstimateItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long itemId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "estimate_id", nullable = false)
    private Estimate estimate;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "material_id", nullable = false)
    private Material material;

    @Column(nullable = false)
    private Double inputArea;

    @Column(nullable = false)
    private Double calculatedQty;

    @Column(nullable = false)
    private Integer materialCost;

    @Column(nullable = false)
    private Integer laborCost;

    @Column(nullable = false)
    private Integer customerUnitPrice;
}
