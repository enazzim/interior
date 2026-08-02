package com.prodev.interior.dto;

import lombok.Data;
import java.time.LocalDate;

@Data
public class IncomeDTO {
    private Long incomeId;
    private Long projectId;
    private Integer amount;
    private Integer discount;
    private LocalDate incomeDate;
    private String type; // 계약금, 중도금, 잔금 등
}
