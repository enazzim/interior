package com.prodev.interior.harness;

import com.prodev.interior.dto.ExpenseDTO;
import com.prodev.interior.dto.IncomeDTO;
import com.prodev.interior.dto.MaterialCreateRequest;
import com.prodev.interior.dto.ProjectCreateRequest;
import org.springframework.stereotype.Component;

import java.time.LocalDate;

@Component
public class DomainGuardrail {

    /**
     * 지출(Expense) 데이터 가드레일: 음수 금액 방지 및 기본 날짜 보정
     */
    public ExpenseDTO sanitizeExpense(ExpenseDTO dto) {
        if (dto == null) {
            dto = new ExpenseDTO();
        }
        if (dto.getAmount() == null || dto.getAmount() < 0) {
            dto.setAmount(0);
        }
        if (dto.getExpenseDate() == null) {
            dto.setExpenseDate(LocalDate.now());
        }
        return dto;
    }

    /**
     * 수입(Income) 데이터 가드레일: 음수 금액 방지 및 기본 날짜 보정
     */
    public IncomeDTO sanitizeIncome(IncomeDTO dto) {
        if (dto == null) {
            dto = new IncomeDTO();
        }
        if (dto.getAmount() == null || dto.getAmount() < 0) {
            dto.setAmount(0);
        }
        if (dto.getIncomeDate() == null) {
            dto.setIncomeDate(LocalDate.now());
        }
        return dto;
    }

    /**
     * 자재(Material) 데이터 가드레일: 환산율 0 이하 방지 및 단가 음수 방지
     */
    public MaterialCreateRequest sanitizeMaterial(MaterialCreateRequest request) {
        if (request == null) {
            request = new MaterialCreateRequest();
        }
        if (request.getConversionRate() == null || request.getConversionRate() <= 0) {
            request.setConversionRate(1.0);
        }
        if (request.getPurchasePrice() == null || request.getPurchasePrice() < 0) {
            request.setPurchasePrice(0);
        }
        if (request.getLaborPrice() == null || request.getLaborPrice() < 0) {
            request.setLaborPrice(0);
        }
        return request;
    }

    /**
     * 프로젝트(Project) 데이터 가드레일: 명칭 기본값 보정
     */
    public ProjectCreateRequest sanitizeProject(ProjectCreateRequest request) {
        if (request == null) {
            request = new ProjectCreateRequest();
        }
        if (request.getProjectName() == null || request.getProjectName().trim().isEmpty()) {
            request.setProjectName("신규 인테리어 프로젝트");
        }
        return request;
    }
}
