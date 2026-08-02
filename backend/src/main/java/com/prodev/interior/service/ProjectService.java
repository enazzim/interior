package com.prodev.interior.service;

import com.prodev.interior.domain.Project;
import com.prodev.interior.domain.Company;
import com.prodev.interior.domain.Vendor;
import com.prodev.interior.domain.ProjectStateHistory;
import com.prodev.interior.domain.User;
import com.prodev.interior.repository.ProjectRepository;
import com.prodev.interior.repository.CompanyRepository;
import com.prodev.interior.repository.VendorRepository;
import com.prodev.interior.repository.ProjectStateHistoryRepository;
import com.prodev.interior.repository.UserRepository;
import com.prodev.interior.repository.IncomeRepository;
import com.prodev.interior.repository.ExpenseRepository;
import com.prodev.interior.repository.EstimateRepository;
import com.prodev.interior.repository.EstimateItemRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ProjectService {

    private final ProjectRepository projectRepository;
    private final CompanyRepository companyRepository;
    private final VendorRepository vendorRepository;
    private final ProjectStateHistoryRepository projectStateHistoryRepository;
    private final UserRepository userRepository;
    private final IncomeRepository incomeRepository;
    private final ExpenseRepository expenseRepository;
    private final EstimateRepository estimateRepository;
    private final EstimateItemRepository estimateItemRepository;

    public List<Project> getAllProjects() {
        // 실제로는 Company ID별로 필터링해야 하지만 MVP 수준에서는 모두 반환
        return projectRepository.findAll();
    }

    @Transactional
    public Project createProject(String projectName, String address, Long clientVendorId) {
        Company company = companyRepository.findById(1L)
                .orElseThrow(() -> new RuntimeException("Company not found"));

        Vendor clientVendor = null;
        if (clientVendorId != null && clientVendorId > 0) {
            clientVendor = vendorRepository.findById(clientVendorId).orElse(null);
        }
            
        Project newProject = Project.builder()
                .company(company)
                .projectName(projectName)
                .address(address)
                .clientVendor(clientVendor)
                .status("견적중") // 기본 상태는 항상 견적중
                .build();
                
        Project savedProject = projectRepository.save(newProject);

        // 최초 현장 등록 이력 로깅
        User admin = userRepository.findById(1L).orElse(null);
        ProjectStateHistory history = ProjectStateHistory.builder()
                .project(savedProject)
                .fromStatus(null)
                .toStatus("견적중")
                .changedBy(admin)
                .build();
        projectStateHistoryRepository.save(history);

        return savedProject;
    }

    public Project getProjectById(Long projectId) {
        return projectRepository.findById(projectId)
                .orElseThrow(() -> new RuntimeException("Project not found with id " + projectId));
    }

    @Transactional
    public Project updateProject(Long projectId, String projectName, String address, Long clientVendorId) {
        Project project = getProjectById(projectId);
        Vendor clientVendor = null;
        if (clientVendorId != null && clientVendorId > 0) {
            clientVendor = vendorRepository.findById(clientVendorId)
                    .orElseThrow(() -> new IllegalArgumentException("Invalid client vendor ID: " + clientVendorId));
        }
        project.updateProjectInfo(projectName, address, clientVendor);
        return project;
    }

    @Transactional
    public void deleteProject(Long projectId) {
        Project project = getProjectById(projectId);

        // '완료' 상태의 프로젝트는 삭제를 금지함
        if ("완료".equals(project.getStatus())) {
            throw new IllegalStateException("완료(정산) 상태의 현장은 삭제할 수 없습니다.");
        }

        // 연관 데이터 일괄 종속 삭제 (순서 주의: 자식 -> 부모)
        projectStateHistoryRepository.deleteByProjectProjectId(projectId);
        incomeRepository.deleteByProjectProjectId(projectId);
        expenseRepository.deleteByProjectProjectId(projectId);
        estimateItemRepository.deleteByEstimateProjectProjectId(projectId);
        estimateRepository.deleteByProjectProjectId(projectId);

        // 부모 엔티티 삭제
        projectRepository.delete(project);
    }

    @Transactional
    public Project updateProjectStatus(Long projectId, String status) {
        Project project = getProjectById(projectId);
        String fromStatus = project.getStatus();

        if (!status.equals(fromStatus)) {
            project.updateStatus(status);

            // 상태 변경 이력 로깅
            User admin = userRepository.findById(1L).orElse(null);
            ProjectStateHistory history = ProjectStateHistory.builder()
                    .project(project)
                    .fromStatus(fromStatus)
                    .toStatus(status)
                    .changedBy(admin)
                    .build();
            projectStateHistoryRepository.save(history);
        }
        return project;
    }

    public List<ProjectStateHistory> getProjectStateHistories(Long projectId) {
        return projectStateHistoryRepository.findByProjectProjectIdOrderByCreatedAtDesc(projectId);
    }
}
