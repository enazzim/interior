package com.prodev.interior.service;

import com.prodev.interior.domain.Company;
import com.prodev.interior.dto.CompanyDTO;
import com.prodev.interior.repository.CompanyRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class CompanyService {

    private final CompanyRepository companyRepository;

    public Company getCompanyById(Long companyId) {
        return companyRepository.findById(companyId)
                .orElseThrow(() -> new IllegalArgumentException("Invalid company ID: " + companyId));
    }

    @Transactional
    public Company updateCompany(Long companyId, CompanyDTO dto) {
        Company company = getCompanyById(companyId);
        company.updateCompanyInfo(
                dto.getCompanyName(), 
                dto.getBusinessNumber(), 
                dto.getAddress(), 
                dto.getSubscriptionPlan(),
                dto.getTel(),
                dto.getFax(),
                dto.getBusinessType(),
                dto.getBusinessItem(),
                dto.getCeoName()
        );
        return company;
    }
}
