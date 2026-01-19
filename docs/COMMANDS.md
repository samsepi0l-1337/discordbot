# Commands Reference

이 문서는 현재 프로젝트의 슬래시 커맨드와 사용 방법을 정리합니다.

## 공통

- **커맨드 등록**: `npm run register`
- **실행**: `npm start`
- **권한(커맨드 설정/관리용)**:
  - 기본적으로 **서버 관리(Manage Server)** 또는 `/config allow-command-role|allow-command-user`로 허용된 권한이 필요합니다.
- **봇 권한(권장)**:
  - 역할 기능: `Manage Roles`
  - 반응 역할: `Add Reactions`, `Read Message History`
  - 티켓 채널: `Manage Channels`, `Manage Roles`, `View Channel`, `Send Messages`

---

## `/config` (길드 설정)

길드(서버)별 기본 설정을 저장합니다.

### `/config set-base-role`

- **인수**
  - `role` (Role, required)
- **사용 예**
  - `/config set-base-role role:@Member`
- **결과**
  - 신규 입장자에게 기본 역할을 부여합니다(지연 설정이 있으면 지연 후 부여).

### `/config set-join-delay`

- **인수**
  - `seconds` (Integer, required, min 0)
- **사용 예**
  - `/config set-join-delay seconds:10`
- **결과**
  - 입장 후 기본 역할 부여를 지정된 초만큼 지연합니다.

### `/config set-intro`

- **인수**
  - `channel` (Text Channel, required)
  - `role` (Role, required)
- **사용 예**
  - `/config set-intro channel:#intro role:@Introduced`
- **결과**
  - 지정된 채널에 메시지를 작성하면 해당 역할을 부여합니다.

### 커맨드 사용 권한 관리

#### `/config allow-command-role`

- **인수**: `role` (Role, required)
- **결과**: 해당 역할을 가진 유저는 `/config`, `/rr`, `/ticket` 같은 관리성 커맨드를 사용할 수 있습니다.

#### `/config remove-command-role`

- **인수**: `role` (Role, required)
- **결과**: 허용 역할에서 제거합니다.

#### `/config allow-command-user`

- **인수**: `user` (User, required)
- **결과**: 특정 유저를 커맨드 사용 허용 목록에 추가합니다.

#### `/config remove-command-user`

- **인수**: `user` (User, required)
- **결과**: 특정 유저를 커맨드 사용 허용 목록에서 제거합니다.

### `/config show`

- **결과**: 현재 저장된 설정을 요약해서 보여줍니다.

### `/config clear`

- **인수**: `field` (Choice, required)
- **결과**: 특정 설정만 초기화합니다.

### `/config reset`

- **결과**: 길드 설정 전체 초기화합니다.

---

## `/rr` (Reaction Roles)

Zira 스타일로 “활성 메시지(active message)”를 선택한 뒤 규칙을 추가/삭제합니다.

### 기본 흐름

1) `/rr channel channel:#some-text` 로 **활성 채널 선택**  
2) `/rr message message_id:<메시지ID>` 로 **활성 메시지 선택**  
3) `/rr add ...` 로 해당 메시지에 반응 역할 규칙을 추가

### `/rr channel`

- **인수**: `channel` (Text Channel, required)
- **결과**: 활성 채널을 설정합니다(활성 메시지 지정 전에 필요).

### `/rr message`

- **인수**: `message_id` (String, required)
- **결과**: 활성 메시지를 설정합니다.

### `/rr add normal`

- **인수**
  - `emoji` (String, required) — 유니코드(예: `✅`) 또는 커스텀(예: `<:name:123...>`)
  - `role` (Role, required)
- **결과**
  - 반응 추가 시 역할 부여, 반응 제거 시 역할 제거

### `/rr add once`

- **인수**: `emoji`, `role`
- **제약**
  - once 타입은 같은 메시지에서 다른 타입과 혼용 불가
- **결과**
  - 반응 시 역할 부여 후 해당 유저의 반응을 제거합니다.

### `/rr add remove`

- **인수**: `emoji`, `role`
- **결과**
  - 반응 시 역할을 제거합니다.

### `/rr add toggle`

- **인수**
  - `emoji` (String, required)
  - `role` (Role, required)
  - `group` (String, optional; default `default`)
- **결과**
  - 같은 메시지/같은 그룹 내에서 하나만 유지되도록 다른 토글 역할을 제거 후 선택 역할을 부여합니다.

