package com.prodev.interior.dto;

import lombok.Data;

@Data
public class VendorDTO {
    private Long vendorId;
    private String vendorType;
    private String businessType;
    private String vendorName;
    private String businessNumber;
    private String address;
    private String contactPerson;
    private String accountInfo;
}
