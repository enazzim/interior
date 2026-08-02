package com.prodev.interior.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SettlementHistoryDTO {
    private Integer year;
    private Integer totalProjects;
    private Long totalRevenue;
    private Long totalExpense;
    private Long netProfit;
    private Double profitMargin;
    private List<ProjectSettlementSummary> items;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ProjectSettlementSummary {
        private Long projectId;
        private String projectName;
        private String clientName;
        private String status;
        private Long totalAmount;
        private Long expenseAmount;
        private Long netProfit;
        private String completionDate;
    }
}
