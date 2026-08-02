package com.prodev.interior.dto;

import lombok.Data;

@Data
public class MaterialCreateRequest {
    private String materialName;
    private String standardUnit;
    private String distributionUnit;
    private Double conversionRate;
    private Integer purchasePrice;
    private Integer laborPrice;
    private Long processId;
    private String specification;
    private com.prodev.interior.domain.ItemType itemType;
}
