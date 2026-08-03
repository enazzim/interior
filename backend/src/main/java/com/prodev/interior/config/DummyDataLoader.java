package com.prodev.interior.config;

import com.prodev.interior.repository.CompanyRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.io.ClassPathResource;
import org.springframework.jdbc.datasource.init.ResourceDatabasePopulator;
import org.springframework.stereotype.Component;

import javax.sql.DataSource;

@Component
@RequiredArgsConstructor
public class DummyDataLoader implements CommandLineRunner {

    private final CompanyRepository companyRepository;
    private final DataSource dataSource;

    @Override
    public void run(String... args) throws Exception {
        // DB에 이미 데이터가 있으면 시드 쿼리 주입 전면 스킵!
        if (companyRepository.count() > 0) {
            System.out.println("ℹ️ [SYSTEM] DB에 이미 기존 데이터가 존재하여 SQL 시드 주입을 안전하게 스킵(Skip)합니다.");
            return;
        }

        // DB가 완전히 비어있는 극초기 1회만 data.sql 시드 쿼리 직접 실행
        System.out.println("🌱 [SYSTEM] DB가 빈 상태입니다. data.sql 기초 마스터 시드 쿼리를 직접 실행합니다...");
        try {
            ResourceDatabasePopulator populator = new ResourceDatabasePopulator();
            populator.addScript(new ClassPathResource("data.sql"));
            populator.execute(dataSource);
            System.out.println("✅ [SYSTEM] data.sql 시드 쿼리 주입이 성공적으로 완료되었습니다!");
        } catch (Exception e) {
            System.err.println("⚠️ [SYSTEM] data.sql 시드 실행 중 안내: " + e.getMessage());
        }
    }
}
