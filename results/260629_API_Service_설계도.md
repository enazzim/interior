# 2026-06-29 [설계도] API 및 Service 아키텍처 상세 명세서

본 설계도는 자재비/노무비 격리 모델 및 엑셀 다운로드 포맷팅, 현장 잠금 조건이 적용된 서버 백엔드 API 명세서입니다.

---

## 1. 자재 마스터 API 및 비즈니스 서비스 (`MaterialService.java`)

### 1.1. 엔드포인트 명세
* **`GET /api/materials`**
  * **설명:** 자재 사전 목록을 전체 조회합니다.
  * **응답 포맷:** `List<MaterialResponse>` (품명, 규격, 자재구분, 단위, 매입원가, 노무단가 포함)
* **`POST /api/materials`**
  * **설명:** 자재 마스터 정보를 새로 등록합니다.
  * **격리 비즈니스 로직:**
    * `itemType == ItemType.MATERIAL` 이면, 인건비 단가(`laborPrice`)는 강제로 `0.0` 설정 저장
    * `itemType == ItemType.LABOR` 이면, 매입 원가(`purchasePrice`)는 강제로 `0.0` 및 단위 환산율(`conversionRate`)은 `1.0` 고정 저장
* **`PUT /api/materials/{id}`**
  * **설명:** 특정 자재 마스터 정보를 수정합니다. 마찬가지로 구분 타입에 맞춰 금액 필드를 강제 초기화하여 상호 격리성을 보장합니다.

---

## 2. 견적서 시뮬레이터 API 및 계산 서비스 (`EstimateService.java`)

### 2.1. 엔드포인트 명세
* **`POST /api/estimates`**
  * **설명:** 선택한 자재 목록과 면적/수량 정보를 수급받아 견적 내역을 임시 시뮬레이션 및 데이터베이스에 영구 저장합니다.
  * **요청 DTO:** `EstimateCreateRequest` (현장 ID, 고객사 ID, 추가된 `CartItem` 목록)
  * **응답 DTO:** `EstimateResponse` (최종 계산된 공급가액, 부가세액, 품목별 청구 단가 등)

### 2.2. [핵심 로직] 품목 구분별 청구 단가 산출식
백엔드 금액 연산 시 자재와 노무비의 청구 단가는 아래 공식에 의해 완벽히 이원화되어 계산됩니다.
* **자재 품목 (`MATERIAL`) 청구 단가 계산식:**
  $$\text{청구 단가} = \text{매입 원가} \times (1 + \text{마진율}) \quad (\text{노무비 청구 단가는 0원 처리})$$
* **노무비 품목 (`LABOR`) 청구 단가 계산식:**
  $$\text{청구 단가} = \text{노무 단가} \times (1 + \text{마진율}) \quad (\text{자재비 청구 단가는 0원 처리})$$

---

## 3. 엑셀 견적서 포맷 및 내보내기 API (`EstimateController.java`)

### 3.1. 엔드포인트 명세
* **`GET /api/estimates/{id}/excel`**
  * **설명:** 해당 견적 데이터를 Apache POI 라이브러리와 연동하여 공식 XCOST-IDIS 하이브리드 견적서 엑셀 양식으로 변환하여 사용자 PC에 다운로드 파일 스트림을 쏩니다.
  * **숫자 천 단위 쉼표 포맷팅 (`CellStyle`):**
    * 엑셀 파일 내 가독성 극대화를 위해 수량(C열), 단가(D열), 공급가액(E열), 세액(F열) 및 계(합계) 행에 천 단위 구분 기호인 `#,##0` 서식 스타일을 주입합니다.
    ```java
    org.apache.poi.xssf.usermodel.XSSFCellStyle borderRightNumeric = workbook.createCellStyle();
    borderRightNumeric.cloneStyleFrom(borderRight);
    borderRightNumeric.setDataFormat(workbook.createDataFormat().getFormat("#,##0"));
    ```

---

## 4. 트랜잭션 관리 및 예외 처리 정책
* **`@Transactional` 선언적 트랜잭션 보장:**
  * 견적서 등록 및 수정 중 단 하나의 자재 항목이라도 저장에 에러가 발생하거나 예외가 뿜어지면, 데이터 무결성을 100% 보장하기 위해 상위 견적서 마스터 정보까지 전체 **롤백(Rollback)** 처리합니다.
* **완료된 현장 변경 예외 제어 (`ProjectService.java`):**
  * 공사 상태가 `완료` 인 현장에 대해 견적서 추가 혹은 프로젝트 수정을 API로 직격으로 쏠 경우, 비즈니스 수준에서 `IllegalStateException`을 발생시켜 백엔드 내부에서도 2차 데이터 훼손을 완벽히 방어합니다.
