# `/config` 상세 가이드

`/config` 명령어는 서버의 기초 동작 정책(권한 관리, 특수 채널 지정 등)을 설정하며, 모든 설정값은 SQLite 데이터베이스의 `guild_config` 테이블에 서버 ID(`guild_id`)별로 저장됩니다.

## 1. 권한 정책 (`canManageCommands`)

봇의 관리 명령어를 실행할 수 있는 대상은 다음과 같은 로직으로 결정됩니다:

1. **서버 관리자**: `Manage Server` 권한이 있는 멤버는 항상 허용됩니다.
2. **허용된 역할**: `/config allow-command-role`으로 등록된 역할을 가진 멤버.
3. **허용된 유저**: `/config allow-command-user`으로 등록된 특정 유저 ID.

---

## 2. 명령어 상세 로직

### `/config set-intro`

- **매개변수**: `channel` (자기소개 채널), `role` (부여할 역할)
- **실행 로직**:
    1. `intro_channel_id`와 `intro_role_id`를 저장합니다.
    2. `messageCreate` 이벤트가 발생할 때마다 메시지가 작성된 채널 ID를 확인합니다.
    3. 작성 채널이 설정된 채널과 일치하면 작성자에게 즉시 역할을 부여합니다.
- **결과**: 특정 채널에 메시지를 남긴 유저에게 "자기소개 완료" 등의 역할을 자동으로 부여합니다.

### `/config allow-command-role` / `allow-command-user`

- **매개변수**: `role` 또는 `user`
- **실행 로직**:
    1. `command_role_ids` 또는 `command_user_ids` 목록에 ID를 추가합니다.
    2. 이후 `/config`, `/rr`, `/ticket` 등의 관리 명령어 실행 시 `permissions.ts`에서 이 목록을 조회하여 권한을 체크합니다.
- **결과**: 관리자 권한이 없더라도 스태프나 부관리자가 봇을 설정할 수 있게 됩니다.

### `/config show`

- **매개변수**: 없음
- **실행 로직**: 데이터베이스에서 현재 서버의 모든 설정 행을 가져와 포맷팅하여 출력합니다.
- **결과**: 현재 활성화된 모든 설정 상태를 한눈에 확인할 수 있습니다.

### `/config reset`

- **매개변수**: 없음
- **실행 로직**: 해당 서버 ID와 연결된 `guild_config` 행을 삭제하거나 초기화합니다.
- **결과**: 모든 봇 설정이 공장 초기화 상태로 되돌아갑니다.