### `/rr list`

- **인수**: `message_id` (String, optional)
- **결과**
  - 전체(또는 특정 메시지)의 반응 역할 규칙을 요약해서 보여줍니다.

### `/rr delete ...`

#### `/rr delete all`

- **인수**: `message_id` (String, required)
- **결과**: 해당 메시지의 모든 규칙 삭제

#### `/rr delete reaction-role`

- **인수**: `message_id` (String, required), `role` (Role, required)
- **결과**: 해당 메시지에서 특정 역할과 연결된 규칙 삭제

#### `/rr delete reaction-emoji`

- **인수**: `message_id` (String, required), `emoji` (String, required)
- **결과**: 해당 메시지에서 특정 이모지와 연결된 규칙 삭제

#### `/rr delete check`

- **인수**: `message_id` (String, required)
- **결과**
  - 삭제된 역할을 참조하는 규칙을 정리합니다.
  - 현재 구현은 “활성 채널(/rr channel)”을 기준으로 메시지를 찾습니다.

### `/rr autorole ...`

- `/rr autorole add target:user|bot role:<Role>`
- `/rr autorole delete target:user|bot role:<Role>`
- `/rr autorole show`
- **결과**
  - 입장 시 자동 부여 역할을 관리합니다.

### `/rr timed ...`

- `/rr timed add role:<Role> time:<10m|2h|1d>`
- `/rr timed delete role:<Role>`
- `/rr timed show`
- **결과**
  - 입장 후 지정 시간 뒤 역할을 부여합니다(현재는 인메모리 타이머 기반).

### `/rr voice ...`

- `/rr voice add channel:<Voice/Stage> role:<Role>`
- `/rr voice delete channel:<Voice/Stage> role:<Role>`
- `/rr voice show`
- **결과**
  - 음성 채널 입장 시 역할 부여, 퇴장 시 제거합니다.

### `/rr dm`

- **인수**: `state` (`on|off`, required)
- **결과**
  - 반응 역할이 부여/제거될 때 유저 DM 알림을 켜거나 끕니다.

---

## `/ticket` (Tickets)

Tickets Bot 스타일로 **서버 내 티켓 채널 생성/닫기/클레임/트랜스크립트**를 제공합니다.

### 권장 셋업 순서

1) `/ticket set-category category:<카테고리>`
2) `/ticket set-transcripts channel:<채널>` (선택)
3) `/ticket add-support-role` 및/또는 `/ticket add-support-user`
4) 패널 게시 채널에서 `/ticket panel`

### `/ticket panel`

- **인수**: 없음
- **결과**
  - 현재 채널에 “티켓 생성” 버튼 패널을 게시합니다.
  - 동시에 해당 채널/메시지를 티켓 패널로 저장합니다.

### `/ticket set-category`

- **인수**: `category` (Category Channel, required)
- **결과**: 티켓 채널이 생성될 카테고리를 설정합니다.

### `/ticket set-transcripts`

- **인수**: `channel` (Text Channel, required)
- **결과**
  - 티켓 종료 시 transcript(`.txt`, 최근 100개 메시지)을 이 채널로 전송합니다.

### 지원팀 설정

#### `/ticket add-support-role` / `/ticket remove-support-role`

- **인수**: `role` (Role, required)
- **결과**: 티켓 채널 접근 권한을 가진 지원 역할을 추가/제거합니다.

#### `/ticket add-support-user` / `/ticket remove-support-user`

- **인수**: `user` (User, required)
- **결과**: 티켓 채널 접근 권한을 가진 지원 유저를 추가/제거합니다.

### 티켓 채널 내부 명령

#### `/ticket close`

- **인수**: `reason` (String, optional)
- **결과**
  - 티켓을 종료 처리하고, 생성자에게 Send 권한을 제한합니다.
  - 트랜스크립트 채널이 설정돼 있으면 transcript 파일을 전송합니다.

#### `/ticket claim` / `/ticket unclaim` / `/ticket transfer`

- **인수**
  - `transfer`는 `user` (User, required)
- **결과**
  - 클레임 정보를 저장합니다(현재 구현은 “표시/기록” 중심).

#### `/ticket add` / `/ticket remove`

- **인수**: `user` (User, required)
- **결과**
  - 해당 유저의 채널 권한을 추가/제거합니다.
