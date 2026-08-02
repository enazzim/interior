# Interior Project - AI & Developer Architecture Rules (Harness Layer 1)
# Interior 프로젝트 - AI 및 개발자 아키텍처 수칙 (하네스 레이어 1)

## 1. Domain & Service Layer Control Rules / 도메인 및 서비스 레이어 통제 수칙
- **Direct Entity Exposure Prohibition / 엔티티 직접 노출 금지**:
  - Controller endpoints MUST NOT return JPA Entity objects directly. Always map to DTOs (`EstimateResponse`, `CommonCodeDTO`, etc.) before returning responses to the client.
  - 컨트롤러 엔드포인트는 JPA 엔티티 객체를 클라이언트에 직접 반환해서는 안 됩니다. 응답 전 반드시 DTO로 변환해야 합니다.
- **Estimate & Calculation Integrity / 견적 및 금액 산출 정밀성 보장**:
  - All financial and estimate calculations (material costs, extra costs, VAT) MUST be processed via `com.prodev.interior.service.EstimateService`.
  - 모든 금액 및 견적 계산(자재비, 경비, 부가세)은 반드시 `EstimateService`를 통해서만 처리해야 합니다.
  - AI Agent and external systems MUST NOT manually compute total amounts; they MUST invoke the `EstimateService` tool/API.
  - AI 에이전트 및 외부 시스템은 총액을 임의로 계산해서는 안 되며, 반드시 `EstimateService` 도구/API를 호출해야 합니다.
- **Common Code Validation / 공통 코드 유효성 검증**:
  - All category keys used in estimates MUST correspond to registered `CommonCode` records (`EST_EXTRA_COST_TYPE`).
  - 견적서에 사용되는 모든 경비 카테고리 키는 등록된 공통 코드(`EST_EXTRA_COST_TYPE`)와 일치해야 합니다.

## 2. Code Quality & Security Rules / 코드 품질 및 보안 수칙
- **Database Consistency / 트랜잭션 일관성**:
  - Use transaction management (`@Transactional`) for mutating operations in the Service layer.
  - 서비스 레이어의 데이터 변경 작업에는 반드시 트랜잭션 관리(`@Transactional`)를 적용해야 합니다.
- **S3 / File Upload Safety / 파일 업로드 안전성**:
  - All image uploads must pass through `ProjectImageService` or `StorageService` with proper validation.
  - 모든 이미지 업로드는 유효성 검사를 거쳐 `ProjectImageService` 또는 `StorageService`를 통과해야 합니다.
- **Frontend State Boundaries / 프론트엔드 상태 예외 처리**:
  - React components must handle loading/error fallback states gracefully.
  - 리액트 컴포넌트는 로딩 상태 및 에러 폴백(Fallback) 상태를 안정적으로 처리해야 합니다.
- **TypeScript Type Import Rule / 타입 임포트 런타임 분리 수칙**:
  - When writing React/TypeScript code, always use `import type { ... }` or `import { type ... }` syntax when importing Types or Interfaces to prevent Vite/esbuild ESM runtime module syntax errors.
  - React/TypeScript 코드 작성 시, 타입(Type)이나 인터페이스(Interface)를 import할 때는 반드시 `import type { ... }` 또는 `import { type ... }` 구문을 사용하여 Vite 런타임 모듈 오류를 예방해야 합니다.


## 3. AI Agent Interaction & Scope Rules / AI 에이전트 상호작용 및 작업 범위 수칙
- **Question-Only Response Principle / 질문 및 조회 시 대답 전용 원칙**:
  - When the user asks a question, seeks advice, or inquires about a topic, the AI Agent MUST ONLY answer the question. DO NOT modify, implement, or create code/files unexpectedly.
  - 사용자가 질문이나 조언, 조회를 요청한 경우 AI 에이전트는 답변만 수행해야 하며, 코드나 파일을 임의로 수정, 구현, 생성해서는 안 됩니다.
- **Explicit Execution Request Requirement / 명시적 구현 요구 필수**:
  - File modifications, code implementations, or file creations MUST ONLY be executed when the user explicitly requests action using terms such as "수정해줘" (Modify), "구현해줘" (Implement), or "생성해줘" (Create).
  - 코드 수정, 파일 생성, 기능 구현 등은 사용자가 "수정해줘", "구현해줘", "생성해줘" 등 명시적으로 요구한 경우에만 수행해야 합니다.
- **Design Spec Compliance / 승인된 설계 명세 준수 원칙**:
  - AI Agents MUST NOT arbitrarily modify architecture or implement unauthorized extra features beyond approved design documents or user-provided specifications. Implementation MUST strictly follow defined specs.
  - AI 에이전트는 승인된 설계 문서나 사용자가 제시한 명세 범위를 넘어 자의적으로 구조를 변경하거나 추가 기능을 임의로 구현해서는 안 되며, 반드시 정의된 사양대로만 구현해야 합니다.
- **Conflict & Ripple-Effect Notification / 로직 충돌 및 연관 수정 사전 보고 원칙**:
  - When modifying or implementing features, if a conflict with existing logic arises or if modifying surrounding/dependent logic is necessary, the AI Agent MUST NOT execute modifications arbitrarily and MUST report the conflict and required scope of changes to the user for confirmation first.
  - 구현 및 수정하려는 로직이 기존 시스템의 다른 로직과 충돌하거나 주변 코드의 추가 수정(파급 효과)이 필요한 경우, AI 에이전트는 독단적으로 수정하지 않고 충돌 원인과 필요한 연관 수정 범위를 사용자에게 반드시 사전에 보고하고 확인을 받아야 합니다.
- **Concise Response & 30-Line Limit Principle / 간결성 및 30줄 답변 제한 원칙**:
  - Responses MUST be concise, clear, and strictly focus on the core point without verbose background chatter.
  - If a response is expected to exceed 30 lines, the AI Agent MUST provide a brief summary first and ask the user whether they want the full detailed response. Only provide long detailed answers upon explicit user consent.
  - 답변은 논점을 벗어나지 않고 짧고 간결하게 핵심만 전달해야 합니다.
  - 답변이 30줄을 초과할 것으로 예상되면, 먼저 길어진다고 알리고 상세 답변 진행 여부를 사용자에게 물어봐야 합니다. 사용자가 허락할 경우에만 길게 답변하고, 그렇지 않으면 핵심만 요약해서 답변해야 합니다.




