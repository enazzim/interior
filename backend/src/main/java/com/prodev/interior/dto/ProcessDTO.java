package com.prodev.interior.dto;

import lombok.Data;

@Data
public class ProcessDTO {
    private Long processId;
    private String processName;
    private Integer sortOrder;
}
