package com.prodev.interior.dto;

import lombok.Builder;
import lombok.Data;
import java.util.List;
import java.util.Map;

@Data
@Builder
public class DashboardStatsDTO {
    private long totalProjects;
    private long activeProjects; // 견적중, 수주, 공사중인 현장 수
    private long completedProjects; // 완료된 현장 수
    private long totalRevenue; // 최종 견적액 합계
    private long totalIncome; // 실제 들어온 돈 합계
    private long totalExpense; // 실제 나간 돈 합계
    private long totalMargin; // 예상 마진 (최종 견적액 - 실제 지출)
    private double averageMarginRate; // 평균 마진율

    private List<MonthlyTrend> monthlyTrends;
    private List<ProcessShare> processShares;
    private List<UrgentAR> urgentARs; // 미수금 긴급 알림 현장 목록
    
    // 4대 통계용 추가 데이터
    private List<MarginRanking> topMargins; // 진짜 마진율 랭킹
    private List<AgingAR> agingARs; // 미수금 연령별 집계
    private List<VendorSpend> topVendors; // 거래처별 매입액 랭킹

    @Data
    @Builder
    public static class MonthlyTrend {
        private String month; // YYYY-MM
        private long income;
        private long expense;
    }

    @Data
    @Builder
    public static class ProcessShare {
        private String processName;
        private long amount;
        private double shareRate;
    }

    @Data
    @Builder
    public static class UrgentAR {
        private Long projectId;
        private String projectName;
        private long balance; // 미수금 잔액
    }

    @Data
    @Builder
    public static class MarginRanking {
        private Long projectId;
        private String projectName;
        private long marginAmount;
        private double marginRate;
    }

    @Data
    @Builder
    public static class AgingAR {
        private String agingGroup; // 30일 이내, 60일 이내, 90일 초과 등
        private long amount;
    }

    @Data
    @Builder
    public static class VendorSpend {
        private String vendorName;
        private long amount;
        private double shareRate;
    }
}
