package com.prodev.interior.controller;

import com.prodev.interior.dto.SettlementHistoryDTO;
import com.prodev.interior.harness.SettlementHistoryGuardrail;
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
    private final SettlementHistoryGuardrail historyGuardrail;

    @GetMapping
    public ResponseEntity<SettlementHistoryDTO> getSettlementHistory(
            @RequestParam(required = false) Integer year,
            @RequestParam(required = false) String keyword) {
        
        int targetYear = historyGuardrail.sanitizeYear(year);

        // 과거 이력 집계 목 데이터 및 DB 연동 DTO 생성
        List<SettlementHistoryDTO.ProjectSettlementSummary> summaries = new ArrayList<>();
        
        projectRepository.findAll().forEach(p -> {
            long total = 25000000L + (p.getProjectId() * 2000000L);
            long expense = 18000000L + (p.getProjectId() * 1200000L);
            long net = total - expense;
            
            summaries.add(SettlementHistoryDTO.ProjectSettlementSummary.builder()
                    .projectId(p.getProjectId())
                    .projectName(p.getProjectName())
                    .clientName(p.getClientVendor() != null ? p.getClientVendor().getVendorName() : "일반 고객")
                    .status("종결 (Completed)")
                    .totalAmount(total)
                    .expenseAmount(expense)
                    .netProfit(net)
                    .completionDate(targetYear + "-11-30")
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
