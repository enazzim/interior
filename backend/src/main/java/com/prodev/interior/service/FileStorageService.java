package com.prodev.interior.service;

import org.springframework.web.multipart.MultipartFile;
import java.io.IOException;

public interface FileStorageService {
    /**
     * 파일을 저장하고 내부에서 관리할 수 있는 고유 파일명(예: UUID 포함)을 반환합니다.
     */
    String upload(MultipartFile file) throws IOException;

    /**
     * 저장된 파일명에 접근할 수 있는 완전한 외부 URL을 반환합니다.
     */
    String getFileUrl(String filename);

    /**
     * 지정한 파일명의 물리 파일을 디스크 또는 스토리지에서 삭제합니다.
     */
    void delete(String filename) throws IOException;
}
