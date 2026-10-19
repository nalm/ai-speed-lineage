# AI 속도 논쟁의 인물 계보 — 데이터와 정적 빌드

일반 독자용 공개 페이지 「AI 속도 논쟁의 인물 계보」의 소스입니다.
**내용은 모두 `data/*.json`에 있고**, 빌드 스크립트가 이를 원래 디자인 그대로의 정적 HTML(`dist/`)로 만듭니다.
숫자(인물·관점·사건 수, 필터 숫자), 분야별 명단, 계보도, 모바일 요약은 전부 데이터에서 계산합니다. 손으로 적은 숫자나 좌표는 없습니다.

- Node.js 18 이상만 있으면 됩니다(외부 패키지 없음).
- JavaScript가 꺼져 있어도 모든 내용이 보입니다. JS는 연표 접기, 인물 검색·필터, 계보 노드 → 인물 카드 이동만 맡습니다.

## 명령어

| 명령 | 하는 일 |
|---|---|
| `npm run validate` | 데이터 검사. 오류가 하나라도 있으면 실패합니다(아래 규칙). |
| `npm run build` | 검사 후 `dist/`에 정적 사이트를 만듭니다(검사 실패 시 빌드하지 않음). |
| `npm run verify` | 빌드 결과 검사: 화면 숫자 = 데이터 숫자, 팩트체크 정정 반영표, datetime 형식, 내부 문구 부재. 결과는 `../preview/correction-checklist.md`. |
| `npm run check` | build + verify |
| `npm run preview` | `dist/`를 http://localhost:4173 에서 띄웁니다(`PORT=8080 npm run preview`로 포트 변경). |
| `npm run proposals:apply -- proposals/2026-10-20.json` | 제안 파일에서 **승인된 항목만** 데이터에 병합합니다. `--dry-run`으로 미리 볼 수 있습니다. |

## 데이터 파일 (`data/`)

| 파일 | 내용 |
|---|---|
| `meta.json` | 페이지 제목·소개 문구, **데이터 기준일**(`data_as_of`), 보도 반영 시점, 마지막 승인일(`last_approved_at`, 비어 있으면 '승인 전 미리보기'로 빌드), 푸터 대표 출처, 섹션 안내 문구 |
| `camps.json` | 진영 4개(낙관·안전·중간·분야별). 인물·사건·계보가 모두 이 키 한 벌(`optimist/safety/middle/domain`)을 씁니다. |
| `people.json` | 인물. `id`(카드 앵커 `#person-<id>`), 이름·별칭(`aliases`, 예: Beff Jezos), 진영, 분야·국적, 역할·스탠스·대표 장면, 사진(`portrait`: Wikimedia Commons 자유 라이선스만, 작성자·라이선스·원본 링크 필수), `verification`, 미확인이면 `unverified_note`(독자에게 보이는 사유), `source_ids`, `factcheck_ids`, `review` |
| `events.json` | 연표 사건. `id`는 `날짜-슬러그`로 고정(제목을 고쳐도 상태가 사라지지 않음). `date_start`/`date_end`(ISO 형식, `<time datetime>`에 그대로 씀), 화면용 `date_label`, 요약·배경·확인된 사실·미확인 사항(비어 있으면 칸을 숨김), `people_ids`, `verification`, `source_ids` |
| `lineage.json` | 계보도. `lanes`(줄 순서·제목), `nodes`(줄·순서·인물 연결 또는 집단 라벨), `edges`(`flow`=화살표 흐름, `opposition`=화살촉 없는 점선 대립, `agreement`=인용·입장 일치) — 관계선마다 근거 문장(`note`)과 출처 필수. 좌표는 빌드가 `lane`·`order`로 자동 배치합니다. |
| `sources.json` | 출처 URL 목록. `publisher`(화면에 보이는 매체 이름), `kind`(primary=당사자·기관 1차 자료 / secondary), `accessed_at` |
| `changelog.json` | '달라진 점' 기록. 첫 항목이 화면 상단에 나오고, 나머지는 '이전 변경 기록'으로 접혀 보입니다. |
| `domain-groups.json` | '전문분야에서 건너온 경고'의 그룹 정의(어떤 `field`를 묶을지). 명단은 인물 데이터에서 자동 생성 |

