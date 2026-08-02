package com.prodev.interior.service;

import com.prodev.interior.domain.Income;
import com.prodev.interior.domain.Project;
import com.prodev.interior.dto.IncomeDTO;
import com.prodev.interior.dto.BulkIncomeRequest;
import com.prodev.interior.repository.IncomeRepository;
import com.prodev.interior.repository.ProjectRepository;
import com.prodev.interior.repository.EstimateRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class IncomeService {

    private final IncomeRepository incomeRepository;
    private final ProjectRepository projectRepository;
    private final EstimateRepository estimateRepository;

    public List<IncomeDTO> getIncomesByProject(Long projectId) {
        return incomeRepository.findByProjectProjectIdOrderByIncomeDateDesc(projectId)
                .stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    @Transactional
    public IncomeDTO createIncome(IncomeDTO dto) {
        Project project = projectRepository.findById(dto.getProjectId())
                .orElseThrow(() -> new IllegalArgumentException("Invalid project ID: " + dto.getProjectId()));

        Income income = Income.builder()
                .project(project)
                .amount(dto.getAmount())
                .discount(dto.getDiscount() != null ? dto.getDiscount() : 0)
                .incomeDate(dto.getIncomeDate())
                .type(dto.getType())
                .build();

        income = incomeRepository.save(income);
        return convertToDTO(income);
    }

    @Transactional
    public void bulkCollectIncomes(BulkIncomeRequest request) {
        Long clientVendorId = request.getClientVendorId();
        int remAmount = request.getAmount() != null ? request.getAmount() : 0;
        int remDiscount = request.getDiscount() != null ? request.getDiscount() : 0;

        // 고객 ID로 필터링한 모든 현장을 오래된 순(createdAt Asc)으로 정렬
        List<Project> allProjects = projectRepository.findAll();
        List<Project> clientProjects = allProjects.stream()
                .filter(p -> p.getClientVendor() != null && p.getClientVendor().getVendorId().equals(clientVendorId))
                .sorted((p1, p2) -> {
                    if (p1.getCreatedAt() == null) return -1;
                    if (p2.getCreatedAt() == null) return 1;
                    return p1.getCreatedAt().compareTo(p2.getCreatedAt());
                })
                .collect(Collectors.toList());

        for (Project p : clientProjects) {
            if (remAmount <= 0 && remDiscount <= 0) {
                break;
            }

            // 이 현장의 최종 견적액
            List<com.prodev.interior.domain.Estimate> ests = estimateRepository.findByProjectProjectIdOrderByCreatedAtDesc(p.getProjectId());
            int totalEstimateAmt = ests.isEmpty() ? 0 : ests.get(0).getTotalAmount();

            // 이 현장의 기존 누적 수금액 + 할인액 합계
            List<Income> incs = incomeRepository.findByProjectProjectIdOrderByIncomeDateDesc(p.getProjectId());
            int totalCollected = incs.stream().mapToInt(inc -> inc.getAmount()).sum();
            int totalDiscounted = incs.stream().mapToInt(inc -> inc.getDiscount() != null ? inc.getDiscount() : 0).sum();

            int unpaid = totalEstimateAmt - totalCollected - totalDiscounted;
            if (unpaid <= 0) {
                continue; // 미수금이 없으면 통과
            }

            // 이번에 이 현장에서 차감해줄(수금 및 할인) 금액 계산
            int payAmt = 0;
            int discAmt = 0;

            if (remAmount > 0) {
                payAmt = Math.min(remAmount, unpaid);
                remAmount -= payAmt;
                unpaid -= payAmt;
            }

            if (unpaid > 0 && remDiscount > 0) {
                discAmt = Math.min(remDiscount, unpaid);
                remDiscount -= discAmt;
                unpaid -= discAmt;
            }

            if (payAmt > 0 || discAmt > 0) {
                Income newIncome = Income.builder()
                        .project(p)
                        .amount(payAmt)
                        .discount(discAmt)
                        .incomeDate(request.getIncomeDate())
                        .type(request.getType() != null ? request.getType() : "일괄수금")
                        .build();
                incomeRepository.save(newIncome);
            }
        }
    }

    @Transactional
    public void deleteIncome(Long incomeId) {
        Income income = incomeRepository.findById(incomeId)
                .orElseThrow(() -> new IllegalArgumentException("Invalid income ID: " + incomeId));
        incomeRepository.delete(income);
    }

    private IncomeDTO convertToDTO(Income income) {
        IncomeDTO dto = new IncomeDTO();
        dto.setIncomeId(income.getIncomeId());
        dto.setProjectId(income.getProject().getProjectId());
        dto.setAmount(income.getAmount());
        dto.setDiscount(income.getDiscount() != null ? income.getDiscount() : 0);
        dto.setIncomeDate(income.getIncomeDate());
        dto.setType(income.getType());
        return dto;
    }
}
