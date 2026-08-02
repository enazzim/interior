package com.prodev.interior.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

import jakarta.annotation.PostConstruct;
import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.UUID;

@Slf4j
@Service
@ConditionalOnProperty(name = "app.storage.type", havingValue = "local", matchIfMissing = true)
public class LocalStorageService implements FileStorageService {

    private Path uploadPath;

    @PostConstruct
    public void init() {
        String appDataDir = System.getenv("APPDATA");
        if (appDataDir == null) {
            appDataDir = System.getProperty("user.home") + "/AppData/Roaming";
        }
        uploadPath = Paths.get(appDataDir, "InteriorERP", "images");

        try {
            if (!Files.exists(uploadPath)) {
                Files.createDirectories(uploadPath);
                log.info("로컬 이미지 저장소 디렉토리를 생성했습니다: {}", uploadPath.toAbsolutePath());
            } else {
                log.info("로컬 이미지 저장소가 존재합니다: {}", uploadPath.toAbsolutePath());
            }
        } catch (IOException e) {
            log.error("로컬 이미지 저장소 디렉토리를 생성할 수 없습니다.", e);
            throw new RuntimeException("Could not initialize storage", e);
        }
    }

    @Override
    public String upload(MultipartFile file) throws IOException {
        String originalFileName = file.getOriginalFilename();
        if (originalFileName == null) {
            originalFileName = "unknown.png";
        }
        String uuidFileName = UUID.randomUUID().toString() + "_" + originalFileName;
        Path targetLocation = this.uploadPath.resolve(uuidFileName);
        
        file.transferTo(targetLocation.toFile());
        log.info("로컬에 파일을 저장했습니다: {}", targetLocation.toAbsolutePath());
        
        return uuidFileName;
    }

    @Override
    public String getFileUrl(String uuidFileName) {
        // http://localhost:38080/images/파일명
        return ServletUriComponentsBuilder.fromCurrentContextPath()
                .path("/images/")
                .path(uuidFileName)
                .toUriString();
    }

    @Override
    public void delete(String uuidFileName) throws IOException {
        Path filePath = this.uploadPath.resolve(uuidFileName);
        Files.deleteIfExists(filePath);
        log.info("로컬 물리 파일을 삭제했습니다: {}", filePath.toAbsolutePath());
    }
}
