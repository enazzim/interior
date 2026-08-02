package com.prodev.interior.repository;

import com.prodev.interior.domain.ProjectImage;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ProjectImageRepository extends JpaRepository<ProjectImage, Long> {
    List<ProjectImage> findByProject_ProjectId(Long projectId);
}
