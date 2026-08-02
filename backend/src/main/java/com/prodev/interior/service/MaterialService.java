package com.prodev.interior.service;

import com.prodev.interior.domain.Material;
import com.prodev.interior.domain.Company;
import com.prodev.interior.domain.Process;
import com.prodev.interior.dto.MaterialCreateRequest;
import com.prodev.interior.dto.MaterialUpdateRequest;
import com.prodev.interior.repository.MaterialRepository;
import com.prodev.interior.repository.CompanyRepository;
import com.prodev.interior.repository.ProcessRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class MaterialService {

    private final MaterialRepository materialRepository;
    private final CompanyRepository companyRepository;
    private final ProcessRepository processRepository;

    public List<Material> getAllMaterials() {
        return materialRepository.findAll();
    }

    public Material getMaterialById(Long materialId) {
        return materialRepository.findById(materialId)
                .orElseThrow(() -> new IllegalArgumentException("Invalid material ID: " + materialId));
    }

    @Transactional
    public Material createMaterial(MaterialCreateRequest request) {
        Company company = companyRepository.findById(1L)
                .orElseThrow(() -> new RuntimeException("Default Company (1) not found"));

        Process process = processRepository.findById(request.getProcessId())
                .orElseThrow(() -> new IllegalArgumentException("Invalid process ID: " + request.getProcessId()));

        com.prodev.interior.domain.ItemType itemType = request.getItemType() != null 
                ? request.getItemType() 
                : com.prodev.interior.domain.ItemType.MATERIAL;

        int finalPurchasePrice = itemType == com.prodev.interior.domain.ItemType.MATERIAL ? request.getPurchasePrice() : 0;
        int finalLaborPrice = itemType == com.prodev.interior.domain.ItemType.LABOR ? request.getLaborPrice() : 0;

        Material material = Material.builder()
                .company(company)
                .process(process)
                .materialName(request.getMaterialName())
                .standardUnit(request.getStandardUnit())
                .distributionUnit(request.getDistributionUnit())
                .conversionRate(request.getConversionRate())
                .purchasePrice(finalPurchasePrice)
                .laborPrice(finalLaborPrice)
                .specification(request.getSpecification())
                .itemType(itemType)
                .build();

        return materialRepository.save(material);
    }

    @Transactional
    public Material updateMaterial(Long materialId, MaterialUpdateRequest request) {
        Material material = getMaterialById(materialId);

        Process process = processRepository.findById(request.getProcessId())
                .orElseThrow(() -> new IllegalArgumentException("Invalid process ID: " + request.getProcessId()));

        com.prodev.interior.domain.ItemType itemType = request.getItemType() != null 
                ? request.getItemType() 
                : com.prodev.interior.domain.ItemType.MATERIAL;

        int finalPurchasePrice = itemType == com.prodev.interior.domain.ItemType.MATERIAL ? request.getPurchasePrice() : 0;
        int finalLaborPrice = itemType == com.prodev.interior.domain.ItemType.LABOR ? request.getLaborPrice() : 0;

        material.updateMaterialInfo(
                request.getMaterialName(),
                request.getStandardUnit(),
                request.getDistributionUnit(),
                request.getConversionRate(),
                finalPurchasePrice,
                finalLaborPrice,
                process,
                request.getSpecification(),
                itemType
        );

        return material;
    }

    @Transactional
    public void deleteMaterial(Long materialId) {
        Material material = getMaterialById(materialId);
        materialRepository.delete(material);
    }
}
