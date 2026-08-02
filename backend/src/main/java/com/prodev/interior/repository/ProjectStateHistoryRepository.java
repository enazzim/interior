package com.prodev.interior.repository;

import com.prodev.interior.domain.ProjectStateHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface ProjectStateHistoryRepository extends JpaRepository<ProjectStateHistory, Long> {
    List<ProjectStateHistory> findByProjectProjectIdOrderByCreatedAtDesc(Long projectId);
    void deleteByProjectProjectId(Long projectId);

    @Modifying(clearAutomatically = true)
    @Query("update ProjectStateHistory h set h.changedBy = null where h.changedBy.userId = :userId")
    void nullifyChangedBy(@Param("userId") Long userId);
}
