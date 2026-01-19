# `/config` 가이드

`/config`는 “서버(길드) 단위 설정 저장”을 담당합니다.

## 권한

기본적으로 **서버 관리(Manage Server)** 권한이 필요합니다.  
또는 `/config allow-command-role`, `/config allow-command-user`로 등록된 역할/유저도 사용할 수 있습니다.

## 기능 요약

- **온보딩 기본 역할**: 입장 후 기본 역할 부여(딜레이 가능)
- **자기소개 역할**: 특정 채널에 메시지 작성 시 역할 부여
- **관리 커맨드 사용 권한**: `/rr`, `/ticket` 포함 “관리용 커맨드” 접근 제어

## 자주 쓰는 셋업 예시

1) 기본 역할과 딜레이 설정

- `/config set-base-role role:@Member`
- `/config set-join-delay seconds:10`

1) 자기소개 역할 부여

- `/config set-intro channel:#intro role:@Introduced`

1) 관리 커맨드 권한 위임

- `/config allow-command-role role:@Staff`
- `/config allow-command-user user:@SomeAdmin`
