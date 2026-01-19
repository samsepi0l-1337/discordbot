# Commands Reference

이 문서는 현재 프로젝트의 슬래시 커맨드와 사용 방법을 정리합니다.

## 공통

- **커맨드 등록**: 봇 실행 시 자동으로 등록됩니다. (`CLIENT_ID`, `GUILD_ID` 설정 필요)
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
  - `intro_channel`, `intro_role`, `command_roles`, `command_users`
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

- **인수**: `message_id` (String, optional)
- **결과**: 활성 메시지를 설정합니다.
- **내부 로직**:
    1. `message_id` 인수가 있으면 해당 ID를 사용합니다.
    2. 인수가 없고 명령어 실행 시 특정 메시지에 **답글(Reply)** 중이라면, 그 답글 대상 메시지를 사용합니다.
    3. 둘 다 없으면 오류 메시지를 출력합니다.

### `/rr add ...` (모든 타입)

- **인수**: `emoji`, `role`, `group` (toggle 전용)
- **내부 로직**:
    1. 명령어 실행 시 특정 메시지에 **답글(Reply)** 중이라면, 그 메시지를 대상으로 즉시 규칙을 추가합니다.
    2. 답글 중이 아니라면, 이전에 `/rr message`로 설정한 **활성 메시지**를 대상으로 사용합니다.
- **결과**: 대상 메시지에 이모지 반응이 달리고 규칙이 DB에 저장됩니다.

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
- **내부 로직**:
    1. 현재 서버의 모든 역할 목록을 조회합니다.
    2. 데이터베이스의 해당 메시지에 등록된 규칙 중, 더 이상 존재하지 않는 역할 ID를 참조하는 행을 삭제합니다.
- **결과**: 삭제된 역할로 인해 발생하는 "찌꺼기 규칙"들을 정리합니다.

### `/rr autorole ...`

- `/rr autorole add target:user|bot role:<Role>`
- **내부 로직**: 유저가 입장할 때 `user` 타입인지 `bot` 타입인지 판별하여 지정된 역할을 즉시 부여합니다.
- **결과**: 유저와 봇을 구분하여 자동으로 초기 권한을 관리합니다.

### `/rr timed ...`

- `/rr timed add role:<Role> time:<10m|2h|1d>`
- **내부 로직**:
    1. `10m`(10분), `2h`(2시간) 등의 문자열을 밀리초(ms) 단위로 파싱합니다.
    2. 유저가 입장할 때 `setTimeout`을 통해 지정된 시간 뒤 역할 부여 작업을 예약합니다.
- **결과**: 입장 후 일정 시간이 지난 뒤 자동으로 역할을 부여합니다. (주의: 봇 재시작 시 대기 중인 예약은 취소됩니다.)
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
  - **지금 이 채널에** “티켓 생성” 버튼이 달린 안내 메시지를 올립니다.
  - 유저가 버튼을 누르면, **그 안내 메시지에서 비공개 스레드(Private Thread) 티켓이 생성**됩니다.
  - 즉, “티켓을 만들 출발점(버튼)”을 이 채널에 만들어두는 명령입니다.

### `/ticket set-category`

- **인수**: `category` (Category Channel, required)
- **결과**
  - 티켓이 만들어질 **기본 카테고리(정리용)** 를 설정합니다.
  - 현재 구현은 Private Thread 방식이지만, 운영상 티켓 관련 채널/스레드를 어디에 둘지 기준으로 사용합니다.

### `/ticket set-transcripts`

- **인수**: `channel` (Text Channel, required)
- **결과**
  - 티켓 종료 시 transcript(`.txt`, 최근 100개 메시지)을 **이 채널에 자동으로 올립니다.**

### 지원팀 설정

#### `/ticket add-support-role` / `/ticket remove-support-role`

- **인수**: `role` (Role, required)
- **결과**
  - 티켓 스레드에 **지원팀 역할의 멤버들을 자동으로 초대**하기 위한 설정입니다.
  - 역할을 추가하면, 티켓 생성 시 해당 역할 멤버가 스레드에 들어올 수 있습니다.

#### `/ticket add-support-user` / `/ticket remove-support-user`

- **인수**: `user` (User, required)
- **결과**
  - 티켓 스레드에 들어올 **지원 유저를 직접 지정**합니다.

### 티켓 채널 내부 명령

#### `/ticket close`

- **인수**: `reason` (String, optional)
- **내부 로직**:
    1. 스레드 채널의 최근 메시지 100개를 가져와 트랜스크립트(`.txt`) 데이터를 생성합니다.
    2. `ticket_sessions` DB의 상태를 `closed`로 변경하고 종료 시간/사유를 기록합니다.
    3. 설정된 트랜스크립트 채널로 텍스트 파일을 업로드합니다.
    4. 스레드를 잠금 및 보관 처리합니다.
- **결과**: 대화가 종료되고 상담 내역이 영구적으로 보존됩니다.

#### `/ticket claim` / `/ticket unclaim` / `/ticket transfer`

- **인수**: `transfer`의 경우 `user` (User, required)
- **내부 로직**: 데이터베이스의 `claimed_by_id` 필드를 업데이트하고, 티켓 채널의 상단 안내 메시지를 현재 담당자 정보로 갱신합니다.
- **결과**: 다른 스태프들이 해당 티켓의 처리 여부를 즉시 알 수 있게 됩니다.

#### `/ticket add` / `/ticket remove`

- **인수**: `user` (User, required)
- **결과**
  - 티켓에 **참여자(유저)를 추가/제거**합니다.
  - Private Thread에서는 해당 유저를 스레드 멤버로 초대/제거합니다.
