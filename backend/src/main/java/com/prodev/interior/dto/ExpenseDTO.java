package com.prodev.interior.dto;

import lombok.Data;
import java.time.LocalDate;

@Data
public class ExpenseDTO {
    private Long expenseId;
    private Long projectId;
    private Long processId;
    private String processName;
    private Long vendorId;
    private String vendorName;
    private Integer amount;
    private LocalDate expenseDate;
}
