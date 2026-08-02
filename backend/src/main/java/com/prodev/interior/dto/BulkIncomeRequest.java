package com.prodev.interior.dto;

import lombok.Data;
import java.time.LocalDate;

@Data
public class BulkIncomeRequest {
    private Long clientVendorId;
    private Integer amount;
    private Integer discount;
    private LocalDate incomeDate;
    private String type;
}
