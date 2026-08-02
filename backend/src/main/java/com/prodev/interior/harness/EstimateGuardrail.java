package com.prodev.interior.harness;

import com.prodev.interior.dto.EstimateCreateRequest;
import org.springframework.stereotype.Component;

import java.util.ArrayList;

@Component
public class EstimateGuardrail {

    private static final double MIN_MARGIN_RATE = 0.0;
    private static final double MAX_MARGIN_RATE = 50.0; // Max 50%
    private static final double DEFAULT_MARGIN_RATE = 20.0;

    /**
     * AI Agent 또는 외부 시스템에서 생성된 EstimateCreateRequest DTO의 유효성을 검증하고 가드레일을 적용합니다.
     */
    public EstimateCreateRequest sanitizeAndValidate(EstimateCreateRequest request) {
        if (request == null) {
            throw new IllegalArgumentException("Estimate request cannot be null.");
        }

        // 1. 마진율 가드레일 (0% ~ 50% 범위로 보정)
        Double marginRate = request.getMarginRate();
        if (marginRate == null || marginRate < MIN_MARGIN_RATE || marginRate > MAX_MARGIN_RATE) {
            request.setMarginRate(DEFAULT_MARGIN_RATE);
        }

        // 2. 견적 항목 리스트 보정
        if (request.getItems() == null) {
            request.setItems(new ArrayList<>());
        }

        // 3. 각 항목 수량 가드레일 (음수 수량 방지)
        for (EstimateCreateRequest.EstimateItemRequest item : request.getItems()) {
            if (item.getInputArea() == null || item.getInputArea() < 0) {
                item.setInputArea(0.0);
            }
        }

        return request;
    }
}
