package com.prodev.interior.repository;

import com.prodev.interior.domain.Income;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface IncomeRepository extends JpaRepository<Income, Long> {
    List<Income> findByProjectProjectIdOrderByIncomeDateDesc(Long projectId);
    void deleteByProjectProjectId(Long projectId);
}
