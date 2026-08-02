package com.prodev.interior.dto;

import lombok.Data;

@Data
public class CompanyDTO {
    private Long companyId;
    private String companyName;
    private String businessNumber;
    private String address;
    private String subscriptionPlan;
    private String tel;
    private String fax;
    private String businessType;
    private String businessItem;
    private String ceoName;
}
