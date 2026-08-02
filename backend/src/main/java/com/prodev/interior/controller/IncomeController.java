package com.prodev.interior.controller;

import com.prodev.interior.dto.IncomeDTO;
import com.prodev.interior.service.IncomeService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/incomes")
@RequiredArgsConstructor
public class IncomeController {

    private final IncomeService incomeService;

    @GetMapping("/project/{projectId}")
    public ResponseEntity<List<IncomeDTO>> getIncomesByProject(@PathVariable Long projectId) {
        return ResponseEntity.ok(incomeService.getIncomesByProject(projectId));
    }

    @PostMapping
    public ResponseEntity<IncomeDTO> createIncome(@RequestBody IncomeDTO dto) {
        return ResponseEntity.ok(incomeService.createIncome(dto));
    }

    @PostMapping("/bulk")
    public ResponseEntity<Void> bulkCollectIncomes(@RequestBody com.prodev.interior.dto.BulkIncomeRequest request) {
        incomeService.bulkCollectIncomes(request);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteIncome(@PathVariable Long id) {
        incomeService.deleteIncome(id);
        return ResponseEntity.noContent().build();
    }
}
