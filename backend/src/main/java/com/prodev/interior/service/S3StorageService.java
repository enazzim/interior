package com.prodev.interior.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import software.amazon.awssdk.auth.credentials.AwsBasicCredentials;
import software.amazon.awssdk.auth.credentials.StaticCredentialsProvider;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;

import jakarta.annotation.PostConstruct;
import java.io.IOException;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
@ConditionalOnProperty(name = "app.storage.type", havingValue = "s3")
public class S3StorageService implements FileStorageService {

    @Value("${cloud.aws.s3.bucket:dummy-bucket}")
    private String bucket;

    @Value("${cloud.aws.credentials.access-key:dummy-access-key}")
    private String accessKey;

    @Value("${cloud.aws.credentials.secret-key:dummy-secret-key}")
    private String secretKey;

    @Value("${cloud.aws.region.static:ap-northeast-2}")
    private String region;

    private S3Client s3Client;

    @PostConstruct
    public void init() {
        if ("dummy-access-key".equals(accessKey)) {
            log.warn("AWS S3 자격 증명이 설정되지 않았습니다. 파일 업로드 시 예외가 발생할 수 있습니다.");
        }
        
        AwsBasicCredentials credentials = AwsBasicCredentials.create(accessKey, secretKey);
        this.s3Client = S3Client.builder()
                .region(Region.of(region))
                .credentialsProvider(StaticCredentialsProvider.create(credentials))
                .build();
    }

    /**
     * S3에 파일을 업로드하고 생성된 UUID 파일명을 반환합니다.
     */
    @Override
    public String upload(MultipartFile multipartFile) throws IOException {
        String originalFileName = multipartFile.getOriginalFilename();
        if (originalFileName == null) {
            originalFileName = "unknown.png";
        }
        String uuidFileName = UUID.randomUUID().toString() + "_" + originalFileName;

        PutObjectRequest putObjectRequest = PutObjectRequest.builder()
                .bucket(bucket)
                .key(uuidFileName)
                .contentType(multipartFile.getContentType())
                .build();

        s3Client.putObject(putObjectRequest, RequestBody.fromInputStream(multipartFile.getInputStream(), multipartFile.getSize()));

        return uuidFileName;
    }

    /**
     * S3에 저장된 파일의 외부 접근용(퍼블릭) URL을 반환합니다.
     */
    @Override
    public String getFileUrl(String uuidFileName) {
        return String.format("https://%s.s3.%s.amazonaws.com/%s", bucket, region, uuidFileName);
    }

    @Override
    public void delete(String uuidFileName) throws IOException {
        software.amazon.awssdk.services.s3.model.DeleteObjectRequest deleteObjectRequest = software.amazon.awssdk.services.s3.model.DeleteObjectRequest.builder()
                .bucket(bucket)
                .key(uuidFileName)
                .build();
        s3Client.deleteObject(deleteObjectRequest);
        log.info("S3 물리 파일을 삭제했습니다: {}", uuidFileName);
    }
}
