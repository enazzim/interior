package com.prodev.interior.dto;

import lombok.Data;
import java.util.List;

@Data
public class EstimateCreateRequest {
    private Long projectId;
    private Long clientVendorId;
    private Long authorUserId;
    private Double marginRate; // 사용자가 동적으로 설정한 마진율
    private List<EstimateItemRequest> items;

    @Data
    public static class EstimateItemRequest {
        private Long materialId;
        private Double inputArea; // 현장 실측 면적 (㎡)
    }
}
