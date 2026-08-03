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
    private List<Integer> availableYears;
    private Integer totalProjects;
    private Long totalRevenue;
    private Long estimatedRevenue;
    private Long totalExpense;
    private Long plannedExpense;
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
        private Long collectedAmount;
        private Long discountAmount;
        private Long expenseAmount;
        private Long plannedExpense;
        private Long netProfit;
        private String completionDate;
    }
}
