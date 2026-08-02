package com.prodev.interior.controller;

import com.prodev.interior.domain.ProjectImage;
import com.prodev.interior.service.ProjectImageService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/projects/{projectId}/images")
@RequiredArgsConstructor
public class ProjectImageController {

    private final ProjectImageService projectImageService;

    @PostMapping
    public ResponseEntity<List<ProjectImage>> uploadImages(
            @PathVariable Long projectId,
            @RequestParam("files") List<MultipartFile> files) {
        
        List<ProjectImage> uploadedImages = projectImageService.uploadImages(projectId, files);
        return ResponseEntity.ok(uploadedImages);
    }

    @GetMapping
    public ResponseEntity<List<ProjectImage>> getImages(@PathVariable Long projectId) {
        List<ProjectImage> images = projectImageService.getImagesByProjectId(projectId);
        return ResponseEntity.ok(images);
    }

    @DeleteMapping("/{imageId}")
    public ResponseEntity<?> deleteImage(
            @PathVariable Long projectId,
            @PathVariable Long imageId) {
        projectImageService.deleteImage(imageId);
        return ResponseEntity.ok().build();
    }
}
