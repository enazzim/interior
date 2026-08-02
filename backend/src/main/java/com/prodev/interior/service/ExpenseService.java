package com.prodev.interior.service;

import com.prodev.interior.domain.Expense;
import com.prodev.interior.domain.Project;
import com.prodev.interior.domain.Process;
import com.prodev.interior.domain.Vendor;
import com.prodev.interior.dto.ExpenseDTO;
import com.prodev.interior.repository.ExpenseRepository;
import com.prodev.interior.repository.ProjectRepository;
import com.prodev.interior.repository.ProcessRepository;
import com.prodev.interior.repository.VendorRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ExpenseService {

    private final ExpenseRepository expenseRepository;
    private final ProjectRepository projectRepository;
    private final ProcessRepository processRepository;
    private final VendorRepository vendorRepository;

    public List<ExpenseDTO> getExpensesByProject(Long projectId) {
        return expenseRepository.findByProjectProjectIdOrderByExpenseDateDesc(projectId)
                .stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    @Transactional
    public ExpenseDTO createExpense(ExpenseDTO dto) {
        Project project = projectRepository.findById(dto.getProjectId())
                .orElseThrow(() -> new IllegalArgumentException("Invalid project ID: " + dto.getProjectId()));
        
        Process process = null;
        if (dto.getProcessId() != null) {
            process = processRepository.findById(dto.getProcessId())
                    .orElseThrow(() -> new IllegalArgumentException("Invalid process ID: " + dto.getProcessId()));
        }

        Vendor vendor = vendorRepository.findById(dto.getVendorId())
                .orElseThrow(() -> new IllegalArgumentException("Invalid vendor ID: " + dto.getVendorId()));

        Expense expense = Expense.builder()
                .project(project)
                .process(process)
                .vendor(vendor)
                .amount(dto.getAmount())
                .expenseDate(dto.getExpenseDate())
                .build();

        expense = expenseRepository.save(expense);
        return convertToDTO(expense);
    }

    @Transactional
    public void deleteExpense(Long expenseId) {
        Expense expense = expenseRepository.findById(expenseId)
                .orElseThrow(() -> new IllegalArgumentException("Invalid expense ID: " + expenseId));
        expenseRepository.delete(expense);
    }

    private ExpenseDTO convertToDTO(Expense expense) {
        ExpenseDTO dto = new ExpenseDTO();
        dto.setExpenseId(expense.getExpenseId());
        dto.setProjectId(expense.getProject().getProjectId());
        if (expense.getProcess() != null) {
            dto.setProcessId(expense.getProcess().getProcessId());
            dto.setProcessName(expense.getProcess().getProcessName());
        }
        dto.setVendorId(expense.getVendor().getVendorId());
        dto.setVendorName(expense.getVendor().getVendorName());
        dto.setAmount(expense.getAmount());
        dto.setExpenseDate(expense.getExpenseDate());
        return dto;
    }
}
