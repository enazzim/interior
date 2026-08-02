package com.prodev.interior.service;

import com.prodev.interior.domain.Process;
import com.prodev.interior.dto.ProcessDTO;
import com.prodev.interior.repository.ProcessRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ProcessService {

    private final ProcessRepository processRepository;

    public List<Process> getAllProcesses() {
        return processRepository.findAll();
    }

    public Process getProcessById(Long processId) {
        return processRepository.findById(processId)
                .orElseThrow(() -> new IllegalArgumentException("Invalid process ID: " + processId));
    }

    @Transactional
    public Process createProcess(ProcessDTO dto) {
        Process process = Process.builder()
                .processName(dto.getProcessName())
                .sortOrder(dto.getSortOrder())
                .build();
        return processRepository.save(process);
    }

    @Transactional
    public Process updateProcess(Long processId, ProcessDTO dto) {
        Process process = getProcessById(processId);
        process.updateProcessInfo(dto.getProcessName(), dto.getSortOrder());
        return process;
    }

    @Transactional
    public void deleteProcess(Long processId) {
        Process process = getProcessById(processId);
        processRepository.delete(process);
    }
}
