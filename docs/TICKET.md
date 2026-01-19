# `/ticket` 가이드 (Private Thread 티켓)

이 프로젝트의 티켓은 **Private Thread** 기반으로 동작합니다.

## 동작 방식

- 관리자가 특정 채널에 `/ticket panel`로 “티켓 생성 버튼” 메시지를 올립니다.
- 유저가 버튼을 누르면, 해당 채널에 **비공개 스레드 티켓**이 만들어집니다.
- 생성자와 지원팀(역할/유저)이 스레드에 자동 초대됩니다.

## 권장 셋업 순서

1) `/ticket set-category` (정리용 기본 카테고리)
2) `/ticket set-transcripts` (선택: 닫힐 때 transcript 로그를 받을 채널)
3) `/ticket add-support-role` 또는 `/ticket add-support-user` (필수)
4) 티켓 버튼을 둘 채널에서 `/ticket panel`

## 운영 커맨드 요약

- `close`: 티켓 종료(잠금/아카이브) + transcript 전송(설정 시)
- `claim/unclaim/transfer`: 담당자 표시/변경
- `add/remove`: 스레드 참여자 초대/제거

## 주의사항(성능/운영)

- 지원팀을 “역할”로 추가하면, 티켓 생성 시 그 역할의 멤버들을 스레드에 초대합니다. 역할 멤버가 매우 많으면 생성이 느려질 수 있습니다.
- 스레드가 자동으로 아카이브되어 있어도, 닫기/클레임 처리는 잠깐 unarchive 후 진행합니다.
