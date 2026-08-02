package com.prodev.interior.repository;
import com.prodev.interior.domain.EstimateItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface EstimateItemRepository extends JpaRepository<EstimateItem, Long> {
    List<EstimateItem> findByEstimateEstimateId(Long estimateId);
    void deleteByEstimateProjectProjectId(Long projectId);
}
