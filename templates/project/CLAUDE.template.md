# {{project_name}} - Agent Context

## Project Overview
{{project_description}}

## Spec-Driven Development Rules

이 프로젝트는 **스펙 드리븐 개발 방식**을 따릅니다. 모든 구현은 스펙 문서를 기반으로 합니다.

### 필수 참조 문서
구현 전 반드시 다음 스펙을 확인하세요:

| 문서 | 위치 | 용도 |
|------|------|------|
| 기능 명세 | `specs/02-specification/functional-spec.yaml` | 상태, 입출력, 에러 케이스 |
| 기술 명세 | `specs/02-specification/technical-spec.yaml` | API, 데이터 모델 |
| UI 명세 | `specs/02-specification/ui-spec.yaml` | 화면, 컴포넌트 |
| 추적 매트릭스 | `specs/traceability.yaml` | 스펙 간 연결 관계 |

### 구현 원칙

1. **스펙에 정의된 것만 구현**
   - 스펙에 없는 기능을 임의로 추가하지 마세요
   - 추가가 필요하면 먼저 스펙 업데이트를 요청하세요

2. **상태 전이 정확히 구현**
   - `functional-spec.yaml`의 `states`를 그대로 구현
   - 정의되지 않은 상태 전이는 만들지 마세요

3. **에러 핸들링 완전성**
   - `error_cases`에 정의된 모든 에러를 처리
   - 에러 코드와 메시지를 스펙과 일치시키세요

4. **테스트 우선**
   - `acceptance_criteria`를 테스트 코드로 먼저 작성
   - Given-When-Then 형식을 테스트 구조로 변환

### Deviation (스펙 이탈) 처리

스펙과 다르게 구현해야 할 경우:
1. 먼저 사용자에게 이유를 설명하세요
2. 승인 후 구현하세요
3. `specs/03-implementation/results/`에 deviation을 기록하세요
```yaml
# deviation 기록 예시
deviations:
  - spec_item: "응답시간 500ms 이내"
    actual: "평균 800ms"
    reason: "외부 API 지연"
    approved: true
```

## Tech Stack

- **Framework**: {{framework}}
- **Language**: {{language}}
- **Database**: {{database}}
- **AI**: {{ai_service}}

## Project Structure
```
{{project_name}}/
├── specs/                 # 스펙 문서 (구현의 원천)
│   ├── 01-discovery/      # 요구사항 정의
│   ├── 02-specification/  # 상세 명세
│   └── 03-implementation/ # 구현 추적
├── src/                   # 소스 코드
├── tests/                 # 테스트 코드
└── CLAUDE.md              # 이 파일
```

## Commands

프로젝트에서 사용 가능한 Claude Code 명령어:

| 명령어 | 설명 |
|--------|------|
| `/spec-discovery` | Discovery 단계 스펙 생성 |
| `/spec-specification` | Specification 단계 스펙 생성 |
| `/implement TASK-XXX` | 특정 태스크 구현 |
| `/verify TASK-XXX` | 구현 결과 검증 |
| `/add-feature` | 새 기능 추가 |
| `/modify-spec` | 기존 스펙 수정 |
| `/status` | 프로젝트 진행 상황 확인 |

## Code Conventions

- **컴포넌트**: PascalCase (`PdfUploader.tsx`)
- **함수/변수**: camelCase (`parsePdfFile`)
- **상수**: UPPER_SNAKE_CASE (`MAX_FILE_SIZE`)
- **파일명**: kebab-case (`pdf-parser.ts`)

## API Response Format

모든 API는 `technical-spec.yaml`의 형식을 따릅니다:
```json
// 성공
{
  "data": { ... },
  "meta": { "timestamp": "..." }
}

// 에러
{
  "error": {
    "code": "ERROR_CODE",
    "message": "User-friendly message"
  }
}
```

---

**Last Updated**: {{created_at}}
**Spec Version**: 0.1.0