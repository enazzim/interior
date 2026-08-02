package com.prodev.interior.controller;

import com.prodev.interior.domain.Project;
import com.prodev.interior.dto.ProjectCreateRequest;
import com.prodev.interior.dto.ProjectUpdateRequest;
import com.prodev.interior.dto.ProjectStatusUpdateRequest;
import com.prodev.interior.service.ProjectService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/projects")
@RequiredArgsConstructor
public class ProjectController {

    private final ProjectService projectService;

    @GetMapping
    public ResponseEntity<List<Project>> getAllProjects() {
        return ResponseEntity.ok(projectService.getAllProjects());
    }

    @PostMapping
    public ResponseEntity<Project> createProject(@RequestBody ProjectCreateRequest request) {
        Project created = projectService.createProject(request.getProjectName(), request.getAddress(), request.getClientVendorId());
        return ResponseEntity.ok(created);
    }

    @GetMapping("/{id}")
    public ResponseEntity<Project> getProject(@PathVariable Long id) {
        return ResponseEntity.ok(projectService.getProjectById(id));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Project> updateProject(@PathVariable Long id, @RequestBody ProjectUpdateRequest request) {
        Project updated = projectService.updateProject(id, request.getProjectName(), request.getAddress(), request.getClientVendorId());
        return ResponseEntity.ok(updated);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteProject(@PathVariable Long id) {
        projectService.deleteProject(id);
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/{projectId}/status")
    public ResponseEntity<Project> updateProjectStatus(@PathVariable Long projectId, @RequestBody ProjectStatusUpdateRequest request) {
        Project updated = projectService.updateProjectStatus(projectId, request.getStatus());
        return ResponseEntity.ok(updated);
    }

    @GetMapping("/{projectId}/histories")
    public ResponseEntity<List<com.prodev.interior.dto.ProjectHistoryDTO>> getProjectHistories(@PathVariable Long projectId) {
        List<com.prodev.interior.domain.ProjectStateHistory> histories = projectService.getProjectStateHistories(projectId);
        List<com.prodev.interior.dto.ProjectHistoryDTO> dtos = histories.stream()
                .map(h -> com.prodev.interior.dto.ProjectHistoryDTO.builder()
                        .historyId(h.getHistoryId())
                        .projectId(h.getProject().getProjectId())
                        .fromStatus(h.getFromStatus())
                        .toStatus(h.getToStatus())
                        .changedByName(h.getChangedBy() != null ? h.getChangedBy().getUsername() : "시스템")
                        .createdAt(h.getCreatedAt())
                        .build())
                .collect(java.util.stream.Collectors.toList());
        return ResponseEntity.ok(dtos);
    }
}
