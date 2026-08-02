package com.prodev.interior.service;

import com.prodev.interior.domain.*;
import com.prodev.interior.dto.DashboardStatsDTO;
import com.prodev.interior.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class DashboardService {

    private final ProjectRepository projectRepository;
    private final ExpenseRepository expenseRepository;
    private final IncomeRepository incomeRepository;
    private final EstimateRepository estimateRepository;
    private final EstimateItemRepository estimateItemRepository;

    @Transactional(readOnly = true)
    public DashboardStatsDTO getDashboardStats() {
        return getDashboardStats(null, null, null);
    }

    @Transactional(readOnly = true)
    public DashboardStatsDTO getDashboardStats(String startDateStr, String endDateStr, Long projectId) {
        List<Project> allProjects = projectRepository.findAll();
        List<Expense> allExpenses = expenseRepository.findAll();
        List<Income> allIncomes = incomeRepository.findAll();
        List<Estimate> allEstimates = estimateRepository.findAll();

        // 0. 필터링 로직 적용
        java.time.LocalDate startDt = (startDateStr != null && !startDateStr.isEmpty()) ? java.time.LocalDate.parse(startDateStr) : null;
        java.time.LocalDate endDt = (endDateStr != null && !endDateStr.isEmpty()) ? java.time.LocalDate.parse(endDateStr) : null;

        if (projectId != null) {
            allProjects = allProjects.stream().filter(p -> p.getProjectId().equals(projectId)).collect(Collectors.toList());
            allExpenses = allExpenses.stream().filter(e -> e.getProject().getProjectId().equals(projectId)).collect(Collectors.toList());
            allIncomes = allIncomes.stream().filter(i -> i.getProject().getProjectId().equals(projectId)).collect(Collectors.toList());
            allEstimates = allEstimates.stream().filter(e -> e.getProject().getProjectId().equals(projectId)).collect(Collectors.toList());
        }

        if (startDt != null && endDt != null) {
            allExpenses = allExpenses.stream().filter(e -> !e.getExpenseDate().isBefore(startDt) && !e.getExpenseDate().isAfter(endDt)).collect(Collectors.toList());
            allIncomes = allIncomes.stream().filter(i -> !i.getIncomeDate().isBefore(startDt) && !i.getIncomeDate().isAfter(endDt)).collect(Collectors.toList());
            // Projects are a bit ambiguous to filter by Date. We will only filter financial records by default, 
            // but if we want strictly filtered projects, we can leave allProjects intact or filter by createdAt/endDate.
            // For now, let's keep allProjects if only filtering by date, so we don't break project counting.
        }

        // 1. 기본 건수 계산
        long totalProjects = allProjects.size();
        long activeProjects = allProjects.stream()
                .filter(p -> !"완료".equals(p.getStatus()))
                .count();
        long completedProjects = totalProjects - activeProjects;

        // 2. 누적 금액 계산
        long totalIncome = allIncomes.stream().mapToLong(Income::getAmount).sum();
        long totalExpense = allExpenses.stream().mapToLong(Expense::getAmount).sum();

        // 각 현장별 최종 견적서(isFinal 또는 가장 최신) 금액의 합계 구하기
        Map<Long, Estimate> latestEstimateMap = new HashMap<>();
        for (Estimate est : allEstimates) {
            Long pid = est.getProject().getProjectId();
            if (!latestEstimateMap.containsKey(pid) || est.getCreatedAt().isAfter(latestEstimateMap.get(pid).getCreatedAt())) {
                latestEstimateMap.put(pid, est);
            }
        }
        long totalRevenue = latestEstimateMap.values().stream().mapToLong(Estimate::getTotalAmount).sum();
        long totalMargin = totalRevenue - totalExpense;
        double averageMarginRate = totalRevenue > 0 ? ((double) totalMargin / totalRevenue) * 100 : 0.0;

        // 3. 월별 추이 집계 (최근 6개월)
        Map<String, DashboardStatsDTO.MonthlyTrend> trendMap = new TreeMap<>();
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM");

        // 초기 최근 6개월 맵 채워넣기
        java.time.LocalDate now = java.time.LocalDate.now();
        for (int i = 5; i >= 0; i--) {
            String monthKey = now.minusMonths(i).format(formatter);
            trendMap.put(monthKey, DashboardStatsDTO.MonthlyTrend.builder()
                    .month(monthKey)
                    .income(0L)
                    .expense(0L)
                    .build());
        }

        // 수입 월별 누적
        for (Income inc : allIncomes) {
            if (inc.getIncomeDate() != null) {
                String monthKey = inc.getIncomeDate().format(formatter);
                if (trendMap.containsKey(monthKey)) {
                    DashboardStatsDTO.MonthlyTrend trend = trendMap.get(monthKey);
                    trend.setIncome(trend.getIncome() + inc.getAmount());
                }
            }
        }

        // 지출 월별 누적
        for (Expense exp : allExpenses) {
            if (exp.getExpenseDate() != null) {
                String monthKey = exp.getExpenseDate().format(formatter);
                if (trendMap.containsKey(monthKey)) {
                    DashboardStatsDTO.MonthlyTrend trend = trendMap.get(monthKey);
                    trend.setExpense(trend.getExpense() + exp.getAmount());
                }
            }
        }

        List<DashboardStatsDTO.MonthlyTrend> monthlyTrends = new ArrayList<>(trendMap.values());

        // 4. 공정별 지출 비중 집계
        Map<String, Long> processMap = new HashMap<>();
        for (Expense exp : allExpenses) {
            String processName = exp.getProcess() != null ? exp.getProcess().getProcessName() : "기타공정";
            processMap.put(processName, processMap.getOrDefault(processName, 0L) + exp.getAmount());
        }

        long totalProcExpense = processMap.values().stream().mapToLong(Long::longValue).sum();
        List<DashboardStatsDTO.ProcessShare> processShares = processMap.entrySet().stream()
                .map(entry -> DashboardStatsDTO.ProcessShare.builder()
                        .processName(entry.getKey())
                        .amount(entry.getValue())
                        .shareRate(totalProcExpense > 0 ? ((double) entry.getValue() / totalProcExpense) * 100 : 0.0)
                        .build())
                .sorted((a, b) -> Long.compare(b.getAmount(), a.getAmount()))
                .collect(Collectors.toList());

        // 5. 미수금 긴급 알림 현장 및 연령별(Aging) 미수금 분석
        List<DashboardStatsDTO.UrgentAR> urgentARs = new ArrayList<>();
        long arUnder30 = 0;
        long arUnder60 = 0;
        long arUnder90 = 0;
        long arOver90 = 0;

        java.time.LocalDate today = java.time.LocalDate.now();

        List<DashboardStatsDTO.MarginRanking> allMargins = new ArrayList<>();

        for (Project proj : allProjects) {
            Estimate latestEst = latestEstimateMap.get(proj.getProjectId());
            long estAmt = latestEst != null ? latestEst.getTotalAmount() : 0L;
            long incAmt = allIncomes.stream()
                    .filter(inc -> inc.getProject().getProjectId().equals(proj.getProjectId()))
                    .mapToLong(Income::getAmount)
                    .sum();
            
            // 미수금 계산
            long balance = estAmt - incAmt;
            if (balance > 0) {
                urgentARs.add(DashboardStatsDTO.UrgentAR.builder()
                        .projectId(proj.getProjectId())
                        .projectName(proj.getProjectName())
                        .balance(balance)
                        .build());
                
                // Aging 계산
                java.time.LocalDate baseDate = proj.getEndDate() != null ? proj.getEndDate() : (latestEst != null ? latestEst.getCreatedAt().toLocalDate() : proj.getCreatedAt().toLocalDate());
                long daysOverdue = java.time.temporal.ChronoUnit.DAYS.between(baseDate, today);
                if (daysOverdue <= 30) {
                    arUnder30 += balance;
                } else if (daysOverdue <= 60) {
                    arUnder60 += balance;
                } else if (daysOverdue <= 90) {
                    arUnder90 += balance;
                } else {
                    arOver90 += balance;
                }
            }

            // 진짜 마진율 계산
            long expAmt = allExpenses.stream()
                    .filter(exp -> exp.getProject().getProjectId().equals(proj.getProjectId()))
                    .mapToLong(Expense::getAmount)
                    .sum();
            long marginAmt = incAmt - expAmt;
            double marginRt = incAmt > 0 ? ((double) marginAmt / incAmt) * 100 : 0.0;
            
            allMargins.add(DashboardStatsDTO.MarginRanking.builder()
                    .projectId(proj.getProjectId())
                    .projectName(proj.getProjectName())
                    .marginAmount(marginAmt)
                    .marginRate(marginRt)
                    .build());
        }
        urgentARs.sort((a, b) -> Long.compare(b.getBalance(), a.getBalance()));

        // 진짜 마진율 랭킹 Top 5
        List<DashboardStatsDTO.MarginRanking> topMargins = allMargins.stream()
                .sorted((a, b) -> Double.compare(b.getMarginRate(), a.getMarginRate()))
                .limit(5)
                .collect(Collectors.toList());

        // AgingAR 리스트 구성
        List<DashboardStatsDTO.AgingAR> agingARs = Arrays.asList(
                DashboardStatsDTO.AgingAR.builder().agingGroup("30일 이내").amount(arUnder30).build(),
                DashboardStatsDTO.AgingAR.builder().agingGroup("31~60일").amount(arUnder60).build(),
                DashboardStatsDTO.AgingAR.builder().agingGroup("61~90일").amount(arUnder90).build(),
                DashboardStatsDTO.AgingAR.builder().agingGroup("90일 초과").amount(arOver90).build()
        );

        // 6. 거래처별 지출 비중 (Top Vendors)
        Map<String, Long> vendorMap = new HashMap<>();
        for (Expense exp : allExpenses) {
            if (exp.getVendor() != null) {
                String vName = exp.getVendor().getVendorName();
                vendorMap.put(vName, vendorMap.getOrDefault(vName, 0L) + exp.getAmount());
            }
        }
        long totalVendorExpense = vendorMap.values().stream().mapToLong(Long::longValue).sum();
        List<DashboardStatsDTO.VendorSpend> topVendors = vendorMap.entrySet().stream()
                .map(entry -> DashboardStatsDTO.VendorSpend.builder()
                        .vendorName(entry.getKey())
                        .amount(entry.getValue())
                        .shareRate(totalVendorExpense > 0 ? ((double) entry.getValue() / totalVendorExpense) * 100 : 0.0)
                        .build())
                .sorted((a, b) -> Long.compare(b.getAmount(), a.getAmount()))
                .limit(5)
                .collect(Collectors.toList());

        return DashboardStatsDTO.builder()
                .totalProjects(totalProjects)
                .activeProjects(activeProjects)
                .completedProjects(completedProjects)
                .totalRevenue(totalRevenue)
                .totalIncome(totalIncome)
                .totalExpense(totalExpense)
                .totalMargin(totalMargin)
                .averageMarginRate(averageMarginRate)
                .monthlyTrends(monthlyTrends)
                .processShares(processShares)
                .urgentARs(urgentARs)
                .topMargins(topMargins)
                .agingARs(agingARs)
                .topVendors(topVendors)
                .build();
    }
}
