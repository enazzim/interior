package com.prodev.interior.repository;
import com.prodev.interior.domain.Process;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
@Repository
public interface ProcessRepository extends JpaRepository<Process, Long> {}
