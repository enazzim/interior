package com.prodev.interior.harness;

import com.prodev.interior.dto.EstimateCreateRequest;
import com.prodev.interior.dto.EstimateResponse;
import com.prodev.interior.service.EstimateService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class AgentToolAdapter {

    private final EstimateService estimateService;
    private final EstimateGuardrail estimateGuardrail;

    /**
     * AI Agent가 견적 생성을 요청할 때 통과하는 안전한 Tool Adapter 메소드.
     * LLM이 생성한 요청에 대해 Guardrail 검증을 거친 후 비즈니스 로직을 호출합니다.
     */
    public EstimateResponse executeEstimateTool(EstimateCreateRequest rawRequest) {
        EstimateCreateRequest sanitizedRequest = estimateGuardrail.sanitizeAndValidate(rawRequest);
        return estimateService.createEstimate(sanitizedRequest);
    }
}
