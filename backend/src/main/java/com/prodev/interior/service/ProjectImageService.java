package com.prodev.interior.service;

import com.prodev.interior.domain.Project;
import com.prodev.interior.domain.ProjectImage;
import com.prodev.interior.repository.ProjectImageRepository;
import com.prodev.interior.repository.ProjectRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class ProjectImageService {

    private final ProjectRepository projectRepository;
    private final ProjectImageRepository projectImageRepository;
    private final FileStorageService fileStorageService;

    @Transactional
    public List<ProjectImage> uploadImages(Long projectId, List<MultipartFile> files) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new IllegalArgumentException("현장을 찾을 수 없습니다: " + projectId));

        List<ProjectImage> savedImages = new ArrayList<>();

        for (MultipartFile file : files) {
            try {
                String uuidFileName = fileStorageService.upload(file);
                String imageUrl = fileStorageService.getFileUrl(uuidFileName);

                ProjectImage projectImage = ProjectImage.builder()
                        .project(project)
                        .originalFileName(file.getOriginalFilename())
                        .uuidFileName(uuidFileName)
                        .imageUrl(imageUrl)
                        .build();

                savedImages.add(projectImageRepository.save(projectImage));
            } catch (IOException e) {
                log.error("S3 파일 업로드 중 오류 발생", e);
                throw new RuntimeException("파일 업로드에 실패했습니다.", e);
            }
        }

        return savedImages;
    }

    @Transactional(readOnly = true)
    public List<ProjectImage> getImagesByProjectId(Long projectId) {
        return projectImageRepository.findByProject_ProjectId(projectId);
    }

    @Transactional
    public void deleteImage(Long imageId) {
        ProjectImage projectImage = projectImageRepository.findById(imageId)
                .orElseThrow(() -> new IllegalArgumentException("이미지를 찾을 수 없습니다: " + imageId));

        try {
            fileStorageService.delete(projectImage.getUuidFileName());
        } catch (IOException e) {
            log.error("물리 파일 삭제 실패: {}", projectImage.getUuidFileName(), e);
        }

        projectImageRepository.delete(projectImage);
    }
}
