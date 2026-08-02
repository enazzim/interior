# 2026-06-28 API 및 Service 계층 설계도
**작성자**: PROCPA

본 문서는 하이브리드 인테리어 ERP 시스템의 두뇌 역할을 하는 **Service(비즈니스 로직)** 계층과, 외부 프론트엔드와 소통하는 **Controller(REST API 창구)** 계층의 설계 명세서입니다.

---

## 1. 아키텍처 흐름도 (Architecture Flow)

프론트엔드(화면)에서 요청이 들어와서 데이터베이스에 저장되기까지의 단방향 데이터 흐름(Unidirectional Data Flow)을 엄격하게 준수합니다.

```mermaid
graph LR
    A[React/Vite 화면] -- "1. DTO (JSON)" --> B[Controller (API 창구)]
    B -- "2. 데이터 검증 및 전달" --> C[Service (핵심 두뇌)]
    C -- "3. 마스터 DB 조회/단위 환산" --> D[Repository (DB 연결)]
    C -- "4. 가공된 Entity 저장" --> D
    D -- "5. SQL 쿼리" --> E[(Database)]
```

---

## 2. Controller 계층: REST API 명세 (주요 창구)

프론트엔드가 호출할 수 있는 주요 주소(Endpoint) 목록입니다.

### 2.1. 현장(Project) 관리 API
- `GET  /api/projects` : 전체 현장 목록 조회 (진행 상태별 필터링 포함)
- `POST /api/projects` : 신규 현장 등록
- `PUT  /api/projects/{projectId}/status` : 현장 상태 변경 (견적중 ➔ 수주 ➔ 공사중 ➔ 정산완료)

### 2.2. 스마트 견적(Estimate) API ★ 핵심
- `GET  /api/projects/{projectId}/estimates` : 특정 현장의 견적서 목록 조회 (버전별)
- `POST /api/estimates` : 신규 견적서 생성 및 견적 항목 일괄 저장 (스마트 계산 적용)
- `PUT  /api/estimates/{estimateId}/finalize` : 견적서 최종 확정 처리 (이후 수정 불가)

### 2.3. 마스터 데이터(Master) API
- `GET  /api/materials` : 자재 마스터 목록 조회 (단위 환산율, 원가 포함)
- `GET  /api/vendors` : 거래처 마스터 목록 조회 (지급처/수금처 구분)

---

## 3. Service 계층: 핵심 비즈니스 로직 설계

시스템의 심장인 `Service` 계층에서 수행할 핵심 알고리즘 및 규칙입니다.

### 3.1. 스마트 단위 환산 및 자동 계산 로직 (`EstimateService`)
프론트엔드에서는 오직 사용자가 입력한 **'현장 실측 면적(㎡)'** 만 서버로 전송합니다. 복잡한 계산은 모두 서버(Service)가 담당합니다.

1. **마스터 데이터 조회**: 전달받은 `materialId`를 통해 DB에서 해당 자재의 `변환 비율(conversionRate)`과 `원가(purchasePrice)`를 가져옵니다.
2. **발주 수량(Box 등) 계산**: 
   - `입력된 면적(㎡) / 변환 비율 = 발주 수량` (소수점 올림 처리)
   - *예시: 15㎡ / 1.44(타일 1박스 면적) = 10.41 ➔ 11 Box 발주 필요*
3. **투트랙(Two-Track) 금액 산출**:
   - **사내 원가(비공개)** = `발주 수량 × 자재 원가` + `인건비`
   - **고객 청구 단가** = `사내 원가 + 마진율(%)`

> [!warning] 보안 정책 (RBAC)
> 사내 원가 및 투트랙 마진 계산 결과는 철저히 서버 내부에서만 계산되며, 프론트엔드로 응답을 내려줄 때 `STAFF(일반 직원)` 권한일 경우 **사내 원가 필드(Material Cost)를 완전히 제거(Null 처리)** 하여 내려보냅니다.

### 3.2. 트랜잭션 관리 정책 (`@Transactional`)
모든 Service 메서드에는 `@Transactional`이 적용됩니다.
- 견적서 1개에 포함된 50개의 항목(EstimateItem)을 저장하던 중, 49번째 항목에서 네트워크 에러나 데이터 오류가 발생하면?
- **결과**: 앞서 저장된 48개의 항목과 견적서 마스터 정보까지 모두 **자동 롤백(Rollback)** 되어 데이터 정합성을 100% 보장합니다.

---

## 4. DTO (Data Transfer Object) 설계 원칙

보안과 트래픽 최적화를 위해 DB 테이블(`Entity`)을 절대로 화면에 직접 노출하지 않습니다.
대신 용도에 맞는 택배상자(`DTO`)를 생성합니다.

- `EstimateCreateRequest.java`: 프론트가 서버로 보낼 때 쓰는 상자 (입력 면적 ㎡만 포함)
- `EstimateResponse.java`: 서버가 계산을 끝내고 프론트로 내려줄 때 쓰는 상자 (원가, 마진, 최종 청구단가 모두 포함)
