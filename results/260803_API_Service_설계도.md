# 통합 API 및 Service 계층 설계도
**최종 수정일:** 2026-08-03  
**작성자:** PROCPA (2개 API 명세서 통합본)

---

## 1. 아키텍처 흐름도 (Architecture Flow)

프론트엔드(화면)에서 요청이 들어와서 데이터베이스에 저장되기까지의 단방향 데이터 흐름(Unidirectional Data Flow)을 엄격하게 준수합니다.

```mermaid
graph LR
    A[React/Vite 화면] -- "1. DTO (JSON)" --> B[Controller (API 창구)]
    B -- "2. 데이터 검증 및 전달" --> C[Service (핵심 비즈니스 로직)]
    C -- "3. 마스터 DB 조회/단위 환산" --> D[Repository (DB 연결)]
    C -- "4. 가공된 Entity 저장" --> D
    D -- "5. SQL 쿼리" --> E[(Database)]
```

---

## 2. Controller 계층: REST API 명세

실제 프로젝트에 탑재되어 구동 중인 백엔드 REST API의 주소(Endpoint) 목록입니다.

### 2.1. 사용자 인증 및 세션 관리 API (`UserController.java`)
* **`POST /api/users/login`**
  * **설명:** 로그인을 처리하고 유저 정보, 세션 만료 시각(8시간), 서버 고유 구동 토큰(`bootId`)을 발급합니다.
* **`GET /api/users/session-check`**
  * **설명:** 서버의 현재 구동 토큰(`bootId`)과 서버 시각을 확인하여 백엔드 재기동 시 세션을 안전하게 초기화합니다.
* **CRUD API:** `GET /api/users`, `GET /api/users/{id}`, `POST /api/users`, `PUT /api/users/{id}`, `DELETE /api/users/{id}`

### 2.2. 현장(Project) 관리 API (`ProjectController.java`)
* **`GET /api/projects`** : 전체 현장 목록 조회.
* **`POST /api/projects`** : 신규 현장 등록.
* **`GET /api/projects/{id}`** : 현장 상세 조회.
* **`PUT /api/projects/{id}`** : 현장 정보 수정.
* **`DELETE /api/projects/{id}`** : 현장 삭제 (단, 완료 현장은 삭제 차단).
* **`PATCH /api/projects/{projectId}/status`** : 현장 진행 상태 변경 (`ESTIMATING` ➔ `CONTRACTED` ➔ `IN_PROGRESS` ➔ `COMPLETED`).
* **`GET /api/projects/{projectId}/histories`** : 해당 현장의 상태 변경 이력 목록 조회.

### 2.3. 스마트 견적(Estimate) API (`EstimateController.java`)
* **`GET /api/estimates/project/{projectId}`** : 특정 현장의 N차 견적서 목록 조회.
* **`POST /api/estimates`** : 신규 견적서 생성 및 견적 항목 일괄 저장 (스마트 단위 환산 적용).
* **`GET /api/estimates/{estimateId}`** : 특정 견적서 상세 정보 조회.
* **`GET /api/estimates/{estimateId}/excel`** : POI를 통한 천 단위 회계 쉼표 및 사진첩 레이아웃이 주입된 고객/실행 투트랙 엑셀 파일 다운로드.

### 2.4. 정산 관리 API (`IncomeController.java` & `ExpenseController.java`)
* **`GET /api/incomes/project/{projectId}`** : 현장별 실제 수금 내역 조회.
* **`POST /api/incomes`** : 수금액 및 할인네고(`discount`) 등록.
* **`POST /api/incomes/bulk`** : 선입선출 기반 미수금 일괄 수금 배분 처리.
* **`DELETE /api/incomes/{id}`** : 수금 취소(삭제).
* **`GET /api/expenses/project/{projectId}`** : 현장별 실제 지출 내역 조회.
* **`POST /api/expenses`** : 지출액 및 지급 거래처(`vendor_id`), 관련 공정 등록.
* **`DELETE /api/expenses/{id}`** : 지출 취소(삭제).

### 2.5. 마스터 데이터 관리 API (`MaterialController.java`, `VendorController.java`, `ProcessController.java`)
* **자재 마스터:** `GET /api/materials`, `POST /api/materials`, `PUT /api/materials/{id}`, `DELETE /api/materials/{id}`
* **거래처 마스터:** `GET /api/vendors`, `POST /api/vendors`, `PUT /api/vendors/{id}`, `DELETE /api/vendors/{id}`
* **공정 마스터:** `GET /api/processes`, `POST /api/processes`, `PUT /api/processes/{id}`, `DELETE /api/processes/{id}`

### 2.6. 기타 시스템 제어 API (`FileDownloadController.java` & `WindowFocusController.java`)
* **`GET /api/files/download`** : 한글 파일명 깨짐을 방지하는 안전한 S3 리소스 프록시 다운로더.
* **`POST /api/window/focus`** : Electron 네이티브 모달창이 닫힌 후 메인 창으로 즉시 포커스 복원 지원.

---

## 3. Service 계층: 핵심 비즈니스 로직 설계

### 3.1. 스마트 단위 환산 및 자동 계산 로직 (`EstimateService`)
1. **마스터 데이터 연동:** 자재 고유의 `conversionRate`와 `purchasePrice`/`laborPrice` 정보를 대조합니다.
2. **발주 수량 계산:** `입력 면적(㎡) / 변환 비율 = 발주 수량` 공식 적용 후 **올림 처리**하여 자재 유통 규격 단위(Box, Roll 등)의 수량을 자동 도출합니다.
3. **투트랙(Two-Track) 금액 산출:**
   * **사내 원가(비공개):** `calculatedQty * purchasePrice` (인건비 별도).
   * **고객 청구 단가:** `CalculatedQty * customerUnitPrice`에 최종 수동 설정 마진율(`marginRate`)을 가산하여 전체 합산 산출.

### 3.2. 자재비와 노무비의 등록 격리 로직 (`MaterialService`)
* `itemType == ItemType.MATERIAL` (순수 자재)일 때: `laborPrice`를 강제로 **`0`**으로 세팅하여 인건비 유입을 원천 차단합니다.
* `itemType == ItemType.LABOR` (순수 노무비)일 때: `purchasePrice`는 **`0`**으로 고정하며 단위 환산 배율 `conversionRate`를 **`1.0`**으로 격리 세팅합니다.

### 3.3. 완료 현장 데이터 변경 차단 정책 (`ProjectService`)
* 현장의 진행 상태가 `COMPLETED` (완료) 상태로 변경되는 순간, 해당 현장 하위에 대한 신규 견적서 생성(`POST /api/estimates`) 및 상태 강제 수정 시 `IllegalStateException`을 발생시켜 백엔드 무결성을 보호합니다.

### 3.4. 트랜잭션 관리 정책 (`@Transactional`)
* mutative(CUD) 작업을 처리하는 모든 Service 계층 메서드에 선언적 트랜잭션(`@Transactional`)을 선언하여, 작업 처리 도중 예외가 발생할 경우 데이터베이스 전체 상태를 롤백(Rollback)해 정합성을 지킵니다.
