package com.prodev.interior.dto;

import lombok.Data;

@Data
public class ProjectUpdateRequest {
    private String projectName;
    private String address;
    private Long clientVendorId;
}
