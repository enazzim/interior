package com.prodev.interior.config;

import com.prodev.interior.domain.*;
import com.prodev.interior.domain.Process;
import com.prodev.interior.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class DummyDataLoader implements CommandLineRunner {

    private final CompanyRepository companyRepository;
    private final UserRepository userRepository;
    private final ProjectRepository projectRepository;
    private final MaterialRepository materialRepository;
    private final VendorRepository vendorRepository;
    private final ProcessRepository processRepository;
    private final org.springframework.security.crypto.password.PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) throws Exception {
        // 1. 기본 회사 데이터 셋업
        Company company = null;
        if (companyRepository.count() == 0) {
            company = Company.builder()
                    .companyName("프로데브 인테리어")
                    .businessNumber("123-45-67890")
                    .address("서울시 강남구 테헤란로 123")
                    .subscriptionPlan("PREMIUM")
                    .tel("02-555-1234")
                    .fax("02-555-5678")
                    .businessType("서비스 / 건설")
                    .businessItem("실내건축 / 인테리어 디자인")
                    .ceoName("이해동")
                    .build();
            companyRepository.save(company);
        } else {
            company = companyRepository.findAll().get(0);
        }

        // 2. 관리자 유저 셋업
        if (userRepository.count() == 0) {
            User adminUser = User.builder().company(company).loginId("admin").username("관리자").password(passwordEncoder.encode("1234")).role("ADMIN").build();
            userRepository.save(adminUser);
        } else {
            // 이미 유저가 존재하지만 비밀번호가 평문(1234 등)인 경우 보안 강화를 위해 자동 암호화 갱신
            userRepository.findByLoginId("admin").ifPresent(adminUser -> {
                if (!adminUser.getPassword().startsWith("$2a$")) {
                    adminUser.updateUserInfo(adminUser.getUsername(), passwordEncoder.encode("1234"), adminUser.getRole());
                    userRepository.save(adminUser);
                }
            });
        }

        // 3. 데모 거래처 셋업
        if (vendorRepository.count() == 0) {
            Vendor clientVendor = Vendor.builder().company(company).vendorName("김철수 고객님").vendorType("CLIENT").businessType("INDIVIDUAL").build();
            vendorRepository.save(clientVendor);

            Vendor supplier1 = Vendor.builder().company(company).vendorName("을지로 타일나라").vendorType("SUPPLIER").businessType("CORPORATION").build();
            vendorRepository.save(supplier1);

            Vendor supplier2 = Vendor.builder().company(company).vendorName("한샘 자재상사").vendorType("SUPPLIER").businessType("CORPORATION").build();
            vendorRepository.save(supplier2);

            Vendor supplier3 = Vendor.builder().company(company).vendorName("개나리 벽지").vendorType("SUPPLIER").businessType("CORPORATION").build();
            vendorRepository.save(supplier3);
        }

        // 4. 데모 프로젝트 셋업
        if (projectRepository.count() == 0) {
            Project project1 = Project.builder().company(company).projectName("반포 자이 아파트 인테리어").status("견적중").build();
            projectRepository.save(project1);

            Project project2 = Project.builder().company(company).projectName("강남 래미안 거실 타일 시공").status("수주").build();
            projectRepository.save(project2);

            Project project3 = Project.builder().company(company).projectName("역삼동 단독주택 올수리").status("공사중").build();
            projectRepository.save(project3);

            Project project4 = Project.builder().company(company).projectName("분당 정자동 상가 도배").status("완료").build();
            projectRepository.save(project4);
        }

        // 5. 공정 대분류 셋업
        Process tileProcess = null;
        Process wallpaperProcess = null;
        if (processRepository.count() == 0) {
            tileProcess = Process.builder().processName("타일공사").sortOrder(1).build();
            processRepository.save(tileProcess);
            wallpaperProcess = Process.builder().processName("도배공사").sortOrder(2).build();
            processRepository.save(wallpaperProcess);
        } else {
            java.util.List<Process> procs = processRepository.findAll();
            tileProcess = procs.stream().filter(p -> p.getProcessName().equals("타일공사")).findFirst().orElse(procs.get(0));
            wallpaperProcess = procs.stream().filter(p -> p.getProcessName().equals("도배공사")).findFirst().orElse(procs.size() > 1 ? procs.get(1) : procs.get(0));
        }

        // 6. 자재 및 노무 마스터 데이터 등록 (자재 테이블이 비어있을 때 삽입 보장)
        if (materialRepository.count() == 0) {
            Material tile = Material.builder()
                    .company(company).process(tileProcess)
                    .materialName("고급 이태리 포세린 타일 (600x600)")
                    .standardUnit("㎡").distributionUnit("Box")
                    .conversionRate(1.44) // 1박스 = 1.44헤베(㎡)
                    .purchasePrice(35000).laborPrice(0)
                    .specification("600x600")
                    .itemType(ItemType.MATERIAL)
                    .build();
            materialRepository.save(tile);

            Material wallpaper = Material.builder()
                    .company(company).process(wallpaperProcess)
                    .materialName("LG 하우시스 실크 벽지")
                    .standardUnit("㎡").distributionUnit("Roll")
                    .conversionRate(16.5) // 1롤 = 약 5평 = 16.5㎡
                    .purchasePrice(40000).laborPrice(0)
                    .specification("실크")
                    .itemType(ItemType.MATERIAL)
                    .build();
            materialRepository.save(wallpaper);

            // 노무/인건비 단독 마스터 데이터 등록
            Material tileLabor = Material.builder()
                    .company(company).process(tileProcess)
                    .materialName("타일공 시공 인건비")
                    .standardUnit("일").distributionUnit("일")
                    .conversionRate(1.0)
                    .purchasePrice(0).laborPrice(250000)
                    .specification("기공 1인 기준 (식대 포함)")
                    .itemType(ItemType.LABOR)
                    .build();
            materialRepository.save(tileLabor);

            Material wallpaperLabor = Material.builder()
                    .company(company).process(wallpaperProcess)
                    .materialName("도배공 시공 인건비")
                    .standardUnit("일").distributionUnit("일")
                    .conversionRate(1.0)
                    .purchasePrice(0).laborPrice(220000)
                    .specification("기공 1인 기준")
                    .itemType(ItemType.LABOR)
                    .build();
            materialRepository.save(wallpaperLabor);

            System.out.println("✅ [SYSTEM] 테스트용 초기 마스터 데이터 셋업 완료!");
        }
    }
}
