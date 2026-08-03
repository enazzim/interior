# 2026-06-29 [설계도] API 및 Service 아키텍처 상세 명세서

본 설계도는 자재비/노무비 격리 모델 및 엑셀 다운로드 포맷팅, 현장 이력 통합 관제, 세션 안전 관리 및 현장 잠금 조건이 적용된 서버 백엔드 API 명세서입니다.

---

## 1. 회원 및 인증 세션 관리 API (`UserController.java`)

### 1.1. 엔드포인트 명세
* **`POST /api/users/login`**
  * **설명:** 사용자 로그인을 처리하고 유저 정보 및 **서버 구동 고유 토큰(`bootId`)**, **세션 만료 시각(8시간)**을 발급합니다.
* **`GET /api/users/session-check`**
  * **설명:** 백엔드 서버의 현재 구동 토큰(`bootId`) 및 서버 시각을 반환하여, **백엔드 재부팅/재빌드 발생 시 프론트엔드가 이를 즉시 감지하여 안전하게 자동 세션 아웃**하도록 제어합니다.

---

## 2. 자재 마스터 API 및 비즈니스 서비스 (`MaterialService.java`)

### 2.1. 엔드포인트 명세
* **`GET /api/materials`**
  * **설명:** 자재 사전 목록을 전체 조회합니다.
  * **응답 포맷:** `List<MaterialResponse>` (품명, 규격, 자재구분, 단위, 매입원가, 노무단가 포함)
* **`POST /api/materials`**
  * **설명:** 자재 마스터 정보를 새로 등록합니다.
  * **격리 비즈니스 로직:**
    * `itemType == ItemType.MATERIAL` 이면, 인건비 단가(`laborPrice`)는 강제로 `0.0` 설정 저장
    * `itemType == ItemType.LABOR` 이면, 매입 원가(`purchasePrice`)는 강제로 `0.0` 및 단위 환산율(`conversionRate`)은 `1.0` 고정 저장
* **`PUT /api/materials/{id}`**
  * **설명:** 특정 자재 마스터 정보를 수정합니다.

---

## 3. 견적서 시뮬레이터 API 및 계산 서비스 (`EstimateService.java`)

### 3.1. 엔드포인트 명세
* **`POST /api/estimates`**
  * **설명:** 선택한 자재 목록과 면적/수량 정보를 수급받아 견적 내역을 임시 시뮬레이션 및 데이터베이스에 영구 저장합니다.

---

## 4. 현장 이력 현황 API (`SettlementHistoryController.java`)

### 4.1. 엔드포인트 명세
* **`GET /api/settlements/history`**
  * **설명:** 연도별 전체 현장(`견적중`, `수주`, `공사중`, `완료`) 이력 및 상단 2원화 지표를 조회합니다.
  * **응답 DTO (`SettlementHistoryDTO`):**
    * `availableYears`: DB에 존재하는 실제 프로젝트 연도 목록 (최신순)
    * `totalProjects`: 연간 전체 현장 수
    * `totalRevenue`: 계약 체결 현장(`수주/공사/완료`)의 연간 확정 매출액
    * `estimatedRevenue`: `견적중` 현장의 미계약 가계산 총액 (파이프라인)
    * `totalExpense`: 계약 확정 현장의 연간 총 집행 지출액
    * `netProfit`: **`실수금액 - 지출원가`** 기준의 연간 확정 누적 순이익
    * `items`: 현장별 요약 목록 (`collectedAmount`, `discountAmount` 포함)

---

## 5. 트랜잭션 관리 및 예외 처리 정책
* **`@Transactional` 선언적 트랜잭션 보장:**
  * 견적서 등록 및 수금/지출 등록 중 단 하나의 항목이라도 저장에 에러가 발생하면 전체 **롤백(Rollback)** 처리합니다.
* **완료된 현장 변경 예외 제어 (`ProjectService.java`):**
  * 공사 상태가 `완료` 인 현장에 대해 견적서 추가 혹은 수정 시 `IllegalStateException`을 발생시켜 백엔드 데이터 훼손을 완벽히 방어합니다.
