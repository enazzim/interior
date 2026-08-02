package com.prodev.interior.harness;

import com.prodev.interior.dto.EstimateCreateRequest;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.ArrayList;

import static org.junit.jupiter.api.Assertions.*;

class EstimateServiceTestHarness {

    private EstimateGuardrail estimateGuardrail;

    @BeforeEach
    void setUp() {
        estimateGuardrail = new EstimateGuardrail();
    }

    @Test
    @DisplayName("[Harness Guardrail] 음수 또는 범위 초과 마진율이 들어왔을 때 기본값(20%)으로 자동 보정되어야 한다")
    void testMarginRateGuardrail() {
        EstimateCreateRequest request = new EstimateCreateRequest();
        request.setMarginRate(99.0); // 초과값
        request.setItems(new ArrayList<>());

        EstimateCreateRequest sanitized = estimateGuardrail.sanitizeAndValidate(request);
        assertEquals(20.0, sanitized.getMarginRate());
    }

    @Test
    @DisplayName("[Harness Guardrail] 음수 수량이 포함되었을 때 0.0으로 자동 보정되어야 한다")
    void testNegativeAreaGuardrail() {
        EstimateCreateRequest request = new EstimateCreateRequest();
        request.setMarginRate(15.0);

        EstimateCreateRequest.EstimateItemRequest item = new EstimateCreateRequest.EstimateItemRequest();
        item.setInputArea(-50.0);
        
        ArrayList<EstimateCreateRequest.EstimateItemRequest> items = new ArrayList<>();
        items.add(item);
        request.setItems(items);

        EstimateCreateRequest sanitized = estimateGuardrail.sanitizeAndValidate(request);
        assertEquals(0.0, sanitized.getItems().get(0).getInputArea());
    }
}
