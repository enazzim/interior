package com.prodev.interior.dto;

import lombok.Builder;
import lombok.Data;
import java.util.List;
import java.time.LocalDateTime;

@Data
@Builder
public class EstimateResponse {
    private Long estimateId;
    private Long projectId;
    private String projectName;
    private Long clientVendorId;
    private String clientVendorName;
    private Integer version;
    private Integer totalAmount;
    private Double marginRate; // 적용된 마진율
    private LocalDateTime createdAt;
    
    // 회사 메타 정보 바인딩용 필드 추가
    private String companyName;
    private String companyBusinessNumber;
    private String companyAddress;
    private String companyTel;
    private String companyFax;
    private String companyBusinessType;
    private String companyBusinessItem;
    private String companyCeoName;

    private List<EstimateItemResponse> items;

    @Data
    @Builder
    public static class EstimateItemResponse {
        private Long itemId;
        private Long materialId;
        private String materialName;
        private Double inputArea; // ㎡
        private Double calculatedQty; // 발주 수량 (Box 등)
        private String distributionUnit; // 발주 단위 (Box, Roll 등)
        private Integer materialCost; // 사내 원가 (권한에 따라 Null 처리됨)
        private Integer laborCost; // 인건비
        private Integer customerUnitPrice; // 고객 청구 단가
        private String specification; // 자재 규격
        private String itemType; // MATERIAL, LABOR
    }
}
