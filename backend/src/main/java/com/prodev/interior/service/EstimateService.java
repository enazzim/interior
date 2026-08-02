package com.prodev.interior.service;

import com.prodev.interior.domain.*;
import com.prodev.interior.dto.EstimateCreateRequest;
import com.prodev.interior.dto.EstimateResponse;
import com.prodev.interior.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class EstimateService {

    private final EstimateRepository estimateRepository;
    private final EstimateItemRepository estimateItemRepository;
    private final ProjectRepository projectRepository;
    private final MaterialRepository materialRepository;
    private final UserRepository userRepository;
    private final VendorRepository vendorRepository;
    private final CompanyRepository companyRepository;

    private static final double DEFAULT_MARGIN_RATE = 0.20; // 20% 마진율

    @Transactional
    public EstimateResponse createEstimate(EstimateCreateRequest request) {
        // 1. 엔티티 조회
        Project project = projectRepository.findById(request.getProjectId())
                .orElseThrow(() -> new IllegalArgumentException("Invalid project ID"));
        User user = userRepository.findById(request.getAuthorUserId()).orElse(null);
        if (user == null) {
            user = userRepository.findAll().stream().findFirst().orElse(null);
            if (user == null) {
                Company company = companyRepository.findAll().stream().findFirst().orElse(null);
                if (company == null) {
                    company = Company.builder()
                            .companyName("기본 회사")
                            .businessNumber("000-00-00000")
                            .ceoName("관리자")
                            .address("기본 주소")
                            .subscriptionPlan("LITE")
                            .build();
                    company = companyRepository.save(company);
                }
                user = User.builder()
                        .company(company)
                        .username("관리자")
                        .loginId("admin")
                        .password("admin123")
                        .role("ADMIN")
                        .build();
                user = userRepository.save(user);
            }
        }
        Vendor clientVendor = request.getClientVendorId() != null ? 
                vendorRepository.findById(request.getClientVendorId()).orElse(null) : null;

        // 2. 마진율 확인 및 설정
        double marginRate = request.getMarginRate() != null ? request.getMarginRate() / 100.0 : DEFAULT_MARGIN_RATE;

        // 3. 견적 마스터 생성
        Estimate estimate = Estimate.builder()
                .project(project)
                .authorUser(user)
                .clientVendor(clientVendor)
                .version(1)
                .isFinal(false)
                .marginRate(marginRate)
                .totalAmount(0) // 아래에서 누적 후 업데이트
                .build();
        estimate = estimateRepository.save(estimate);

        int totalAmount = 0;

        // 4. 견적 항목(Item) 자동 계산 및 저장
        for (EstimateCreateRequest.EstimateItemRequest itemReq : request.getItems()) {
            Material material = materialRepository.findById(itemReq.getMaterialId())
                    .orElseThrow(() -> new IllegalArgumentException("Invalid material ID"));

            // [핵심 로직 1] 단위 환산 (올림 처리)
            double calculatedQty = Math.ceil(itemReq.getInputArea() / material.getConversionRate());

            // [핵심 로직 2 & 3] 사내 원가 및 고객 청구 단가 계산 (자재비 vs 인건비 분리)
            int materialCost = 0;
            int laborCost = 0;
            int customerUnitPrice = 0;

            if (material.getItemType() == com.prodev.interior.domain.ItemType.LABOR) {
                laborCost = material.getLaborPrice();
                customerUnitPrice = laborCost;
            } else {
                materialCost = (int) (calculatedQty * material.getPurchasePrice());
                customerUnitPrice = material.getPurchasePrice();
            }

            // 엔티티 생성
            EstimateItem estimateItem = EstimateItem.builder()
                    .estimate(estimate)
                    .material(material)
                    .inputArea(itemReq.getInputArea())
                    .calculatedQty(calculatedQty)
                    .materialCost(materialCost)
                    .laborCost(laborCost)
                    .customerUnitPrice(customerUnitPrice)
                    .build();
            estimateItemRepository.save(estimateItem);

            totalAmount += (int) (customerUnitPrice * calculatedQty);
        }

        // 마진율을 전체 합계에 일괄 적용
        totalAmount = (int) (totalAmount * (1 + marginRate));

        // 총 금액 업데이트 및 DB 반영
        estimate.updateTotalAmount(totalAmount);
        estimateRepository.save(estimate);
        
        return convertToResponse(estimate);
    }

    @Transactional(readOnly = true)
    public List<EstimateResponse> getEstimatesByProject(Long projectId) {
        List<Estimate> estimates = estimateRepository.findByProjectProjectIdOrderByCreatedAtDesc(projectId);
        return estimates.stream()
                .map(this::convertToResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public EstimateResponse getEstimateById(Long estimateId) {
        Estimate estimate = estimateRepository.findById(estimateId)
                .orElseThrow(() -> new IllegalArgumentException("견적서를 찾을 수 없습니다: " + estimateId));
        return convertToResponse(estimate);
    }

    private EstimateResponse convertToResponse(Estimate estimate) {
        List<EstimateItem> items = estimateItemRepository.findByEstimateEstimateId(estimate.getEstimateId());
        List<EstimateResponse.EstimateItemResponse> itemResponses = items.stream()
                .map(item -> EstimateResponse.EstimateItemResponse.builder()
                        .itemId(item.getItemId())
                        .materialId(item.getMaterial().getMaterialId())
                        .materialName(item.getMaterial().getMaterialName())
                        .inputArea(item.getInputArea())
                        .calculatedQty(item.getCalculatedQty())
                        .distributionUnit(item.getMaterial().getDistributionUnit())
                        .materialCost(item.getMaterialCost())
                        .laborCost(item.getLaborCost())
                        .customerUnitPrice(item.getCustomerUnitPrice())
                        .specification(item.getMaterial().getSpecification())
                        .itemType(item.getMaterial().getItemType() != null ? item.getMaterial().getItemType().name() : "MATERIAL")
                        .build())
                .collect(Collectors.toList());

        com.prodev.interior.domain.Company comp = estimate.getProject().getCompany();

        return EstimateResponse.builder()
                .estimateId(estimate.getEstimateId())
                .projectId(estimate.getProject().getProjectId())
                .projectName(estimate.getProject().getProjectName())
                .clientVendorId(estimate.getClientVendor() != null ? estimate.getClientVendor().getVendorId() : null)
                .clientVendorName(estimate.getClientVendor() != null ? estimate.getClientVendor().getVendorName() : null)
                .version(estimate.getVersion())
                .totalAmount(estimate.getTotalAmount())
                .marginRate(estimate.getMarginRate() != null ? estimate.getMarginRate() * 100.0 : 20.0)
                .createdAt(estimate.getCreatedAt())
                .companyName(comp != null ? comp.getCompanyName() : null)
                .companyBusinessNumber(comp != null ? comp.getBusinessNumber() : null)
                .companyAddress(comp != null ? comp.getAddress() : null)
                .companyTel(comp != null ? comp.getTel() : null)
                .companyFax(comp != null ? comp.getFax() : null)
                .companyBusinessType(comp != null ? comp.getBusinessType() : null)
                .companyBusinessItem(comp != null ? comp.getBusinessItem() : null)
                .companyCeoName(comp != null ? comp.getCeoName() : null)
                .items(itemResponses)
                .build();
    }
}