`review`는 `{state: approved|pending|rejected|legacy, by, at}`입니다. 2026-10-19 이전 공개본에서 옮겨 온 항목은 모두 `pending`(nalm 승인 대기)입니다.

## 검사 규칙 (`npm run validate`)

- **`verification: "verified"`(검증됨)이면 출처 URL이 1개 이상** 있어야 합니다. 1차 자료가 없고 독립 2차 출처가 2개 미만이면 경고합니다.
- 미확인 인물은 `unverified_note`, 미확인 사건은 `unknown`(미확인 사항)이 있어야 합니다.
- 독자에게 보이는 문장에 내부 작업 문구(‘조사 메모’, ‘검증 메모’, ‘1차 조사 종합’ 등)가 있으면 실패합니다. 내부 메모는 출처로 쓸 수 없습니다.
- 모든 참조(인물·출처·노드)가 실제로 있어야 하고, 날짜는 유효한 ISO 형식이어야 합니다.
- 사진은 Commons 원본 링크·작성자·자유 라이선스(CC BY / CC BY-SA / CC0 / 퍼블릭 도메인)가 있어야 합니다.
- `src/styles.css`의 보조 텍스트·배지 색이 배경과 **4.5:1 이상** 대비인지 라이트·다크 모드 모두 계산합니다.

## 매일 검토 흐름

1. **수집(자동, 미공개)** — 매일 수집 작업이 `proposals/YYYY-MM-DD.json`을 만듭니다. 기존 `data/`는 건드리지 않습니다. 각 항목은 `op`(add|update), `target`(people / events / sources / lineage.edges / lineage.nodes), `target_id`, `before`, `after`, `evidence`(URL·매체·게시일·발췌), `confidence`, `risk`, `review`를 가집니다. 형식은 `proposals/2026-10-20.example.json`을 참고하세요. 출처 URL·발췌가 없는 제안은 만들지 않습니다.
2. **새 항목은 기본 미확인** — 추가되는 인물·사건·관계선은 `verification`을 따로 정하지 않으면 `unverified`로 들어갑니다. 진영 변경, 관계선 추가, ‘검증됨’ 승격은 반드시 사람이 판단합니다.
3. **검토** — nalm이 제안 파일의 각 항목 `review.state`를 `approved` / `rejected`로 바꿉니다(그대로 두면 `pending`, 다음 회차로 넘어감).
4. **병합** — `npm run proposals:apply -- proposals/YYYY-MM-DD.json`. 승인 항목만 반영하고, 반영 결과가 검사를 통과할 때만 `data/`를 씁니다. 거절 항목은 `proposals/rejected.json`에 남아 같은 제안이 다시 올라오는 것을 막는 데 씁니다.
5. **기록·확인** — 이번 회차 요약을 `changelog.json` 맨 앞에 추가하고, `meta.json`의 `data_as_of`·`last_approved_at`을 갱신한 뒤 `npm run check` → `npm run preview`로 확인합니다. 공개된 사실을 고친 경우 반드시 변경 기록에 남깁니다.

## 기타

- `tools/migrate-from-original.mjs` — 원본 단일 HTML(`../original/`)과 팩트체크(`../factcheck/factcheck.json`)에서 `data/`를 처음 만든 1회용 스크립트(감사 기록용). **다시 실행하면 `data/`를 덮어쓰니** 일상 작업에는 쓰지 마세요.
- `tools/corrections-2026-10-19.mjs` — 팩트체크 '수정 필요' 28건의 정정표. `npm run verify`가 이 표로 반영 여부를 검사합니다.
- `tools/migration-extra-edits.json` — 28건 외에 이전 과정에서 함께 손본 항목 목록.
- 배포: Render 정적 사이트(무료, `render.yaml`). `main`에 push하면 Render가 `npm ci && npm run build`로 빌드하고 `dist`를 공개합니다. `dist/`는 저장소에 넣지 않습니다.
- `npm run verify`는 상위 작업 폴더의 `../factcheck/factcheck.json`을 읽고 `../preview/`에 결과를 쓰므로, 이 저장소만 받은 환경(Render 포함)에서는 실행하지 않습니다. push 전에 작업 폴더에서 `npm run check`를 돌리세요.
