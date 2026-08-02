package com.prodev.interior.service;

import com.prodev.interior.domain.Vendor;
import com.prodev.interior.domain.Company;
import com.prodev.interior.dto.VendorDTO;
import com.prodev.interior.repository.VendorRepository;
import com.prodev.interior.repository.CompanyRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class VendorService {

    private final VendorRepository vendorRepository;
    private final CompanyRepository companyRepository;

    public List<Vendor> getAllVendors() {
        return vendorRepository.findAll();
    }

    public Vendor getVendorById(Long vendorId) {
        return vendorRepository.findById(vendorId)
                .orElseThrow(() -> new IllegalArgumentException("Invalid vendor ID: " + vendorId));
    }

    @Transactional
    public Vendor createVendor(VendorDTO dto) {
        Company company = companyRepository.findById(1L)
                .orElseThrow(() -> new RuntimeException("Default Company not found"));

        Vendor vendor = Vendor.builder()
                .company(company)
                .vendorName(dto.getVendorName())
                .vendorType(dto.getVendorType())
                .businessType(dto.getBusinessType())
                .businessNumber(dto.getBusinessNumber())
                .address(dto.getAddress())
                .contactPerson(dto.getContactPerson())
                .accountInfo(dto.getAccountInfo())
                .build();

        return vendorRepository.save(vendor);
    }

    @Transactional
    public Vendor updateVendor(Long vendorId, VendorDTO dto) {
        Vendor vendor = getVendorById(vendorId);
        vendor.updateVendorInfo(
                dto.getVendorName(),
                dto.getVendorType(),
                dto.getBusinessType(),
                dto.getBusinessNumber(),
                dto.getAddress(),
                dto.getContactPerson(),
                dto.getAccountInfo()
        );
        return vendor;
    }

    @Transactional
    public void deleteVendor(Long vendorId) {
        Vendor vendor = getVendorById(vendorId);
        vendorRepository.delete(vendor);
    }
}
