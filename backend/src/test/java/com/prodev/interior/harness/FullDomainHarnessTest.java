package com.prodev.interior.harness;

import com.prodev.interior.dto.ExpenseDTO;
import com.prodev.interior.dto.IncomeDTO;
import com.prodev.interior.dto.MaterialCreateRequest;
import com.prodev.interior.dto.ProjectCreateRequest;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.time.LocalDate;

import static org.junit.jupiter.api.Assertions.*;

class FullDomainHarnessTest {

    private DomainGuardrail domainGuardrail;

    @BeforeEach
    void setUp() {
        domainGuardrail = new DomainGuardrail();
    }

    @Test
    @DisplayName("[Domain Harness] 지출 및 수입 음수 금액이 들어왔을 때 0으로 보정되고 오늘 날짜가 지정되어야 한다")
    void testExpenseAndIncomeGuardrail() {
        ExpenseDTO expense = new ExpenseDTO();
        expense.setAmount(-50000);
        ExpenseDTO sanitizedExpense = domainGuardrail.sanitizeExpense(expense);
        assertEquals(0, sanitizedExpense.getAmount());
        assertNotNull(sanitizedExpense.getExpenseDate());

        IncomeDTO income = new IncomeDTO();
        income.setAmount(-100000);
        IncomeDTO sanitizedIncome = domainGuardrail.sanitizeIncome(income);
        assertEquals(0, sanitizedIncome.getAmount());
        assertNotNull(sanitizedIncome.getIncomeDate());
    }

    @Test
    @DisplayName("[Domain Harness] 자재 환산율이 0 이하일 때 기본값 1.0으로 보정되어야 한다")
    void testMaterialConversionRateGuardrail() {
        MaterialCreateRequest request = new MaterialCreateRequest();
        request.setConversionRate(0.0);
        request.setPurchasePrice(-1000);

        MaterialCreateRequest sanitized = domainGuardrail.sanitizeMaterial(request);
        assertEquals(1.0, sanitized.getConversionRate());
        assertEquals(0, sanitized.getPurchasePrice());
    }

    @Test
    @DisplayName("[Domain Harness] 프로젝트 명칭이 공백일 때 기본 명칭으로 보정되어야 한다")
    void testProjectNameGuardrail() {
        ProjectCreateRequest request = new ProjectCreateRequest();
        request.setProjectName("   ");

        ProjectCreateRequest sanitized = domainGuardrail.sanitizeProject(request);
        assertEquals("신규 인테리어 프로젝트", sanitized.getProjectName());
    }
}
