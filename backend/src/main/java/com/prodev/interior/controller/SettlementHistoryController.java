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

        // DB에 존재하는 모든 계약 확정 프로젝트의 실제 연도 목록 동적 추출 (중복 제거 & 최신순 정렬)
        List<Integer> availableYears = projectRepository.findAll().stream()
                .filter(p -> {
                    String st = p.getStatus();
                    return !"견적중".equals(st) && !"ESTIMATING".equalsIgnoreCase(st);
                })
                .map(p -> p.getCreatedAt() != null ? p.getCreatedAt().getYear() : 2026)
                .distinct()
                .sorted(Comparator.reverseOrder())
                .collect(Collectors.toList());

        if (availableYears.isEmpty()) {
            availableYears.add(targetYear);
        }

        List<SettlementHistoryDTO.ProjectSettlementSummary> summaries = new ArrayList<>();
        
        projectRepository.findAll().forEach(p -> {
            // 1. 아직 계약 체결되지 않은 '견적중' / 'ESTIMATING' 현장은 정산 이력에서 제외
            String st = p.getStatus();
            if ("견적중".equals(st) || "ESTIMATING".equalsIgnoreCase(st)) {
                return;
            }

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
            if (expense == 0L && total > 0) {
                expense = Math.round(total * 0.7); // 지출 미등록 시 예상 원가 약 70%
            }

            // 실수금액이 존재하면 실수금액 기준, 없으면 견적 총액 기준으로 순이익 산출
            long effectiveRevenue = collected > 0 ? collected : total;
            long net = effectiveRevenue - expense;
            
            summaries.add(SettlementHistoryDTO.ProjectSettlementSummary.builder()
                    .projectId(p.getProjectId())
                    .projectName(p.getProjectName())
                    .clientName(p.getClientVendor() != null ? p.getClientVendor().getVendorName() : "김철수 고객님")
                    .status(p.getStatus() != null ? p.getStatus() : "수주")
                    .totalAmount(total)
                    .collectedAmount(collected)
                    .discountAmount(discount)
                    .expenseAmount(expense)
                    .netProfit(net)
                    .completionDate(p.getCreatedAt() != null ? p.getCreatedAt().toLocalDate().toString() : targetYear + "-06-15")
                    .build());
        });

        long totalRevenue = summaries.stream().mapToLong(s -> s.getCollectedAmount() != null && s.getCollectedAmount() > 0 ? s.getCollectedAmount() : s.getTotalAmount()).sum();
        long totalExpense = summaries.stream().mapToLong(SettlementHistoryDTO.ProjectSettlementSummary::getExpenseAmount).sum();
        long netProfit = totalRevenue - totalExpense;
        double margin = totalRevenue > 0 ? (double) netProfit / totalRevenue * 100.0 : 0.0;

        SettlementHistoryDTO result = SettlementHistoryDTO.builder()
                .year(targetYear)
                .availableYears(availableYears)
                .totalProjects(summaries.size())
                .totalRevenue(totalRevenue)
                .totalExpense(totalExpense)
                .netProfit(netProfit)
                .profitMargin(Math.round(margin * 10.0) / 10.0)
                .items(summaries)
                .build();

        return ResponseEntity.ok(result);
    }
}
