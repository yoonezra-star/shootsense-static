이 폴더에는 앞으로 발행할 글 JSON을 넣습니다.

운영 규칙:
- 파일 하나가 글 1건입니다.
- GitHub Actions가 하루 1회 실행되며, `publish-log.json` 기준으로 마지막 발행 후 3일이 지나면 다음 글 1건만 발행합니다.
- 발행이 끝나면 해당 파일은 `.done.json`으로 이름이 바뀝니다.

필수 필드:
- `slug`
- `title`
- `description`
- `summary`
- `category`
- `sections`

카테고리 키:
- `travel-tips`
- `asia-travel`
- `europe-travel`
- `middle-east-travel`
- `southeast-asia-travel`
