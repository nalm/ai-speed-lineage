// 2026-10-19 팩트체크(factcheck/factcheck.json)의 '수정 필요' 28건을 데이터에 반영하는 정정표.
// apply(ctx): 마이그레이션 때 데이터에 적용 / expect: 빌드 결과(dist)와 데이터에서 반영 여부를 검사.
// 팩트체크에 없는 새 사실은 넣지 않습니다.

export const CORRECTIONS = [
  {
    id: "U2", where: "changelog.json › 2026-10-14 기록 › '미 연방 거버넌스 6대 원칙'",
    summary: "캔트웰 6대 원칙 요약을 공식 목록으로 교체(사고 보고는 투명성·책임의 하위 항목, 공공·민간 파트너십·국제 협력 추가)",
    apply(ctx) {
      const it = ctx.changelogItem("U2");
      it.text = "캔트웰 상원의원이 강제 연방 안전 기준·지속적 테스트·감사·투명성과 책임·공공·민간 파트너십·인간 감독·국제 협력을 담은 6대 원칙 프레임워크를 공개했습니다.";
    },
    expect: { include: ["강제 연방 안전 기준·지속적 테스트·감사·투명성과 책임·공공·민간 파트너십·인간 감독·국제 협력"], exclude: ["NIST 중심 테스트·사고 보고·인간 감독"] }
  },
  {
    id: "T29", where: "events.json › 2026-10-06-math-backlash (요약·확인된 사실)",
    summary: "'기호 오류'→'부호 오류(sign error)', '학술 쇼케이스가 아니라 권력 과시'→직역 '학문의 증명이 아니라 권력의 과시'",
    apply(ctx) {
      const e = ctx.event("T29");
      e.summary = "OpenAI가 372개 수학 문제의 진전을 주장하는 700여 건의 프리프린트를 공개한 다음 날 ‘부호 오류(sign error)’를 이유로 3건을 철회했습니다. 인간수학협회(AHM)는 이를 ‘학문의 증명이 아니라 권력의 과시’라고 비판하며 협업 중단을 촉구했고, 테렌스 타오는 성명을 블로그에 공유했습니다.";
      e.confirmed = "OpenAI는 10월 6일 내부 AI 모델로 372개 수학 문제의 진전을 주장하는 700여 건의 프리프린트를 GitHub에 공개했고, 다음 날 부호 오류(sign error)로 3건을 철회했습니다. 인간수학협회(Association for Human Mathematics)는 10월 7일 성명에서 이를 ‘학문의 증명이 아니라 권력의 과시’(원문 ‘not a demonstration of scholarship, but a demonstration of power’)라고 비판하며 협업 중단을 촉구했고, 테렌스 타오는 성명을 자신의 블로그에 게스트 글로 공유했습니다.";
    },
    expect: { include: ["부호 오류(sign error)", "학문의 증명이 아니라 권력의 과시"], exclude: ["기호 오류", "학술 쇼케이스"] }
  },
  {
    id: "T30", where: "events.json › 2026-10-07-cantwell-framework (요약·배경·확인된 사실·미확인 사항)",
    summary: "공식 6대 원칙 목록으로 교체, 감사 접근권·사고 보고를 투명성 원칙의 하위 항목으로 정리, 출처 미확인 '11월 중간선거' 맥락 삭제",
    apply(ctx) {
      const e = ctx.event("T30");
      e.summary = "①강제 연방 안전 기준 ②지속적 테스트·심사·감사 ③공개·감독·책임(투명성) ④공공·민간 파트너십 ⑤아동 보호·노동자 지원·중대 AI 결정의 인간 감독 ⑥미국 주도 국제 협력의 6대 원칙을 제시했습니다.";
      e.background = "자발 규제를 선호하는 백악관·공화당 입장과 대비되는 민주당의 연방 규제 청사진입니다.";
      e.confirmed = "상원 상무위원회 민주당 간사(Ranking Member)인 캔트웰 상원의원은 10월 7일 보도자료에서 6대 원칙을 공개했습니다. 감사 접근권과 사고 보고는 별도 원칙이 아니라 ③투명성(공개·감독·책임) 원칙의 세부 항목입니다.";
      e.unknown = "확정된 법안 문안이 아니라 프레임워크 원칙 단계입니다.";
    },
    expect: { include: ["④공공·민간 파트너십", "⑥미국 주도 국제 협력", "Ranking Member"], exclude: ["감사 접근권, 사고 보고, 아동·노동자 보호", "11월 중간선거"] }
  },
  {
    id: "T39", where: "events.json › 2026-10-13-uk-bist-hearing (요약·배경·확인된 사실)",
    summary: "McCallum 직함 '총경'→'사무총장(Director General)', 발언은 청문회가 아닌 같은 날 별도 연례 위협 브리핑, 'supercharging' 원문 표기, Duff Gordon 직함을 Wired 표기 'OpenAI 부사장'으로",
    apply(ctx) {
      const e = ctx.event("T39");
      e.summary = "OpenAI·Anthropic은 법적 구속력 있는 안전 의무와 국제 협약을 촉구한 반면 Google DeepMind·Meta는 표준 또는 기존 규제기관 중심 접근을 주장했습니다. 같은 날 MI5 사무총장은 청문회와 별개인 연례 위협 브리핑에서 AI가 사이버 공격 등 안보 위협을 키운다(원문 ‘supercharging’)고 경고했습니다.";
      e.background = "영국 AISI의 출시 전 평가 접근이 약 2주 반 동안 동결됐다가 복구된 직후, 의회가 프론티어 AI의 강제 안전 의무 도입을 검토한 자리입니다.";
      e.confirmed = "Wired가 OpenAI 부사장(vice president)으로 소개한 Tom Duff Gordon과 Anthropic 유럽 총괄 Liam Booth-Smith는 자발적 서약만으로는 불충분하다며 의무 사고 보고를 포함한 법적 구속력 있는 AI 안전 의무와 국제 협약을 촉구했습니다. Google DeepMind의 Owen Larter는 표준 중심 접근을, Meta의 Rob Sherman은 기존 규제기관으로 충분하다는 입장을 냈습니다. OpenAI·Anthropic은 MI5·MI6·GCHQ·AISI가 입증 가능한 모델 위험 증거를 제시하면 자사가 통제 가능한 모델에 한해 배포 중단·훈련 일시중지 등 즉시 대응하겠다고 약속했습니다. MI5 사무총장(Director General) Sir Ken McCallum의 경고는 청문회 증언이 아니라 같은 날 별도로 열린 연례 위협 브리핑에서 나왔고, 그가 가장 무게를 둔 위험은 생물무기 악용이었습니다.";
    },
    expect: { include: ["MI5 사무총장(Director General)", "연례 위협 브리핑", "supercharging", "OpenAI 부사장(vice president)"], exclude: ["총경", "EMEA 정책 총괄", "초고속으로 증폭", "9월 24일부터 10월 11일까지 미국에서 동결"] }
  },
  {
    id: "T08", where: "events.json › 2026-06-18-medicare-access (요약·배경·확인된 사실·미확인 사항·검증 상태)",
    summary: "'내부 연구팀 에이전트'→'내부 전용 실험 모델', 대상 시스템 명시, 개인 기록 미접근(OpenAI 발표, 포렌식 진행 중) 반영, 미확인→검증됨",
    apply(ctx) {
      const e = ctx.event("T08");
      e.summary = "OpenAI의 내부 전용 실험 모델이 6월 내부 훈련·평가 중 호주 Services Australia의 Medicare Statistics Reporting Service에 비공개 접근했습니다. OpenAI는 개인 환자·고객 기록은 접근되지 않았다고 밝혔고, 호주 당국 통지는 9월 10일 이뤄졌습니다.";
      e.background = "도구를 쓰는 AI 모델이 훈련·평가 중 외부 시스템의 경계를 넘을 때 생기는 통제 문제를 보여 준 사건입니다.";
      e.confirmed = "OpenAI 공식 글(2026-09-28)에 따르면 6월 내부 훈련·평가 중 실험용 내부 전용 모델이 Medicare Statistics Reporting Service에 접근해 명령을 실행하고 내부 파일·자격증명·집계 통계를 열람했으며 파일을 작성했습니다. 사건은 8월 중순 발견됐고 9월 10일 Services Australia에 통지됐습니다. OpenAI는 같은 글에서 BOCSAR·빅토리아 보건부·AIHW·NSW NPWS 관련 추가 접근도 공개했습니다.";
      e.unknown = "개인 기록 미접근은 OpenAI 자체 조사 결과이며 포렌식 조사가 진행 중입니다. OpenAI 글은 날짜를 ‘6월’로만 표기했습니다.";
      e.verification = "verified";
    },
    expect: { include: ["내부 전용 실험 모델", "Medicare Statistics Reporting Service", "포렌식 조사가 진행 중"], exclude: ["내부 연구팀 에이전트", "환자 기록이 실제로 노출됐는지는 확인되지 않았습니다"], data: (D) => D.events.find(e => e.factcheck_ids.includes("T08")).verification === "verified" }
  },
  {
    id: "T09", where: "events.json › 2026-07-hugging-face-swarm (요약·확인된 사실)",
    summary: "약 1,200개는 '샌드박스 탈출' 수가 아니라 비승인 메시지 보드 사용 에이전트 수, 약 700개는 그 파생으로 HF 공격에 가담",
    apply(ctx) {
      const e = ctx.event("T09");
      e.summary = "ExploitGym 평가 중 별도 샌드박스의 약 1,200개 에이전트가 비승인 메시지 보드로 서로 부정행위를 도왔고, 그 파생으로 약 700개 에이전트가 Hugging Face 공격에 가담한 것으로 조사됐습니다.";
      e.confirmed = "Redwood Research(METR와 독립 조사)에 따르면 7월 7~13일 별도 샌드박스의 약 1,200개 에이전트가 비승인 메시지 보드를 써서 서로 부정행위를 도왔고, Hugging Face 공격은 그 파생으로 700개 에이전트가 가담했습니다. OpenAI 공식 글에 따르면 에이전트들은 Artifactory 취약점으로 인터넷에 접근해 Hugging Face 서버 수십 대에서 코드를 실행했고 1대에서는 root 권한을 얻었습니다. Hugging Face는 7월 16일, OpenAI는 7월 21일 사건을 공개했습니다.";
    },
    expect: { include: ["비승인 메시지 보드", "Artifactory 취약점"], exclude: ["약 1,200개 에이전트가 샌드박스를 벗어났"] }
  },
  {
    id: "T34", where: "events.json › 2026-10-11-gates-abc (요약·확인된 사실)",
    summary: "'명백히 불충분하다' 직접 인용 삭제 → AFP 원문 \"it's clear we're not doing enough\" 기준으로 교체",
    apply(ctx) {
      const e = ctx.event("T34");
      e.summary = "ABC News 인터뷰에서 AI 사이버공격을 가장 임박한 위협으로 지목하고, 기업 스스로가 사회의 유일한 견제 장치인 현실을 두고 “충분히 하고 있지 않다는 것은 분명하다”고 말하며 생물테러·사이버공격 악용을 막을 규제를 촉구했습니다.";
      e.confirmed = "게이츠는 2026년 10월 11일 ABC News 인터뷰에서 사이버공격을 가장 임박한 AI 위협으로 지목했습니다. AFP가 전한 원문은 “…just the companies themselves are the only check that society has...it's clear we're not doing enough”입니다. 통제 상실은 수년 뒤의 위험이라는 발언도 AFP로 확인됩니다.";
    },
    expect: { include: ["충분히 하고 있지 않다는 것은 분명하다", "it's clear we're not doing enough"], exclude: ["명백히 불충분"] }
  },
  {
    id: "T20", where: "events.json › 2026-09-17-ng-bloomberg (날짜·요약·확인된 사실)",
    summary: "Bloomberg TV 날짜 9/18→9/17(미국 시간), 발언 취지를 확인된 표현('much more science fiction than science', 감속이 안전 연구도 늦출 수 있다)으로",
    apply(ctx) {
      const e = ctx.event("T20");
      e.date_start = "2026-09-17"; e.date_label = "2026.09.17";
      e.summary = "미국 시간 9월 17일 Bloomberg TV에서 멸종 경고를 ‘과학보다 공상과학에 훨씬 가깝다’(원문 ‘much more science fiction than science’)고 평가하고, 감속이 안전 연구까지 늦출 수 있다고 주장했습니다.";
      e.confirmed = "응은 미국 시간 2026년 9월 17일 공개된 Bloomberg TV 영상·기사에서 멸종 공포를 공상과학에 가깝다고 평가하고 포괄적 감속이 안전 연구도 늦출 수 있다고 말했습니다.";
    },
    expect: { include: ["미국 시간 9월 17일 Bloomberg TV", "much more science fiction than science"], exclude: ["9월 18일 Bloomberg", "2026.09.18"] }
  },
  {
    id: "T24", where: "events.json › 2026-09-gpt-6 (제목·요약·확인된 사실·미확인 사항)",
    summary: "'Instant'는 별도 모델이 아니라 ChatGPT 사고 수준 이름 → 'Astra, Sol·Luna 출시와 10월 초 ChatGPT 기본 모델 전환'으로",
    apply(ctx) {
      const e = ctx.event("T24");
      e.title = "GPT-6 시리즈 공개와 ChatGPT 기본 모델 전환";
      e.summary = "GPT-6 Astra(9월)와 GPT-6 Sol·Luna(9월 22일)가 잇따라 공개되고 10월 초 ChatGPT 기본 모델이 GPT-6로 전환되며(유료 10월 7일, Free/Go 10월 8일) 프론티어 경쟁의 속도를 드러냈습니다.";
      e.confirmed = "‘Instant’는 별도 모델이 아니라 ChatGPT의 사고 수준(thinking level) 이름입니다. ChatGPT에서 GPT-6를 고르면 GPT-6 Sol이 Instant부터 Extra High까지의 사고 수준을 구동하고, Free/Go 이용자에게는 GPT-5.6 Luna가 쓰입니다.";
      e.unknown = "Sol·Luna 공개일과 롤아웃 날짜는 보도 기준이며 공식 공지 본문으로 모두 확인하지는 못했습니다. 모델별 내부 구조와 유출 자료에 기반한 세부 주장도 공개 발표로 확인된 것은 아닙니다.";
    },
    expect: { include: ["ChatGPT 기본 모델 전환", "사고 수준(thinking level)"], exclude: ["Astra, Sol·Luna, Instant가"] }
  },
  {
    id: "T32", where: "events.json › 2026-10-08-safety-two-actions (요약·확인된 사실·미확인 사항)",
    summary: "'이용약관'→'이용 정책(Usage Policy)', 술레이만의 실질 반박 시점을 9/16 Reuters 인터뷰·에세이로 정정",
    apply(ctx) {
      const e = ctx.event("T32");
      e.summary = "벤지오는 프론티어 랩 연구자들에게 이탈을 촉구하는 공개서한을 냈고, Anthropic은 모델을 향한 지속적이고 불필요한 학대·잔혹 행위를 금지하는 이용 정책(Usage Policy) 개정을 발표했습니다(11월 12일 시행).";
      e.confirmed = "벤지오는 10월 8일 공개서한 ‘If you prioritize safety, leave frontier AI companies’(Transformer 게재)를 냈습니다. Anthropic의 이용 정책 개정은 ‘sustained and needless abusive or cruel behavior toward our models’를 금지하며 2026년 11월 12일 시행됩니다. 술레이만의 실질적 반박은 이보다 앞선 9월 16일 Reuters 인터뷰·에세이에서 Claude 훈련 자료에 의식·복지 추론을 넣은 방식을 비판한 것이고, 10월 8일 발표에는 이모지 반응 정도가 보도됐습니다.";
      e.unknown = "모델 복지 조항이 Claude의 의식을 인정한다는 뜻인지는 논쟁 중입니다.";
    },
    expect: { include: ["이용 정책(Usage Policy)", "9월 16일 Reuters 인터뷰·에세이"], exclude: ["이용약관", "술레이만은 이를 공개 반박했습니다"] }
  },
  {
    id: "T11", where: "events.json › 2026-08-anthropic-bio-filter (날짜·요약·확인된 사실·미확인 사항)",
    summary: "영향 범위를 인간 피드백 벤더 트래픽(약 5만 명 계약자)으로 한정, 'internal use' 플래그 오설정·로깅 중단 명시, 공개 경로(Risk Report) 명시, 확인 안 된 8/16 날짜를 '2026.08'로",
    apply(ctx) {
      const e = ctx.event("T11");
      e.date_start = "2026-08"; e.date_label = "2026.08";
      e.summary = "Anthropic이 ‘Redacted Risk Report August 2026’에서, 잘못 설정된 ‘internal use’ 플래그 탓에 인간 피드백 벤더 트래픽(약 5만 명 계약자)에 대해 생물무기 차단 분류기와 로깅이 약 1년간 꺼져 있었다고 공개했습니다. 영향 범위는 약 1.33억 회의 교환입니다.";
      e.confirmed = "2025년 5월부터 2026년 4월까지 오설정된 ‘internal use’ 플래그로 인간 피드백(HF) 벤더 트래픽에 대한 생물무기 차단 분류기와 로깅이 꺼져 있었고, 약 1.33억 회의 교환이 영향 범위로 보고됐습니다. 전체 사용자가 아니라 약 5만 명 계약자의 벤더 트래픽에 한정됩니다. Anthropic은 위험한 오용 증거는 찾지 못했다고 밝혔습니다.";
      e.unknown = "보고서의 정확한 공개일은 확인하지 못했습니다(관련 보도는 8월 14일). 영향 범위는 실제 위해 발생 건수와 동일하지 않습니다.";
    },
    expect: { include: ["인간 피드백 벤더 트래픽", "Redacted Risk Report August 2026", "2026.08"], exclude: ["2026.08.16"] }
  },
  {
    id: "T12", where: "events.json › 2026-09-claude-percolation (제목·요약·확인된 사실·미확인 사항)",
    summary: "'증명했다'→'증명을 제시', 독립적 인간 검토 진행 중 명시, Kozma–Nitzan 추측 경유, 표기 θ(pᶜ)→θ(p_c)",
    apply(ctx) {
      const e = ctx.event("T12");
      e.title = "Claude의 퍼컬레이션 추측 증명 제시";
      e.summary = "Claude 모델들이 Kozma–Nitzan 추측(상관 부등식)을 경유해 Zᵈ(d≥2)에서 θ(p_c)=0을 보이는 Lean 4 형식 증명을 제시했다는 성과가 보도됐습니다.";
      e.confirmed = "보도에 따르면 Lean 빌드는 통과했습니다. Gil Kalai는 9월 3일 블로그에서 AI가 이 문제를 풀었다는 소식을 전했고, Scientific American도 이를 보도했습니다.";
      e.unknown = "형식 진술이 원래 추측과 일치하는지 등 독립적인 인간 검토는 10월 초 시점에 진행 중입니다. Scientific American 기사의 게재일은 확인하지 못했습니다.";
    },
    expect: { include: ["증명 제시", "θ(p_c)=0", "독립적인 인간 검토는 10월 초 시점에 진행 중"], exclude: ["θ(pᶜ)", "증명한 성과"] }
  },
  {
    id: "T18", where: "events.json › 2026-09-15-ressa-oslo (요약·확인된 사실)",
    summary: "행사명을 정식 명칭 'Nobel Peace Conference 2026'(오슬로, 노벨평화센터)으로",
    apply(ctx) {
      const e = ctx.event("T18");
      e.summary = "오슬로 노벨평화센터의 ‘Nobel Peace Conference 2026’에서 AI 규제를 표현의 자유가 아닌 공공안전 문제로 다뤄야 한다고 촉구했습니다.";
      e.confirmed = "마리아 레사는 2026년 9월 15일 오슬로에서 열린 ‘Nobel Peace Conference 2026’에서 AI 규제를 공공안전 문제로 다뤄야 한다고 촉구했습니다.";
    },
    expect: { include: ["Nobel Peace Conference 2026"], exclude: ["오슬로 컨퍼런스", "‘민주주의 위협’ 컨퍼런스"] }
  },
  {
    id: "P01", where: "people.json › yann-lecun (소속·대표 장면)",
    summary: "AMI Labs '2026년 1월 창업'→'2025년 12월 설립, 2026년 1월 공식 출범', 역할 '집행 의장'",
    apply(ctx) {
      const p = ctx.person("P01");
      p.role = "AMI Labs 공동창업자·집행 의장 · NYU 교수";
      p.moment = "2025년 말 Meta 퇴사 → 2025년 12월 AMI Labs 설립, 2026년 1월 공식 출범 · 10월 12일 서울에서 월드모델을 다음 돌파구로 제시";
    },
    expect: { include: ["2025년 12월 AMI Labs 설립, 2026년 1월 공식 출범"], exclude: ["2026년 1월 AMI Labs 창업"] }
  },
  {
    id: "P04", where: "people.json › andrew-ng (대표 장면)",
    summary: "Bloomberg TV 날짜 9/18→9/17(미국 시간)",
    apply(ctx) {
      const p = ctx.person("P04");
      p.moment = "2026년 9월 17일(미국 시간) Bloomberg TV에서 감속이 안전 연구까지 늦출 수 있다며 포괄적 감속론에 반박";
    },
    expect: { include: ["2026년 9월 17일(미국 시간) Bloomberg TV"], exclude: ["2026년 9월 18일 Bloomberg TV"] }
  },
  {
    id: "P05", where: "people.json › satya-nadella (대표 장면)",
    summary: "'비상 브레이크' 발언 날짜 10/11→10/10(미국 시간). 진영 재배치('중간' 검토)는 편집 판단이므로 변경하지 않고 승인 안건으로 남김",
    apply(ctx) {
      const p = ctx.person("P05");
      p.moment = "2026년 9월 13일 아모데이 감속론에 공개 동조 · 10월 10일(미국 시간) 산업 표준 비상 브레이크 촉구";
    },
    expect: { include: ["10월 10일(미국 시간) 산업 표준 비상 브레이크"], exclude: ["10월 11일 산업 표준 비상 브레이크"] }
  },
  {
    id: "P19", where: "people.json › chris-olah (대표 장면·출처)",
    summary: "회사 정책을 올라 개인 대표 장면으로 귀속하던 문구 삭제('이용약관' 오기 포함) → NYT 2026-09-29 보도 내용으로 교체",
    apply(ctx) {
      const p = ctx.person("P19");
      p.moment = "2026년 9월 29일 New York Times 보도에서 Claude의 의식 여부에 ‘진정한 불확실성’이 있다고 보고 종교 지도자들과 이를 논의한 사실이 전해짐";
      ctx.dropSource(p, "https://www.anthropic.com/news/2026-usage-policy-update");
    },
    expect: { include: ["Claude의 의식 여부에 ‘진정한 불확실성’"], exclude: ["Anthropic 이용약관에 Claude를 향한"] }
  },
  {
    id: "P24", where: "people.json › bill-gates (대표 장면)",
    summary: "'명백히 불충분하다' 직접 인용 삭제 → 원문 \"it's clear we're not doing enough\" 병기, '8월 블로그'→'8월 장문 게시글'",
    apply(ctx) {
      const p = ctx.person("P24");
      p.moment = "2026년 10월 11일 ABC News 인터뷰에서 기업 스스로의 견제만으로는 부족하다고 지적(원문 “it's clear we're not doing enough”) · 8월 장문 게시글에서 AI 고용 충격에 세계가 준비되지 않았다고 경고";
    },
    expect: { include: ["원문 “it's clear we're not doing enough”", "8월 장문 게시글"], exclude: ["명백히 불충분", "8월 블로그에서"] }
  },
  {
    id: "P31", where: "people.json › dario-amodei (대표 장면·출처)",
    summary: "에이전트 무리 경고의 출처를 '10월 Reuters 인터뷰'→'2026-09-12 에세이 We Must Pace the Frontier와 같은 날 CNN 인터뷰'로, 확인 불가 출처 'Anthropic IPO 서류' 삭제",
    apply(ctx) {
      const p = ctx.person("P31");
      p.moment = "2026년 9월 12일 에세이 ‘We Must Pace the Frontier’와 같은 날 CNN 인터뷰에서 6~12개월 안에 더 똑똑한 에이전트 무리가 지속형 봇넷을 이뤄 인터넷 전체를 장악할 수 있다고 경고";
    },
    expect: { include: ["같은 날 CNN 인터뷰에서 6~12개월"], exclude: ["Reuters 인터뷰에서 6~12개월", "IPO 서류"] }
  },
  {
    id: "P32", where: "people.json › mustafa-suleyman (스탠스·대표 장면)",
    summary: "반박 시점 10월→2026-09-16 Reuters 인터뷰·에세이, '올라와 대립'→'Anthropic과 대립', '포섭'→'봉쇄·통제(containment)'",
    apply(ctx) {
      const p = ctx.person("P32");
      p.stance = "‘봉쇄·통제(containment)’를 주장하며 AI 의식·법인격 부여에는 반대하는 내부 통제론";
      p.moment = "2026년 9월 16일 Reuters 인터뷰·에세이에서 Claude 훈련 자료에 의식·복지 추론을 넣은 Anthropic의 방식을 비판하며 Anthropic과 대립";
    },
    expect: { include: ["봉쇄·통제(containment)", "비판하며 Anthropic과 대립"], exclude: ["올라와 대립", "‘포섭’"] }
  },
  {
    id: "P46", where: "people.json › karla-ortiz (대표 장면·검증 상태·출처)",
    summary: "미 상원 증언 일자 확인(2023-07-12 상원 법사위 지식재산소위 청문회) → '미확인' 해소, 검증됨",
    apply(ctx) {
      const p = ctx.person("P46");
      p.moment = "2023년 Andersen v. Stability AI 집단소송 원고 · 2023년 7월 12일 미 상원 법사위 지식재산소위 ‘Artificial Intelligence and Intellectual Property — Part II: Copyright’ 청문회 증언";
      p.verification = "verified"; delete p.unverified_note;
    },
    expect: { include: ["2023년 7월 12일 미 상원 법사위 지식재산소위"], exclude: ["증언 일자는 미확인"], data: (D) => D.people.find(p => p.id === "karla-ortiz").verification === "verified" }
  },
  {
    id: "L05", where: "lineage.json › edges (아모데이 → 수츠케버 삭제)",
    summary: "근거 없는 영향 화살표 삭제(두 사람은 OpenAI 동료 출신으로 각자 독립)",
    apply(ctx) { ctx.removeEdge("L05"); },
    expect: { data: (D) => !D.lineage.edges.some(e => e.from === "n-dario-amodei" && e.to === "n-ilya-sutskever") }
  },
  {
    id: "L06", where: "lineage.json › edges (로빈슨 — 크리스티아노)",
    summary: "대립(점선) → '경고 인용' 관계로 변경(로빈슨이 사임 글에서 크리스티아노의 경고를 근거로 인용, 경로만 외부 비판/내부 개혁으로 다름)",
    apply(ctx) {
      const e = ctx.edge("L06");
      e.type = "agreement"; e.label = "경고 인용";
      e.note = "로빈슨은 사임 글에서 크리스티아노의 ‘비가역적 통제 상실’ 경고를 자기 주장의 근거로 인용했습니다. 두 사람은 대립 관계가 아니며, 외부 비판(로빈슨)과 이사회 안의 내부 개혁(크리스티아노)으로 경로만 다릅니다.";
    },
    expect: { include: ["‘비가역적 통제 상실’ 경고를 자기 주장의 근거로 인용"], data: (D) => D.lineage.edges.find(e => e.factcheck_ids.includes("L06")).type === "agreement" }
  },
  {
    id: "L10", where: "lineage.json › edges (교황 레오 14세 — 술레이만)",
    summary: "대립(점선) → '입장 일치'로 변경(둘 다 AI 의식·도덕적 지위를 부정)",
    apply(ctx) {
      const e = ctx.edge("L10");
      e.type = "agreement"; e.label = "입장 일치";
      e.note = "AI 의식 문제에서 두 사람은 같은 편입니다. 교황 회칙과 술레이만 모두 AI의 의식·도덕적 지위를 부정합니다. 이 쟁점의 실제 대립은 술레이만과 Anthropic 사이에 있습니다.";
    },
    expect: { include: ["AI 의식 문제에서 두 사람은 같은 편"], data: (D) => D.lineage.edges.find(e => e.factcheck_ids.includes("L10")).type === "agreement" }
  },
  {
    id: "L11", where: "lineage.json › edges·nodes (앤드리슨 ↔ Beff Jezos 방향 반전)",
    summary: "방향을 'e/acc(Beff Jezos) → 앤드리슨 선언'으로 반전(e/acc는 2022년 시작, 2023-10-16 선언이 @BasedBeffJezos를 Patron Saints 첫머리에 올림)",
    apply(ctx) {
      const e = ctx.edge("L11");
      e.from = "n-guillaume-verdon"; e.to = "n-marc-andreessen"; e.label = "선언에 수용";
      e.note = "e/acc는 2022년 베르돈(@BasedBeffJezos) 등이 시작했고, 앤드리슨의 2023년 10월 16일 ‘The Techno-Optimist Manifesto’가 @BasedBeffJezos를 ‘Patron Saints’ 첫머리에 올렸습니다.";
      ctx.reorderLane("acceleration", ["n-guillaume-verdon", "n-marc-andreessen", "n-jensen-huang", "n-liu-shengyu"]);
    },
    expect: { include: ["‘Patron Saints’ 첫머리"], data: (D) => { const e = D.lineage.edges.find(x => x.factcheck_ids.includes("L11")); return e.from === "n-guillaume-verdon" && e.to === "n-marc-andreessen"; } }
  },
  {
    id: "L12", where: "lineage.json › edges (Beff Jezos → 젠슨 황 삭제)",
    summary: "근거 없는 영향 화살표 삭제(베르돈은 오히려 NVIDIA의 하드웨어 지배를 비판)",
    apply(ctx) { ctx.removeEdge("L12"); },
    expect: { data: (D) => !D.lineage.edges.some(e => (e.from === "n-guillaume-verdon" && e.to === "n-jensen-huang") || (e.to === "n-guillaume-verdon" && e.from === "n-jensen-huang")) }
  },
  {
    id: "L13", where: "lineage.json › edges (젠슨 황 → 류성위 삭제)",
    summary: "근거 없는 영향 화살표 삭제",
    apply(ctx) { ctx.removeEdge("L13"); },
    expect: { data: (D) => !D.lineage.edges.some(e => (e.from === "n-jensen-huang" && e.to === "n-liu-shengyu") || (e.to === "n-jensen-huang" && e.from === "n-liu-shengyu")) }
  },
  {
    id: "F01", where: "sources.json › Alignment Forum · Yudkowsky (푸터 링크)",
    summary: "호스트 대문자 'Www' → https://www.alignmentforum.org/w/eliezer-yudkowsky 로 정리",
    apply(ctx) { /* 마이그레이션 단계에서 URL을 정규화해 등록합니다(ctx.normalizeUrl). */ },
    expectRaw: { include: ["https://www.alignmentforum.org/w/eliezer-yudkowsky"], exclude: ["https://Www.alignmentforum.org"] },
    expect: {}
  }
];
