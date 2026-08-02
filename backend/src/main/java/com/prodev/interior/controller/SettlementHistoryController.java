package com.prodev.interior.controller;

import com.prodev.interior.domain.Estimate;
import com.prodev.interior.dto.SettlementHistoryDTO;
import com.prodev.interior.harness.SettlementHistoryGuardrail;
import com.prodev.interior.repository.EstimateRepository;
import com.prodev.interior.repository.ProjectRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.List;

@RestController
@RequestMapping("/api/settlements/history")
@RequiredArgsConstructor
public class SettlementHistoryController {

    private final ProjectRepository projectRepository;
    private final EstimateRepository estimateRepository;
    private final SettlementHistoryGuardrail historyGuardrail;

    @GetMapping
    public ResponseEntity<SettlementHistoryDTO> getSettlementHistory(
            @RequestParam(required = false) Integer year,
            @RequestParam(required = false) String keyword) {
        
        int targetYear = historyGuardrail.sanitizeYear(year);

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

            long expense = Math.round(total * 0.7); // 집행 지출 원가 (약 70%)
            long net = total - expense;
            
            summaries.add(SettlementHistoryDTO.ProjectSettlementSummary.builder()
                    .projectId(p.getProjectId())
                    .projectName(p.getProjectName())
                    .clientName(p.getClientVendor() != null ? p.getClientVendor().getVendorName() : "김철수 고객님")
                    .status(p.getStatus() != null ? p.getStatus() : "견적중")
                    .totalAmount(total)
                    .expenseAmount(expense)
                    .netProfit(net)
                    .completionDate(p.getCreatedAt() != null ? p.getCreatedAt().toLocalDate().toString() : targetYear + "-06-15")
                    .build());
        });

        long totalRevenue = summaries.stream().mapToLong(SettlementHistoryDTO.ProjectSettlementSummary::getTotalAmount).sum();
        long totalExpense = summaries.stream().mapToLong(SettlementHistoryDTO.ProjectSettlementSummary::getExpenseAmount).sum();
        long netProfit = totalRevenue - totalExpense;
        double margin = totalRevenue > 0 ? (double) netProfit / totalRevenue * 100.0 : 0.0;

        SettlementHistoryDTO result = SettlementHistoryDTO.builder()
                .year(targetYear)
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
