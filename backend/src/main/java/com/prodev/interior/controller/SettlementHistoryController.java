package com.prodev.interior.controller;

import com.prodev.interior.domain.Estimate;
import com.prodev.interior.domain.Expense;
import com.prodev.interior.domain.Income;
import com.prodev.interior.dto.SettlementHistoryDTO;
import com.prodev.interior.harness.SettlementHistoryGuardrail;
import com.prodev.interior.repository.EstimateRepository;
import com.prodev.interior.repository.ExpenseRepository;
import com.prodev.interior.repository.IncomeRepository;
import com.prodev.interior.repository.ProjectRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/settlements/history")
@RequiredArgsConstructor
public class SettlementHistoryController {

    private final ProjectRepository projectRepository;
    private final EstimateRepository estimateRepository;
    private final ExpenseRepository expenseRepository;
    private final IncomeRepository incomeRepository;
    private final SettlementHistoryGuardrail historyGuardrail;

    @GetMapping
    public ResponseEntity<SettlementHistoryDTO> getSettlementHistory(
            @RequestParam(required = false) Integer year,
            @RequestParam(required = false) String keyword) {
        
        int targetYear = historyGuardrail.sanitizeYear(year);

        // DB에 존재하는 모든 프로젝트의 실제 연도 목록 동적 추출 (중복 제거 & 최신순 정렬)
        List<Integer> availableYears = projectRepository.findAll().stream()
                .map(p -> p.getCreatedAt() != null ? p.getCreatedAt().getYear() : 2026)
                .distinct()
                .sorted(Comparator.reverseOrder())
                .collect(Collectors.toList());

        if (availableYears.isEmpty()) {
            availableYears.add(targetYear);
        }

        List<SettlementHistoryDTO.ProjectSettlementSummary> summaries = new ArrayList<>();
        
        projectRepository.findAll().forEach(p -> {
            // DB 프로젝트 생성 연도 필터링
            int projectYear = p.getCreatedAt() != null ? p.getCreatedAt().getYear() : 2026;
            if (year != null && projectYear != targetYear) {
                return;
            }

            // 키워드 필터링 적용
            if (keyword != null && !keyword.trim().isEmpty()) {
                String kw = keyword.trim().toLowerCase();
                boolean matchesProject = p.getProjectName() != null && p.getProjectName().toLowerCase().contains(kw);
                boolean matchesClient = p.getClientVendor() != null && p.getClientVendor().getVendorName().toLowerCase().contains(kw);
                if (!matchesProject && !matchesClient) {
                    return;
                }
            }

            // DB에서 해당 현장의 최신 견적서 총액 동적 조회
            List<Estimate> estimates = estimateRepository.findByProjectProjectIdOrderByCreatedAtDesc(p.getProjectId());
            long total = 0L;
            if (!estimates.isEmpty()) {
                total = estimates.get(0).getTotalAmount(); // 가장 최근에 작성/수정된 버전의 견적 총액
            }

            // 실제 수금액 & 할인네고액 누계
            List<Income> incomes = incomeRepository.findByProjectProjectIdOrderByIncomeDateDesc(p.getProjectId());
            long collected = incomes.stream().mapToLong(Income::getAmount).sum();
            long discount = incomes.stream().mapToLong(inc -> inc.getDiscount() != null ? inc.getDiscount() : 0).sum();

            // 실제 지출 원가 누계
            List<Expense> expenses = expenseRepository.findByProjectProjectIdOrderByExpenseDateDesc(p.getProjectId());
            long expense = expenses.stream().mapToLong(Expense::getAmount).sum();
            
            String st = p.getStatus() != null ? p.getStatus() : "견적중";
            boolean isEstimating = "견적중".equals(st) || "ESTIMATING".equalsIgnoreCase(st);

            // 실수금액이 존재하면 실수금액 기준, 없으면 견적 총액 기준으로 순이익 산출
            long effectiveRevenue = collected > 0 ? collected : total;
            long net = isEstimating ? 0L : (effectiveRevenue - expense);
            
            summaries.add(SettlementHistoryDTO.ProjectSettlementSummary.builder()
                    .projectId(p.getProjectId())
                    .projectName(p.getProjectName())
                    .clientName(p.getClientVendor() != null ? p.getClientVendor().getVendorName() : "김철수 고객님")
                    .status(st)
                    .totalAmount(total)
                    .collectedAmount(collected)
                    .discountAmount(discount)
                    .expenseAmount(expense)
                    .netProfit(net)
                    .completionDate(p.getCreatedAt() != null ? p.getCreatedAt().toLocalDate().toString() : targetYear + "-06-15")
                    .build());
        });

        // 확정 계약 현장만 상단 실적 카드(확정 매출, 확정 지출, 확정 순이익)에 합산
        List<SettlementHistoryDTO.ProjectSettlementSummary> confirmedItems = summaries.stream()
                .filter(s -> !"견적중".equals(s.getStatus()) && !"ESTIMATING".equalsIgnoreCase(s.getStatus()))
                .collect(Collectors.toList());

        // 미계약 견적중 현장의 가계산 총액 합계 (예상 파이프라인)
        long estimatedRevenue = summaries.stream()
                .filter(s -> "견적중".equals(s.getStatus()) || "ESTIMATING".equalsIgnoreCase(s.getStatus()))
                .mapToLong(SettlementHistoryDTO.ProjectSettlementSummary::getTotalAmount)
                .sum();

        long totalRevenue = confirmedItems.stream().mapToLong(s -> s.getCollectedAmount() != null && s.getCollectedAmount() > 0 ? s.getCollectedAmount() : s.getTotalAmount()).sum();
        long totalExpense = confirmedItems.stream().mapToLong(SettlementHistoryDTO.ProjectSettlementSummary::getExpenseAmount).sum();
        long netProfit = totalRevenue - totalExpense;
        double margin = totalRevenue > 0 ? (double) netProfit / totalRevenue * 100.0 : 0.0;

        SettlementHistoryDTO result = SettlementHistoryDTO.builder()
                .year(targetYear)
                .availableYears(availableYears)
                .totalProjects(summaries.size())
                .totalRevenue(totalRevenue)
                .estimatedRevenue(estimatedRevenue)
                .totalExpense(totalExpense)
                .netProfit(netProfit)
                .profitMargin(Math.round(margin * 10.0) / 10.0)
                .items(summaries)
                .build();

        return ResponseEntity.ok(result);
    }
}
