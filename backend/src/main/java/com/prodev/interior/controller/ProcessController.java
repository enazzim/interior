package com.prodev.interior.controller;

import com.prodev.interior.domain.Process;
import com.prodev.interior.dto.ProcessDTO;
import com.prodev.interior.service.ProcessService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/processes")
@RequiredArgsConstructor
public class ProcessController {

    private final ProcessService processService;

    @GetMapping
    public ResponseEntity<List<Process>> getAllProcesses() {
        return ResponseEntity.ok(processService.getAllProcesses());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Process> getProcessById(@PathVariable Long id) {
        return ResponseEntity.ok(processService.getProcessById(id));
    }

    @PostMapping
    public ResponseEntity<Process> createProcess(@RequestBody ProcessDTO dto) {
        return ResponseEntity.ok(processService.createProcess(dto));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Process> updateProcess(@PathVariable Long id, @RequestBody ProcessDTO dto) {
        return ResponseEntity.ok(processService.updateProcess(id, dto));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteProcess(@PathVariable Long id) {
        processService.deleteProcess(id);
        return ResponseEntity.noContent().build();
    }
}
