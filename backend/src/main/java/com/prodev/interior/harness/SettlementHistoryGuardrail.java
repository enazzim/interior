package com.prodev.interior.harness;

import org.springframework.stereotype.Component;
import java.time.LocalDate;

@Component
public class SettlementHistoryGuardrail {

    private static final int MIN_YEAR = 2000;
    
    /**
     * 조회 연도 범위를 안전하게 검증하고 보정합니다.
     */
    public int sanitizeYear(Integer year) {
        int currentYear = LocalDate.now().getYear();
        if (year == null || year < MIN_YEAR || year > currentYear + 1) {
            return currentYear;
        }
        return year;
    }
}
