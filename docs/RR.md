# `/rr` 가이드 (Reaction Roles)

`/rr`는 Zira 스타일로 “특정 메시지에 리액션을 달면 역할을 주는 규칙”을 관리합니다.

## 기본 개념: Active Message

`/rr`은 먼저 “규칙을 붙일 메시지”를 선택해야 합니다.

1) `/rr channel channel:#채널`
2) `/rr message message_id:<메시지ID>`
3) `/rr add ...` 로 규칙 추가

## 룰 타입

- **normal**: 리액션 추가 시 역할 부여, 리액션 제거 시 역할 제거
- **once**: 역할 부여 후 리액션을 제거(1회성)
  - 같은 메시지에서 다른 타입과 혼용 불가
- **remove**: 리액션 시 역할 제거
- **toggle**: 같은 그룹에서 하나만 유지(다른 토글 역할 제거 후 선택 역할 부여)

## DM 알림

`/rr dm on`을 켜면 리액션으로 역할이 추가/제거될 때 유저에게 DM 안내를 보냅니다.

## 예시

1) 공지 메시지에 normal 규칙 추가

- `/rr channel channel:#roles`
- `/rr message message_id:123456789012345678`
- `/rr add normal emoji:✅ role:@Member`

1) 색상 역할 토글

- `/rr add toggle emoji:🔴 role:@Red group:color`
- `/rr add toggle emoji:🔵 role:@Blue group:color`
