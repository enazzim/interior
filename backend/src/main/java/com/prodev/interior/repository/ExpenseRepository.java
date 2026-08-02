package com.prodev.interior.repository;

import com.prodev.interior.domain.Expense;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface ExpenseRepository extends JpaRepository<Expense, Long> {
    List<Expense> findByProjectProjectIdOrderByExpenseDateDesc(Long projectId);
    void deleteByProjectProjectId(Long projectId);
}
